'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        console.log('[UsageContext] User profile data:', data);
        const role = data.data?.role || UserRole.USER;
        console.log('[UsageContext] User role:', role);
        setUserRole(role);
      } else {
        console.error('[UsageContext] Failed to fetch user profile:', response.statusText);
        setUserRole(UserRole.USER);
      }
    } catch (err: any) {
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
        console.error('Failed to fetch usage stats:', response.statusText);
        setError('Failed to fetch usage stats');
      }
    } catch (err: any) {
      console.error('Error fetching usage stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - fetch both user profile and usage stats
  useEffect(() => {
    fetchUserProfile();
    fetchUsage();
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
