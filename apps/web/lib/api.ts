import axios from 'axios';
import { auth } from './firebase';
import { ApiResponse, AnalysisType } from '@transcribe/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const transcriptionApi = {
  upload: async (file: File, analysisType?: AnalysisType, context?: string, contextId?: string): Promise<ApiResponse<any>> => {
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

  list: async (page = 1, pageSize = 20): Promise<ApiResponse<any>> => {
    return api.get('/transcriptions', {
      params: { page, pageSize },
    });
  },

  get: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/transcriptions/${id}`);
  },

  updateTitle: async (id: string, title: string): Promise<ApiResponse<any>> => {
    return api.put(`/transcriptions/${id}/title`, { title });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}`);
  },

  regenerateSummary: async (id: string, instructions?: string): Promise<ApiResponse<any>> => {
    return api.post(`/transcriptions/${id}/regenerate-summary`, { instructions });
  },

  // Comment API methods
  addComment: async (id: string, position: any, content: string): Promise<ApiResponse<any>> => {
    return api.post(`/transcriptions/${id}/comments`, { position, content });
  },

  getComments: async (id: string): Promise<ApiResponse<any[]>> => {
    return api.get(`/transcriptions/${id}/comments`);
  },

  updateComment: async (id: string, commentId: string, updates: { content?: string; resolved?: boolean }): Promise<ApiResponse<any>> => {
    return api.put(`/transcriptions/${id}/comments/${commentId}`, updates);
  },

  deleteComment: async (id: string, commentId: string): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${id}/comments/${commentId}`);
  },
};

export default api;