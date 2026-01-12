'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import websocketService from '@/lib/websocket';
import { getApiUrl } from '@/lib/config';

interface ApiHealthContextType {
  isApiHealthy: boolean;
  isChecking: boolean;
  retryHealthCheck: () => Promise<void>;
}

const ApiHealthContext = createContext<ApiHealthContextType | undefined>(
  undefined
);

export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const [isApiHealthy, setIsApiHealthy] = useState(true); // Assume healthy initially
  const [isChecking, setIsChecking] = useState(false);

  const healthCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailuresRef = useRef(0);
  const isMountedRef = useRef(true);

  // Perform HTTP health check
  const checkApiHealth = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsChecking(true);
    try {
      const apiUrl = getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (isMountedRef.current) {
        if (response.ok) {
          setIsApiHealthy(true);
          consecutiveFailuresRef.current = 0;
        } else {
          consecutiveFailuresRef.current++;
          setIsApiHealthy(false);
        }
      }
    } catch {
      if (isMountedRef.current) {
        consecutiveFailuresRef.current++;
        setIsApiHealthy(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  // Schedule next health check with exponential backoff when unhealthy
  const scheduleNextCheck = useCallback(() => {
    if (healthCheckTimeoutRef.current) {
      clearTimeout(healthCheckTimeoutRef.current);
    }

    // Exponential backoff: 30s, 60s, 120s, 240s (max 4 min)
    const baseDelay = 30000;
    const delay = Math.min(
      baseDelay * Math.pow(2, consecutiveFailuresRef.current - 1),
      240000
    );

    healthCheckTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        checkApiHealth();
      }
    }, delay);
  }, [checkApiHealth]);

  // Listen to WebSocket connection health
  useEffect(() => {
    const unsubscribe = websocketService.on(
      'connection_health_changed',
      (data: unknown) => {
        const { healthy, connected } = data as {
          healthy: boolean;
          connected: boolean;
        };

        // If WebSocket is unhealthy, verify with HTTP health check
        if (!healthy || !connected) {
          checkApiHealth();
        } else {
          // WebSocket recovered - likely API is healthy
          setIsApiHealthy(true);
          consecutiveFailuresRef.current = 0;
        }
      }
    );

    return unsubscribe;
  }, [checkApiHealth]);

  // Initial health check on mount
  useEffect(() => {
    isMountedRef.current = true;
    checkApiHealth();

    return () => {
      isMountedRef.current = false;
      if (healthCheckTimeoutRef.current) {
        clearTimeout(healthCheckTimeoutRef.current);
      }
    };
  }, [checkApiHealth]);

  // Schedule retry when unhealthy
  useEffect(() => {
    if (!isApiHealthy && consecutiveFailuresRef.current > 0) {
      scheduleNextCheck();
    }

    return () => {
      if (healthCheckTimeoutRef.current) {
        clearTimeout(healthCheckTimeoutRef.current);
      }
    };
  }, [isApiHealthy, scheduleNextCheck]);

  const retryHealthCheck = useCallback(async () => {
    // Clear any scheduled check
    if (healthCheckTimeoutRef.current) {
      clearTimeout(healthCheckTimeoutRef.current);
      healthCheckTimeoutRef.current = null;
    }
    await checkApiHealth();
  }, [checkApiHealth]);

  return (
    <ApiHealthContext.Provider
      value={{ isApiHealthy, isChecking, retryHealthCheck }}
    >
      {children}
    </ApiHealthContext.Provider>
  );
}

export function useApiHealth() {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within ApiHealthProvider');
  }
  return context;
}
