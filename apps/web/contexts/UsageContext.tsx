'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import websocketService from '@/lib/websocket';
import { WEBSOCKET_EVENTS } from '@transcribe/shared';

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
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Initial fetch
  useEffect(() => {
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

  return (
    <UsageContext.Provider
      value={{ usageStats, loading, error, refreshUsage: fetchUsage }}
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
