import axios from 'axios';
import { auth } from './firebase';
import { ApiResponse, AnalysisType } from '@transcribe/shared';
import { getApiUrl } from './config';

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Wait a moment for auth to stabilize if needed
  let user = auth.currentUser;
  
  // If no user, wait briefly for auth state to settle (useful right after sign-in)
  // This is especially important for email/password login
  if (!user) {
    // Try waiting up to 1 second with multiple checks
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      user = auth.currentUser;
      if (user) {
        break;
      }
    }
  }
  
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
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
        // User is not authenticated, redirect to login
        window.location.href = '/login';
        // Return a rejected promise with proper error
        return Promise.reject({ 
          status: 401, 
          message: 'User not authenticated' 
        });
      }
    }
    
    // Make sure we always return a proper error object
    const errorToReturn = error.response?.data || {
      status: error.response?.status || 500,
      message: error.message || 'An unknown error occurred',
      originalError: error
    };
    
    return Promise.reject(errorToReturn);
  }
);

export const transcriptionApi = {
  upload: async (file: File, analysisType?: AnalysisType, context?: string, contextId?: string): Promise<ApiResponse<{ jobId: string; transcriptionId: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (analysisType) formData.append('analysisType', analysisType);
    if (context) formData.append('context', context);
    if (contextId) formData.append('contextId', contextId);

    return api.post('/transcriptions/upload', formData, {
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
};

export default api;