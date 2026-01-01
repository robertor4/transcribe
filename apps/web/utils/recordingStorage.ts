/**
 * recordingStorage.ts
 * IndexedDB storage utility for resilient audio recording
 * Provides auto-save and recovery capabilities for long recordings
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { RecordingSource } from '@/hooks/useMediaRecorder';

/**
 * Database schema for stored recordings
 */
interface RecordingDB extends DBSchema {
  recordings: {
    key: string; // recordingId (UUID)
    value: {
      id: string;
      userId: string; // Firebase user ID - recordings are scoped per user
      startTime: number; // Unix timestamp
      chunks: Blob[]; // Audio chunks from MediaRecorder
      duration: number; // Seconds
      mimeType: string; // e.g., 'audio/webm;codecs=opus'
      source: RecordingSource; // 'microphone' | 'tab-audio'
      lastSaved: number; // Unix timestamp of last save
    };
    indexes: { 'by-user': string }; // Index for filtering by userId
  };
}

/**
 * RecordingStorage class
 * Manages IndexedDB operations for recording persistence
 */
export class RecordingStorage {
  private db: IDBPDatabase<RecordingDB> | null = null;
  private readonly DB_NAME = 'neural-summary-recordings';
  private readonly DB_VERSION = 2; // Bumped from 1 to add userId index
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
        },
      });
    } catch (error) {
      console.error('[RecordingStorage] Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Save a recording to IndexedDB
   * @param recording Recording data to save
   */
  async saveRecording(recording: RecordingDB['recordings']['value']): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.put(this.STORE_NAME, {
        ...recording,
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
   * @returns Recording data or undefined if not found
   */
  async getRecording(id: string): Promise<RecordingDB['recordings']['value'] | undefined> {
    if (!this.db) {
      return undefined;
    }

    try {
      return await this.db.get(this.STORE_NAME, id);
    } catch {
      return undefined;
    }
  }

  /**
   * Get all stored recordings
   * @returns Array of all recordings
   * @deprecated Use getRecordingsByUser instead to ensure user data isolation
   */
  async getAllRecordings(): Promise<RecordingDB['recordings']['value'][]> {
    if (!this.db) {
      return [];
    }

    try {
      return await this.db.getAll(this.STORE_NAME);
    } catch {
      return [];
    }
  }

  /**
   * Get all recordings for a specific user
   * @param userId Firebase user ID
   * @returns Array of recordings belonging to the user
   */
  async getRecordingsByUser(userId: string): Promise<RecordingDB['recordings']['value'][]> {
    if (!this.db || !userId) {
      return [];
    }

    try {
      return await this.db.getAllFromIndex(this.STORE_NAME, 'by-user', userId);
    } catch {
      // Fallback: if index query fails, filter manually
      // This handles the case where old recordings don't have userId
      try {
        const allRecordings = await this.db.getAll(this.STORE_NAME);
        return allRecordings.filter(r => r.userId === userId);
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
export type RecoverableRecording = RecordingDB['recordings']['value'];
