'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SharedTranscriptionView } from '@transcribe/shared';
import { SummaryRenderer } from '@/components/SummaryRenderer';
import TranscriptTimeline from '@/components/TranscriptTimeline';
import { AnalysisContentRenderer } from '@/components/AnalysisContentRenderer';
import { Button } from '@/components/Button';
import {
  Lock,
  Loader2,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  BarChart3,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

export default function SharedTranscriptionPage() {
  const params = useParams();
  const t = useTranslations('shared');
  const shareToken = params.shareToken as string;

  // Force light mode on shared pages (they don't have theme controls)
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    html.classList.remove('dark');

    // Restore dark mode if it was active when leaving the page
    return () => {
      if (wasDark) {
        html.classList.add('dark');
      }
    };
  }, []);

  const [transcription, setTranscription] = useState<SharedTranscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'ai-assets'>('summary');

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

  const fetchSharedTranscription = useCallback(async (withPassword?: string, incrementView: boolean = false) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (withPassword) {
        queryParams.append('password', withPassword);
      }
      if (incrementView) {
        queryParams.append('incrementView', 'true');
      }

      // Ensure we're using the correct base URL in the browser
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/api/transcriptions/shared/${shareToken}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.message?.includes('password')) {
          setPasswordRequired(true);
          setPasswordSubmitted(false);
        } else {
          setError(data.message || t('error.invalidLink'));
        }
        return;
      }

      if (data.success && data.data) {
        setTranscription(data.data);
        setPasswordRequired(false);
      } else {
        setError(t('error.notFound'));
      }
    } catch (error) {
      console.error('Error fetching shared transcription:', error);
      setError(t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [shareToken, t]);

  useEffect(() => {
    if (shareToken) {
      // Use sessionStorage to track if we've already incremented for this session
      const sessionKey = `share_view_${shareToken}`;
      const hasViewed = sessionStorage.getItem(sessionKey);

      if (!hasViewed) {
        // First time viewing in this session - increment the view count
        fetchSharedTranscription(undefined, true);
        sessionStorage.setItem(sessionKey, 'true');
      } else {
        // Already viewed in this session - don't increment
        fetchSharedTranscription(undefined, false);
      }
    }
  }, [shareToken, fetchSharedTranscription]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitted(true);
    // Don't increment view count when submitting password
    fetchSharedTranscription(password, false);
  };


  // Copy summary to clipboard
  const handleCopySummary = async () => {
    if (!transcription) return;

    const summaryV2 = transcription.summaryV2;
    const summaryText = transcription.analyses?.summary || '';

    let textToCopy = '';

    if (summaryV2) {
      // Build text from structured summary
      if (summaryV2.intro) {
        textToCopy += summaryV2.intro + '\n\n';
      }
      if (summaryV2.keyPoints?.length) {
        textToCopy += 'Key Points:\n';
        summaryV2.keyPoints.forEach((point) => {
          textToCopy += `• ${point.topic}: ${point.description}\n`;
        });
        textToCopy += '\n';
      }
      if (summaryV2.detailedSections?.length) {
        summaryV2.detailedSections.forEach((section) => {
          textToCopy += `${section.topic}\n${section.content}\n\n`;
        });
      }
    } else {
      textToCopy = summaryText;
    }

    try {
      await navigator.clipboard.writeText(textToCopy.trim());
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  // Check which sections are available
  const hasSummary = !!(transcription?.summaryV2 || transcription?.analyses?.summary);
  const hasTranscript = !!transcription?.transcriptText;
  const hasAIAssets = !!(transcription?.generatedAnalyses && transcription.generatedAnalyses.length > 0);

  // Set initial active tab based on available content
  useEffect(() => {
    if (transcription) {
      if (hasSummary) {
        setActiveTab('summary');
      } else if (hasTranscript) {
        setActiveTab('transcript');
      } else if (hasAIAssets) {
        setActiveTab('ai-assets');
      }
    }
  }, [transcription, hasSummary, hasTranscript, hasAIAssets]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#8D6AFA]" />
          <p className="text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired && !passwordSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-[#8D6AFA] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 uppercase tracking-wide">{t('passwordRequired')}</h2>
            <p className="text-gray-600 mt-2">{t('passwordDescription')}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:border-[#8D6AFA] hover:border-gray-400 transition-colors text-gray-800 placeholder:text-gray-500"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-[#8D6AFA] text-white py-3 rounded-full hover:bg-[#7A5AE0] transition-colors"
            >
              {t('submit')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 uppercase tracking-wide">{t('error.title')}</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!transcription) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Logo/Branding - Logo only, no text */}
          <div className="flex items-center justify-between mb-6">
            <img
              src="/assets/logos/neural-summary-logo.svg"
              alt="Neural Summary"
              className="h-8 w-auto"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-xs font-medium text-[#8D6AFA]">
              <Lock className="w-3.5 h-3.5" />
              {t('readOnly')}
            </div>
          </div>

          {/* Title and Metadata */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words uppercase tracking-wide">
              {transcription.title || transcription.fileName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>{transcription.sharedBy}</span>
              <span className="text-gray-400">·</span>
              <span>{formatDate(transcription.createdAt)}</span>
              {transcription.viewCount !== undefined && (
                <>
                  <span className="text-gray-400">·</span>
                  <span>{transcription.viewCount} {transcription.viewCount === 1 ? 'view' : 'views'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6">
            <div className="flex items-center gap-1 py-1">
              {hasSummary && (
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors duration-200 ${
                    activeTab === 'summary'
                      ? 'text-[#8D6AFA] border-b-2 border-[#8D6AFA] -mb-[1px] bg-purple-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Summary
                  </span>
                </button>
              )}
              {hasTranscript && (
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors duration-200 ${
                    activeTab === 'transcript'
                      ? 'text-[#8D6AFA] border-b-2 border-[#8D6AFA] -mb-[1px] bg-purple-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transcript
                  </span>
                </button>
              )}
              {hasAIAssets && (
                <button
                  onClick={() => setActiveTab('ai-assets')}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors duration-200 ${
                    activeTab === 'ai-assets'
                      ? 'text-[#8D6AFA] border-b-2 border-[#8D6AFA] -mb-[1px] bg-purple-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Assets
                  </span>
                </button>
              )}
            </div>
          </nav>

          <div className="p-6">
            {/* Summary Tab Content */}
            {hasSummary && (
              <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
                <div className="flex items-center justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopySummary}
                  >
                    {copiedSummary ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <SummaryRenderer
                  content={transcription.analyses?.summary || ''}
                  summaryV2={transcription.summaryV2}
                />
              </div>
            )}

            {/* Transcript Tab Content */}
            {hasTranscript && (
              <div className={activeTab === 'transcript' ? 'block' : 'hidden'}>
                {transcription.speakerSegments && transcription.speakerSegments.length > 0 ? (
                  <TranscriptTimeline
                    transcriptionId={transcription.id}
                    segments={transcription.speakerSegments}
                    readOnlyMode={true}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono bg-gray-50 p-4 rounded-lg">
                    {transcription.transcriptText}
                  </p>
                )}
              </div>
            )}

            {/* AI Assets Tab Content */}
            {hasAIAssets && (
              <div className={activeTab === 'ai-assets' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  {transcription.generatedAnalyses?.map((analysis) => (
                    <div key={analysis.id} className="p-6 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                        {analysis.templateName}
                      </h3>
                      <AnalysisContentRenderer
                        content={analysis.content}
                        contentType={analysis.contentType}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show message if no content was shared */}
            {!hasSummary && !hasTranscript && !hasAIAssets && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700">No content available for this shared conversation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>{t('footer.poweredBy')}</p>
            <p className="mt-2">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
