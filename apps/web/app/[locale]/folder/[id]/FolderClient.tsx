'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Folder,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { RecordingModal } from '@/components/RecordingModal';
import { useFolderConversations } from '@/hooks/useFolderConversations';
import { formatDuration, formatRelativeTime } from '@/lib/formatters';

interface FolderClientProps {
  folderId: string;
}

export function FolderClient({ folderId }: FolderClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isRecording, setIsRecording] = useState(false);

  const { folder, conversations, isLoading, error } = useFolderConversations(folderId);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation />}
          showRightPanel={false}
          mainContent={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#cc3399] mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading folder...</p>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // Error or not found state
  if (error || !folder) {
    return (
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation />}
          showRightPanel={false}
          mainContent={
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Folder not found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error?.message || 'The folder you are looking for does not exist or you do not have access to it.'}
                </p>
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="primary">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // Calculate total duration
  const totalDuration = conversations.reduce(
    (sum, conv) => sum + (conv.source?.audioDuration || 0),
    0
  );

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={true}
        rightPanel={
          <div className="p-6">
            {/* Folder Stats */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                Folder Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Conversations
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {conversations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Total Duration
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatDuration(totalDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Created
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatRelativeTime(folder.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
        mainContent={
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Folder Header */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: folder.color
                      ? `${folder.color}20`
                      : 'rgb(243 244 246)',
                  }}
                >
                  <Folder
                    className="w-8 h-8"
                    style={{
                      color: folder.color || 'rgb(107 114 128)',
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                    {folder.name}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400 ml-20">
                <span>{conversations.length} conversations</span>
                <span>·</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </div>

            {/* Conversations in Folder */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Conversations ({conversations.length})
                </h2>
                <Button variant="brand" size="md" onClick={() => setIsRecording(true)}>
                  + New Conversation
                </Button>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-6">
                    <Folder className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-6">
                    Create your first conversation in this folder
                  </p>
                  <Button variant="brand" size="md" onClick={() => setIsRecording(true)}>
                    + New Conversation
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                  {conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/${locale}/conversation/${conversation.id}`}
                      className="group relative flex items-center justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-[#cc3399] group-hover:scale-110 transition-all duration-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#cc3399] transition-colors duration-200 truncate">
                              {conversation.title}
                            </span>
                            {conversation.status === 'ready' && (
                              <span className="flex-shrink-0 text-gray-700 dark:text-gray-400">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                            <span>{formatDuration(conversation.source.audioDuration)}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(conversation.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                        →
                      </div>
                      {conversation.status === 'processing' && (
                        <div className="ml-4 flex-shrink-0">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Processing
                          </span>
                        </div>
                      )}
                      {conversation.status === 'failed' && (
                        <div className="ml-4 flex-shrink-0">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            Failed
                          </span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Floating Action Button */}
      <FloatingRecordButton onClick={() => setIsRecording(true)} isRecording={isRecording} />

      {/* Recording Modal */}
      <RecordingModal
        isOpen={isRecording}
        onStop={() => setIsRecording(false)}
        onCancel={() => setIsRecording(false)}
      />
    </div>
  );
}
