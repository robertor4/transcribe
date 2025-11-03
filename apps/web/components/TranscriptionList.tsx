'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { transcriptionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import websocketService from '@/lib/websocket';
import { useTranscriptionPolling } from '@/hooks/useTranscriptionPolling';
import {
  Transcription,
  TranscriptionStatus,
  TranscriptionProgress,
  WEBSOCKET_EVENTS
} from '@transcribe/shared';

interface ListResponse {
  items: Transcription[];
  total: number;
  page: number;
  pageSize: number;
  hasMore?: boolean;
}
import {
  FileAudio,
  Trash2,
  Clock,
  XCircle,
  Loader2,
  FileText,
  Copy,
  Check,
  AlignLeft,
  Edit3,
  X,
  Share2,
  ChevronDown,
  Globe,
  Upload,
  MoreVertical
} from 'lucide-react';
import { AnalysisContentRenderer } from './AnalysisContentRenderer';
import { AnalysisTabs } from './AnalysisTabs';
import { ShareModal } from './ShareModal';
import { ProcessingStatus } from './ProcessingStatus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface TranscriptionListProps {
  lastCompletedId?: string | null;
  onNavigateToUpload?: () => void;
}

export const TranscriptionList: React.FC<TranscriptionListProps> = ({
  lastCompletedId,
  onNavigateToUpload
}) => {
  const t = useTranslations('transcription');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const { user } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, TranscriptionProgress>>(new Map());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unformattedTranscripts, setUnformattedTranscripts] = useState<Set<string>>(new Set());
  const [showTechnicalError, setShowTechnicalError] = useState<Set<string>>(new Set());
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [shareModalTranscription, setShareModalTranscription] = useState<Transcription | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20; // Load 20 items at a time
  const initialLoadDone = useRef(false);

  // Callback for polling hook when it updates a transcription
  const handlePollingUpdate = useCallback((updatedTranscription: Transcription) => {
    console.log('[Polling] Received update for transcription:', updatedTranscription.id, updatedTranscription.status);

    // Update transcription in list
    setTranscriptions(prev =>
      prev.map(t =>
        t.id === updatedTranscription.id ? updatedTranscription : t
      )
    );

    // If completed or failed, clear progress map
    if (
      updatedTranscription.status === TranscriptionStatus.COMPLETED ||
      updatedTranscription.status === TranscriptionStatus.FAILED
    ) {
      setProgressMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(updatedTranscription.id);
        return newMap;
      });
      websocketService.clearEventTracking(updatedTranscription.id);
    }
  }, []);

  // Set up polling fallback for in-progress transcriptions
  const { notifyProgress } = useTranscriptionPolling(
    transcriptions,
    handlePollingUpdate,
    {
      enabled: true,
      pollingInterval: 10000, // Poll every 10 seconds
      staleThreshold: 30000, // Consider stale after 30 seconds without updates
      maxConcurrentPolls: 5,
    }
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  };

  // Helper function to determine if a PROCESSING transcription is stuck
  // A transcription is considered stuck if it's been processing for more than 15 minutes
  const isStuckProcessing = (transcription: Transcription): boolean => {
    if (transcription.status !== TranscriptionStatus.PROCESSING) {
      return false;
    }

    const STUCK_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
    const createdAt = new Date(transcription.createdAt).getTime();
    const now = Date.now();
    const processingTime = now - createdAt;

    return processingTime > STUCK_THRESHOLD_MS;
  };

  // Group transcriptions by month
  const groupedTranscriptions = useMemo(() => {
    const groups: Record<string, Transcription[]> = {};
    
    transcriptions.forEach(transcription => {
      const date = new Date(transcription.createdAt);
      const monthYear = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(transcription);
    });
    
    // Sort months in descending order (newest first)
    const sortedGroups: Record<string, Transcription[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        const dateA = new Date(groups[a][0].createdAt);
        const dateB = new Date(groups[b][0].createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });
    
    return sortedGroups;
  }, [transcriptions]);

  const loadTranscriptions = useCallback(async (reset = false) => {
    if (!hasMore && !reset) return;
    if (loadingMore && !reset) return; // Prevent multiple simultaneous loads
    
    try {
      const pageToLoad = reset ? 1 : currentPage;
      
      if (pageToLoad === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await transcriptionApi.list(pageToLoad, pageSize);

      if (response?.success && response.data) {
        const data = response.data as ListResponse;
        const newItems = data.items;
        
        if (reset) {
          // Reset for initial load or refresh
          setTranscriptions(newItems);
          setCurrentPage(2); // Next page will be 2
        } else {
          // Append for infinite scroll, but filter out duplicates
          setTranscriptions(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          });
          setCurrentPage(prev => prev + 1);
        }
        
        // Update pagination state
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      const errorObj = error as { message?: string; status?: number; response?: { status?: number; data?: { message?: string } } };
      console.error('Failed to load transcriptions:', errorObj);

      if (errorObj?.response?.status === 401 &&
          errorObj?.response?.data?.message?.includes('Email not verified')) {
        console.log('Email verification required');
      }
      
      if (reset || currentPage === 1) {
        setTranscriptions([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, pageSize, loadingMore]);

  // Load initial transcriptions when component mounts or user changes
  useEffect(() => {
    if (user && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadTranscriptions(true);
    } else if (!user) {
      setLoading(false);
      initialLoadDone.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle new completed transcription from parent
  useEffect(() => {
    if (!lastCompletedId || !user) return;

    const fetchAndUpdateTranscription = async (retryCount = 0) => {
      try {
        console.log(`[TranscriptionList] Fetching transcription ${lastCompletedId} (attempt ${retryCount + 1})`);
        const response = await transcriptionApi.get(lastCompletedId);

        if (response.success && response.data) {
          const updatedTranscription = response.data as Transcription;
          console.log(`[TranscriptionList] Successfully fetched transcription ${lastCompletedId}, status: ${updatedTranscription.status}`);

          setTranscriptions(prev => {
            // Check if this transcription already exists in the list
            const existingIndex = prev.findIndex(t => t.id === lastCompletedId);

            if (existingIndex >= 0) {
              // Update existing transcription in place
              console.log(`[TranscriptionList] Updating existing transcription ${lastCompletedId} in list`);
              return prev.map(t =>
                t.id === lastCompletedId ? updatedTranscription : t
              );
            } else {
              // New transcription - prepend it to the list
              console.log(`[TranscriptionList] Adding new transcription ${lastCompletedId} to list`);
              return [updatedTranscription, ...prev];
            }
          });
        } else {
          console.warn(`[TranscriptionList] Fetch returned no data for ${lastCompletedId}`);
          // Retry up to 3 times if we get no data (transcription might not be created yet)
          if (retryCount < 3) {
            console.log(`[TranscriptionList] Retrying fetch in ${500 * (retryCount + 1)}ms...`);
            setTimeout(() => fetchAndUpdateTranscription(retryCount + 1), 500 * (retryCount + 1));
          }
        }
      } catch (error) {
        console.error(`[TranscriptionList] Failed to fetch transcription ${lastCompletedId}:`, error);
        // Retry up to 3 times on error
        if (retryCount < 3) {
          console.log(`[TranscriptionList] Retrying fetch in ${500 * (retryCount + 1)}ms...`);
          setTimeout(() => fetchAndUpdateTranscription(retryCount + 1), 500 * (retryCount + 1));
        }
      }
    };

    fetchAndUpdateTranscription();
  }, [lastCompletedId, user]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!user) return;

    // Track timeout timers for processing transcriptions
    const timeoutTimers = new Map<string, NodeJS.Timeout>();

    // Listen for connection health changes
    const unsubscribeHealth = websocketService.on(
      'connection_health_changed',
      (data: unknown) => {
        const healthData = data as { healthy: boolean; connected: boolean };
        console.log('[WebSocket] Connection health changed:', healthData);
      }
    );

    // Listen for real-time updates
    const unsubscribeProgress = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS,
      (data: unknown) => {
        const progress = data as TranscriptionProgress;
        console.log(`[TranscriptionList] WebSocket progress received for ${progress.transcriptionId}:`, {
          progress: progress.progress,
          stage: progress.stage,
          status: progress.status
        });

        // Notify polling hook that we received an update (resets staleness timer)
        notifyProgress(progress.transcriptionId, progress.progress);

        // Mark event received in WebSocket service
        websocketService.markEventReceived(progress.transcriptionId);

        // Validate that this transcription exists before updating progress
        setProgressMap(prev => {
          // Check if transcription exists in our list (avoid updating wrong cards)
          const transcriptionExists = transcriptions.some(t => t.id === progress.transcriptionId);

          if (!transcriptionExists) {
            // This progress update is for a transcription we don't have yet
            // This can happen if WebSocket event arrives before API fetch completes
            console.log('[TranscriptionList] Received progress for unknown transcription (not in list yet):', progress.transcriptionId);
            // The transcription will appear once the scheduled fetch completes
          } else {
            console.log(`[TranscriptionList] Updating progress map for ${progress.transcriptionId}`);
          }

          const newMap = new Map(prev);
          const existingProgress = newMap.get(progress.transcriptionId);
          // Preserve start time if it exists, otherwise set it
          const startTime = existingProgress?.startTime || Date.now();
          newMap.set(progress.transcriptionId, { ...progress, startTime });
          return newMap;
        });

        // Set or reset timeout for this transcription (extended to 10 minutes)
        const existingTimer = timeoutTimers.get(progress.transcriptionId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const newTimer = setTimeout(() => {
          // Mark as failed after timeout (only if polling hasn't already updated it)
          setTranscriptions(prev =>
            prev.map(t =>
              t.id === progress.transcriptionId && t.status === TranscriptionStatus.PROCESSING
                ? {
                    ...t,
                    status: TranscriptionStatus.FAILED,
                    error: 'Transcription timed out. Please try again with a shorter audio file.'
                  }
                : t
            )
          );
          setProgressMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(progress.transcriptionId);
            return newMap;
          });
          timeoutTimers.delete(progress.transcriptionId);
          websocketService.clearEventTracking(progress.transcriptionId);
        }, 10 * 60 * 1000); // Extended to 10 minutes timeout (polling should handle it before this)

        timeoutTimers.set(progress.transcriptionId, newTimer);
      }
    );

    const unsubscribeComplete = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      async (data: unknown) => {
        const progress = data as TranscriptionProgress;

        // Clear timeout timer
        const timer = timeoutTimers.get(progress.transcriptionId);
        if (timer) {
          clearTimeout(timer);
          timeoutTimers.delete(progress.transcriptionId);
        }

        // Clear event tracking and progress map
        websocketService.clearEventTracking(progress.transcriptionId);
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(progress.transcriptionId);
          return newMap;
        });

        // Fetch the updated transcription and update in place
        try {
          const response = await transcriptionApi.get(progress.transcriptionId);
          if (response.success && response.data) {
            setTranscriptions(prev =>
              prev.map(t =>
                t.id === progress.transcriptionId ? response.data as Transcription : t
              )
            );
          }
        } catch (error) {
          console.error('Failed to fetch updated transcription:', error);
        }
      }
    );
    
    const unsubscribeFailed = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED,
      (data: unknown) => {
        const progress = data as TranscriptionProgress & { error?: string };

        // Clear timeout timer
        const timer = timeoutTimers.get(progress.transcriptionId);
        if (timer) {
          clearTimeout(timer);
          timeoutTimers.delete(progress.transcriptionId);
        }

        // Clear event tracking and progress map
        websocketService.clearEventTracking(progress.transcriptionId);
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(progress.transcriptionId);
          return newMap;
        });

        // Update the transcription status to failed in place
        setTranscriptions(prev =>
          prev.map(t =>
            t.id === progress.transcriptionId
              ? {
                  ...t,
                  status: TranscriptionStatus.FAILED,
                  error: progress.error || 'Transcription failed'
                }
              : t
          )
        );
      }
    );

    return () => {
      unsubscribeHealth();
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeFailed();
      // Clear all timeout timers
      timeoutTimers.forEach(timer => clearTimeout(timer));
    };
  }, [t, user, loadTranscriptions, notifyProgress]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await transcriptionApi.delete(id);
      setTranscriptions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error(t('failedToDelete'), error);
    }
  };

  const handleTranscriptionUpdate = useCallback(async (transcriptionId: string) => {
    try {
      const response = await transcriptionApi.get(transcriptionId);
      if (response.success && response.data) {
        const updatedTranscription = response.data as Transcription;
        setTranscriptions(prev =>
          prev.map(t => t.id === transcriptionId ? updatedTranscription : t)
        );
      }
    } catch (error) {
      console.error('Failed to refresh transcription:', error);
    }
  }, []);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const toggleFormat = (transcriptionId: string) => {
    setUnformattedTranscripts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transcriptionId)) {
        newSet.delete(transcriptionId);
      } else {
        newSet.add(transcriptionId);
      }
      return newSet;
    });
  };

  const formatTranscript = (text: string): string => {
    // Add a line break after each sentence (. ? !)
    // But not for abbreviations like Mr. Dr. etc.
    return text
      .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n')
      .replace(/([.!?])(?=[A-Z])/g, '$1\n\n')
      .trim();
  };

  const getFriendlyErrorMessage = (error: string): string => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('file too large') || errorLower.includes('25mb')) {
      return 'The audio file is too large. Please upload files smaller than 25MB or split your recording into shorter segments.';
    }
    if (errorLower.includes('invalid file format') || errorLower.includes('unsupported format')) {
      return 'This file format is not supported. Please upload audio files in MP3, M4A, WAV, or other common formats.';
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'Connection issue encountered. Please check your internet connection and try again.';
    }
    if (errorLower.includes('timeout')) {
      return 'The transcription took too long to process. This might happen with very long recordings. Please try again or split your file.';
    }
    if (errorLower.includes('api') || errorLower.includes('openai')) {
      return 'There was an issue with the transcription service. Please try again in a few moments.';
    }
    if (errorLower.includes('auth') || errorLower.includes('unauthorized')) {
      return 'Authentication issue. Please sign out and sign back in to continue.';
    }
    if (errorLower.includes('quota') || errorLower.includes('limit')) {
      return 'You\'ve reached your transcription limit. Please try again later or contact support.';
    }
    
    return 'Something went wrong during transcription. Please try again or contact support if the issue persists.';
  };

  const toggleTechnicalError = (id: string) => {
    setShowTechnicalError(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const startEditingTitle = (transcription: Transcription) => {
    setEditingTitleId(transcription.id);
    setEditingTitleValue(transcription.title || transcription.fileName);
  };

  const cancelEditingTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const saveTitle = async (id: string) => {
    const trimmedTitle = editingTitleValue.trim();
    if (!trimmedTitle) {
      // Don't save empty title, keep editing mode open
      return;
    }

    try {
      const response = await transcriptionApi.updateTitle(id, trimmedTitle);
      if (response.success) {
        setTranscriptions(prev =>
          prev.map(t =>
            t.id === id ? { ...t, title: trimmedTitle } : t
          )
        );
        setEditingTitleId(null);
        setEditingTitleValue('');
      } else {
        console.error('Failed to update title - API returned error:', response.error || response.message);
      }
    } catch (error) {
      console.error(t('failedToUpdateTitle'), error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveTitle(id);
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  const getStatusIcon = (status: TranscriptionStatus) => {
    switch (status) {
      case TranscriptionStatus.PROCESSING:
        return <Loader2 className="h-5 w-5 text-[#cc3399] animate-spin" />;
      case TranscriptionStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // Set up infinite scroll
  const sentinelRef = useInfiniteScroll(
    () => loadTranscriptions(false),
    hasMore,
    loadingMore
  );

  const getStatusText = (status: TranscriptionStatus, transcriptionId?: string) => {
    const progress = transcriptionId 
      ? progressMap.get(transcriptionId)
      : Array.from(progressMap.values()).find(
          p => transcriptions.some(t => t.id === p.transcriptionId && t.status === status)
        );
    
    if (progress) {
      // Check if this has been processing for more than 2 minutes
      const processingTime = progress.startTime 
        ? (Date.now() - progress.startTime) / 1000 
        : 0;
      
      if (processingTime > 120) {
        return `${progress.message || status} (${progress.progress}%) - Taking longer than usual...`;
      }
      return `${progress.message || status} (${progress.progress}%)`;
    }
    
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 text-[#cc3399] animate-spin" />
      </div>
    );
  }

  if (transcriptions.length === 0) {
    return (
      <div className="text-center py-16">
        <FileAudio className="h-16 w-16 text-[#cc3399] mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {tDashboard('emptyStateTitle')}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-md mx-auto">
          {tDashboard('emptyStateDescription')}
        </p>
        {onNavigateToUpload && (
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#cc3399] text-white font-medium rounded-lg hover:bg-[#b82d89] transition-colors shadow-sm hover:shadow-md"
          >
            <Upload className="h-5 w-5" />
            {tDashboard('emptyStateButton')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload New Audio Button */}
      {onNavigateToUpload && transcriptions.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#cc3399] text-white text-sm sm:text-base font-medium rounded-lg hover:bg-[#b82d89] transition-colors shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {tDashboard('uploadNewAudio')}
          </button>
        </div>
      )}

      {Object.entries(groupedTranscriptions).map(([monthYear, monthTranscriptions]) => (
        <div key={monthYear}>
          {/* Month Divider */}
          <div className="flex items-baseline gap-3 mb-6 pb-2 border-b border-gray-300 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{monthYear}</h2>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {monthTranscriptions.length} {monthTranscriptions.length === 1 ? 'transcription' : 'transcriptions'}
            </span>
          </div>
          
          {/* Transcriptions for this month */}
          <div className="space-y-6">
            {monthTranscriptions.map((transcription) => {
              const progress = progressMap.get(transcription.id);
              const isExpanded = expandedId === transcription.id;
              const isStuck = isStuckProcessing(transcription);

              return (
                <div
                  key={transcription.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200"
          >
            <div
              className={`px-3 py-4 sm:px-5 sm:py-5 ${
                transcription.status === TranscriptionStatus.COMPLETED && !isExpanded
                  ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-lg transition-colors'
                  : ''
              }`}
              onClick={() => {
                if (transcription.status === TranscriptionStatus.COMPLETED && !isExpanded) {
                  setExpandedId(transcription.id);
                }
              }}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {editingTitleId === transcription.id ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                      <textarea
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onKeyDown={(e) => handleTitleKeyPress(e, transcription.id)}
                        className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-600 rounded-lg px-3 py-2 sm:py-1.5 w-full sm:min-w-0 sm:flex-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20 resize-none"
                        placeholder={t('editTitle')}
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center justify-start gap-2 sm:gap-1.5">
                        <button
                          onClick={() => saveTitle(transcription.id)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 sm:p-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg sm:rounded transition-colors flex-shrink-0"
                          title={tCommon('save')}
                        >
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="sm:hidden text-sm font-medium">Save</span>
                        </button>
                        <button
                          onClick={cancelEditingTitle}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 sm:p-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg sm:rounded transition-colors flex-shrink-0"
                          title={tCommon('cancel')}
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="sm:hidden text-sm font-medium">Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5 sm:gap-2 min-w-0 w-full">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 min-w-0 flex-1 break-words">
                        {transcription.title || transcription.fileName}
                      </h3>
                      {/* Edit button - desktop only */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTitle(transcription);
                        }}
                        className="hidden sm:block p-1 text-gray-400 dark:text-gray-500 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors flex-shrink-0 mt-0.5"
                        title={t('editTitle')}
                      >
                        <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1 mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(transcription.createdAt)}
                    </span>
                    {(transcription.detectedLanguage || (transcription.translations && Object.keys(transcription.translations).length > 0)) && (
                      <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="hidden sm:inline">•</span>
                        <Globe className="h-3 w-3" />
                        <span className="flex items-center gap-1">
                          {transcription.detectedLanguage && (
                            <span className="font-medium text-gray-700 dark:text-gray-400">
                              {transcription.detectedLanguage.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                          {transcription.translations && Object.keys(transcription.translations).map((langCode) => (
                            <span key={langCode} className="flex items-center gap-1">
                              <span>•</span>
                              <span className="font-medium text-gray-700 dark:text-gray-400">
                                {langCode.toUpperCase()}
                              </span>
                            </span>
                          ))}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                  {transcription.status === TranscriptionStatus.PROCESSING && progress && !isStuck ? (
                    <div className="min-w-0 flex-1 sm:flex-none">
                      <ProcessingStatus
                        progress={progress.progress || 0}
                        stage={progress.stage as 'uploading' | 'processing' | 'summarizing' || 'processing'}
                      />
                    </div>
                  ) : transcription.status === TranscriptionStatus.PROCESSING && !progress && !isStuck ? (
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400 animate-spin" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Starting...
                      </span>
                    </div>
                  ) : isStuck ? (
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 dark:text-orange-400 animate-spin" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="hidden sm:inline">Stuck Processing</span>
                        <span className="sm:hidden">Stuck</span>
                      </span>
                    </div>
                  ) : transcription.status === TranscriptionStatus.FAILED ? (
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {getStatusIcon(transcription.status)}
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                        {getStatusText(transcription.status, transcription.id)}
                      </span>
                    </div>
                  ) : transcription.status === TranscriptionStatus.PENDING ? (
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 dark:text-yellow-400" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Pending
                      </span>
                    </div>
                  ) : null}

                  {/* Mobile: Dropdown Menu for Actions */}
                  {(transcription.status === TranscriptionStatus.COMPLETED ||
                    transcription.status === TranscriptionStatus.FAILED ||
                    transcription.status === TranscriptionStatus.PENDING ||
                    isStuck) && (
                    <div className="relative block sm:hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === transcription.id ? null : transcription.id);
                        }}
                        className="flex items-center justify-center p-1.5 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                        title="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === transcription.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                            {/* Edit Title option */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingTitle(transcription);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#cc3399] dark:hover:text-[#cc3399] transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span className="text-gray-800 dark:text-gray-200">{t('editTitle')}</span>
                            </button>
                            {transcription.status === TranscriptionStatus.COMPLETED && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareModalTranscription(transcription);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <Share2 className="h-4 w-4" />
                                <span className="text-gray-800 dark:text-gray-200">{t('share')}</span>
                                {transcription.shareToken && (
                                  <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                handleDelete(transcription.id);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-gray-800 dark:text-gray-200">{t('delete')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Desktop: Individual Action Buttons */}
                  {transcription.status === TranscriptionStatus.COMPLETED && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModalTranscription(transcription);
                      }}
                      className="hidden sm:block p-1.5 sm:p-2 text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all relative"
                      title={t('share')}
                    >
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      {transcription.shareToken && (
                        <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                      )}
                    </button>
                  )}

                  {(transcription.status === TranscriptionStatus.COMPLETED ||
                    transcription.status === TranscriptionStatus.FAILED ||
                    transcription.status === TranscriptionStatus.PENDING ||
                    isStuck) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(transcription.id);
                      }}
                      className="hidden sm:block p-1.5 sm:p-2 text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title={t('delete')}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}

                  {/* Expand/Collapse button */}
                  {transcription.status === TranscriptionStatus.COMPLETED && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : transcription.id);
                      }}
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 ${
                        isExpanded
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-[#cc3399] text-white hover:bg-[#b82d89] shadow-sm hover:shadow-md active:scale-95'
                      }`}
                      title={isExpanded ? t('hideTranscript') : t('viewTranscription')}
                    >
                      <ChevronDown
                        className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {progress && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-[#cc3399] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {transcription.status === TranscriptionStatus.FAILED && transcription.error && (
              <div className="border-t border-gray-200 dark:border-gray-700 border-l-4 border-l-red-500 p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start space-x-2">
                  <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">{t('status_failed')}</p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {getFriendlyErrorMessage(transcription.error)}
                    </p>
                    <button
                      onClick={() => toggleTechnicalError(transcription.id)}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline mt-2 inline-block"
                    >
                      {showTechnicalError.has(transcription.id) ? t('hideTechnicalDetails') : t('showTechnicalDetails')}
                    </button>
                    {showTechnicalError.has(transcription.id) && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                        <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                          {transcription.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isExpanded && transcription.status === TranscriptionStatus.COMPLETED && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-5">
                {/* Show analysis tabs - support both old (analyses) and new (coreAnalyses) formats */}
                {(transcription.analyses || transcription.coreAnalyses) ? (
                  <div>
                    <AnalysisTabs
                      analyses={{
                        // New format: use coreAnalyses if available, fallback to analyses
                        summary: transcription.coreAnalyses?.summary || transcription.analyses?.summary || '',
                        actionItems: transcription.coreAnalyses?.actionItems || transcription.analyses?.actionItems,
                        communicationStyles: transcription.coreAnalyses?.communicationStyles || transcription.analyses?.communicationStyles,
                        transcript: transcription.coreAnalyses?.transcript || transcription.analyses?.transcript || transcription.transcriptText,
                        // Old format fields (only for backward compatibility)
                        emotionalIntelligence: transcription.analyses?.emotionalIntelligence,
                        influencePersuasion: transcription.analyses?.influencePersuasion,
                        personalDevelopment: transcription.analyses?.personalDevelopment,
                        details: transcription.analyses?.details,
                      }}
                      transcriptionId={transcription.id}
                      transcription={transcription}
                      speakerSegments={transcription.speakerSegments}
                      speakers={transcription.speakers}
                      onTranscriptionUpdate={() => handleTranscriptionUpdate(transcription.id)}
                    />
                  </div>
                ) : (
                  /* Legacy view for transcriptions without analyses */
                  <>
                
                <div className="p-4">
                {/* Show content based on active tab */}
                {transcription.summary && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Summary
                        {transcription.summaryVersion && transcription.summaryVersion > 1 && (
                          <span className="ml-2 px-2 py-1 text-xs bg-[#cc3399] text-white rounded">
                            v{transcription.summaryVersion}
                          </span>
                        )}
                      </h4>
                      <button
                        onClick={() => handleCopy(transcription.summary || '', `summary-${transcription.id}`)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition-colors"
                        title="Copy summary"
                      >
                        {copiedId === `summary-${transcription.id}` ? (
                          <>
                            <Check className="h-3 w-3 text-[#cc3399]" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <AnalysisContentRenderer content={transcription.summary} />
                    </div>
                  </div>
                )}
                
                {transcription.transcriptText && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <FileAudio className="h-4 w-4 mr-2" />
                        Full Transcript
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFormat(transcription.id)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                            !unformattedTranscripts.has(transcription.id)
                              ? 'bg-pink-100 dark:bg-pink-900/30 text-[#cc3399] hover:bg-pink-200 dark:hover:bg-pink-900/40'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={!unformattedTranscripts.has(transcription.id) ? "Show original format" : "Format transcript"}
                        >
                          <AlignLeft className="h-3 w-3" />
                          {!unformattedTranscripts.has(transcription.id) ? 'Formatted' : 'Original'}
                        </button>
                        <button
                          onClick={() => handleCopy(
                            !unformattedTranscripts.has(transcription.id)
                              ? formatTranscript(transcription.transcriptText || '')
                              : transcription.transcriptText || '',
                            `transcript-${transcription.id}`
                          )}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition-colors"
                          title="Copy transcript"
                        >
                          {copiedId === `transcript-${transcription.id}` ? (
                            <>
                              <Check className="h-3 w-3 text-[#cc3399]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {!unformattedTranscripts.has(transcription.id)
                          ? formatTranscript(transcription.transcriptText || '')
                          : transcription.transcriptText}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Show regular transcript if no analyses */}
                {!transcription.analyses && transcription.transcriptText && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <FileAudio className="h-4 w-4 mr-2" />
                        Full Transcript
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFormat(transcription.id)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                            !unformattedTranscripts.has(transcription.id)
                              ? 'bg-pink-100 dark:bg-pink-900/30 text-[#cc3399] hover:bg-pink-200 dark:hover:bg-pink-900/40'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={!unformattedTranscripts.has(transcription.id) ? "Show original format" : "Format transcript"}
                        >
                          <AlignLeft className="h-3 w-3" />
                          {!unformattedTranscripts.has(transcription.id) ? 'Formatted' : 'Original'}
                        </button>
                        <button
                          onClick={() => handleCopy(
                            !unformattedTranscripts.has(transcription.id)
                              ? formatTranscript(transcription.transcriptText || '')
                              : transcription.transcriptText || '',
                            `transcript-${transcription.id}`
                          )}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-[#cc3399] dark:hover:text-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition-colors"
                          title="Copy transcript"
                        >
                          {copiedId === `transcript-${transcription.id}` ? (
                            <>
                              <Check className="h-3 w-3 text-[#cc3399]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {!unformattedTranscripts.has(transcription.id)
                          ? formatTranscript(transcription.transcriptText || '')
                          : transcription.transcriptText}
                      </p>
                    </div>
                  </div>
                )}
                </div>
                </>
                )}
              </div>
            )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-10" />
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{t('loadingMore')}</span>
          </div>
        </div>
      )}
      
      {/* No More Items Message */}
      {!hasMore && transcriptions.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          {t('noMoreTranscriptions')}
        </div>
      )}
      
      {/* Share Modal */}
      {shareModalTranscription && (
        <ShareModal
          transcription={shareModalTranscription}
          isOpen={!!shareModalTranscription}
          onClose={() => setShareModalTranscription(null)}
          onShareUpdate={(updatedTranscription) => {
            // Update the transcription in the list with the new share info
            setTranscriptions(prev => 
              prev.map(t => t.id === updatedTranscription.id ? updatedTranscription : t)
            );
          }}
        />
      )}
    </div>
  );
};