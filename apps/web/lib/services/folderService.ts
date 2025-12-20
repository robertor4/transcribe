/**
 * Folder Service - V2 UI
 *
 * Service for folder management in the V2 UI.
 */

import { folderApi, transcriptionApi } from '../api';
import type { Folder as BackendFolder, Transcription } from '@transcribe/shared';
import { transcriptionsToConversations, Conversation } from '../types/conversation';

/**
 * Folder type for frontend use
 * Simplified from the backend Folder type
 */
export interface Folder {
  id: string;
  name: string;
  color?: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert backend folder to frontend folder
 */
function toFolder(data: BackendFolder): Folder {
  return {
    id: data.id,
    name: data.name,
    color: data.color,
    sortOrder: data.sortOrder,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

/**
 * List all folders for the current user
 */
export async function listFolders(): Promise<Folder[]> {
  const response = await folderApi.list();

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch folders');
  }

  return (response.data as BackendFolder[]).map(toFolder);
}

/**
 * Get a single folder by ID
 */
export async function getFolder(id: string): Promise<Folder> {
  const response = await folderApi.get(id);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Folder not found');
  }

  return toFolder(response.data as BackendFolder);
}

/**
 * Create a new folder
 */
export async function createFolder(name: string, color?: string): Promise<Folder> {
  const response = await folderApi.create(name, color);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create folder');
  }

  return toFolder(response.data as BackendFolder);
}

/**
 * Update a folder
 */
export async function updateFolder(
  id: string,
  data: { name?: string; color?: string; sortOrder?: number }
): Promise<Folder> {
  const response = await folderApi.update(id, data);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update folder');
  }

  return toFolder(response.data as BackendFolder);
}

/**
 * Delete a folder
 * @param deleteContents - If true, soft-delete all conversations in the folder (requires confirm)
 *                         If false/undefined, move conversations to "unfiled"
 * @returns Object with deletedConversations count
 */
export async function deleteFolder(
  id: string,
  deleteContents: boolean = false
): Promise<{ deletedConversations: number }> {
  const response = await folderApi.delete(id, deleteContents);

  if (!response.success) {
    throw new Error(response.error || 'Failed to delete folder');
  }

  return {
    deletedConversations: (response.data as { deletedConversations?: number })?.deletedConversations || 0,
  };
}

/**
 * Get conversations in a specific folder
 */
export async function getFolderConversations(folderId: string): Promise<Conversation[]> {
  const response = await folderApi.getTranscriptions(folderId);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch folder conversations');
  }

  return transcriptionsToConversations(response.data as Transcription[]);
}

/**
 * Move a conversation to a folder
 */
export async function moveToFolder(
  conversationId: string,
  folderId: string | null
): Promise<void> {
  const response = await transcriptionApi.moveToFolder(conversationId, folderId);

  if (!response.success) {
    throw new Error(response.error || 'Failed to move conversation');
  }
}

