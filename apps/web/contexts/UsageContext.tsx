'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import websocketService from '@/lib/websocket';
import { WEBSOCKET_EVENTS, UserRole } from '@transcribe/shared';

interface UsageStats {
  tier: string;
  usage: {
    hours: number;
    transcriptions: number;
    onDemandAnalyses: number;
  };
  limits: {
    transcriptions?: number;
    hours?: number;
    onDemandAnalyses?: number;
  };
  overage: {
    hours: number;
    amount: number;
  };
  percentUsed: number;
  warnings: string[];
  resetDate: string;
}

interface UsageContextType {
  usageStats: UsageStats | null;
  loading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
  userRole: UserRole | null;
  isAdmin: boolean;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Track if we've already fetched for this user to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchUserProfile = async () => {
    if (!user) {
      setUserRole(null);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const role = data.data?.role || UserRole.USER;
        setUserRole(role);
      } else {
        setUserRole(UserRole.USER);
      }
    } catch (err) {
      setUserRole(UserRole.USER); // Default to USER on error
    }
  };

  const fetchUsage = async () => {
    if (!user) {
      setUsageStats(null);
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/usage-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.data);
        setError(null);
      } else {
        setError('Failed to fetch usage stats');
        // Set default free tier stats as fallback for new users
        setUsageStats({
          tier: 'free',
          usage: {
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
          },
          limits: {
            transcriptions: 3,
            hours: 1,
            onDemandAnalyses: 3,
          },
          overage: {
            hours: 0,
            amount: 0,
          },
          percentUsed: 0,
          warnings: [],
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage stats');
      // Set default free tier stats as fallback for new users
      setUsageStats({
        tier: 'free',
        usage: {
          hours: 0,
          transcriptions: 0,
          onDemandAnalyses: 0,
        },
        limits: {
          transcriptions: 3,
          hours: 1,
          onDemandAnalyses: 3,
        },
        overage: {
          hours: 0,
          amount: 0,
        },
        percentUsed: 0,
        warnings: [],
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - only when user ID changes and email is verified
  useEffect(() => {
    const userId = user?.uid || null;

    // Only fetch if user ID changed (login/logout), not on every render
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      hasFetchedRef.current = false;
    }

    if (user && user.emailVerified && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      // Fetch in parallel with proper error handling
      Promise.all([fetchUserProfile(), fetchUsage()]).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        setLoading(false);
      });
    } else if (!user) {
      setUserRole(null);
      setUsageStats(null);
      setLoading(false);
    } else if (user && !user.emailVerified) {
      // User exists but email not verified - don't fetch, just stop loading
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh when transcription completes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      () => {
        fetchUsage();
      },
    );

    return () => unsubscribe();
  }, [user]);

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <UsageContext.Provider
      value={{
        usageStats,
        loading,
        error,
        refreshUsage: fetchUsage,
        userRole,
        isAdmin
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within UsageProvider');
  }
  return context;
};
