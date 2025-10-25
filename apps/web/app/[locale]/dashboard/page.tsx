'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { auth } from '@/lib/firebase';
import { FileUploader } from '@/components/FileUploader';
import { TranscriptionList } from '@/components/TranscriptionList';
import { HowItWorks } from '@/components/HowItWorks';
import { RecordingGuide } from '@/components/RecordingGuide';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UsageBadge } from '@/components/UsageBadge';
import { FileAudio, Upload, Info, Mic } from 'lucide-react';
import websocketService from '@/lib/websocket';
import notificationService from '@/lib/notifications';
import { WEBSOCKET_EVENTS, TranscriptionProgress } from '@transcribe/shared';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'how-it-works' | 'recording-guide'>('upload');
  const [activeTranscriptions, setActiveTranscriptions] = useState<Map<string, string>>(new Map());
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuthState = async () => {
      if (!loading) {
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Force refresh the user to get latest email verification status
        try {
          await user.reload();
          // Get the refreshed user object
          const currentUser = auth.currentUser;
          
          if (currentUser && !currentUser.emailVerified) {
            router.push('/verify-email');
            return;
          }
          
          // Connect WebSocket service when user is authenticated and verified
          console.log('[Dashboard] Connecting WebSocket service...');
          await websocketService.connect();
          console.log('[Dashboard] WebSocket service connected');
        } catch (error) {
          console.error('[Dashboard] Error during auth check or WebSocket connection:', error);
        }
      }
    };
    
    checkAuthState();
    
    // Cleanup: disconnect WebSocket when component unmounts
    return () => {
      console.log('[Dashboard] Disconnecting WebSocket service...');
      websocketService.disconnect();
    };
  }, [user, loading, router]);

  // Load file name mappings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('active_transcriptions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActiveTranscriptions(new Map(Object.entries(parsed)));
        console.log('[Dashboard] Restored active transcriptions from localStorage:', parsed);
      } catch (error) {
        console.error('[Dashboard] Error parsing stored transcriptions:', error);
      }
    }
  }, []);

  // Save file name mappings to localStorage whenever they change
  useEffect(() => {
    const mapObject = Object.fromEntries(activeTranscriptions);
    localStorage.setItem('active_transcriptions', JSON.stringify(mapObject));
    console.log('[Dashboard] Saved active transcriptions to localStorage:', mapObject);
  }, [activeTranscriptions]);

  useEffect(() => {
    // Listen for transcription completion to refresh the list
    const unsubscribe = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED,
      (progress: unknown) => {
        console.log('[Dashboard] Received TRANSCRIPTION_COMPLETED event:', progress);
        const typedProgress = progress as TranscriptionProgress;
        setLastCompletedId(typedProgress.transcriptionId);

        // Get the file name from our stored map
        const fileName = activeTranscriptions.get(typedProgress.transcriptionId) || 'your file';
        console.log('[Dashboard] File name for transcription:', fileName);
        
        // Send browser notification if enabled
        if (typedProgress.status === 'completed') {
          console.log('[Dashboard] Sending completion notification for:', fileName);
          // Don't force notification - let the service handle focus detection properly
          notificationService.sendTranscriptionComplete(
            fileName,
            typedProgress.transcriptionId,
            false // Normal behavior - only notify when tab is not focused
          );
          // Clean up the stored file name
          setActiveTranscriptions(prev => {
            const newMap = new Map(prev);
            newMap.delete(typedProgress.transcriptionId);
            return newMap;
          });
        } else if (typedProgress.status === 'failed') {
          console.log('[Dashboard] Sending failure notification for:', fileName);
          notificationService.sendTranscriptionFailed(
            fileName,
            typedProgress.transcriptionId
          );
          // Clean up the stored file name
          setActiveTranscriptions(prev => {
            const newMap = new Map(prev);
            newMap.delete(typedProgress.transcriptionId);
            return newMap;
          });
        }
      }
    );

    // Also listen for failed events
    const unsubscribeFailed = websocketService.on(
      WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED,
      (progress: unknown) => {
        console.log('[Dashboard] Received TRANSCRIPTION_FAILED event:', progress);
        const typedProgress = progress as TranscriptionProgress;
        const fileName = activeTranscriptions.get(typedProgress.transcriptionId) || 'your file';
        
        notificationService.sendTranscriptionFailed(
          fileName,
          typedProgress.transcriptionId
        );
        
        // Clean up
        setActiveTranscriptions(prev => {
          const newMap = new Map(prev);
          newMap.delete(typedProgress.transcriptionId);
          return newMap;
        });
      }
    );

    return () => {
      unsubscribe();
      unsubscribeFailed();
    };
  }, [activeTranscriptions]);

  const handleUploadComplete = (transcriptionId: string, fileName?: string) => {
    // Store the file name for this transcription
    if (fileName) {
      setActiveTranscriptions(prev => new Map(prev).set(transcriptionId, fileName));
    }
    
    // Subscribe to updates for this transcription
    websocketService.subscribeToTranscription(transcriptionId);

    // Switch to history tab to see progress
    setActiveTab('history');
    setLastCompletedId(transcriptionId);
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // If no user, they should be redirected to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  // If user is unverified, show message while redirecting
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Your email is not verified.</p>
          <p className="text-sm text-gray-500">Redirecting to verification page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/assets/NS-symbol.webp"
                alt="Neural Summary Logo"
                className="h-8 w-auto mr-3"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {tCommon('appName')}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UsageBadge />
              <ThemeToggle />
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex flex-wrap gap-x-8">
            <button
              onClick={() => {
                setActiveTab('upload');
                trackEvent('dashboard_viewed', { tab: 'upload' });
              }}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'upload'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                {tDashboard('uploadAudio')}
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                trackEvent('dashboard_viewed', { tab: 'history' });
              }}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'history'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center">
                <FileAudio className="h-5 w-5 mr-2" />
                {tDashboard('transcriptionHistory')}
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('recording-guide');
                trackEvent('dashboard_viewed', { tab: 'recording-guide' });
              }}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'recording-guide'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center">
                <Mic className="h-5 w-5 mr-2" />
                {tDashboard('recordingGuide')}
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('how-it-works');
                trackEvent('dashboard_viewed', { tab: 'how-it-works' });
              }}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'how-it-works'
                  ? 'border-[#cc3399] text-[#cc3399]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                {tDashboard('howItWorks')}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {activeTab === 'upload' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {tDashboard('uploadAudioFiles')}
              </h2>
              <FileUploader onUploadComplete={handleUploadComplete} />
            </div>
          ) : activeTab === 'history' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {tDashboard('yourTranscriptions')}
              </h2>
              <TranscriptionList lastCompletedId={lastCompletedId} />
            </div>
          ) : activeTab === 'how-it-works' ? (
            <div>
              <HowItWorks onStartTranscribing={() => setActiveTab('upload')} />
            </div>
          ) : activeTab === 'recording-guide' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                {tDashboard('howToRecord')}
              </h2>
              <RecordingGuide />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}