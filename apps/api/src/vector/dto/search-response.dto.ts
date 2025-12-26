// Response types are defined in @transcribe/shared
// This file re-exports them for convenience and adds any API-specific response wrappers

export type {
  Citation,
  AskResponse,
  FindResponse,
  ConversationMatch,
  MatchedSnippet,
} from '@transcribe/shared';

export interface IndexingStatusResponse {
  indexed: boolean;
  chunkCount?: number;
  indexedAt?: Date;
  estimatedIndexingSeconds?: number;
}

export interface IndexingProgressResponse {
  status: 'indexing' | 'completed' | 'failed';
  message: string;
  progress?: number;
  estimatedSeconds?: number;
}
