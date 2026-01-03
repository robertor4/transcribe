/**
 * chunkUploader.ts
 * Uploads audio recording chunks directly to Firebase Storage during recording.
 * Provides resilience for long recordings by streaming data to the cloud.
 *
 * Architecture:
 * - MediaRecorder fires ondataavailable every ~10 seconds
 * - Chunks are accumulated until ~5MB threshold
 * - Each 5MB chunk is uploaded to Firebase Storage
 * - Folder structure: recordings/{userId}/{sessionId}/chunk_XXX.webm
 * - On completion, metadata.json is written with session details
 * - Backend merges chunks with FFmpeg before transcription
 */

import {
  ref,
  uploadBytes,
  getMetadata,
  UploadMetadata,
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { storage } from '@/lib/firebase';
import type { RecordingSource } from '@/hooks/useMediaRecorder';

/**
 * Metadata stored with each recording session
 */
export interface ChunkMetadata {
  sessionId: string;
  startTime: number;
  source: RecordingSource;
  status: 'recording' | 'complete' | 'failed';
  chunkCount: number;
  duration: number;
  mimeType: string;
  userId: string;
}

/**
 * Progress information for upload tracking
 */
export interface UploadProgress {
  uploadedChunks: number;
  totalSize: number;
  lastUploadTime: number;
  pendingChunks: number;
  failedChunks: number;
}

// Configuration constants
const CHUNK_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 2000, 4000]; // Exponential backoff

/**
 * ChunkUploader class
 * Manages chunked uploads to Firebase Storage during recording
 */
export class ChunkUploader {
  private sessionId: string;
  private chunkIndex: number = 0;
  private accumulator: Blob[] = [];
  private accumulatorSize: number = 0;
  private uploadQueue: Array<{ index: number; blob: Blob; retries: number }> = [];
  private isUploading: boolean = false;
  private totalUploadedSize: number = 0;
  private failedChunks: number = 0;
  private onProgressCallback?: (progress: UploadProgress) => void;
  private onErrorCallback?: (error: Error, recoverable: boolean) => void;
  private startTime: number;
  private source: RecordingSource;
  private mimeType: string;
  private isOnline: boolean = true;
  private aborted: boolean = false;

  constructor(
    private userId: string,
    source: RecordingSource,
    mimeType: string = 'audio/webm'
  ) {
    // Generate unique session ID: timestamp + random suffix
    this.sessionId = `${Date.now()}_${this.generateRandomId(8)}`;
    this.startTime = Date.now();
    this.source = source;
    this.mimeType = mimeType;

    // Store session ID in localStorage for recovery
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeRecordingSession', this.sessionId);
      localStorage.setItem('activeRecordingUserId', this.userId);

      // Listen for online/offline events
      this.isOnline = navigator.onLine;
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    console.log(`[ChunkUploader] Created session ${this.sessionId} for user ${userId}`);
  }

