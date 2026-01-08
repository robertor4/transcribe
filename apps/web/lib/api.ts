import axios from 'axios';
import { auth, authReady } from './firebase';
import {
  ApiResponse,
  AnalysisType,
  AnalysisTemplate,
  GeneratedAnalysis,
  BlogHeroImage,
  Translation,
  ConversationTranslations,
  TranslateConversationResponse,
  AskResponse,
  QAHistoryItem,
  FindResponse,
  FindReplaceResults,
  ReplaceResponse,
  ImportedConversation,
  ImportConversationResponse,
  ImportedConversationWithContent,
} from '@transcribe/shared';
import { getApiUrl } from './config';

// Extended type for recent analyses with conversation title
export interface RecentAnalysis extends GeneratedAnalysis {
  conversationTitle: string;
}

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 1800000, // 30 minutes timeout for large file uploads (increased from 5 min for 3+ hour recordings)
  maxContentLength: 5 * 1024 * 1024 * 1024, // 5GB max content length (matches backend)
  maxBodyLength: 5 * 1024 * 1024 * 1024, // 5GB max body length (matches backend)
});

// Add auth token to requests
// IMPORTANT: Wait for Firebase Auth to initialize before checking currentUser
// This prevents race conditions on page refresh where requests fire before
// auth.currentUser is populated from IndexedDB
api.interceptors.request.use(async (config) => {
  // Wait for auth to be ready (resolves immediately if already initialized)
  await authReady;

  const user = auth.currentUser;

  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Failed to get auth token
    }
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    
    const originalRequest = error.config;
    
    // Check if we got a 401 and haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Check if this is an email verification error
      if (error.response?.data?.message?.includes('Email not verified')) {
        window.location.href = '/verify-email';
        return Promise.reject(error.response?.data || { 
          status: 401, 
          message: 'Email not verified' 
        });
      }
      
      // Wait for auth to be ready before checking user state
      // This is critical on page refresh - auth.currentUser may be null
      // while Firebase is still restoring the session from IndexedDB
      await authReady;

      // Check if user is still authenticated
      const user = auth.currentUser;
      if (user) {
        try {
          // Try to get a fresh token
          const newToken = await user.getIdToken(true); // force refresh
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the request with the new token
          return api(originalRequest);
        } catch (refreshError) {
          // If token refresh fails, then redirect to login
          window.location.href = '/login';
          // Still return a rejected promise with proper error
          return Promise.reject({
            status: 401,
            message: 'Authentication failed',
            originalError: refreshError
          });
        }
      } else {
        // User is genuinely not authenticated (auth is ready and no user)
        window.location.href = '/login';
        // Return a rejected promise with proper error
        return Promise.reject({
          status: 401,
          message: 'User not authenticated'
        });
      }
    }
    
    // Return the original axios error to preserve error.response.status
    // This allows components to check error.response?.status === 402 for quota errors
    return Promise.reject(error);
  }
);

