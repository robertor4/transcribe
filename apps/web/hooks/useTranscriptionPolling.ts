import { useEffect, useRef, useCallback } from 'react';
import { Transcription, TranscriptionStatus } from '@transcribe/shared';
import { transcriptionApi } from '@/lib/api';

/**
 * Configuration for the polling behavior
 */
interface PollingConfig {
  /** How often to poll for updates (in milliseconds) */
  pollingInterval: number;
  /** How long without updates before considering a transcription "stale" (in milliseconds) */
  staleThreshold: number;
  /** Maximum number of transcriptions to poll concurrently */
  maxConcurrentPolls: number;
  /** Whether polling is enabled */
  enabled: boolean;
}

/**
 * Metadata tracked for each in-progress transcription
 */
interface TranscriptionMetadata {
  transcriptionId: string;
  lastUpdateTime: number;
  lastProgress: number;
  pollCount: number;
}

/**
 * Custom hook that provides polling fallback for transcriptions when WebSocket fails
 *
 * This hook automatically polls the API for transcription status updates when:
 * - A transcription is in PROCESSING state
 * - No progress updates have been received for a while (stale threshold)
 * - The polling is enabled
 *
 * @param transcriptions - Array of transcriptions to monitor
 * @param onUpdate - Callback when a transcription is updated via polling
 * @param config - Optional configuration for polling behavior
 */
export function useTranscriptionPolling(
  transcriptions: Transcription[],
  onUpdate: (transcription: Transcription) => void,
  config: Partial<PollingConfig> = {}
) {
  const defaultConfig: PollingConfig = {
    pollingInterval: 10000, // Poll every 10 seconds
    staleThreshold: 30000, // Consider stale after 30 seconds
    maxConcurrentPolls: 5, // Max 5 concurrent polls
    enabled: true,
    ...config,
  };

  // Track metadata for each transcription
  const metadataRef = useRef<Map<string, TranscriptionMetadata>>(new Map());
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activePolls = useRef<Set<string>>(new Set());

  /**
   * Update metadata when progress is received (from WebSocket or polling)
   */
  const updateMetadata = useCallback((transcriptionId: string, progress: number) => {
    const metadata = metadataRef.current.get(transcriptionId);
    if (metadata) {
      metadata.lastUpdateTime = Date.now();
      metadata.lastProgress = progress;
    } else {
      metadataRef.current.set(transcriptionId, {
        transcriptionId,
        lastUpdateTime: Date.now(),
        lastProgress: progress,
        pollCount: 0,
      });
    }
  }, []);

  /**
   * Check if a transcription should be polled
   */
  const shouldPoll = useCallback((transcription: Transcription): boolean => {
    // Only poll transcriptions in PROCESSING state
    if (transcription.status !== TranscriptionStatus.PROCESSING) {
      return false;
    }

    const metadata = metadataRef.current.get(transcription.id);
    if (!metadata) {
      // First time seeing this transcription, initialize metadata
      metadataRef.current.set(transcription.id, {
        transcriptionId: transcription.id,
        lastUpdateTime: Date.now(),
        lastProgress: 0,
        pollCount: 0,
      });
      return false; // Don't poll immediately, give WebSocket a chance
    }

    // Check if stale (no updates for staleThreshold milliseconds)
    const timeSinceLastUpdate = Date.now() - metadata.lastUpdateTime;
    const isStale = timeSinceLastUpdate > defaultConfig.staleThreshold;

    // Don't poll if already polling this transcription
    const alreadyPolling = activePolls.current.has(transcription.id);

    return isStale && !alreadyPolling;
  }, [defaultConfig.staleThreshold]);

  /**
   * Poll a single transcription for status update
   */
  const pollTranscription = useCallback(async (transcriptionId: string) => {
    // Mark as actively polling
    activePolls.current.add(transcriptionId);

    try {
      const response = await transcriptionApi.get(transcriptionId);
      const updatedTranscription = response.data as Transcription;

      // Update metadata
      const metadata = metadataRef.current.get(transcriptionId);
      if (metadata) {
        metadata.lastUpdateTime = Date.now();
        metadata.pollCount += 1;

        // If status changed to completed/failed, clean up metadata
        if (
          updatedTranscription.status === TranscriptionStatus.COMPLETED ||
          updatedTranscription.status === TranscriptionStatus.FAILED
        ) {
          metadataRef.current.delete(transcriptionId);
        }
      }

      // Notify parent component of the update
      onUpdate(updatedTranscription);

      console.log(
        `[Polling] Successfully polled transcription ${transcriptionId}, status: ${updatedTranscription.status}`
      );
    } catch (error) {
      console.error(`[Polling] Failed to poll transcription ${transcriptionId}:`, error);
    } finally {
      // Remove from active polls
      activePolls.current.delete(transcriptionId);
    }
  }, [onUpdate]);

  /**
   * Main polling loop - checks all transcriptions and polls stale ones
   */
  const pollStaleTranscriptions = useCallback(async () => {
    if (!defaultConfig.enabled) {
      return;
    }

    // Find transcriptions that need polling
    const transcriptionsToPoll = transcriptions
      .filter(shouldPoll)
      .slice(0, defaultConfig.maxConcurrentPolls);

    if (transcriptionsToPoll.length > 0) {
      console.log(
        `[Polling] Found ${transcriptionsToPoll.length} stale transcription(s) to poll:`,
        transcriptionsToPoll.map(t => t.id)
      );

      // Poll all stale transcriptions in parallel
      await Promise.allSettled(
        transcriptionsToPoll.map(t => pollTranscription(t.id))
      );
    }
  }, [transcriptions, shouldPoll, pollTranscription, defaultConfig.enabled, defaultConfig.maxConcurrentPolls]);

  /**
   * Set up polling interval
   */
  useEffect(() => {
    if (!defaultConfig.enabled) {
      return;
    }

    // Start polling loop
    pollingTimerRef.current = setInterval(() => {
      pollStaleTranscriptions();
    }, defaultConfig.pollingInterval);

    // Cleanup on unmount
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [defaultConfig.enabled, defaultConfig.pollingInterval, pollStaleTranscriptions]);

  /**
   * Clean up metadata for completed/failed transcriptions
   */
  useEffect(() => {
    transcriptions.forEach(transcription => {
      if (
        transcription.status === TranscriptionStatus.COMPLETED ||
        transcription.status === TranscriptionStatus.FAILED
      ) {
        metadataRef.current.delete(transcription.id);
      }
    });
  }, [transcriptions]);

  /**
   * Public API for manually triggering metadata update (called when WebSocket sends progress)
   */
  const notifyProgress = useCallback((transcriptionId: string, progress: number) => {
    updateMetadata(transcriptionId, progress);
  }, [updateMetadata]);

  return {
    notifyProgress,
    activePolls: activePolls.current.size,
    staleCounts: metadataRef.current.size,
  };
}
