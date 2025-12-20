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
  paygCredits?: number;
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
      console.log('[UsageContext] Fetching user profile...');
      const startTime = performance.now();
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
        console.log('[UsageContext] User profile fetched', {
          elapsed: `${(performance.now() - startTime).toFixed(0)}ms`
        });
        const role = data.data?.role || UserRole.USER;
        console.log('[UsageContext] User role:', role);
        setUserRole(role);
      } else {
        console.error('[UsageContext] Failed to fetch user profile:', response.statusText);
        setUserRole(UserRole.USER);
      }
    } catch (err) {
      console.error('[UsageContext] Error fetching user profile:', err);
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
      console.log('[UsageContext] Fetching usage stats...');
      const startTime = performance.now();
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
        console.log('[UsageContext] Usage stats fetched', {
          elapsed: `${(performance.now() - startTime).toFixed(0)}ms`
        });
        setUsageStats(data.data);
        setError(null);
      } else {
        console.error('Failed to fetch usage stats:', response.statusText);
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

  // Initial fetch - only when user ID changes, not on every user object change
  useEffect(() => {
    const userId = user?.uid || null;

    // Only fetch if user ID changed (login/logout), not on every render
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      hasFetchedRef.current = false;
    }

    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      console.log('[UsageContext] Initial fetch triggered for user:', userId);
      // Fetch in parallel with proper error handling
      Promise.all([fetchUserProfile(), fetchUsage()]).catch((err) => {
        console.error('[UsageContext] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        setLoading(false);
      });
    } else if (!user) {
      setUserRole(null);
      setUsageStats(null);
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh when transcription completes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      () => {
        console.log('[UsageContext] Transcription completed, refreshing usage stats');
        fetchUsage();
      },
    );

    return () => unsubscribe();
  }, [user]);

  const isAdmin = userRole === UserRole.ADMIN;

  // Debug log whenever isAdmin changes
  useEffect(() => {
    console.log('[UsageContext] isAdmin:', isAdmin, 'userRole:', userRole);
  }, [isAdmin, userRole]);

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
