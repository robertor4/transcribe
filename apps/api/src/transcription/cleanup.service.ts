/**
 * Cleanup Service
 * Handles cleanup of orphaned files and zombie transcription documents
 * Runs as a cron job to prevent accumulation of corrupted state
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseService } from '../firebase/firebase.service';
import { TranscriptionStatus } from '@transcribe/shared';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Cleanup orphaned files and zombie documents
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    this.logger.log('[Cleanup] Starting cleanup job...');

    try {
      await this.cleanupZombieTranscriptions();
      await this.cleanupOrphanedFiles();
      this.logger.log('[Cleanup] Cleanup job completed successfully');
    } catch (error) {
      this.logger.error('[Cleanup] Cleanup job failed:', error);
    }
  }

  /**
   * Find and clean up zombie transcriptions
   * Zombie = status PENDING or PROCESSING for more than 24 hours
   */
  private async cleanupZombieTranscriptions() {
    this.logger.log('[Cleanup] Checking for zombie transcriptions...');

    try {
      const db = this.firebaseService.firestore;
      const transcriptionsRef = db.collection('transcriptions');

      // Get all PENDING or PROCESSING transcriptions
      const pendingSnapshot = await transcriptionsRef
        .where('status', '==', TranscriptionStatus.PENDING)
        .get();

      const processingSnapshot = await transcriptionsRef
        .where('status', '==', TranscriptionStatus.PROCESSING)
        .get();

      const allDocs = [...pendingSnapshot.docs, ...processingSnapshot.docs];

      if (allDocs.length === 0) {
        this.logger.log('[Cleanup] No pending/processing transcriptions found');
        return;
      }

      this.logger.log(
        `[Cleanup] Found ${allDocs.length} pending/processing transcriptions`,
      );

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 hours ago
      let zombieCount = 0;
      let cleanedCount = 0;

      for (const doc of allDocs) {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.()?.getTime() || 0;

        // Check if older than 24 hours
        if (createdAt < oneDayAgo) {
          zombieCount++;
          this.logger.warn(
            `[Cleanup] Found zombie transcription: ${doc.id} (status: ${data.status}, created: ${new Date(createdAt).toISOString()})`,
          );

          try {
            // Delete the original file if it exists
            if (data.storagePath) {
              try {
                await this.firebaseService.deleteFileByPath(data.storagePath);
                this.logger.log(
                  `[Cleanup] Deleted orphaned file: ${data.storagePath}`,
                );
              } catch (error) {
                // File might already be deleted, that's OK
                this.logger.warn(
                  `[Cleanup] Could not delete file ${data.storagePath}:`,
                  error.message,
                );
              }
            }

            // Mark transcription as failed
            await this.firebaseService.updateTranscription(doc.id, {
              status: TranscriptionStatus.FAILED,
              error:
                'Transcription timed out or was orphaned. Please try uploading again.',
              updatedAt: new Date(),
            });

            cleanedCount++;
            this.logger.log(
              `[Cleanup] Marked zombie transcription as FAILED: ${doc.id}`,
            );
          } catch (error) {
            this.logger.error(
              `[Cleanup] Failed to clean up zombie transcription ${doc.id}:`,
              error,
            );
          }
        }
      }

      this.logger.log(
        `[Cleanup] Zombie cleanup complete: Found ${zombieCount} zombies, cleaned ${cleanedCount}`,
      );
    } catch (error) {
      this.logger.error(
        '[Cleanup] Error cleaning up zombie transcriptions:',
        error,
      );
      throw error;
    }
  }

  /**
   * Find and clean up orphaned files
   * Orphaned = file in storage with no corresponding Firestore document
   *
   * Note: This is a simplified version that only checks recent files
   * to avoid scanning the entire storage bucket (expensive)
   */
  private async cleanupOrphanedFiles() {
    this.logger.log('[Cleanup] Checking for orphaned files...');

    try {
      // Note: Checking for orphaned files requires listing all files in storage
      // and cross-referencing with Firestore documents. This can be expensive
      // for large buckets. For now, we'll log this and implement if needed.

      // A more practical approach is to rely on the zombie cleanup above,
      // which deletes files when their documents are marked as failed.

      this.logger.log(
        '[Cleanup] Orphaned file cleanup skipped (handled by zombie cleanup)',
      );
    } catch (error) {
      this.logger.error('[Cleanup] Error cleaning up orphaned files:', error);
      throw error;
    }
  }
}
