'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploader } from '@/components/FileUploader';
import { TranscriptionList } from '@/components/TranscriptionList';
import { HowItWorks } from '@/components/HowItWorks';
import { RecordingGuide } from '@/components/RecordingGuide';
import { NotificationToggle } from '@/components/NotificationToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LogOut, FileAudio, Upload, Info, Mic } from 'lucide-react';
import websocketService from '@/lib/websocket';
import notificationService from '@/lib/notifications';
import { WEBSOCKET_EVENTS, TranscriptionProgress } from '@transcribe/shared';
import { useTranslations, useLocale } from 'next-intl';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'how-it-works' | 'recording-guide'>('how-it-works');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTranscriptions, setActiveTranscriptions] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, router, locale]);

  useEffect(() => {
    // Listen for transcription completion to refresh the list
    const unsubscribe = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      (progress: TranscriptionProgress) => {
        console.log('Transcription completed event received:', progress);
        setRefreshKey(prev => prev + 1);
        
        // Get the file name from our stored map
        const fileName = activeTranscriptions.get(progress.transcriptionId) || 'your file';
        console.log('File name for notification:', fileName);
        console.log('Active transcriptions map:', activeTranscriptions);
        
        // Send browser notification if enabled
        if (progress.status === 'completed') {
          console.log('Sending completion notification for:', fileName);
          // Force notification for testing (third parameter = true)
          notificationService.sendTranscriptionComplete(
            fileName,
            progress.transcriptionId,
            true // Force notification even if tab is focused
          );
          // Clean up the stored file name
          setActiveTranscriptions(prev => {
            const newMap = new Map(prev);
            newMap.delete(progress.transcriptionId);
            return newMap;
          });
        } else if (progress.status === 'failed') {
          console.log('Sending failure notification for:', fileName);
          notificationService.sendTranscriptionFailed(
            fileName,
            progress.transcriptionId
          );
          // Clean up the stored file name
          setActiveTranscriptions(prev => {
            const newMap = new Map(prev);
            newMap.delete(progress.transcriptionId);
            return newMap;
          });
        }
      }
    );

    return unsubscribe;
  }, [activeTranscriptions]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const handleUploadComplete = (transcriptionId: string, fileName?: string) => {
    // Store the file name for this transcription
    if (fileName) {
      setActiveTranscriptions(prev => new Map(prev).set(transcriptionId, fileName));
    }
    
    // Subscribe to updates for this transcription
    websocketService.subscribeToTranscription(transcriptionId);
    
    // Switch to history tab to see progress
    setActiveTab('history');
    setRefreshKey(prev => prev + 1);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="/assets/OT-symbol.webp" 
                alt="OT Logo" 
                className="h-8 w-auto mr-3"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {t('common.appName')}
                </h1>
                <p className="text-xs text-gray-500">By Olympia Tech</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <LanguageSwitcher />
              <NotificationToggle />
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                title={t('auth.signOut')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex flex-wrap gap-x-8">
            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'how-it-works'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                {t('dashboard.howItWorks')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'upload'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                {t('dashboard.uploadAudio')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'history'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <FileAudio className="h-5 w-5 mr-2" />
                {t('dashboard.transcriptionHistory')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recording-guide')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'recording-guide'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <Mic className="h-5 w-5 mr-2" />
                {t('dashboard.recordingGuide')}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'upload' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Upload audio files
              </h2>
              <FileUploader onUploadComplete={handleUploadComplete} />
            </div>
          ) : activeTab === 'history' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Your transcriptions
              </h2>
              <TranscriptionList key={refreshKey} />
            </div>
          ) : activeTab === 'how-it-works' ? (
            <div>
              <HowItWorks onStartTranscribing={() => setActiveTab('upload')} />
            </div>
          ) : activeTab === 'recording-guide' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                How to record audio on any device
              </h2>
              <RecordingGuide />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}