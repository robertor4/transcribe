export enum TranscriptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  subscription?: {
    type: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };
}

export interface TranscriptionContext {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transcription {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  status: TranscriptionStatus;
  context?: string;
  contextId?: string;
  transcriptText?: string;
  summary?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface TranscriptionJob {
  id: string;
  transcriptionId: string;
  userId: string;
  fileUrl: string;
  context?: string;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  processedAt?: Date;
}

export interface FileUploadRequest {
  file: File;
  context?: string;
  contextId?: string;
  priority?: number;
}

export interface TranscriptionProgress {
  transcriptionId: string;
  status: TranscriptionStatus;
  progress: number;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TranscriptionFilter {
  userId?: string;
  status?: TranscriptionStatus;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  sortBy?: 'createdAt' | 'completedAt' | 'fileName' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}