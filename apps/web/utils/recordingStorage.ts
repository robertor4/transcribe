/**
 * recordingStorage.ts
 * IndexedDB storage utility for resilient audio recording
 * Provides auto-save and recovery capabilities for long recordings
 *
 * Note: We store audio data as ArrayBuffers instead of Blobs because
 * iOS Safari has issues with Blob serialization in IndexedDB. Blobs
 * stored on iOS Safari often come back as 0-byte objects.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { RecordingSource } from '@/hooks/useMediaRecorder';

/**
 * Internal storage format - uses ArrayBuffers for iOS Safari compatibility
 */
interface StoredChunk {
  buffer: ArrayBuffer;
  type: string; // MIME type of the original Blob
}

/**
 * Database schema for stored recordings
 * Version 3: Changed chunks from Blob[] to StoredChunk[] for iOS Safari compatibility
 */
interface RecordingDB extends DBSchema {
  recordings: {
    key: string; // recordingId (UUID)
    value: {
      id: string;
      userId: string; // Firebase user ID - recordings are scoped per user
      startTime: number; // Unix timestamp
      chunks: StoredChunk[]; // Audio chunks as ArrayBuffers (iOS Safari compatible)
      duration: number; // Seconds
      mimeType: string; // e.g., 'audio/webm;codecs=opus'
      source: RecordingSource; // 'microphone' | 'tab-audio'
      lastSaved: number; // Unix timestamp of last save
    };
    indexes: { 'by-user': string }; // Index for filtering by userId
  };
}

/**
 * External interface - what callers work with (uses Blobs)
 */
export interface RecordingData {
  id: string;
  userId: string;
  startTime: number;
  chunks: Blob[]; // Callers work with Blobs
  duration: number;
  mimeType: string;
  source: RecordingSource;
  lastSaved: number;
}

/**
 * RecordingStorage class
 * Manages IndexedDB operations for recording persistence
 */
export class RecordingStorage {
  private db: IDBPDatabase<RecordingDB> | null = null;
  private readonly DB_NAME = 'neural-summary-recordings';
  private readonly DB_VERSION = 3; // Bumped to 3 for ArrayBuffer storage
  private readonly STORE_NAME = 'recordings';

