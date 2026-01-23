/**
 * directUpload.ts
 * Uploads files directly from browser to Firebase Storage using resumable uploads.
 * This bypasses the backend for the actual file transfer, significantly improving
 * upload performance for large files (no server-side buffering/re-upload).
 *
 * Flow:
 * 1. Browser uploads file directly to Firebase Storage (/uploads/{userId}/...)
 * 2. Browser notifies backend with storage path to start processing
 * 3. Backend reads file from storage and processes it
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
  UploadTask,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Progress callback for upload tracking
 */
export type DirectUploadProgressCallback = (
  bytesTransferred: number,
  totalBytes: number,
  percentage: number,
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error'
) => void;

/**
 * Result of a successful direct upload
 */
export interface DirectUploadResult {
  storagePath: string;
  downloadUrl: string;
  fileSize: number;
  fileName: string;
  contentType: string;
}

/**
 * Options for direct upload
 */
export interface DirectUploadOptions {
  onProgress?: DirectUploadProgressCallback;
  onError?: (error: Error) => void;
}

/**
 * Active upload task that can be paused/resumed/canceled
 */
export interface ActiveUpload {
  task: UploadTask;
  pause: () => boolean;
  resume: () => boolean;
  cancel: () => boolean;
  promise: Promise<DirectUploadResult>;
}

/**
 * Generate a unique filename with timestamp to avoid collisions
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  // Sanitize filename - keep only alphanumeric, dots, dashes, underscores
  const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${timestamp}_${randomSuffix}_${sanitized}`;
}

/**
 * Upload a file directly to Firebase Storage with progress tracking.
 * Uses resumable uploads which automatically retry on network failures.
 *
 * @param file - File to upload
 * @param userId - User ID for storage path
 * @param options - Optional callbacks for progress and errors
 * @returns ActiveUpload object with control methods and result promise
 */
export function uploadFileDirect(
  file: File,
  userId: string,
  options: DirectUploadOptions = {}
): ActiveUpload {
  const { onProgress, onError } = options;

  // Generate unique storage path
  const uniqueFilename = generateUniqueFilename(file.name);
  const storagePath = `uploads/${userId}/${uniqueFilename}`;
  const storageRef = ref(storage, storagePath);

  // Create resumable upload task
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Create promise that resolves when upload completes
  const promise = new Promise<DirectUploadResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const percentage = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );

        // Map Firebase state to our state type
        let state: 'running' | 'paused' | 'success' | 'canceled' | 'error' = 'running';
        switch (snapshot.state) {
          case 'paused':
            state = 'paused';
            break;
          case 'running':
            state = 'running';
            break;
          case 'success':
            state = 'success';
            break;
          case 'canceled':
            state = 'canceled';
            break;
        }

        onProgress?.(
          snapshot.bytesTransferred,
          snapshot.totalBytes,
          percentage,
          state
        );
      },
      (error) => {
        // Handle errors
        const uploadError = new Error(
          error.message || 'Upload failed'
        );
        onError?.(uploadError);
        reject(uploadError);
      },
      async () => {
        // Upload completed successfully
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          onProgress?.(file.size, file.size, 100, 'success');

          resolve({
            storagePath,
            downloadUrl,
            fileSize: file.size,
            fileName: file.name,
            contentType: file.type,
          });
        } catch (error) {
          const urlError = new Error('Failed to get download URL');
          onError?.(urlError);
          reject(urlError);
        }
      }
    );
  });

  return {
    task: uploadTask,
    pause: () => uploadTask.pause(),
    resume: () => uploadTask.resume(),
    cancel: () => uploadTask.cancel(),
    promise,
  };
}

/**
 * Simple wrapper that just returns the promise (no pause/resume control needed)
 */
export async function uploadFileDirectSimple(
  file: File,
  userId: string,
  onProgress?: DirectUploadProgressCallback
): Promise<DirectUploadResult> {
  const { promise } = uploadFileDirect(file, userId, { onProgress });
  return promise;
}
