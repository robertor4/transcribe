import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import {
  TranscriptionJob,
  TranscriptionStatus,
  QUEUE_NAMES,
} from '@transcribe/shared';
import { TranscriptionService } from './transcription.service';
import { OnDemandAnalysisService } from './on-demand-analysis.service';
import { StorageService } from '../firebase/services/storage.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { UsageService } from '../usage/usage.service';
import { VectorService } from '../vector/vector.service';

@Processor(QUEUE_NAMES.TRANSCRIPTION)
export class TranscriptionProcessor {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private transcriptionService: TranscriptionService,
    private onDemandAnalysisService: OnDemandAnalysisService,
    private storageService: StorageService,
    private transcriptionRepository: TranscriptionRepository,
    private websocketGateway: WebSocketGateway,
    private emailService: EmailService,
    private userService: UserService,
    private usageService: UsageService,
    private vectorService: VectorService,
  ) {
    const concurrency = parseInt(
      process.env.TRANSCRIPTION_CONCURRENCY || '2',
      10,
    );
    this.logger.log(
      `Transcription processor initialized with concurrency: ${concurrency} (${concurrency > 1 ? 'parallel' : 'sequential'} processing)`,
    );
  }

  @Process({
    name: 'transcribe',
    concurrency: parseInt(process.env.TRANSCRIPTION_CONCURRENCY || '2', 10),
  })
  async handleTranscription(job: Job<TranscriptionJob>) {
    const {
      transcriptionId,
      userId,
      fileUrl,
      // analysisType is kept in job.data for future use but currently unused
      context,
      selectedTemplates,
    } = job.data;

    const concurrency = parseInt(
      process.env.TRANSCRIPTION_CONCURRENCY || '2',
      10,
    );
    this.logger.log(
      `[Job ${job.id}] Processing transcription ${transcriptionId} (concurrency: ${concurrency})`,
    );

    try {
      // Update status to processing
      await this.transcriptionRepository.updateTranscription(transcriptionId, {
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
      // Note: transcriptWithSpeakers no longer stored - derived from speakerSegments on demand
      const speakerCount = transcriptionResult.speakerCount;
      const durationSeconds = transcriptionResult.durationSeconds || 0;

      if (detectedLanguage) {
        this.logger.log(
          `Detected language for transcription ${transcriptionId}: ${detectedLanguage}`,
        );
      }

      // V2: Parse template selection to determine which analyses to generate
      const analysisSelection =
        this.transcriptionService.parseTemplateSelection(selectedTemplates);

      // Update progress for summarization phase
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 60,
        message: 'Transcription complete, generating analyses...',
        stage: 'summarizing',
      });

      // V2 ARCHITECTURE: Generate summaryV2 directly, other analyses via templates
      // 1. Generate summaryV2 (always, stored on transcription doc for fast access)
      const summaryResult = analysisSelection.generateSummary
        ? await this.transcriptionService.generateSummaryV2Only(
            transcriptText,
            context,
            detectedLanguage,
          )
        : null;
      const summaryV2 = summaryResult?.summary ?? null;
      const conversationCategory = summaryResult?.conversationCategory;

      // 2. Generate actionItems and communicationStyles as GeneratedAnalysis docs
      const generatedAnalysisIds: string[] = [];

      if (analysisSelection.generateActionItems) {
        try {
          this.logger.log(
            `Generating actionItems analysis for transcription ${transcriptionId}`,
          );
          const actionItemsDoc =
            await this.onDemandAnalysisService.generateFromTemplate(
              transcriptionId,
              'actionItems',
              userId,
              undefined,
              { skipDuplicateCheck: true },
            );
          generatedAnalysisIds.push(actionItemsDoc.id);
          this.logger.log(`ActionItems analysis created: ${actionItemsDoc.id}`);
        } catch (err) {
          this.logger.error('Failed to generate actionItems analysis:', err);
          // Continue processing even if this fails
        }
      }

      if (analysisSelection.generateCommunicationStyles) {
        try {
          this.logger.log(
            `Generating communicationAnalysis for transcription ${transcriptionId}`,
          );
          const commDoc =
            await this.onDemandAnalysisService.generateFromTemplate(
              transcriptionId,
              'communicationAnalysis',
              userId,
              undefined,
              { skipDuplicateCheck: true },
            );
          generatedAnalysisIds.push(commDoc.id);
          this.logger.log(`CommunicationAnalysis created: ${commDoc.id}`);
        } catch (err) {
          this.logger.error('Failed to generate communicationAnalysis:', err);
          // Continue processing even if this fails
        }
      }

      // V2: Use title directly from summaryV2 (AI generates max 10 words)
      let finalTitle: string | undefined;
      if (summaryV2?.title) {
        finalTitle = summaryV2.title;
        this.logger.log(
          `Using summaryV2 title for transcription ${transcriptionId}: ${finalTitle}`,
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

      // Save transcription results (upload but URL not needed since we store text directly)
      await this.storageService.uploadText(
        transcriptText,
        `transcriptions/${userId}/${transcriptionId}/transcript.txt`,
      );

      // V2: No longer save markdown summary file (summaryV2 is stored as JSON on doc)

      // Update transcription document with language and speaker information
      // V2 ARCHITECTURE: summaryV2 stored directly on doc, other analyses in generatedAnalyses collection
      const updateData: any = {
        status: TranscriptionStatus.COMPLETED,
        transcriptText,
        summaryV2, // V2: Structured summary stored directly on doc for fast access
        generatedAnalysisIds, // V2: References to actionItems, communicationAnalysis, etc.
        duration: durationSeconds, // Audio duration in seconds
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      // Add the short title if available
      if (finalTitle) {
        updateData.title = finalTitle;
      }

      if (detectedLanguage) {
        updateData.detectedLanguage = detectedLanguage;
        updateData.summaryLanguage = detectedLanguage;
      }

      // Add AI-detected conversation category
      if (conversationCategory) {
        updateData.conversationCategory = conversationCategory;
        this.logger.log(
          `Conversation category detected: ${conversationCategory}`,
        );
      }

      // Add speaker diarization data if available
      if (speakers && speakers.length > 0) {
        updateData.speakers = speakers;
        updateData.speakerSegments = speakerSegments;
        // Note: transcriptWithSpeakers no longer stored - derived from speakerSegments on demand
        updateData.speakerCount = speakerCount;
        this.logger.log(
          `Added speaker diarization data: ${speakerCount} speakers identified`,
        );
      }

      await this.transcriptionRepository.updateTranscription(
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

      // Audio files are retained for 30 days for support/recovery purposes
      // Cleanup is handled by the scheduled 30-day cleanup job in cleanup.service.ts

      // Index for semantic search (non-blocking - fallback to keyword search if fails)
      try {
        const chunkCount = await this.vectorService.indexTranscription(
          userId,
          transcriptionId,
        );
        this.logger.log(
          `Indexed ${chunkCount} chunks for search (transcription ${transcriptionId})`,
        );
      } catch (indexError) {
        // Log but don't fail - keyword search fallback will work
        this.logger.warn(
          `Failed to index transcription ${transcriptionId} for search: ${indexError instanceof Error ? indexError.message : 'Unknown error'}`,
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
          const transcription =
            await this.transcriptionRepository.getTranscription(
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

      // Audio files are retained for 30 days even on failure for support/recovery purposes
      // Cleanup is handled by the scheduled 30-day cleanup job in cleanup.service.ts

      // Check if transcription was already completed before marking as failed
      // This prevents post-completion cleanup errors from marking successful transcriptions as failed
      const currentTranscription =
        await this.transcriptionRepository.getTranscription(
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
      await this.transcriptionRepository.updateTranscription(transcriptionId, {
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