export const transcriptionApi = {
  upload: async (file: File, analysisType?: AnalysisType, context?: string, contextId?: string, selectedTemplates?: string[]): Promise<ApiResponse<{ jobId: string; transcriptionId: string }>> => {
    console.log('[TranscriptionAPI] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      analysisType,
      selectedTemplates,
    });

    const formData = new FormData();
    formData.append('file', file);
    if (analysisType) formData.append('analysisType', analysisType);
    if (context) formData.append('context', context);
    if (contextId) formData.append('contextId', contextId);
    if (selectedTemplates?.length) formData.append('selectedTemplates', JSON.stringify(selectedTemplates));

    try {
      const response: ApiResponse<{ jobId: string; transcriptionId: string }> = await api.post('/transcriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('[TranscriptionAPI] Upload successful:', response);
      return response;
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown; status?: number } };
      console.error('[TranscriptionAPI] Upload failed:', {
        error,
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      throw error;
    }
  },

  uploadBatch: async (files: File[], mergeFiles: boolean, analysisType?: AnalysisType, context?: string, contextId?: string): Promise<ApiResponse<{ transcriptionIds: string[]; fileNames: string[]; merged: boolean }>> => {
    const formData = new FormData();

    // Append all files
    files.forEach(file => {
      formData.append('files', file);
    });

    // Append merge flag
    formData.append('mergeFiles', mergeFiles.toString());

    if (analysisType) formData.append('analysisType', analysisType);
    if (context) formData.append('context', context);
    if (contextId) formData.append('contextId', contextId);

    return api.post('/transcriptions/upload-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  list: async (page = 1, pageSize = 20): Promise<ApiResponse<{ items: unknown[]; total: number; page: number; pageSize: number }>> => {
    return api.get('/transcriptions', {
      params: { page, pageSize },
    });
  },

  /**
   * Get lightweight transcription summaries for dashboard list view.
   * Returns only fields needed for rendering conversation cards,
   * reducing payload size by 80-95%.
   */
  listSummaries: async (page = 1, pageSize = 20): Promise<ApiResponse<{ items: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean }>> => {
    return api.get('/transcriptions/summaries', {
      params: { page, pageSize },
    });
  },

  search: async (query: string, limit = 20): Promise<ApiResponse<{ items: unknown[]; total: number }>> => {
    return api.get('/transcriptions/search', {
      params: { query, limit },
    });
  },

  // Semantic search using vector similarity (Qdrant)
  semanticSearch: async (query: string, limit = 10): Promise<ApiResponse<FindResponse>> => {
    return api.post('/vector/find', { query, maxResults: limit });
  },

  getRecentlyOpened: async (limit = 5): Promise<ApiResponse<unknown[]>> => {
    return api.get('/transcriptions/recently-opened', {
      params: { limit },
    });
  },

  clearRecentlyOpened: async (): Promise<ApiResponse<{ cleared: number }>> => {
    return api.delete('/transcriptions/recently-opened');
  },

  recordAccess: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post(`/transcriptions/${id}/access`);
  },

  get: async (id: string): Promise<ApiResponse<unknown>> => {
    return api.get(`/transcriptions/${id}`);
  },

  updateTitle: async (id: string, title: string): Promise<ApiResponse<{ message: string }>> => {
    return api.put(`/transcriptions/${id}/title`, { title });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}`);
  },

  regenerateSummary: async (id: string, instructions?: string): Promise<ApiResponse<{ summary: string }>> => {
    return api.post(`/transcriptions/${id}/regenerate-summary`, { instructions });
  },

  // Comment API methods
  addComment: async (id: string, position: { start: number; end: number }, content: string): Promise<ApiResponse<{ id: string; content: string; position: { start: number; end: number }; createdAt: string }>> => {
    return api.post(`/transcriptions/${id}/comments`, { position, content });
  },

  getComments: async (id: string): Promise<ApiResponse<unknown[]>> => {
    return api.get(`/transcriptions/${id}/comments`);
  },

  updateComment: async (id: string, commentId: string, updates: { content?: string; resolved?: boolean }): Promise<ApiResponse<{ id: string; content: string; resolved: boolean }>> => {
    return api.put(`/transcriptions/${id}/comments/${commentId}`, updates);
  },

  deleteComment: async (id: string, commentId: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}/comments/${commentId}`);
  },

  // Share API methods
  createShareLink: async (id: string, settings?: { expiresAt?: Date; maxViews?: number; password?: string }): Promise<ApiResponse<{ shareToken: string; shareUrl: string }>> => {
    return api.post(`/transcriptions/${id}/share`, settings || {});
  },

  revokeShareLink: async (id: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}/share`);
  },

  updateShareSettings: async (id: string, settings: { expiresAt?: Date; maxViews?: number; password?: string }): Promise<ApiResponse> => {
    return api.put(`/transcriptions/${id}/share-settings`, settings);
  },

  sendShareEmail: async (id: string, emailRequest: { recipientEmail: string; recipientName?: string; message?: string; senderName?: string }): Promise<ApiResponse> => {
    return api.post(`/transcriptions/${id}/share/email`, emailRequest);
  },

  // Translation API methods
  translate: async (id: string, targetLanguage: string): Promise<ApiResponse<unknown>> => {
    return api.post(`/transcriptions/${id}/translate`, { targetLanguage });
  },

  getTranslation: async (id: string, language: string): Promise<ApiResponse<unknown>> => {
    return api.get(`/transcriptions/${id}/translations/${language}`);
  },

  deleteTranslation: async (id: string, language: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}/translations/${language}`);
  },

  updateTranslationPreference: async (id: string, languageCode: string): Promise<ApiResponse> => {
    return api.patch(`/transcriptions/${id}/translation-preference`, { languageCode });
  },

  // On-Demand Analysis API methods
  getAnalysisTemplates: async (): Promise<ApiResponse<AnalysisTemplate[]>> => {
    return api.get('/transcriptions/analysis-templates');
  },

  generateAnalysis: async (id: string, templateId: string, customInstructions?: string): Promise<ApiResponse<GeneratedAnalysis>> => {
    return api.post(`/transcriptions/${id}/generate-analysis`, { templateId, customInstructions });
  },

  getUserAnalyses: async (id: string): Promise<ApiResponse<GeneratedAnalysis[]>> => {
    return api.get(`/transcriptions/${id}/analyses`);
  },

  getAnalysis: async (id: string, analysisId: string): Promise<ApiResponse<GeneratedAnalysis>> => {
    return api.get(`/transcriptions/${id}/analyses/${analysisId}`);
  },

  deleteAnalysis: async (id: string, analysisId: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}/analyses/${analysisId}`);
  },

  generateBlogImage: async (id: string, analysisId: string): Promise<ApiResponse<{ heroImage: BlogHeroImage }>> => {
    return api.post(`/transcriptions/${id}/analyses/${analysisId}/generate-image`);
  },

  getRecentAnalyses: async (limit: number = 8): Promise<ApiResponse<RecentAnalysis[]>> => {
    return api.get(`/transcriptions/recent-analyses?limit=${limit}`);
  },

  getRecentAnalysesByFolder: async (folderId: string, limit: number = 8): Promise<ApiResponse<RecentAnalysis[]>> => {
    return api.get(`/transcriptions/recent-analyses/folder/${folderId}?limit=${limit}`);
  },

  // Folder API method
  moveToFolder: async (id: string, folderId: string | null): Promise<ApiResponse<{ message: string }>> => {
    return api.patch(`/transcriptions/${id}/folder`, { folderId });
  },

  // Send email draft to self
  sendEmailToSelf: async (analysisId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post(`/transcriptions/analyses/${analysisId}/send-to-self`);
  },

  // Q&A API methods
  askQuestion: async (id: string, question: string, maxResults = 10, history?: QAHistoryItem[]): Promise<ApiResponse<AskResponse>> => {
    return api.post(`/transcriptions/${id}/ask`, { question, maxResults, history });
  },

  getIndexingStatus: async (id: string): Promise<ApiResponse<{ indexed: boolean; chunkCount: number; indexedAt?: string }>> => {
    return api.get(`/transcriptions/${id}/indexing-status`);
  },
};

// Folder API
export const folderApi = {
  list: async (): Promise<ApiResponse<unknown[]>> => {
    return api.get('/folders');
  },

  get: async (id: string): Promise<ApiResponse<unknown>> => {
    return api.get(`/folders/${id}`);
  },

  create: async (name: string, color?: string): Promise<ApiResponse<unknown>> => {
    return api.post('/folders', { name, color });
  },

  update: async (id: string, data: { name?: string; color?: string; sortOrder?: number }): Promise<ApiResponse<unknown>> => {
    return api.put(`/folders/${id}`, data);
  },

  delete: async (id: string, deleteContents: boolean = false): Promise<ApiResponse<{ message: string; deletedConversations?: number }>> => {
    const params = deleteContents
      ? { deleteContents: 'true', confirm: 'true' }
      : {};
    return api.delete(`/folders/${id}`, { params });
  },

  getTranscriptions: async (id: string): Promise<ApiResponse<unknown[]>> => {
    return api.get(`/folders/${id}/transcriptions`);
  },

  // Q&A API methods
  askQuestion: async (id: string, question: string, maxResults = 15, history?: QAHistoryItem[]): Promise<ApiResponse<AskResponse>> => {
    return api.post(`/folders/${id}/ask`, { question, maxResults, history });
  },
};

// Find/Replace API
export const findReplaceApi = {
  /**
   * Find matches in a conversation
   */
  findMatches: async (
    transcriptionId: string,
    findText: string,
    options?: { caseSensitive?: boolean; wholeWord?: boolean }
  ): Promise<ApiResponse<FindReplaceResults>> => {
    return api.post(`/transcriptions/${transcriptionId}/find`, {
      findText,
      ...options,
    });
  },

  /**
   * Replace matches in a conversation
   */
  replaceMatches: async (
    transcriptionId: string,
    request: {
      findText: string;
      replaceText: string;
      caseSensitive: boolean;
      wholeWord: boolean;
      replaceAll?: boolean;
      replaceCategories?: ('summary' | 'transcript' | 'aiAssets')[];
      matchIds?: string[];
    }
  ): Promise<ApiResponse<ReplaceResponse>> => {
    return api.post(`/transcriptions/${transcriptionId}/replace`, request);
  },
};

// Translation API (V2 - uses separate translations collection)
export const translationApi = {
  /**
   * Translate conversation content to target locale
   */
  translate: async (
    transcriptionId: string,
    targetLocale: string,
    options?: { translateSummary?: boolean; translateAssets?: boolean; assetIds?: string[] }
  ): Promise<ApiResponse<TranslateConversationResponse>> => {
    return api.post(`/translations/${transcriptionId}`, {
      targetLocale,
      ...options,
    });
  },

  /**
   * Get translation status for a conversation
   */
  getStatus: async (transcriptionId: string): Promise<ApiResponse<ConversationTranslations>> => {
    return api.get(`/translations/${transcriptionId}/status`);
  },

  /**
   * Get all translations for a specific locale
   */
  getForLocale: async (transcriptionId: string, localeCode: string): Promise<ApiResponse<Translation[]>> => {
    return api.get(`/translations/${transcriptionId}/${localeCode}`);
  },

  /**
   * Delete all translations for a locale
   */
  deleteForLocale: async (transcriptionId: string, localeCode: string): Promise<ApiResponse<{ deletedCount: number }>> => {
    return api.delete(`/translations/${transcriptionId}/${localeCode}`);
  },

  /**
   * Update locale preference for a conversation
   */
  updatePreference: async (transcriptionId: string, localeCode: string): Promise<ApiResponse> => {
    return api.patch(`/translations/${transcriptionId}/preference`, { localeCode });
  },

  // ============================================================
  // PUBLIC ENDPOINTS (FOR SHARED CONVERSATIONS)
  // ============================================================

  /**
   * Get translation status for a shared conversation (no auth required)
   */
  getSharedStatus: async (shareToken: string, transcriptionId: string): Promise<ApiResponse<ConversationTranslations>> => {
    return api.get(`/translations/shared/${shareToken}/status?transcriptionId=${transcriptionId}`);
  },

  /**
   * Get translations for a specific locale (shared conversation, no auth required)
   */
  getSharedForLocale: async (
    shareToken: string,
    localeCode: string,
    transcriptionId: string
  ): Promise<ApiResponse<Translation[]>> => {
    return api.get(`/translations/shared/${shareToken}/${localeCode}?transcriptionId=${transcriptionId}`);
  },
};

// Imported Conversations API (V2 - Shared with you folder)
export const importedConversationApi = {
  /**
   * Import a shared conversation by its share token.
   * Creates a linked reference to the original share.
   */
  import: async (
    shareToken: string,
    password?: string
  ): Promise<ApiResponse<ImportConversationResponse>> => {
    return api.post(`/imported-conversations/${shareToken}`, { password });
  },

  /**
   * Get all imported conversations for the current user.
   */
  list: async (): Promise<ApiResponse<ImportedConversation[]>> => {
    return api.get('/imported-conversations');
  },

  /**
   * Get the count of imported conversations.
   */
  getCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return api.get('/imported-conversations/count');
  },

  /**
   * Get an imported conversation with its live content.
   * Validates the share is still accessible.
   */
  get: async (importId: string): Promise<ApiResponse<ImportedConversationWithContent>> => {
    return api.get(`/imported-conversations/${importId}`);
  },

  /**
   * Remove an imported conversation (soft delete).
   */
  remove: async (importId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.delete(`/imported-conversations/${importId}`);
  },

  /**
   * Check if the current user has imported a specific share.
   */
  checkStatus: async (
    shareToken: string
  ): Promise<ApiResponse<{ imported: boolean; importedAt?: Date }>> => {
    return api.get(`/imported-conversations/check/${shareToken}`);
  },
};

export default api;