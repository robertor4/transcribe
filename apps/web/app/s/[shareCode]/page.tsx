'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SharedTranscriptionView, AnalysisResults } from '@transcribe/shared';
import { AnalysisTabs } from '@/components/AnalysisTabs';
import {
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SharedTranscriptionPage() {
  const params = useParams();
  const t = useTranslations('shared');
  const shareCode = params.shareCode as string;

  const [transcription, setTranscription] = useState<SharedTranscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fix hydration mismatch: compute year once on mount
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  const formatDate = (date: Date | string) => {
    // Fix hydration: ensure consistent date formatting between server and client
    const d = new Date(date);
    const month = d.toLocaleString('en-US', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();

    // Add ordinal suffix to day
    const suffix = ['th', 'st', 'nd', 'rd'][
      day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) ? day % 10 : 0
    ];

    return `${month} ${day}${suffix}, ${year}`;
  };

  const fetchSharedTranscription = useCallback(async (withPassword?: string, incrementView: boolean = false) => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (withPassword) {
        params.append('password', withPassword);
      }
      // Only increment view on first successful load
      if (incrementView) {
        params.append('incrementView', 'true');
      }
      
      const queryString = params.toString();
      // Ensure we're using the correct base URL in the browser
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/api/transcriptions/shared/${shareCode}${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.status === 401 && data.message?.includes('Password required')) {
        setPasswordRequired(true);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load transcription');
      }
      
      if (data.success && data.data) {
        setTranscription(data.data);
        setPasswordRequired(false);
        setPasswordSubmitted(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching shared transcription:', error);
      setError(error instanceof Error ? error.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [shareCode, t]);

  useEffect(() => {
    // Initial load - increment view count
    fetchSharedTranscription(undefined, true);
  }, [shareCode, fetchSharedTranscription]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitted(true);
    
    // Try with password but don't increment view again
    await fetchSharedTranscription(password, false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#cc3399] mx-auto mb-4" />
          <p className="text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('error.title')}
            </h1>
            <p className="text-gray-700 mb-6">
              {error === 'Transcription not found' ? t('error.notFound') :
               error === 'Invalid or expired share link' ? t('error.invalidLink') :
               error}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (passwordRequired && !passwordSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-[#cc3399] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('passwordRequired')}
            </h1>
            <p className="text-gray-700">
              {t('passwordDescription')}
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full px-4 py-3 pr-12 border border-gray-400 rounded-lg text-gray-800 placeholder:text-gray-500 focus:outline-none focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20"
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
              className="w-full px-6 py-3 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] transition-colors"
            >
              {t('submit')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700">{t('error.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/assets/NS-symbol.webp"
              alt="Neural Summary"
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold text-gray-900">Neural Summary</span>
          </div>

          {/* Title and Metadata */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">
                {transcription.title || transcription.fileName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{transcription.sharedBy}</span>
                {mounted && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span>{formatDate(transcription.createdAt)}</span>
                  </>
                )}
                {mounted && transcription.viewCount !== undefined && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span>{transcription.viewCount} {transcription.viewCount === 1 ? 'view' : 'views'}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-md text-xs font-medium text-[#cc3399]">
                <Lock className="w-3.5 h-3.5" />
                {t('readOnly')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Analysis Tabs - includes transcript as a tab */}
            {(transcription.analyses || transcription.transcriptText || transcription.generatedAnalyses) && (
              <AnalysisTabs
                analyses={{
                  ...transcription.analyses,
                  transcript: transcription.transcriptText
                } as AnalysisResults}
                generatedAnalyses={transcription.generatedAnalyses}
                speakerSegments={transcription.speakerSegments}
                transcription={transcription}
                readOnlyMode={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>{t('footer.poweredBy')}</p>
            {currentYear && (
              <p className="mt-2">{t('footer.copyright', { year: currentYear })}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}