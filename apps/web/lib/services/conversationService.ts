/**
 * Conversation Service - V2 UI
 *
 * High-level service that wraps the transcription API with Conversation terminology.
 * Provides a clean interface for V2 UI components.
 */

import { transcriptionApi, folderApi } from '../api';
import type { Transcription } from '@transcribe/shared';
import {
  Conversation,
  transcriptionToConversation,
  transcriptionsToConversations,
} from '../types/conversation';

export interface ConversationListResult {
  conversations: Conversation[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * List conversations with pagination
 */
export async function listConversations(
  page = 1,
  pageSize = 20
): Promise<ConversationListResult> {
  const response = await transcriptionApi.list(page, pageSize);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch conversations');
  }

  const data = response.data as {
    items: Transcription[];
    total: number;
    page: number;
    pageSize: number;
  };

  return {
    conversations: transcriptionsToConversations(data.items),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    hasMore: data.page * data.pageSize < data.total,
  };
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation> {
  const response = await transcriptionApi.get(id);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Conversation not found');
  }

  return transcriptionToConversation(response.data as Transcription);
}

/**
 * Upload audio and create a new conversation
 */
export async function uploadConversation(
  file: File,
  options?: {
    context?: string;
    contextId?: string;
  }
): Promise<{ jobId: string; transcriptionId: string }> {
  const response = await transcriptionApi.upload(
    file,
    undefined, // analysisType - default
    options?.context,
    options?.contextId
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to upload file');
  }

  return response.data;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const response = await transcriptionApi.delete(id);

  if (!response.success) {
    throw new Error(response.error || 'Failed to delete conversation');
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  const response = await transcriptionApi.updateTitle(id, title);

  if (!response.success) {
    throw new Error(response.error || 'Failed to update title');
  }
}

/**
 * Move conversation to a folder
 */
export async function moveConversationToFolder(
  id: string,
  folderId: string | null
): Promise<void> {
  const response = await transcriptionApi.moveToFolder(id, folderId);

  if (!response.success) {
    throw new Error(response.error || 'Failed to move conversation');
  }
}

/**
 * Create share link for a conversation
 */
export async function createShareLink(
  id: string,
  settings?: {
    expiresAt?: Date;
    maxViews?: number;
    password?: string;
  }
): Promise<{ shareToken: string; shareUrl: string }> {
  const response = await transcriptionApi.createShareLink(id, settings);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create share link');
  }

  return response.data;
}

/**
 * Revoke share link
 */
export async function revokeShareLink(id: string): Promise<void> {
  const response = await transcriptionApi.revokeShareLink(id);

  if (!response.success) {
    throw new Error(response.error || 'Failed to revoke share link');
  }
}

/**
 * Send share email
 */
export async function sendShareEmail(
  id: string,
  emailRequest: {
    recipientEmail: string;
    recipientName?: string;
    message?: string;
    senderName?: string;
  }
): Promise<void> {
  const response = await transcriptionApi.sendShareEmail(id, emailRequest);

  if (!response.success) {
    throw new Error(response.error || 'Failed to send share email');
  }
}

/**
 * List conversations in a specific folder
 */
export async function listConversationsByFolder(
  folderId: string
): Promise<Conversation[]> {
  const response = await folderApi.getTranscriptions(folderId);

  if (!response.success || !response.data) {
    throw new Error((response as { error?: string }).error || 'Failed to fetch folder conversations');
  }

  return transcriptionsToConversations(response.data as Transcription[]);
}

/**
 * Search result item - lightweight version for search results
 */
export interface SearchResult {
  id: string;
  title: string;
  fileName: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Search results container
 */
export interface SearchResults {
  results: SearchResult[];
  total: number;
  query: string;
}

/**
 * Search conversations by query
 * Searches across title, fileName, and summary content
 */
export async function searchConversations(
  query: string,
  limit = 20
): Promise<SearchResults> {
  const response = await transcriptionApi.search(query, limit);

  if (!response.success || !response.data) {
    throw new Error((response as { error?: string }).error || 'Failed to search conversations');
  }

  const data = response.data as {
    items: Array<{
      id: string;
      title?: string;
      fileName?: string;
      status: string;
      folderId?: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
    }>;
    total: number;
  };

  return {
    results: data.items.map((item) => ({
      id: item.id,
      title: item.title || item.fileName || 'Untitled',
      fileName: item.fileName || '',
      status: mapStatus(item.status),
      folderId: item.folderId || null,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })),
    total: data.total,
    query,
  };
}

/**
 * Map backend status to frontend status
 */
function mapStatus(status: string): 'pending' | 'processing' | 'ready' | 'failed' {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'ready';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

// Re-export the Conversation type for convenience
export type { Conversation } from '../types/conversation';
