export const SUPPORTED_AUDIO_FORMATS = [
  '.m4a',
  '.mp3',
  '.wav',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.webm',
  '.flac',
  '.ogg'
];

export const SUPPORTED_MIME_TYPES = [
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/flac',
  'audio/ogg',
  'video/mp4',
  'application/octet-stream' // Sometimes m4a files are reported as this
];

// AssemblyAI supports files up to 5GB, OpenAI Whisper API has a 25MB limit
// We use AssemblyAI as primary service, Whisper as fallback with automatic splitting
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB (AssemblyAI limit)
export const WHISPER_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit per chunk)
export const MAX_DURATION = 240 * 60; // 240 minutes (4 hours)

export const TRANSCRIPTION_MODELS = {
  WHISPER: 'whisper-1',
  WHISPER_LARGE: 'whisper-large-v3'
} as const;

export const SUMMARY_MODELS = {
  GPT4_MINI: 'gpt-4o-mini',
  GPT4: 'gpt-4o',
  GPT35_TURBO: 'gpt-3.5-turbo'
} as const;

export const QUEUE_NAMES = {
  TRANSCRIPTION: 'transcription-queue',
  SUMMARY: 'summary-queue',
  NOTIFICATION: 'notification-queue'
} as const;

export const WEBSOCKET_EVENTS = {
  // Client to Server
  SUBSCRIBE_TRANSCRIPTION: 'subscribe_transcription',
  UNSUBSCRIBE_TRANSCRIPTION: 'unsubscribe_transcription',
  SUBSCRIBE_COMMENTS: 'subscribe_comments',
  UNSUBSCRIBE_COMMENTS: 'unsubscribe_comments',

  // Server to Client
  TRANSCRIPTION_PROGRESS: 'transcription_progress',
  TRANSCRIPTION_COMPLETED: 'transcription_completed',
  TRANSCRIPTION_FAILED: 'transcription_failed',
  SUMMARY_REGENERATION_PROGRESS: 'summary_regeneration_progress',
  SUMMARY_REGENERATION_COMPLETED: 'summary_regeneration_completed',
  SUMMARY_REGENERATION_FAILED: 'summary_regeneration_failed',
  COMMENT_ADDED: 'comment_added',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',

  // Connection & Auth
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  AUTH_ERROR: 'auth_error'
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING'
} as const;

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
    maxDuration: 60 * 60, // 60 minutes
    monthlyMinutes: 300, // 5 hours
    maxConcurrentJobs: 1,
    priority: 1
  },
  pro: {
    maxFileSize: 3 * 1024 * 1024 * 1024, // 3GB
    maxDuration: 180 * 60, // 3 hours
    monthlyMinutes: 3000, // 50 hours
    maxConcurrentJobs: 3,
    priority: 5
  },
  enterprise: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB (AssemblyAI max)
    maxDuration: 240 * 60, // 4 hours
    monthlyMinutes: -1, // Unlimited
    maxConcurrentJobs: 10,
    priority: 10
  }
} as const;