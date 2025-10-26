import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { QUEUE_NAMES, TranscriptionStatus } from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class QueueHealthService implements OnModuleInit {
  private readonly logger = new Logger(QueueHealthService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.TRANSCRIPTION) private transcriptionQueue: Queue,
    private firebaseService: FirebaseService,
    private websocketGateway: WebSocketGateway,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'Queue Health Service initialized - checking for stale jobs',
    );
    await this.checkStaleJobs();
    await this.logQueueStatistics();
  }

  /**
   * Check for stale jobs after application restart.
   * Stale jobs are transcriptions marked as PROCESSING in Firestore
   * but have no corresponding active job in Redis queue.
   */
  async checkStaleJobs(): Promise<void> {
    try {
      // Get all active jobs from the queue
      const activeJobs = await this.transcriptionQueue.getActive();
      const activeTranscriptionIds = new Set(
        activeJobs.map((job: Job) => job.data.transcriptionId),
      );

      this.logger.log(`Found ${activeJobs.length} active jobs in Redis queue`);

      // Query Firestore for transcriptions marked as PROCESSING
      const processingTranscriptions = await this.firebaseService.firestore
        .collection('transcriptions')
        .where('status', '==', TranscriptionStatus.PROCESSING)
        .get();

      this.logger.log(
        `Found ${processingTranscriptions.size} transcriptions with PROCESSING status in Firestore`,
      );

      let staleCount = 0;
      let recoveredCount = 0;

      // Check each processing transcription
      for (const doc of processingTranscriptions.docs) {
        const transcription = doc.data();
        const transcriptionId = doc.id;

        // If transcription is marked as PROCESSING but not in active jobs, it might be stale
        if (!activeTranscriptionIds.has(transcriptionId)) {
          staleCount++;

          // Check if there's a waiting/delayed job for this transcription
          const waitingJobs = await this.transcriptionQueue.getWaiting();
          const delayedJobs = await this.transcriptionQueue.getDelayed();
          const allPendingJobs = [...waitingJobs, ...delayedJobs];

          const hasPendingJob = allPendingJobs.some(
            (job: Job) => job.data.transcriptionId === transcriptionId,
          );

          if (hasPendingJob) {
            // Job is waiting to be processed - notify user
            this.logger.log(
              `Transcription ${transcriptionId} has a pending job - notifying user`,
            );
            recoveredCount++;

            this.websocketGateway.sendTranscriptionProgress(
              transcription.userId,
              {
                transcriptionId,
                status: TranscriptionStatus.PROCESSING,
                progress: 5,
                message: 'Resuming transcription after server restart...',
                stage: 'processing',
              },
            );
          } else {
            // No active or pending job found - this is truly stale
            this.logger.warn(
              `Stale transcription detected: ${transcriptionId} - status is PROCESSING but no job found in queue`,
            );
            this.logger.warn(
              `You may need to manually investigate transcription ${transcriptionId}`,
            );

            // Optionally: Mark as failed or re-queue
            // For safety, we'll just log the issue for manual investigation
            // In production, you might want to implement auto-recovery logic here
          }
        }
      }

      if (staleCount > 0) {
        this.logger.log(
          `Stale job check complete: Found ${staleCount} potentially stale transcriptions, recovered ${recoveredCount}`,
        );
      } else {
        this.logger.log('No stale jobs detected - all systems operational');
      }
    } catch (error) {
      this.logger.error('Error checking for stale jobs:', error);
    }
  }

  /**
   * Log current queue statistics for monitoring
   */
  async logQueueStatistics(): Promise<void> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.transcriptionQueue.getWaitingCount(),
        this.transcriptionQueue.getActiveCount(),
        this.transcriptionQueue.getCompletedCount(),
        this.transcriptionQueue.getFailedCount(),
        this.transcriptionQueue.getDelayedCount(),
      ]);

      this.logger.log('Queue Statistics:');
      this.logger.log(`  - Waiting: ${waiting}`);
      this.logger.log(`  - Active: ${active}`);
      this.logger.log(`  - Completed: ${completed}`);
      this.logger.log(`  - Failed: ${failed}`);
      this.logger.log(`  - Delayed: ${delayed}`);
    } catch (error) {
      this.logger.error('Error logging queue statistics:', error);
    }
  }

  /**
   * Get queue health status for monitoring endpoints
   */
  async getQueueHealth(): Promise<{
    healthy: boolean;
    stats: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.transcriptionQueue.getWaitingCount(),
      this.transcriptionQueue.getActiveCount(),
      this.transcriptionQueue.getCompletedCount(),
      this.transcriptionQueue.getFailedCount(),
      this.transcriptionQueue.getDelayedCount(),
    ]);

    const stats = { waiting, active, completed, failed, delayed };

    // Consider queue unhealthy if there are too many failed jobs
    const healthy = failed < 100; // Threshold can be adjusted

    return { healthy, stats };
  }
}