  /**
   * Initialize IndexedDB connection
   * Must be called before any other operations
   */
  async init(): Promise<void> {
    if (this.db) return; // Already initialized

    try {
      this.db = await openDB<RecordingDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, _newVersion, transaction) {
          // Version 1: Create object store
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('recordings')) {
              const store = db.createObjectStore('recordings', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
            }
          }
          // Version 2: Add userId index (if upgrading from v1)
          if (oldVersion >= 1 && oldVersion < 2) {
            const store = transaction.objectStore('recordings');
            if (!store.indexNames.contains('by-user')) {
              store.createIndex('by-user', 'userId');
            }
          }
          // Version 3: Migrate Blob[] to StoredChunk[]
          // Note: We can't easily migrate existing data in an upgrade,
          // so old recordings with Blob[] format will be handled in getRecording
        },
      });
    } catch (error) {
      console.error('[RecordingStorage] Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Convert a Blob to an ArrayBuffer
   */
  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return await blob.arrayBuffer();
  }

  /**
   * Convert an ArrayBuffer back to a Blob
   */
  private arrayBufferToBlob(buffer: ArrayBuffer, type: string): Blob {
    return new Blob([buffer], { type });
  }

  /**
   * Convert Blob[] to StoredChunk[] for storage
   */
  private async blobsToStoredChunks(blobs: Blob[]): Promise<StoredChunk[]> {
    const storedChunks: StoredChunk[] = [];
    for (const blob of blobs) {
      const buffer = await this.blobToArrayBuffer(blob);
      storedChunks.push({
        buffer,
        type: blob.type,
      });
    }
    return storedChunks;
  }

  /**
   * Convert StoredChunk[] back to Blob[]
   */
  private storedChunksToBlobs(storedChunks: StoredChunk[]): Blob[] {
    return storedChunks.map((chunk) => this.arrayBufferToBlob(chunk.buffer, chunk.type));
  }

  /**
   * Check if chunks are in old Blob[] format (for migration)
   */
  private isOldBlobFormat(chunks: unknown[]): chunks is Blob[] {
    return chunks.length > 0 && chunks[0] instanceof Blob;
  }

  /**
   * Check if chunks are in new StoredChunk[] format
   */
  private isStoredChunkFormat(chunks: unknown[]): chunks is StoredChunk[] {
    return (
      chunks.length > 0 &&
      typeof chunks[0] === 'object' &&
      chunks[0] !== null &&
      'buffer' in chunks[0] &&
      'type' in chunks[0]
    );
  }

  /**
   * Save a recording to IndexedDB
   * @param recording Recording data to save (with Blob chunks)
   */
  async saveRecording(recording: RecordingData): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      // Convert Blobs to ArrayBuffers for storage
      const storedChunks = await this.blobsToStoredChunks(recording.chunks);

      await this.db.put(this.STORE_NAME, {
        id: recording.id,
        userId: recording.userId,
        startTime: recording.startTime,
        chunks: storedChunks,
        duration: recording.duration,
        mimeType: recording.mimeType,
        source: recording.source,
        lastSaved: Date.now(),
      });
    } catch (error) {
      // Handle quota exceeded error gracefully
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error(
          'Storage quota exceeded. Please clean up old recordings or free up device storage.'
        );
      }
      throw error;
    }
  }

  /**
   * Retrieve a recording by ID
   * @param id Recording ID
   * @returns Recording data with Blob chunks, or undefined if not found
   */
  async getRecording(id: string): Promise<RecordingData | undefined> {
    if (!this.db) {
      return undefined;
    }

    try {
      const stored = await this.db.get(this.STORE_NAME, id);
      if (!stored) {
        return undefined;
      }

      // Handle both old Blob[] format and new StoredChunk[] format
      let chunks: Blob[];
      if (this.isOldBlobFormat(stored.chunks)) {
        // Old format - chunks are already Blobs (may be broken on iOS)
        chunks = stored.chunks;
        console.log(`[RecordingStorage] Recording ${id} uses old Blob format`);
      } else if (this.isStoredChunkFormat(stored.chunks)) {
        // New format - convert ArrayBuffers back to Blobs
        chunks = this.storedChunksToBlobs(stored.chunks);
        console.log(
          `[RecordingStorage] Recording ${id} converted from ArrayBuffer format, ${chunks.length} chunks`
        );
      } else {
        // Unknown format
        console.warn(`[RecordingStorage] Recording ${id} has unknown chunk format`);
        chunks = [];
      }

      return {
        id: stored.id,
        userId: stored.userId,
        startTime: stored.startTime,
        chunks,
        duration: stored.duration,
        mimeType: stored.mimeType,
        source: stored.source,
        lastSaved: stored.lastSaved,
      };
    } catch (error) {
      console.error(`[RecordingStorage] Error getting recording ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get all stored recordings
   * @returns Array of all recordings with Blob chunks
   * @deprecated Use getRecordingsByUser instead to ensure user data isolation
   */
  async getAllRecordings(): Promise<RecordingData[]> {
    if (!this.db) {
      return [];
    }

    try {
      const allStored = await this.db.getAll(this.STORE_NAME);
      const recordings: RecordingData[] = [];

      for (const stored of allStored) {
        let chunks: Blob[];
        if (this.isOldBlobFormat(stored.chunks)) {
          chunks = stored.chunks;
        } else if (this.isStoredChunkFormat(stored.chunks)) {
          chunks = this.storedChunksToBlobs(stored.chunks);
        } else {
          chunks = [];
        }

        recordings.push({
          id: stored.id,
          userId: stored.userId,
          startTime: stored.startTime,
          chunks,
          duration: stored.duration,
          mimeType: stored.mimeType,
          source: stored.source,
          lastSaved: stored.lastSaved,
        });
      }

      return recordings;
    } catch {
      return [];
    }
  }

  /**
   * Get all recordings for a specific user
   * @param userId Firebase user ID
   * @returns Array of recordings belonging to the user with Blob chunks
   */
  async getRecordingsByUser(userId: string): Promise<RecordingData[]> {
    if (!this.db || !userId) {
      return [];
    }

    try {
      const allStored = await this.db.getAllFromIndex(this.STORE_NAME, 'by-user', userId);
      const recordings: RecordingData[] = [];

      for (const stored of allStored) {
        let chunks: Blob[];
        if (this.isOldBlobFormat(stored.chunks)) {
          chunks = stored.chunks;
        } else if (this.isStoredChunkFormat(stored.chunks)) {
          chunks = this.storedChunksToBlobs(stored.chunks);
        } else {
          chunks = [];
        }

        recordings.push({
          id: stored.id,
          userId: stored.userId,
          startTime: stored.startTime,
          chunks,
          duration: stored.duration,
          mimeType: stored.mimeType,
          source: stored.source,
          lastSaved: stored.lastSaved,
        });
      }

      return recordings;
    } catch {
      // Fallback: if index query fails, filter manually
      try {
        const allRecordings = await this.getAllRecordings();
        return allRecordings.filter((r) => r.userId === userId);
      } catch {
        return [];
      }
    }
  }

  /**
   * Delete a recording by ID
   * @param id Recording ID to delete
   */
  async deleteRecording(id: string): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.delete(this.STORE_NAME, id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean up recordings older than specified days
   * @param daysOld Number of days (default: 7)
   * @returns Number of recordings deleted
   */
  async cleanupOldRecordings(daysOld: number = 7): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const recordings = await this.getAllRecordings();
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const recording of recordings) {
        if (recording.lastSaved < cutoffTime) {
          await this.deleteRecording(recording.id);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Reconstruct a Blob from stored recording chunks
   * Used for preview playback in recovery dialog
   * @param id Recording ID
   * @returns Blob or null if not found/empty
   */
  async reconstructBlob(id: string): Promise<Blob | null> {
    const recording = await this.getRecording(id);
    if (!recording || recording.chunks.length === 0) {
      return null;
    }
    return new Blob(recording.chunks, { type: recording.mimeType });
  }

  /**
   * Get total storage used by all recordings
   * @returns Size in bytes
   */
  async getTotalStorageUsed(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const recordings = await this.getAllRecordings();
      let totalBytes = 0;

      for (const recording of recordings) {
        for (const chunk of recording.chunks) {
          totalBytes += chunk.size;
        }
      }

      return totalBytes;
    } catch {
      return 0;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Singleton instance for use throughout the app
 */
let storageInstance: RecordingStorage | null = null;

/**
 * Get or create the singleton RecordingStorage instance
 * @returns RecordingStorage instance
 */
export async function getRecordingStorage(): Promise<RecordingStorage> {
  if (!storageInstance) {
    storageInstance = new RecordingStorage();
    await storageInstance.init();
  }
  return storageInstance;
}

/**
 * Type export for recovery UI
 */
export type RecoverableRecording = RecordingData;
