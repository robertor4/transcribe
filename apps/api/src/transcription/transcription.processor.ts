import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import {
  TranscriptionJob,
  TranscriptionStatus,
  QUEUE_NAMES,
} from '@transcribe/shared';
import { TranscriptionService } from './transcription.service';
import { FirebaseService } from '../firebase/firebase.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { UsageService } from '../usage/usage.service';

@Processor(QUEUE_NAMES.TRANSCRIPTION)
export class TranscriptionProcessor {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private transcriptionService: TranscriptionService,
    private firebaseService: FirebaseService,
    private websocketGateway: WebSocketGateway,
    private emailService: EmailService,
    private userService: UserService,
    private usageService: UsageService,
  ) {
    const concurrency = parseInt(process.env.TRANSCRIPTION_CONCURRENCY || '2', 10);
    this.logger.log(
      `Transcription processor initialized with concurrency: ${concurrency} (${concurrency > 1 ? 'parallel' : 'sequential'} processing)`,
    );
  }

  @Process({
    name: 'transcribe',
    concurrency: parseInt(process.env.TRANSCRIPTION_CONCURRENCY || '2', 10),
  })
  async handleTranscription(job: Job<TranscriptionJob>) {
    const { transcriptionId, userId, fileUrl, analysisType, context } =
      job.data;

    const concurrency = parseInt(process.env.TRANSCRIPTION_CONCURRENCY || '2', 10);
    this.logger.log(
      `[Job ${job.id}] Processing transcription ${transcriptionId} (concurrency: ${concurrency})`,
    );

    try {
      // Update status to processing
      await this.firebaseService.updateTranscription(transcriptionId, {
        status: TranscriptionStatus.PROCESSING,
        updatedAt: new Date(),
      });

      // Send initial progress update
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 5,
        message: 'Initializing audio processing...',
        stage: 'processing',
      });

      // Small delay to show initialization
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 10,
        message: 'Starting transcription...',
        stage: 'processing',
      });

      // Transcribe audio (with progress updates handled internally for chunks)
      const transcriptionResult =
        await this.transcriptionService.transcribeAudioWithProgress(
          fileUrl,
          context,
          (progress: number, message: string) => {
            this.websocketGateway.sendTranscriptionProgress(userId, {
              transcriptionId,
              status: TranscriptionStatus.PROCESSING,
              progress,
              message,
            });
          },
        );

      const transcriptText = transcriptionResult.text;
      const detectedLanguage = transcriptionResult.language;
      const speakers = transcriptionResult.speakers;
      const speakerSegments = transcriptionResult.speakerSegments;
      const transcriptWithSpeakers = transcriptionResult.transcriptWithSpeakers;
      const speakerCount = transcriptionResult.speakerCount;
      const durationSeconds = transcriptionResult.durationSeconds || 0;

      if (detectedLanguage) {
        this.logger.log(
          `Detected language for transcription ${transcriptionId}: ${detectedLanguage}`,
        );
      }

      // Update progress for summarization phase
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 60,
        message: 'Transcription complete, generating core analyses...',
        stage: 'summarizing',
      });

      // Generate CORE analyses only (Summary, Action Items, Communication, Transcript)
      const coreAnalyses = await this.transcriptionService.generateCoreAnalyses(
        transcriptText,
        context,
        detectedLanguage,
      );

      // For backward compatibility, keep the summary field
      const summary = coreAnalyses.summary;

      // Extract title from the summary
      const extractedTitle =
        this.transcriptionService.extractTitleFromSummary(summary);
      if (extractedTitle) {
        this.logger.log(
          `Extracted title for transcription ${transcriptionId}: ${extractedTitle}`,
        );
      }

      // Update progress - finalizing
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 90,
        message: 'All analyses generated, saving results...',
        stage: 'summarizing',
      });

      // Small delay before final save
      await new Promise((resolve) => setTimeout(resolve, 300));

      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 95,
        message: 'Finalizing your transcription...',
        stage: 'summarizing',
      });

      // Save transcription results
      const transcriptUrl = await this.firebaseService.uploadText(
        transcriptText,
        `transcriptions/${userId}/${transcriptionId}/transcript.txt`,
      );

      const summaryUrl = await this.firebaseService.uploadText(
        summary,
        `transcriptions/${userId}/${transcriptionId}/summary.md`,
      );

      // Update transcription document with language and speaker information
      const updateData: any = {
        status: TranscriptionStatus.COMPLETED,
        transcriptText,
        summary, // Keep for backward compatibility
        coreAnalyses, // NEW: Store core analyses
        generatedAnalysisIds: [], // Initialize empty array for on-demand analyses
        duration: durationSeconds, // Audio duration in seconds
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      // Add the extracted title if available
      if (extractedTitle) {
        updateData.title = extractedTitle;
      }

      if (detectedLanguage) {
        updateData.detectedLanguage = detectedLanguage;
        updateData.summaryLanguage = detectedLanguage;
      }

      // Add speaker diarization data if available
      if (speakers && speakers.length > 0) {
        updateData.speakers = speakers;
        updateData.speakerSegments = speakerSegments;
        updateData.transcriptWithSpeakers = transcriptWithSpeakers;
        updateData.speakerCount = speakerCount;
        this.logger.log(
          `Added speaker diarization data: ${speakerCount} speakers identified`,
        );
      }

      await this.firebaseService.updateTranscription(
        transcriptionId,
        updateData,
      );

      // Track usage for billing and analytics
      try {
        await this.usageService.trackTranscription(
          userId,
          transcriptionId,
          durationSeconds,
        );
        this.logger.log(
          `Usage tracked for user ${userId}: ${(durationSeconds / 60).toFixed(2)} minutes`,
        );
      } catch (usageError) {
        // Log error but don't fail the transcription if usage tracking fails
        this.logger.error(
          `Failed to track usage for transcription ${transcriptionId}:`,
          usageError,
        );
      }

      // Delete original uploaded file for security and privacy
      try {
        this.logger.log(
          `Deleting original audio file for transcription ${transcriptionId}`,
        );

        // Get the transcription to check for storagePath
        const transcription = await this.firebaseService.getTranscription(
          userId,
          transcriptionId,
        );

        if (transcription?.storagePath) {
          await this.firebaseService.deleteFileByPath(
            transcription.storagePath,
          );
        } else {
          await this.firebaseService.deleteFile(fileUrl);
        }

        this.logger.log(
          `Successfully deleted original audio file for transcription ${transcriptionId}`,
        );

        // Clear file references after successful deletion to prevent double deletion
        await this.firebaseService.clearTranscriptionFileReferences(
          transcriptionId,
        );
      } catch (deleteError) {
        // Log but don't fail the entire job if file deletion fails
        this.logger.warn(
          `Failed to delete original audio file for transcription ${transcriptionId}:`,
          deleteError,
        );
      }

      // Send completion notification
      this.websocketGateway.sendTranscriptionComplete(userId, {
        transcriptionId,
        status: TranscriptionStatus.COMPLETED,
        progress: 100,
        message: 'Transcription completed successfully!',
      });

      // Send email notification
      try {
        const user = await this.userService.getUserProfile(userId);
        if (user) {
          const transcription = await this.firebaseService.getTranscription(
            userId,
            transcriptionId,
          );
          if (transcription) {
            await this.emailService.sendTranscriptionCompleteEmail(
              user,
              transcription,
            );
            this.logger.log(
              `Email notification sent to ${user.email} for transcription ${transcriptionId}`,
            );
          }
        }
      } catch (emailError) {
        // Don't fail the transcription if email fails
        this.logger.error(
          `Failed to send email notification for transcription ${transcriptionId}:`,
          emailError,
        );
      }

      this.logger.log(
        `[Job ${job.id}] Transcription ${transcriptionId} completed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Error processing transcription ${transcriptionId}:`,
        error,
      );

      // Delete original uploaded file even on failure for security and privacy
      try {
        this.logger.log(
          `Deleting original audio file for failed transcription ${transcriptionId}`,
        );

        // Get the transcription to check for storagePath
        const transcription = await this.firebaseService.getTranscription(
          userId,
          transcriptionId,
        );

        if (transcription?.storagePath) {
          await this.firebaseService.deleteFileByPath(
            transcription.storagePath,
          );
        } else {
          await this.firebaseService.deleteFile(fileUrl);
        }

        this.logger.log(
          `Successfully deleted original audio file for failed transcription ${transcriptionId}`,
        );

        // Clear file references after successful deletion to prevent double deletion
        await this.firebaseService.clearTranscriptionFileReferences(
          transcriptionId,
        );
      } catch (deleteError) {
        this.logger.warn(
          `Failed to delete original audio file for failed transcription ${transcriptionId}:`,
          deleteError,
        );
      }

      // Check if transcription was already completed before marking as failed
      // This prevents post-completion cleanup errors from marking successful transcriptions as failed
      const currentTranscription = await this.firebaseService.getTranscription(
        userId,
        transcriptionId,
      );

      if (currentTranscription?.status === TranscriptionStatus.COMPLETED) {
        this.logger.warn(
          `Transcription ${transcriptionId} already completed, not marking as failed due to post-completion error: ${error.message}`,
        );
        // Don't throw - the transcription actually succeeded
        return;
      }

      // Update status to failed only if it wasn't completed
      await this.firebaseService.updateTranscription(transcriptionId, {
        status: TranscriptionStatus.FAILED,
        error: error.message || 'Transcription failed',
        updatedAt: new Date(),
      });

      // Send error notification
      this.websocketGateway.sendTranscriptionFailed(userId, {
        transcriptionId,
        status: TranscriptionStatus.FAILED,
        progress: 0,
        error: error.message || 'Transcription failed',
      });

      throw error;
    }
  }
}
