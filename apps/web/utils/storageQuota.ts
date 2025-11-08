/**
 * storageQuota.ts
 * Storage quota monitoring and management utilities
 * Helps prevent storage exhaustion during long recordings
 */

/**
 * Storage quota information
 */
export interface StorageQuotaInfo {
  usage: number; // Bytes used
  quota: number; // Total bytes available
  percentUsed: number; // Percentage (0-100)
  available: number; // Bytes remaining
  canStore1HourRecording: boolean; // Can store ~56MB recording
  canStore3HourRecording: boolean; // Can store ~168MB recording
}

/**
 * Check current storage quota and usage
 * Uses StorageManager API (available in all modern browsers)
 * @returns Storage quota information or null if API unavailable
 */
export async function checkStorageQuota(): Promise<StorageQuotaInfo | null> {
  // Check if StorageManager API is available
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    console.warn('[StorageQuota] StorageManager API not available');
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
    const available = quota - usage;

    // Estimate: 1 hour of audio at 128kbps ≈ 56 MB
    const oneHourBytes = 56 * 1024 * 1024; // 56 MB
    const threeHourBytes = oneHourBytes * 3; // 168 MB

    const quotaInfo: StorageQuotaInfo = {
      usage,
      quota,
      percentUsed,
      available,
      canStore1HourRecording: available > oneHourBytes,
      canStore3HourRecording: available > threeHourBytes,
    };

    console.log('[StorageQuota] Current usage:', formatBytes(usage));
    console.log('[StorageQuota] Available quota:', formatBytes(quota));
    console.log('[StorageQuota] Percent used:', percentUsed.toFixed(1) + '%');

    return quotaInfo;
  } catch (error) {
    console.error('[StorageQuota] Failed to check storage quota:', error);
    return null;
  }
}

/**
 * Request persistent storage (prevents browser from auto-clearing data)
 * Useful for important recordings that should survive storage pressure
 * @returns true if persistent storage granted
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !('persist' in navigator.storage)) {
    console.warn('[StorageQuota] Persistent storage API not available');
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    if (isPersisted) {
      console.log('[StorageQuota] Persistent storage granted');
    } else {
      console.log('[StorageQuota] Persistent storage denied');
    }
    return isPersisted;
  } catch (error) {
    console.error('[StorageQuota] Failed to request persistent storage:', error);
    return false;
  }
}

/**
 * Check if storage is already persistent
 * @returns true if persistent storage is active
 */
export async function isPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !('persisted' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error('[StorageQuota] Failed to check persistent storage:', error);
    return false;
  }
}

/**
 * Get storage warning level based on usage percentage
 * @param percentUsed Percentage of quota used (0-100)
 * @returns Warning level: 'none' | 'low' | 'medium' | 'critical'
 */
export function getStorageWarningLevel(
  percentUsed: number
): 'none' | 'low' | 'medium' | 'critical' {
  if (percentUsed >= 95) return 'critical';
  if (percentUsed >= 85) return 'medium';
  if (percentUsed >= 75) return 'low';
  return 'none';
}

/**
 * Get user-friendly storage warning message
 * @param warningLevel Warning level
 * @param available Bytes available
 * @returns Warning message or null
 */
export function getStorageWarningMessage(
  warningLevel: 'none' | 'low' | 'medium' | 'critical',
  available: number
): string | null {
  switch (warningLevel) {
    case 'critical':
      return `Storage almost full (${formatBytes(available)} remaining). Recordings may not save. Please clean up old recordings or free up device storage.`;
    case 'medium':
      return `Storage running low (${formatBytes(available)} remaining). Consider cleaning up old recordings.`;
    case 'low':
      return `Storage usage is high (${formatBytes(available)} remaining). You may want to clean up old recordings soon.`;
    default:
      return null;
  }
}

/**
 * Estimate recording size based on duration
 * @param durationSeconds Recording duration in seconds
 * @param bitrate Bitrate in kbps (default: 128)
 * @returns Estimated size in bytes
 */
export function estimateRecordingSize(durationSeconds: number, bitrate: number = 128): number {
  // Formula: (bitrate * duration) / 8 = bytes
  // bitrate is in kilobits per second, so multiply by 1000 and divide by 8 for bytes
  return Math.ceil((bitrate * 1000 * durationSeconds) / 8);
}

/**
 * Check if there's enough space for a recording
 * @param durationSeconds Expected recording duration
 * @param bitrate Expected bitrate in kbps
 * @returns true if enough space available
 */
export async function canStoreRecording(
  durationSeconds: number,
  bitrate: number = 128
): Promise<boolean> {
  const quota = await checkStorageQuota();
  if (!quota) {
    // If we can't check quota, assume we have space
    return true;
  }

  const estimatedSize = estimateRecordingSize(durationSeconds, bitrate);
  // Add 20% buffer for metadata and overhead
  const sizeWithBuffer = estimatedSize * 1.2;

  return quota.available > sizeWithBuffer;
}

/**
 * Format bytes to human-readable string
 * @param bytes Number of bytes
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "56.3 MB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${value} ${sizes[i]}`;
}

/**
 * Format storage percentage with color-coded status
 * @param percentUsed Percentage used (0-100)
 * @returns Object with formatted text and color class
 */
export function formatStoragePercentage(percentUsed: number): {
  text: string;
  colorClass: string;
} {
  const warningLevel = getStorageWarningLevel(percentUsed);

  const colorClass =
    warningLevel === 'critical'
      ? 'text-red-600 dark:text-red-400'
      : warningLevel === 'medium'
        ? 'text-orange-600 dark:text-orange-400'
        : warningLevel === 'low'
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-green-600 dark:text-green-400';

  return {
    text: `${percentUsed.toFixed(1)}%`,
    colorClass,
  };
}

/**
 * Storage quota monitoring hook return type
 */
export interface StorageMonitor {
  quota: StorageQuotaInfo | null;
  warningLevel: 'none' | 'low' | 'medium' | 'critical';
  warningMessage: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}
