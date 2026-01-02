/**
 * Queue Recovery Service
 *
 * Handles recovery of stuck/stalled transcription jobs:
 * 1. Listens for Bull 'stalled' events and logs them
 * 2. On startup, recovers jobs stuck in PROCESSING state in Firestore
 *    but not present in the Bull queue (orphaned after server restart)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { FieldValue } from 'firebase-admin/firestore';
import { QUEUE_NAMES, TranscriptionStatus } from '@transcribe/shared';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class QueueRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(QueueRecoveryService.name);
  // Grace period: don't recover jobs that just started (might still be initializing)
  private readonly RECOVERY_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectQueue(QUEUE_NAMES.TRANSCRIPTION)
    private readonly transcriptionQueue: Queue,
    private readonly transcriptionRepository: TranscriptionRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  onModuleInit() {
    this.setupQueueEventListeners();
    // Small delay to ensure queue is fully connected
    setTimeout(() => {
      this.recoverOrphanedJobs().catch((error) => {
        this.logger.error('[Recovery] Startup recovery failed:', error);
      });
    }, 5000);
  }

  /**
   * Set up event listeners for queue events (stalled, failed, etc.)
   */
  private setupQueueEventListeners() {
    // Log when a job is detected as stalled (will be auto-retried by Bull)
    this.transcriptionQueue.on('stalled', (job: Job) => {
      this.logger.warn(
        `[Queue] Job ${job.id} stalled - transcription ${job.data?.transcriptionId}. Bull will auto-retry.`,
      );
    });

    // Log when a job fails after all retries
    this.transcriptionQueue.on('failed', (job: Job, error: Error) => {
      this.logger.error(
        `[Queue] Job ${job.id} failed permanently - transcription ${job.data?.transcriptionId}: ${error.message}`,
      );
    });

    // Log successful completion
    this.transcriptionQueue.on('completed', (job: Job) => {
      this.logger.log(
        `[Queue] Job ${job.id} completed - transcription ${job.data?.transcriptionId}`,
      );
    });

    this.logger.log(
      '[Queue] Event listeners registered for stalled job recovery',
    );
  }

  /**
   * On startup, find transcriptions stuck in PROCESSING that don't have
   * corresponding jobs in the Bull queue (orphaned after server crash/restart)
   */
  private async recoverOrphanedJobs() {
    this.logger.log(
      '[Recovery] Checking for orphaned PROCESSING transcriptions...',
    );

    try {
      const db = this.firebaseService.firestore;
      const transcriptionsRef = db.collection('transcriptions');

      // Find all transcriptions in PROCESSING state
      const processingSnapshot = await transcriptionsRef
        .where('status', '==', TranscriptionStatus.PROCESSING)
        .get();

      if (processingSnapshot.empty) {
        this.logger.log('[Recovery] No PROCESSING transcriptions found');
        return;
      }

      this.logger.log(
        `[Recovery] Found ${processingSnapshot.size} PROCESSING transcriptions, checking queue...`,
      );

      // Get all active/waiting jobs from the queue
      const [activeJobs, waitingJobs, delayedJobs] = await Promise.all([
        this.transcriptionQueue.getActive(),
        this.transcriptionQueue.getWaiting(),
        this.transcriptionQueue.getDelayed(),
      ]);

      const queuedTranscriptionIds = new Set([
        ...activeJobs.map((j) => j.data?.transcriptionId),
        ...waitingJobs.map((j) => j.data?.transcriptionId),
        ...delayedJobs.map((j) => j.data?.transcriptionId),
      ]);

      const now = Date.now();
      let recoveredCount = 0;
      let skippedCount = 0;

      for (const doc of processingSnapshot.docs) {
        const data = doc.data();
        const transcriptionId = doc.id;

        // Skip if job is still in the queue (being processed normally)
        if (queuedTranscriptionIds.has(transcriptionId)) {
          this.logger.debug(
            `[Recovery] Transcription ${transcriptionId} still in queue, skipping`,
          );
          skippedCount++;
          continue;
        }

        // Check grace period - don't recover very recent jobs
        const updatedAt = data.updatedAt?.toDate?.()?.getTime() || 0;
        if (now - updatedAt < this.RECOVERY_GRACE_PERIOD_MS) {
          this.logger.debug(
            `[Recovery] Transcription ${transcriptionId} updated recently, skipping (grace period)`,
          );
          skippedCount++;
          continue;
        }

        // This transcription is orphaned - re-queue it
        this.logger.warn(
          `[Recovery] Found orphaned transcription ${transcriptionId} (user: ${data.userId}), re-queuing...`,
        );

        try {
          // Reset status to PENDING before re-queuing
          // Use FieldValue.delete() to remove the error field (Firestore doesn't accept undefined)
          await this.transcriptionRepository.updateTranscription(
            transcriptionId,
            {
              status: TranscriptionStatus.PENDING,
              updatedAt: new Date(),
              error: FieldValue.delete() as unknown as string,
            },
          );

          // Re-add to queue
          await this.transcriptionQueue.add(
            'transcribe',
            {
              transcriptionId,
              userId: data.userId,
              fileUrl: data.fileUrl,
              context: data.context,
              selectedTemplates: data.selectedTemplates,
            },
            {
              jobId: `recovery-${transcriptionId}-${Date.now()}`,
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 60000,
              },
            },
          );

          recoveredCount++;
          this.logger.log(
            `[Recovery] Successfully re-queued transcription ${transcriptionId}`,
          );
        } catch (error) {
          this.logger.error(
            `[Recovery] Failed to recover transcription ${transcriptionId}:`,
            error,
          );
        }
      }

      this.logger.log(
        `[Recovery] Startup recovery complete: ${recoveredCount} recovered, ${skippedCount} skipped`,
      );
    } catch (error) {
      this.logger.error('[Recovery] Error during startup recovery:', error);
    }
  }
}
