import axios from 'axios';
import { auth } from './firebase';

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
  upload: async (file: File, context?: string, contextId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (context) formData.append('context', context);
    if (contextId) formData.append('contextId', contextId);

    return api.post('/transcriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  list: async (page = 1, pageSize = 20) => {
    return api.get('/transcriptions', {
      params: { page, pageSize },
    });
  },

  get: async (id: string) => {
    return api.get(`/transcriptions/${id}`);
  },

  delete: async (id: string) => {
    return api.delete(`/transcriptions/${id}`);
  },
};

export default api;