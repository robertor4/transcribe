import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { File } from '@google-cloud/storage';
import { Readable } from 'stream';
import { FirebaseService } from '../firebase.service';

// Retry configuration for large file uploads
const UPLOAD_RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  // Errors that should trigger a retry
  retryableErrors: [
    'EPROTO',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPIPE',
    'ECONNREFUSED',
    'socket hang up',
    'network timeout',
    'write EPROTO',
  ],
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
  ) {}

  private get storage(): admin.storage.Storage {
    return this.firebaseService.storageService;
  }

  /**
   * Check if an error is retryable (transient network/TLS error)
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    const errorCode = error?.code || '';

    return UPLOAD_RETRY_CONFIG.retryableErrors.some(
      (retryableError) =>
        errorMessage.includes(retryableError) ||
        errorCode.includes(retryableError),
    );
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Upload a buffer using streaming with retry logic for large files
   */
  private async uploadWithRetry(
    file: File,
    buffer: Buffer,
    contentType: string,
    path: string,
  ): Promise<void> {
    let lastError: Error | null = null;
    let delay = UPLOAD_RETRY_CONFIG.initialDelayMs;

    for (
      let attempt = 1;
      attempt <= UPLOAD_RETRY_CONFIG.maxRetries;
      attempt++
    ) {
      try {
        // Use streaming upload for better handling of large files
        await new Promise<void>((resolve, reject) => {
          const stream = Readable.from(buffer);
          const writeStream = file.createWriteStream({
            metadata: { contentType },
            resumable: true,
            // Use smaller chunk size for more reliable uploads (8MB chunks)
            chunkSize: 8 * 1024 * 1024,
          });

          writeStream.on('error', (err) => {
            reject(err);
          });

          writeStream.on('finish', () => {
            resolve();
          });

          stream.pipe(writeStream);
        });

        // Success - return without error
        if (attempt > 1) {
          this.logger.log(
            `Upload succeeded on attempt ${attempt} for: ${path}`,
          );
        }
        return;
      } catch (error: any) {
        lastError = error;

        if (this.isRetryableError(error)) {
          if (attempt < UPLOAD_RETRY_CONFIG.maxRetries) {
            this.logger.warn(
              `Upload attempt ${attempt}/${UPLOAD_RETRY_CONFIG.maxRetries} failed for ${path}: ${error.message}. Retrying in ${delay}ms...`,
            );
            await this.sleep(delay);
            delay = Math.min(
              delay * UPLOAD_RETRY_CONFIG.backoffMultiplier,
              UPLOAD_RETRY_CONFIG.maxDelayMs,
            );
          } else {
            this.logger.error(
              `Upload failed after ${UPLOAD_RETRY_CONFIG.maxRetries} attempts for ${path}: ${error.message}`,
            );
          }
        } else {
          // Non-retryable error - throw immediately
          this.logger.error(
            `Non-retryable upload error for ${path}: ${error.message}`,
          );
          throw error;
        }
      }
    }

    // All retries exhausted
    throw (
      lastError ||
      new Error(
        `Upload failed after ${UPLOAD_RETRY_CONFIG.maxRetries} attempts`,
      )
    );
  }

  /**
   * Extract identifier from file path for logging
   * Handles multiple path patterns:
   * - "transcriptions/userId/transcriptionId/file" -> "transcriptionId"
   * - "audio/userId/timestamp_filename" -> "timestamp_filename" (truncated)
   */
  private extractIdFromPath(path: string): string {
    // Try transcriptions path first: transcriptions/{userId}/{transcriptionId}/...
    const transcriptionMatch = path.match(/transcriptions\/[^/]+\/([^/]+)/);
    if (transcriptionMatch) {
      return transcriptionMatch[1];
    }

    // Try audio path: audio/{userId}/{timestamp}_{filename}
    const audioMatch = path.match(/audio\/[^/]+\/(.+)/);
    if (audioMatch) {
      // Return truncated filename for readability
      const filename = audioMatch[1];
      return filename.length > 30
        ? filename.substring(0, 30) + '...'
        : filename;
    }

    // Fallback: return last path segment
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : 'unknown';
  }

  /**
   * Extract file path from a signed URL
   */
  private extractFilePathFromUrl(url: string): string {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    const bucketName = this.configService.get<string>(
      'FIREBASE_STORAGE_BUCKET',
    );
    const bucketIndex = pathParts.findIndex(
      (part) =>
        part === bucketName ||
        part.includes('.firebasestorage.app') ||
        part.includes('.appspot.com'),
    );

    let filePath: string;
    if (bucketIndex !== -1) {
      filePath = pathParts.slice(bucketIndex + 1).join('/');
    } else {
      const nonEmptyParts = pathParts.filter((p) => p);
      filePath = nonEmptyParts.slice(1).join('/');
    }

    // Decode the file path (handles URL encoding like %20 for spaces)
    return decodeURIComponent(filePath);
  }

  async uploadFile(
    buffer: Buffer,
    path: string,
    contentType: string,
  ): Promise<{ url: string; path: string }> {
    const bucket = this.storage.bucket();
    const file = bucket.file(path);
    const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

    this.logger.log(
      `Uploading file to storage: ${path}, size: ${fileSizeMB} MB`,
    );

    // Use streaming upload with retry for large files (>50MB)
    // or simple save for smaller files
    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB

    if (buffer.length > LARGE_FILE_THRESHOLD) {
      this.logger.log(
        `Using streaming upload with retry for large file (${fileSizeMB} MB)`,
      );
      await this.uploadWithRetry(file, buffer, contentType, path);
    } else {
      await file.save(buffer, {
        metadata: {
          contentType,
        },
      });
    }

    this.logger.log(`File saved successfully: ${path}`);

    // Verify the file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File upload verification failed: ${path}`);
    }

    // Generate signed URL with long expiration
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const transcriptionId = this.extractIdFromPath(path);
    this.logger.log(
      `Generated signed URL for transcription ${transcriptionId}`,
    );

    return { url, path };
  }

  async uploadText(text: string, path: string): Promise<string> {
    const buffer = Buffer.from(text, 'utf-8');
    const result = await this.uploadFile(buffer, path, 'text/plain');
    return result.url;
  }

  /**
   * Upload a file to a public path (no signed URL needed).
   * Public access is controlled via Firebase Storage rules, not object-level ACLs.
   * Use for non-sensitive content like AI-generated blog images.
   *
   * NOTE: Path must be under a publicly readable rule (e.g., public/blog-images/)
   * @returns Object with public URL and storage path
   */
  async uploadPublicFile(
    buffer: Buffer,
    path: string,
    contentType: string,
  ): Promise<{ url: string; path: string }> {
    const bucket = this.storage.bucket();
    const file = bucket.file(path);

    this.logger.log(
      `Uploading public file to storage: ${path}, size: ${buffer.length} bytes`,
    );

    // Upload without public: true - bucket uses uniform access, so public read
    // is controlled by Firebase Storage rules, not object-level ACLs
    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    this.logger.log(`Public file saved successfully: ${path}`);

    // Verify the file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File upload verification failed: ${path}`);
    }

    // Construct public URL using Firebase Storage CDN format
    // This format respects Firebase Storage rules (unlike storage.googleapis.com which needs IAM)
    const bucketName = this.configService.get<string>(
      'FIREBASE_STORAGE_BUCKET',
    );
    const encodedPath = encodeURIComponent(path);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

    this.logger.log(`Generated public URL for ${path}`);

    return { url: publicUrl, path };
  }

  async getPublicUrl(url: string): Promise<string> {
    try {
      const filePath = this.extractFilePathFromUrl(url);
      const transcriptionId = this.extractIdFromPath(filePath);
      this.logger.log(
        `Creating public URL for transcription ${transcriptionId}`,
      );

      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        this.logger.error(
          `File does not exist for transcription ${transcriptionId}: ${filePath}`,
        );
        throw new Error(`File not found in storage: ${filePath}`);
      }

      // Generate a new signed URL with long expiration for AssemblyAI
      const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      });

      this.logger.log(
        `Generated public URL for transcription ${transcriptionId}`,
      );

      return publicUrl;
    } catch (error) {
      this.logger.error('Error creating public URL:', error);
      throw error;
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    try {
      const filePath = this.extractFilePathFromUrl(url);
      const transcriptionId = this.extractIdFromPath(filePath);
      this.logger.log(`Downloading file for transcription ${transcriptionId}`);

      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      const [buffer] = await file.download();

      return buffer;
    } catch (error) {
      this.logger.error('Error parsing file URL or downloading:', error);
      this.logger.error('Original URL:', url);
      throw error;
    }
  }

  /**
   * Download a file by its path (not URL)
   * Used for chunked recording processing
   */
  async downloadFileByPath(path: string): Promise<Buffer> {
    try {
      const bucket = this.storage.bucket();
      const file = bucket.file(path);
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      this.logger.error(`Error downloading file by path: ${path}`, error);
      throw error;
    }
  }

  /**
   * List files in a Firebase Storage path (prefix)
   * Used for chunked recording processing to find all chunks
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const bucket = this.storage.bucket();
      const [files] = await bucket.getFiles({ prefix });
      return files.map((file) => file.name);
    } catch (error) {
      this.logger.error(`Error listing files with prefix: ${prefix}`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists at the given path
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket();
      const file = bucket.file(path);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.logger.error(`Error checking file existence: ${path}`, error);
      return false;
    }
  }

  /**
   * Generate a fresh signed URL for a file at the given path.
   * Used to regenerate expired signed URLs.
   * @param path - Firebase Storage path (e.g., "users/123/blog-images/456.webp")
   * @param expirationMs - Expiration time in milliseconds (default: 7 days)
   * @returns Fresh signed URL or null if file doesn't exist
   */
  async generateSignedUrl(
    path: string,
    expirationMs: number = 7 * 24 * 60 * 60 * 1000,
  ): Promise<string | null> {
    try {
      const bucket = this.storage.bucket();
      const file = bucket.file(path);
      const [exists] = await file.exists();

      if (!exists) {
        this.logger.warn(`File not found for signed URL generation: ${path}`);
        return null;
      }

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMs,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Error generating signed URL for ${path}:`, error);
      return null;
    }
  }

  async deleteFileByPath(path: string): Promise<void> {
    try {
      const transcriptionId = this.extractIdFromPath(path);
      const bucket = this.storage.bucket();
      const file = bucket.file(path);
      await file.delete();
      this.logger.log(
        `Successfully deleted file for transcription ${transcriptionId}`,
      );
    } catch (error: any) {
      // Check if the error is a 404 (file not found)
      if (error?.code === 404 || error?.message?.includes('No such object')) {
        const transcriptionId = this.extractIdFromPath(path);
        this.logger.warn(
          `File already deleted or doesn't exist for transcription ${transcriptionId}`,
        );
        // Don't throw - this is not a critical error
        return;
      }
      // For other errors, log and re-throw
      this.logger.error('Error deleting file by path:', error);
      throw error;
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const filePath = this.extractFilePathFromUrl(url);
      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      await file.delete();
      this.logger.log(`Successfully deleted file: ${filePath}`);
    } catch (error: any) {
      // Check if the error is a 404 (file not found)
      if (error?.code === 404 || error?.message?.includes('No such object')) {
        this.logger.warn(`File already deleted or doesn't exist: ${url}`);
        // Don't throw - this is not a critical error
        return;
      }
      // For other errors, log and re-throw
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Delete all files for a user (used in account deletion)
   */
  async deleteUserFiles(userId: string): Promise<number> {
    try {
      const bucket = this.storage.bucket();
      const [files] = await bucket.getFiles({ prefix: `users/${userId}/` });

      let deletedCount = 0;
      for (const file of files) {
        await file.delete();
        deletedCount++;
      }

      this.logger.log(
        `Deleted ${deletedCount} storage files for user ${userId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting storage files for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
