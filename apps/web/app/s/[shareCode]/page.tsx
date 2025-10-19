'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SharedTranscriptionView, AnalysisResults } from '@transcribe/shared';
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
  const shareCode = params.shareCode as string;
  
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#cc3399] mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('error.title')}
            </h1>
            <p className="text-gray-600 mb-6">
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-[#cc3399] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('passwordRequired')}
            </h1>
            <p className="text-gray-600">
              {t('passwordDescription')}
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg text-gray-800 placeholder:text-gray-500 focus:outline-none focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20"
                autoFocus
                required
              />
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('error.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileAudio className="w-8 h-8 text-[#cc3399]" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {transcription.title || transcription.fileName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {t('sharedBy')}: {transcription.sharedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(transcription.createdAt)}
                  </span>
                  {transcription.viewCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {t('views')}: {transcription.viewCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                <FileText className="w-4 h-4 inline mr-1" />
                {t('readOnly')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Analysis Tabs - includes transcript as a tab */}
            {(transcription.analyses || transcription.transcriptText) && (
              <AnalysisTabs
                analyses={{
                  ...transcription.analyses,
                  transcript: transcription.transcriptText
                } as AnalysisResults}
                speakerSegments={transcription.speakerSegments}
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
            <p className="mt-2">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}