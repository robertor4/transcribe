import type { ReactNode } from 'react';

export interface FolderContext {
  folderId: string;
  /** Called after any mutation (delete, move, remove) to refresh the folder's conversation list */
  onRefresh: () => Promise<void>;
  /** Called when user wants to remove conversations from this folder (sets folderId to null) */
  onRemoveFromFolder: (conversationIds: string[]) => Promise<void>;
  /** Optional extra toolbar content rendered next to the New button (e.g., Ask Questions) */
  extraToolbarActions?: ReactNode;
}
