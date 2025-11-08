/**
 * Audio utility functions for browser-based recording
 * Handles format detection, blob conversion, and browser compatibility
 */

export interface AudioFormat {
  mimeType: string;
  extension: string;
  codec: string;
}

/**
 * Detects the best supported audio format for the current browser
 * Priority: WebM (Opus) > WebM (VP8) > MP4 (AAC)
 */
export function detectBestAudioFormat(): AudioFormat {
  // Try WebM with Opus codec (best for speech, supported by Chrome/Firefox)
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return {
        mimeType: 'audio/webm;codecs=opus',
        extension: 'webm',
        codec: 'opus',
      };
    }

    // Try WebM with VP8 (fallback)
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return {
        mimeType: 'audio/webm',
        extension: 'webm',
        codec: 'vp8',
      };
    }

    // Try MP4 (Safari)
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return {
        mimeType: 'audio/mp4',
        extension: 'm4a',
        codec: 'aac',
      };
    }
  }

  // Default fallback
  return {
    mimeType: 'audio/webm',
    extension: 'webm',
    codec: 'opus',
  };
}

/**
 * Checks if MediaRecorder API is supported in the current browser
 */
export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia !== 'undefined' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Checks if tab audio capture (getDisplayMedia) is supported
 * Only available in Chrome/Edge on desktop
 */
export function isTabAudioSupported(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.mediaDevices === 'undefined') {
    return false;
  }

  // Check if getDisplayMedia exists
  const hasDisplayMedia = typeof navigator.mediaDevices.getDisplayMedia !== 'undefined';

  // Check if we're on a supported browser (Chrome/Edge)
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(navigator.userAgent);

  // Check if we're on desktop (not mobile)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return hasDisplayMedia && (isChrome || isEdge) && !isMobile;
}

/**
 * Detects the current browser
 */
export function detectBrowser(): {
  name: string;
  isMobile: boolean;
  supportsTabAudio: boolean;
} {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  let name = 'Unknown';
  if (/Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)) {
    name = isMobile ? 'Chrome Mobile' : 'Chrome';
  } else if (/Edg/.test(ua)) {
    name = 'Edge';
  } else if (/Firefox/.test(ua)) {
    name = 'Firefox';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    name = isMobile ? 'iOS Safari' : 'Safari';
  }

  return {
    name,
    isMobile,
    supportsTabAudio: isTabAudioSupported(),
  };
}

/**
 * Converts an audio Blob to a File object with proper naming
 */
export function blobToFile(blob: Blob, format: AudioFormat): File {
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');

  const filename = `Recording_${timestamp}.${format.extension}`;

  return new File([blob], filename, {
    type: format.mimeType,
    lastModified: Date.now(),
  });
}

/**
 * Formats duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Estimates file size based on recording duration
 * Assumes average bitrate of 128kbps for speech
 */
export function estimateFileSize(durationSeconds: number): number {
  const AVERAGE_BITRATE = 128 * 1024; // 128 kbps in bytes
  return Math.floor((durationSeconds * AVERAGE_BITRATE) / 8);
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets user-friendly error message for permission errors
 */
export function getPermissionErrorMessage(error: Error): string {
  const errorName = error.name || '';

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return 'Microphone access denied. Please allow microphone access in your browser settings.';
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'No microphone found. Please connect a microphone and try again.';
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'Microphone is already in use by another application. Please close other apps and try again.';
  }

  if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
    return 'Your microphone does not meet the required specifications.';
  }

  if (errorName === 'TypeError') {
    return 'Invalid recording configuration. Please try again.';
  }

  if (errorName === 'AbortError') {
    return 'Recording was interrupted. Please try again.';
  }

  return error.message || 'An unknown error occurred while accessing the microphone.';
}

/**
 * Request wake lock to prevent screen from sleeping during recording
 * Only supported on mobile browsers
 */
export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if ('wakeLock' in navigator) {
    try {
      return await navigator.wakeLock.request('screen');
    } catch (err) {
      console.warn('Wake lock request failed:', err);
      return null;
    }
  }
  return null;
}

/**
 * Release wake lock when recording stops
 */
export function releaseWakeLock(wakeLock: WakeLockSentinel | null): void {
  if (wakeLock) {
    wakeLock.release().catch((err) => console.warn('Wake lock release failed:', err));
  }
}
