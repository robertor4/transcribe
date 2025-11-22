'use client';

import { Clock, FileIcon, Calendar, Folder as FolderIcon, Tag, Users as UsersIcon, Share2, Download, Copy, Edit3 } from 'lucide-react';
import { formatDuration } from '@/lib/mockData';

interface ConversationDetails {
  duration: number;
  fileSize?: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  folder?: {
    id: string;
    name: string;
  };
  tags?: string[];
  speakers?: number;
}

interface RightContextPanelProps {
  conversation?: ConversationDetails;
  onGenerateOutput?: (outputType: string) => void;
}

/**
 * Right context panel for three-pane layout
 * Shows conversation details matching folder view style
 */
export function RightContextPanel({
  conversation,
}: RightContextPanelProps) {
  if (!conversation) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Select a conversation to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* File Information */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">File Information</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Duration
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatDuration(conversation.duration)}
            </span>
          </div>
          {conversation.fileSize && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">File Size</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {conversation.fileSize}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Created
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {conversation.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              conversation.status === 'ready'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : conversation.status === 'processing'
                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {conversation.status === 'ready' ? '✓ Ready' :
               conversation.status === 'processing' ? '⏳ Processing' :
               'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Actions</h2>
        </div>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
            <Download className="w-4 h-4 text-gray-500" />
            <span>Download PDF</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
            <Share2 className="w-4 h-4 text-gray-500" />
            <span>Share Link</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
            <Copy className="w-4 h-4 text-gray-500" />
            <span>Copy Transcript</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
            <Edit3 className="w-4 h-4 text-gray-500" />
            <span>Edit Details</span>
          </button>
        </div>
      </div>

      {/* Speakers */}
      {conversation.speakers && conversation.speakers > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <UsersIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Speakers</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Count</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {conversation.speakers} speaker{conversation.speakers > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
