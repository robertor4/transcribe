'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { OnboardingData, OnboardingResponses } from '@transcribe/shared';
import { auth } from '@/lib/firebase';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl();

interface OnboardingContextType {
  /** True if this is a new user who hasn't completed or skipped onboarding */
  needsOnboarding: boolean;
  /** Whether to show the questionnaire modal */
  showQuestionnaire: boolean;
  /** Whether to show the spotlight tour */
  showTour: boolean;
  /** Loading state */
  isLoading: boolean;
  /** The example conversation ID (if seeded) */
  exampleConversationId: string | null;
  /** Save questionnaire responses and mark as completed */
  completeQuestionnaire: (responses: OnboardingResponses) => Promise<void>;
  /** Skip the questionnaire */
  skipQuestionnaire: () => Promise<void>;
  /** Mark the tour as completed */
  completeTour: () => Promise<void>;
  /** Skip the tour */
  skipTour: () => Promise<void>;
  /** Seed the example conversation */
  seedExample: () => Promise<string | null>;
  /** Manually restart the onboarding flow (for "Tutorial" menu item) */
  restartOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

interface OnboardingApiPayload {
  responses?: OnboardingResponses;
  questionnaireCompletedAt?: string;
  tourCompletedAt?: string;
  completedAt?: string;
  skippedAt?: string;
}

async function updateOnboardingApi(
  data: OnboardingApiPayload,
): Promise<OnboardingData> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/user/onboarding`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

async function seedExampleApi(): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/user/onboarding/seed-example`, {
    method: 'POST',
    headers,
  });
  const json = await res.json();
  return json.data.transcriptionId;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exampleConversationId, setExampleConversationId] = useState<
    string | null
  >(null);
  const hasFetchedRef = useRef(false);

  // Determine onboarding state from user profile
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const checkOnboarding = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/user/profile`, { headers });
        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const json = await res.json();
        const userData = json.data;
        const onboarding: OnboardingData | undefined = userData?.onboarding;

        // If onboarding already completed or skipped, nothing to do
        if (onboarding?.completedAt || onboarding?.skippedAt) {
          setExampleConversationId(
            onboarding.exampleConversationId || null,
          );
          setIsLoading(false);
          return;
        }

        // Check if user is "new" (created less than 1 hour ago)
        let createdAt = userData?.createdAt;
        if (createdAt && typeof createdAt === 'object' && '_seconds' in createdAt) {
          createdAt = new Date(createdAt._seconds * 1000);
        } else if (createdAt) {
          createdAt = new Date(createdAt);
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const isNewUser = createdAt && new Date(createdAt) > oneHourAgo;

        if (!isNewUser && !onboarding) {
          // Existing user without onboarding data — skip silently
          setIsLoading(false);
          return;
        }

        // New user or user with partial onboarding
        setNeedsOnboarding(true);
        setExampleConversationId(
          onboarding?.exampleConversationId || null,
        );

        // Determine what to show
        if (!onboarding?.questionnaireCompletedAt) {
          setShowQuestionnaire(true);
        } else if (!onboarding?.tourCompletedAt) {
          setShowTour(true);
        }

        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [user]);

  const seedExample = useCallback(async (): Promise<string | null> => {
    try {
      const id = await seedExampleApi();
      setExampleConversationId(id);
      return id;
    } catch {
      return null;
    }
  }, []);

  const completeQuestionnaire = useCallback(
    async (responses: OnboardingResponses) => {
      const now = new Date().toISOString();
      await updateOnboardingApi({
        responses,
        questionnaireCompletedAt: now,
      });
      setShowQuestionnaire(false);
      setShowTour(true);
    },
    [],
  );

  const skipQuestionnaire = useCallback(async () => {
    const now = new Date().toISOString();
    await updateOnboardingApi({ skippedAt: now });
    setShowQuestionnaire(false);
    setNeedsOnboarding(false);
  }, []);

  const completeTour = useCallback(async () => {
    const now = new Date().toISOString();
    await updateOnboardingApi({
      tourCompletedAt: now,
      completedAt: now,
    });
    setShowTour(false);
    setNeedsOnboarding(false);
  }, []);

  const skipTour = useCallback(async () => {
    const now = new Date().toISOString();
    await updateOnboardingApi({
      tourCompletedAt: now,
      completedAt: now,
    });
    setShowTour(false);
    setNeedsOnboarding(false);
  }, []);

  const restartOnboarding = useCallback(() => {
    setNeedsOnboarding(true);
    setShowQuestionnaire(true);
    setShowTour(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        needsOnboarding,
        showQuestionnaire,
        showTour,
        isLoading,
        exampleConversationId,
        completeQuestionnaire,
        skipQuestionnaire,
        completeTour,
        skipTour,
        seedExample,
        restartOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