  /**
   * Generate a random alphanumeric ID
   */
  private generateRandomId(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private handleOnline = () => {
    console.log('[ChunkUploader] Network online, resuming uploads');
    this.isOnline = true;
    this.processUploadQueue();
  };

  private handleOffline = () => {
    console.log('[ChunkUploader] Network offline, pausing uploads');
    this.isOnline = false;
  };

  /**
   * Get the current session ID
   */
  get currentSessionId(): string {
    return this.sessionId;
  }

  /**
   * Set progress callback
   */
  setOnProgress(callback: (progress: UploadProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Set error callback
   */
  setOnError(callback: (error: Error, recoverable: boolean) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Add data from MediaRecorder ondataavailable event
   * Automatically uploads when threshold is reached
   */
  async addData(blob: Blob): Promise<void> {
    if (this.aborted) return;

    this.accumulator.push(blob);
    this.accumulatorSize += blob.size;

    if (this.accumulatorSize >= CHUNK_SIZE_THRESHOLD) {
      await this.flushChunk();
    }
  }

  /**
   * Flush current accumulator to a chunk and queue for upload
   */
  private async flushChunk(): Promise<void> {
    if (this.accumulator.length === 0 || this.aborted) return;

    const chunkBlob = new Blob(this.accumulator, { type: this.mimeType });
    const chunkIndex = this.chunkIndex++;

    // Queue for upload
    this.uploadQueue.push({ index: chunkIndex, blob: chunkBlob, retries: 0 });

    // Clear accumulator
    this.accumulator = [];
    this.accumulatorSize = 0;

    console.log(
      `[ChunkUploader] Queued chunk ${chunkIndex} (${(chunkBlob.size / 1024 / 1024).toFixed(2)}MB)`
    );

    // Process queue
    await this.processUploadQueue();
  }

  /**
   * Process upload queue with retry logic
   */
  private async processUploadQueue(): Promise<void> {
    if (this.isUploading || this.uploadQueue.length === 0 || !this.isOnline || this.aborted) {
      return;
    }

    this.isUploading = true;

    while (this.uploadQueue.length > 0 && this.isOnline && !this.aborted) {
      const item = this.uploadQueue[0];

      try {
        await this.uploadChunk(item.index, item.blob);
        this.uploadQueue.shift(); // Remove successful upload
        this.totalUploadedSize += item.blob.size;
        this.reportProgress();
      } catch {
        item.retries++;

        if (item.retries >= MAX_RETRY_ATTEMPTS) {
          // Move to failed, continue with next
          this.uploadQueue.shift();
          this.failedChunks++;
          console.error(
            `[ChunkUploader] Failed to upload chunk ${item.index} after ${MAX_RETRY_ATTEMPTS} attempts`
          );
          this.onErrorCallback?.(
            new Error(`Failed to upload chunk ${item.index} after ${MAX_RETRY_ATTEMPTS} attempts`),
            true // recoverable - other chunks may succeed
          );
          this.reportProgress();
        } else {
          // Wait and retry
          const delay = RETRY_DELAY_MS[item.retries - 1] || 4000;
          console.log(
            `[ChunkUploader] Retry ${item.retries}/${MAX_RETRY_ATTEMPTS} for chunk ${item.index} in ${delay}ms`
          );
          await this.delay(delay);
        }
      }
    }

    this.isUploading = false;
  }

  /**
   * Upload a single chunk to Firebase Storage
   */
  private async uploadChunk(index: number, blob: Blob): Promise<void> {
    // Refresh auth token if needed
    await this.refreshTokenIfNeeded();

    const chunkName = `chunk_${String(index).padStart(3, '0')}.webm`;
    const path = `recordings/${this.userId}/${this.sessionId}/${chunkName}`;
    const storageRef = ref(storage, path);

    const metadata: UploadMetadata = {
      contentType: this.mimeType,
      customMetadata: {
        chunkIndex: String(index),
        sessionId: this.sessionId,
        uploadedAt: new Date().toISOString(),
      },
    };

    await uploadBytes(storageRef, blob, metadata);

    console.log(
      `[ChunkUploader] Uploaded ${chunkName} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  /**
   * Refresh Firebase auth token if it's close to expiration
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    const auth = getAuth();
    if (!auth.currentUser) return;

    try {
      const tokenResult = await auth.currentUser.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime).getTime();
      const now = Date.now();

      // Refresh if token will expire in next 5 minutes
      if (expirationTime - now < 5 * 60 * 1000) {
        console.log('[ChunkUploader] Refreshing auth token');
        await auth.currentUser.getIdToken(true); // Force refresh
      }
    } catch (error) {
      console.warn('[ChunkUploader] Failed to check/refresh token:', error);
    }
  }

  /**
   * Upload metadata file
   */
  private async uploadMetadata(metadata: ChunkMetadata): Promise<void> {
    const path = `recordings/${this.userId}/${this.sessionId}/metadata.json`;
    const storageRef = ref(storage, path);
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });

    await uploadBytes(storageRef, metadataBlob, {
      contentType: 'application/json',
    });
  }

  /**
   * Finalize the recording - flush remaining data and update metadata
   * @param duration Recording duration in seconds
   * @returns Session ID for backend processing
   */
  async finalize(duration: number): Promise<string> {
    if (this.aborted) {
      throw new Error('Session was aborted');
    }

    console.log(`[ChunkUploader] Finalizing session ${this.sessionId}`);

    // Flush any remaining data
    if (this.accumulator.length > 0) {
      await this.flushChunk();
    }

    // Wait for all uploads to complete (with timeout)
    const maxWaitTime = 60000; // 1 minute max wait
    const startWait = Date.now();
    while ((this.uploadQueue.length > 0 || this.isUploading) && !this.aborted) {
      if (Date.now() - startWait > maxWaitTime) {
        console.warn('[ChunkUploader] Timeout waiting for uploads to complete');
        break;
      }
      await this.delay(100);
    }

    // Upload final metadata
    const metadata: ChunkMetadata = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      source: this.source,
      status: this.failedChunks > 0 ? 'failed' : 'complete',
      chunkCount: this.chunkIndex,
      duration,
      mimeType: this.mimeType,
      userId: this.userId,
    };

    try {
      await this.uploadMetadata(metadata);
    } catch (error) {
      console.error('[ChunkUploader] Failed to upload metadata:', error);
      // Don't throw - the chunks are still uploaded
    }

    // Clear localStorage
    this.clearLocalStorage();

    // Remove event listeners
    this.removeEventListeners();

    console.log(
      `[ChunkUploader] Finalized session ${this.sessionId} with ${this.chunkIndex} chunks`
    );

    return this.sessionId;
  }

  /**
   * Abort the recording - cleanup without finalizing
   */
  async abort(): Promise<void> {
    console.log(`[ChunkUploader] Aborting session ${this.sessionId}`);
    this.aborted = true;
    this.uploadQueue = [];
    this.accumulator = [];
    this.clearLocalStorage();
    this.removeEventListeners();
  }

  /**
   * Clear localStorage session data
   */
  private clearLocalStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeRecordingSession');
      localStorage.removeItem('activeRecordingUserId');
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Report progress to callback
   */
  private reportProgress(): void {
    this.onProgressCallback?.({
      uploadedChunks: this.chunkIndex - this.uploadQueue.length - this.failedChunks,
      totalSize: this.totalUploadedSize,
      lastUploadTime: Date.now(),
      pendingChunks: this.uploadQueue.length,
      failedChunks: this.failedChunks,
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check for recoverable session from previous recording
   * Call this on app startup to detect crashed recordings
   */
  static getRecoverableSession(): { sessionId: string; userId: string } | null {
    if (typeof window === 'undefined') return null;

    const sessionId = localStorage.getItem('activeRecordingSession');
    const userId = localStorage.getItem('activeRecordingUserId');

    if (sessionId && userId) {
      return { sessionId, userId };
    }
    return null;
  }

  /**
   * Clear recoverable session (call after user dismisses recovery)
   */
  static clearRecoverableSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeRecordingSession');
      localStorage.removeItem('activeRecordingUserId');
    }
  }

  /**
   * Check if a session exists in Firebase Storage
   * Used to verify a recoverable session has actual data
   */
  static async sessionExists(
    userId: string,
    sessionId: string
  ): Promise<{ exists: boolean; chunkCount: number }> {
    try {
      // Try to get metadata file
      const metadataRef = ref(storage, `recordings/${userId}/${sessionId}/metadata.json`);
      const metadata = await getMetadata(metadataRef);

      // If metadata exists, extract chunk count
      const chunkCount = parseInt(metadata.customMetadata?.chunkCount || '0', 10);
      return { exists: true, chunkCount };
    } catch {
      // Try to check for at least one chunk
      try {
        const chunk0Ref = ref(storage, `recordings/${userId}/${sessionId}/chunk_000.webm`);
        await getMetadata(chunk0Ref);
        return { exists: true, chunkCount: 1 }; // At least one chunk exists
      } catch {
        return { exists: false, chunkCount: 0 };
      }
    }
  }
}
