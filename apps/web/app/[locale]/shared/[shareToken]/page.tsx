'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SharedTranscriptionView } from '@transcribe/shared';
import { AnalysisTabs } from '@/components/AnalysisTabs';
import {
  Lock,
  Loader2,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SharedTranscriptionPage() {
  const params = useParams();
  const t = useTranslations('shared');
  const shareToken = params.shareToken as string;
  
  const [transcription, setTranscription] = useState<SharedTranscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#cc3399]" />
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
            <Lock className="w-12 h-12 text-[#cc3399] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900">{t('passwordRequired')}</h2>
            <p className="text-gray-600 mt-2">{t('passwordDescription')}</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:border-[#cc3399] hover:border-gray-400 transition-colors text-gray-800 placeholder:text-gray-500"
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
              className="w-full bg-[#cc3399] text-white py-3 rounded-lg hover:bg-[#b82d89] transition-colors"
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('error.title')}</h2>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">
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
            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-xs font-medium text-blue-700">
                <Lock className="w-3.5 h-3.5" />
                {t('readOnly')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {/* Analysis Tabs - only show content that was explicitly shared */}
          {(transcription.analyses || transcription.transcriptText) && (
            <div>
              <AnalysisTabs
                analyses={{
                  // The backend already filters analyses based on contentOptions
                  // We just need to add the transcript if it was provided
                  ...(transcription.analyses || {}),
                  // Add transcript only if it was shared (backend provides it only when shared)
                  ...(transcription.transcriptText
                    ? { transcript: transcription.transcriptText }
                    : {})
                }}
                speakerSegments={transcription.speakerSegments}
                speakers={transcription.speakers}
                transcription={transcription}
                readOnlyMode={true}
              />
            </div>
          )}

          {/* Show message if no content was shared */}
          {!transcription.analyses && !transcription.transcriptText && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700">No content available for this shared transcript.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a 
              href="https://neuralsummary.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#cc3399] hover:text-[#b82d89] transition-colors"
            >
              Neural Summary
            </a>
          </p>
          <p className="mt-2">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  );
}