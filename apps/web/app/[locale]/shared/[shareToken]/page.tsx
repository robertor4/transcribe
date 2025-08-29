'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SharedTranscriptionView } from '@transcribe/shared';
import { AnalysisTabs } from '@/components/AnalysisTabs';
import {
  FileAudio,
  Calendar,
  User,
  Eye,
  Lock,
  Loader2,
  FileText,
  AlertCircle,
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
      
      // Use relative URL that works in both dev and production
      const url = `/api/transcriptions/shared/${shareToken}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">{t('loading')}</p>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enterPassword')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:border-[#cc3399] hover:border-gray-300 transition-colors placeholder-gray-500 text-gray-900"
              autoFocus
              required
            />
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
          <p className="text-gray-600">{error}</p>
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <FileAudio className="w-6 h-6" />
                {transcription.title || transcription.fileName}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {t('sharedBy')}: {transcription.sharedBy}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(transcription.createdAt)}
                </span>
                {transcription.viewCount && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {t('views')}: {transcription.viewCount}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {t('readOnly')}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Analysis Tabs - only show content that was explicitly shared */}
          {(transcription.analyses || transcription.transcriptText) && (
            <div>
              <AnalysisTabs 
                transcriptionId={transcription.id}
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
              />
            </div>
          )}
          
          {/* Show message if no content was shared */}
          {!transcription.analyses && !transcription.transcriptText && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No content available for this shared transcript.</p>
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