'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { transcriptionApi } from '@/lib/api';
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
  Download, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  AlignLeft,
  Edit3,
  X,
  Users,
  User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { SummaryWithComments } from './SummaryWithComments';
import SpeakerSummary from './SpeakerSummary';
import TranscriptWithSpeakers from './TranscriptWithSpeakers';
import SpeakerTimeline from './SpeakerTimeline';

export const TranscriptionList: React.FC = () => {
  const t = useTranslations('transcription');
  const tCommon = useTranslations('common');
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, TranscriptionProgress>>(new Map());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unformattedTranscripts, setUnformattedTranscripts] = useState<Set<string>>(new Set());
  const [showTechnicalError, setShowTechnicalError] = useState<Set<string>>(new Set());
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [showSpeakerView, setShowSpeakerView] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<{ [key: string]: 'summary' | 'transcript' | 'speakers' }>({});

  useEffect(() => {
    loadTranscriptions();
    
    // Listen for real-time updates
    const unsubscribeProgress = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS,
      (progress: TranscriptionProgress) => {
        setProgressMap(prev => new Map(prev).set(progress.transcriptionId, progress));
      }
    );

    const unsubscribeComplete = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      (progress: TranscriptionProgress) => {
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(progress.transcriptionId);
          return newMap;
        });
        loadTranscriptions();
      }
    );

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
    };
  }, []);

  const loadTranscriptions = async () => {
    try {
      const response = await transcriptionApi.list();
      if (response?.success) {
        setTranscriptions(response.data.items);
      }
    } catch (error) {
      console.error(t('failedToLoad'), error);
    } finally {
      setLoading(false);
    }
  };

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
      case TranscriptionStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case TranscriptionStatus.PROCESSING:
        return <Loader2 className="h-5 w-5 text-[#cc3399] animate-spin" />;
      case TranscriptionStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: TranscriptionStatus) => {
    const progress = Array.from(progressMap.values()).find(
      p => transcriptions.some(t => t.id === p.transcriptionId && t.status === status)
    );
    
    if (progress) {
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
    <div className="space-y-4">
      {transcriptions.map((transcription) => {
        const progress = progressMap.get(transcription.id);
        const isExpanded = expandedId === transcription.id;
        
        return (
          <div
            key={transcription.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FileAudio className="h-8 w-8 text-[#cc3399] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {editingTitleId === transcription.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onKeyDown={(e) => handleTitleKeyPress(e, transcription.id)}
                            className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 min-w-0"
                            placeholder={t('editTitle')}
                            autoFocus
                            style={{ width: '200px' }}
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
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
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(transcription.fileSize)}
                      </span>
                      {transcription.duration && (
                        <span className="text-xs text-gray-500">
                          {formatDuration(transcription.duration)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(transcription.createdAt).toLocaleDateString()}
                      </span>
                      {transcription.speakerCount && transcription.speakerCount > 0 && (
                        <span className="text-xs text-[#cc3399] flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {transcription.speakerCount} {transcription.speakerCount === 1 ? 'speaker' : 'speakers'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(transcription.status)}
                    <span className="text-sm text-gray-600">
                      {progress ? progress.message : getStatusText(transcription.status)}
                    </span>
                  </div>
                  
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
                {/* Tab navigation for expanded view */}
                {transcription.speakers && transcription.speakers.length > 0 && (
                  <div className="border-b border-gray-200 bg-white px-4">
                    <nav className="-mb-px flex space-x-4">
                      <button
                        onClick={() => setActiveTab(prev => ({ ...prev, [transcription.id]: 'summary' }))}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          (!activeTab[transcription.id] || activeTab[transcription.id] === 'summary')
                            ? 'border-[#cc3399] text-[#cc3399]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Summary
                      </button>
                      <button
                        onClick={() => setActiveTab(prev => ({ ...prev, [transcription.id]: 'transcript' }))}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab[transcription.id] === 'transcript'
                            ? 'border-[#cc3399] text-[#cc3399]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Transcript
                      </button>
                      <button
                        onClick={() => setActiveTab(prev => ({ ...prev, [transcription.id]: 'speakers' }))}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                          activeTab[transcription.id] === 'speakers'
                            ? 'border-[#cc3399] text-[#cc3399]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        Speakers ({transcription.speakerCount})
                      </button>
                    </nav>
                  </div>
                )}
                
                <div className="p-4">
                {/* Show content based on active tab */}
                {(!activeTab[transcription.id] || activeTab[transcription.id] === 'summary') && transcription.summary && (
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
                        transcriptionId={transcription.id}
                        summary={transcription.summary}
                        onSummaryRegenerated={(newSummary) => {
                          setTranscriptions(prev => 
                            prev.map(t => 
                              t.id === transcription.id 
                                ? { ...t, summary: newSummary, summaryVersion: (t.summaryVersion || 1) + 1 }
                                : t
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {activeTab[transcription.id] === 'transcript' && transcription.transcriptText && (
                  transcription.speakers && transcription.speakers.length > 0 ? (
                    <TranscriptWithSpeakers
                      segments={transcription.speakerSegments}
                      transcriptWithSpeakers={transcription.transcriptWithSpeakers}
                    />
                  ) : (
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
                  )
                )}
                
                {activeTab[transcription.id] === 'speakers' && transcription.speakers && (
                  <div className="space-y-4">
                    <SpeakerSummary speakers={transcription.speakers} />
                    <SpeakerTimeline segments={transcription.speakerSegments} />
                  </div>
                )}
                
                {/* Show regular transcript if no tabs (no speaker data) */}
                {!transcription.speakers && transcription.transcriptText && (
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};