'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Target, Heart, Users, Folder, MessageSquare } from 'lucide-react';
import { ThreePaneLayout } from '@/components/ThreePaneLayout';
import { LeftNavigation } from '@/components/LeftNavigation';
import { Button } from '@/components/Button';
import { FloatingRecordButton } from '@/components/FloatingRecordButton';
import { RecordingModal } from '@/components/RecordingModal';
import { mockFolders, mockConversations, formatDuration, formatRelativeTime } from '@/lib/mockData';

interface FolderClientProps {
  folderId: string;
}

export function FolderClient({ folderId }: FolderClientProps) {
  const folder = mockFolders.find(f => f.id === folderId);
  const conversations = mockConversations.filter(c => c.folderId === folderId);
  const [isRecording, setIsRecording] = useState(false);

  if (!folder) {
    return (
      <div className="h-screen flex flex-col">
        <ThreePaneLayout
          leftSidebar={<LeftNavigation />}
          showRightPanel={false}
          mainContent={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-6">
                  <Folder className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Folder not found</h1>
                <Link href="/prototype-dashboard-v2" className="text-[#cc3399] hover:underline">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  const FolderIcon = folder.color === 'purple' ? Briefcase : folder.color === 'blue' ? Target : Heart;

  return (
    <div className="h-screen flex flex-col">
      <ThreePaneLayout
        leftSidebar={<LeftNavigation />}
        showRightPanel={true}
        rightPanel={
          <div className="p-6">
            {/* Folder Members in Right Panel */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Members</h2>
              </div>
              <div className="space-y-3">
                {folder.members.map((member) => (
                  <div key={member.userId} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{member.email}</div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                      member.role === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
              {folder.members.length < 5 && (
                <div className="mt-4">
                  <Button variant="ghost" fullWidth size="sm">
                    + Invite Member
                  </Button>
                </div>
              )}
            </div>

            {/* Folder Stats */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Folder Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Conversations</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{folder.conversationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Duration</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatDuration(folder.totalMinutes * 60)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Members</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{folder.members.length}</span>
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <FolderIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{folder.name}</h1>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-400 ml-20">
                <span>{folder.conversationCount} conversations</span>
                <span>·</span>
                <span>{formatDuration(folder.totalMinutes * 60)}</span>
                <span>·</span>
                <span>{folder.members.length} member{folder.members.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Conversations in Folder */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Conversations ({conversations.length})
                </h2>
                <Button variant="brand" size="md">
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
                  <Button variant="brand" size="md">
                    + New Conversation
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-100 dark:border-gray-800">
                  {conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/prototype-conversation-v2/${conversation.id}`}
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
                              <span className="flex-shrink-0 text-gray-700 dark:text-gray-400">✓</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                            <span>{formatDuration(conversation.source.audioDuration)}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(conversation.createdAt)}</span>
                            {conversation.sharing.viewCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{conversation.sharing.viewCount} views</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-sm font-medium text-gray-400 group-hover:text-[#cc3399] group-hover:translate-x-1 transition-all duration-200">
                        →
                      </div>
                      {conversation.status === 'processing' && (
                        <div className="ml-4 flex-shrink-0">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                            ⏳ Processing
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

            {/* Prototype Notice */}
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🧪</div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Three-Pane UI Prototype (V2)</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Folder view with modern three-pane layout. Navigate using the left sidebar.
                    Click any conversation to view it in the V2 interface. Use the floating button (bottom-right) for quick recording.
                  </div>
                </div>
              </div>
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
