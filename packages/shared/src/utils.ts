import { SUPPORTED_AUDIO_FORMATS, SUPPORTED_MIME_TYPES, MAX_FILE_SIZE } from './constants';
import type { Speaker } from './types';

export function isValidAudioFile(fileName: string, mimeType?: string): boolean {
  // Get the file extension (handle files with spaces and special characters)
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return false;
  
  const extension = fileName.substring(lastDotIndex).toLowerCase();
  const isValidExtension = SUPPORTED_AUDIO_FORMATS.includes(extension);
  
  // If no MIME type provided, just check extension
  if (!mimeType || mimeType === '') {
    return isValidExtension;
  }
  
  // For m4a files, browsers might report different MIME types
  if (extension === '.m4a' && (
    mimeType === 'audio/x-m4a' || 
    mimeType === 'audio/m4a' || 
    mimeType === 'audio/mp4' ||
    mimeType === 'application/octet-stream' ||
    mimeType === ''
  )) {
    return true;
  }
  
  // Check if MIME type is in the supported list
  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(mimeType);
  
  // Return true if either the extension is valid OR the MIME type is valid
  // This handles cases where MIME type detection fails but extension is correct
  return isValidExtension || isValidMimeType;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

export function getDateFolder(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return parseError(error.error);
  }

  return 'An unknown error occurred';
}

// ============================================
// Speaker Display Name Helpers
// ============================================

/**
 * Get the display name for a speaker.
 * Returns customName if set, otherwise falls back to speakerTag.
 */
export function getSpeakerDisplayName(speaker: Speaker): string {
  return speaker.customName?.trim() || speaker.speakerTag;
}

/**
 * Get display name from a speakerTag given a speakers array.
 * Used when you only have the tag (from SpeakerSegment) but need the custom name.
 */
export function getSpeakerDisplayNameByTag(
  speakerTag: string,
  speakers?: Speaker[]
): string {
  if (!speakers) return speakerTag;
  const speaker = speakers.find((s) => s.speakerTag === speakerTag);
  return speaker?.customName?.trim() || speakerTag;
}

/**
 * Build a speaker name mapping string for AI prompts.
 * Returns a formatted string like: "Speaker 1 is Roberto, Speaker 2 is Fikret"
 * Only includes speakers that have custom names set.
 */
export function buildSpeakerMappingForAI(speakers?: Speaker[]): string {
  if (!speakers) return '';
  const mappings = speakers
    .filter((s) => s.customName?.trim())
    .map((s) => `${s.speakerTag} is ${s.customName!.trim()}`);
  return mappings.length > 0
    ? `Speaker identification: ${mappings.join(', ')}`
    : '';
}