'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { transcriptionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import websocketService from '@/lib/websocket';
import { 
  Transcription, 
  TranscriptionStatus,
  TranscriptionProgress,
  WEBSOCKET_EVENTS,
  formatFileSize,
  formatDuration 
} from '@transcribe/shared';
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
  Calendar
} from 'lucide-react';
import { SummaryWithComments } from './SummaryWithComments';
import { AnalysisTabs } from './AnalysisTabs';
import { ShareModal } from './ShareModal';
import { ProcessingStatus } from './ProcessingStatus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export const TranscriptionList: React.FC = () => {
  const t = useTranslations('transcription');
  const tCommon = useTranslations('common');
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
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20; // Load 20 items at a time

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formatted = d.toLocaleDateString('en-US', options);
    
    // Add ordinal suffix to day
    const day = d.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'][
      day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) ? day % 10 : 0
    ];
    
    return formatted.replace(/\d+,/, `${day}${suffix},`);
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
        const data = response.data as any;
        const newItems = data.items as Transcription[];
        
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
      const errorObj = error as { message?: string; status?: number; response?: { status?: number; data?: unknown } };
      console.error('Failed to load transcriptions:', errorObj);
      
      if (errorObj?.response?.status === 401 && 
          (errorObj?.response?.data as any)?.message?.includes('Email not verified')) {
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
    if (user) {
      loadTranscriptions(true);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!user) return;
    
    // Track timeout timers for processing transcriptions
    const timeoutTimers = new Map<string, NodeJS.Timeout>();
    
    // Listen for real-time updates
    const unsubscribeProgress = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS,
      (data: unknown) => {
        const progress = data as TranscriptionProgress;
        setProgressMap(prev => {
          const newMap = new Map(prev);
          const existingProgress = newMap.get(progress.transcriptionId);
          // Preserve start time if it exists, otherwise set it
          const startTime = existingProgress?.startTime || Date.now();
          newMap.set(progress.transcriptionId, { ...progress, startTime });
          return newMap;
        });
        
        // Set or reset timeout for this transcription (5 minutes)
        const existingTimer = timeoutTimers.get(progress.transcriptionId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        const newTimer = setTimeout(() => {
          // Mark as failed after timeout
          setTranscriptions(prev => 
            prev.map(t => 
              t.id === progress.transcriptionId 
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
        }, 5 * 60 * 1000); // 5 minutes timeout
        
        timeoutTimers.set(progress.transcriptionId, newTimer);
      }
    );

    const unsubscribeComplete = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      (data: unknown) => {
        const progress = data as TranscriptionProgress;
        // Clear timeout timer
        const timer = timeoutTimers.get(progress.transcriptionId);
        if (timer) {
          clearTimeout(timer);
          timeoutTimers.delete(progress.transcriptionId);
        }
        
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(progress.transcriptionId);
          return newMap;
        });
        // Reload from the beginning to show new transcriptions
        loadTranscriptions(true);
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
        
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(progress.transcriptionId);
          return newMap;
        });
        
        // Update the transcription status to failed
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
        
        // Reload to get the latest status
        loadTranscriptions(true);
      }
    );

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeFailed();
      // Clear all timeout timers
      timeoutTimers.forEach(timer => clearTimeout(timer));
    };
  }, [t, user, loadTranscriptions]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await transcriptionApi.delete(id);
      setTranscriptions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error(t('failedToDelete'), error);
    }
  };

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
      <div className="text-center py-12">
        <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{t('noTranscriptAvailable')}</p>
        <p className="text-sm text-gray-400 mt-2">{t('noSummaryAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedTranscriptions).map(([monthYear, monthTranscriptions]) => (
        <div key={monthYear}>
          {/* Month Divider */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-6 px-6 py-3 mb-4 border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[#cc3399]/10 rounded-lg">
                <Calendar className="h-4 w-4 text-[#cc3399]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">{monthYear}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {monthTranscriptions.length} {monthTranscriptions.length === 1 ? 'transcription' : 'transcriptions'}
              </span>
            </div>
          </div>
          
          {/* Transcriptions for this month */}
          <div className="space-y-4">
            {monthTranscriptions.map((transcription) => {
              const progress = progressMap.get(transcription.id);
              const isExpanded = expandedId === transcription.id;
              
              return (
                <div
                  key={transcription.id}
            className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:scale-[1.005] cursor-pointer"
          >
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileAudio className="h-8 w-8 text-[#cc3399] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1">
                      {editingTitleId === transcription.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onKeyDown={(e) => handleTitleKeyPress(e, transcription.id)}
                            className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 min-w-0 flex-1"
                            placeholder={t('editTitle')}
                            autoFocus
                          />
                          <button
                            onClick={() => saveTitle(transcription.id)}
                            className="p-1 text-green-600 hover:text-green-800 flex-shrink-0"
                            title={tCommon('save')}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditingTitle}
                            className="p-1 text-red-600 hover:text-red-800 flex-shrink-0"
                            title={tCommon('cancel')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate min-w-0">
                            {transcription.title || transcription.fileName}
                          </p>
                          <button
                            onClick={() => startEditingTitle(transcription)}
                            className="p-1 text-gray-400 hover:text-[#cc3399] transition-colors flex-shrink-0"
                            title={t('editTitle')}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 overflow-hidden">
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatFileSize(transcription.fileSize)}
                      </span>
                      {transcription.duration && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDuration(transcription.duration)}
                        </span>
                      )}
                      {transcription.title && transcription.title !== transcription.fileName && (
                        <span className="text-xs text-gray-500 truncate">
                          {transcription.fileName}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(transcription.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 flex-shrink-0">
                  {transcription.status === TranscriptionStatus.PROCESSING && progress ? (
                    <ProcessingStatus 
                      progress={progress.progress || 0}
                      stage={progress.stage as 'uploading' | 'processing' | 'summarizing' || 'processing'}
                    />
                  ) : transcription.status === TranscriptionStatus.FAILED ? (
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transcription.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(transcription.status, transcription.id)}
                      </span>
                    </div>
                  ) : null}
                  
                  {transcription.status === TranscriptionStatus.COMPLETED && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : transcription.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isExpanded 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-[#cc3399] text-white hover:bg-[#b82e86] shadow-md hover:shadow-lg'
                      }`}
                      title={isExpanded ? t('hideTranscript') : t('viewTranscription')}
                    >
                      {isExpanded ? t('close') : t('view')}
                    </button>
                  )}
                  
                  {transcription.status === TranscriptionStatus.COMPLETED && (
                    <button
                      onClick={() => setShareModalTranscription(transcription)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors relative"
                      title={t('share')}
                    >
                      <Share2 className="h-5 w-5" />
                      {transcription.shareToken && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </button>
                  )}
                  
                  {(transcription.status === TranscriptionStatus.COMPLETED || 
                    transcription.status === TranscriptionStatus.FAILED) && (
                    <button
                      onClick={() => handleDelete(transcription.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {progress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#cc3399] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {transcription.status === TranscriptionStatus.FAILED && transcription.error && (
              <div className="border-t border-gray-200 p-4 bg-red-50">
                <div className="flex items-start space-x-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 mb-1">{t('status_failed')}</p>
                    <p className="text-sm text-red-700">
                      {getFriendlyErrorMessage(transcription.error)}
                    </p>
                    <button
                      onClick={() => toggleTechnicalError(transcription.id)}
                      className="text-xs text-red-600 hover:text-red-800 underline mt-2 inline-block"
                    >
                      {showTechnicalError.has(transcription.id) ? t('hideTechnicalDetails') : t('showTechnicalDetails')}
                    </button>
                    {showTechnicalError.has(transcription.id) && (
                      <div className="mt-2 p-2 bg-red-100 rounded">
                        <p className="text-xs text-red-600 font-mono break-all">
                          {transcription.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isExpanded && transcription.status === TranscriptionStatus.COMPLETED && (
              <div className="border-t border-gray-200 bg-gray-50">
                {/* Show analysis tabs if we have analyses, otherwise show legacy tabs */}
                {transcription.analyses ? (
                  <div className="p-4">
                    <AnalysisTabs 
                      analyses={{
                        ...transcription.analyses,
                        transcript: transcription.transcriptText
                      }} 
                      transcriptionId={transcription.id}
                      speakerSegments={transcription.speakerSegments}
                      speakers={transcription.speakers}
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
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
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
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#cc3399] hover:bg-pink-50 rounded transition-colors"
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
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <SummaryWithComments
                        summary={transcription.summary}
                      />
                    </div>
                  </div>
                )}
                
                {transcription.transcriptText && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                        <FileAudio className="h-4 w-4 mr-2" />
                        Full Transcript
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFormat(transcription.id)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                            !unformattedTranscripts.has(transcription.id)
                              ? 'bg-pink-100 text-[#cc3399] hover:bg-pink-200'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#cc3399] hover:bg-pink-50 rounded transition-colors"
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
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
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
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                        <FileAudio className="h-4 w-4 mr-2" />
                        Full Transcript
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFormat(transcription.id)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                            !unformattedTranscripts.has(transcription.id)
                              ? 'bg-pink-100 text-[#cc3399] hover:bg-pink-200'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#cc3399] hover:bg-pink-50 rounded transition-colors"
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
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
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
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{t('loadingMore')}</span>
          </div>
        </div>
      )}
      
      {/* No More Items Message */}
      {!hasMore && transcriptions.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
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