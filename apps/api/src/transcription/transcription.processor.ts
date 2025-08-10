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

@Processor(QUEUE_NAMES.TRANSCRIPTION)
export class TranscriptionProcessor {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private transcriptionService: TranscriptionService,
    private firebaseService: FirebaseService,
    private websocketGateway: WebSocketGateway,
  ) {}

  @Process('transcribe')
  async handleTranscription(job: Job<TranscriptionJob>) {
    const { transcriptionId, userId, fileUrl, analysisType, context } = job.data;

    this.logger.log(`Processing transcription job ${transcriptionId}`);

    try {
      // Update status to processing
      await this.firebaseService.updateTranscription(transcriptionId, {
        status: TranscriptionStatus.PROCESSING,
        updatedAt: new Date(),
      });

      // Send progress update
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 10,
        message: 'Starting transcription...',
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
      
      if (detectedLanguage) {
        this.logger.log(`Detected language for transcription ${transcriptionId}: ${detectedLanguage}`);
      }

      // Update progress
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 60,
        message: 'Transcription complete, generating summary...',
      });

      // Generate summary/analysis in the detected language
      const summary = await this.transcriptionService.generateSummary(
        transcriptText,
        analysisType,
        context,
        detectedLanguage,
      );

      // Update progress
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 90,
        message: 'Summary generated, saving results...',
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

      // Update transcription document with language information
      const updateData: any = {
        status: TranscriptionStatus.COMPLETED,
        transcriptText,
        summary,
        completedAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (detectedLanguage) {
        updateData.detectedLanguage = detectedLanguage;
        updateData.summaryLanguage = detectedLanguage;
      }
      
      await this.firebaseService.updateTranscription(transcriptionId, updateData);

      // Delete original uploaded file for security and privacy
      try {
        this.logger.log(
          `Deleting original audio file for transcription ${transcriptionId}`,
        );
        await this.firebaseService.deleteFile(fileUrl);
        this.logger.log(
          `Successfully deleted original audio file for transcription ${transcriptionId}`,
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

      this.logger.log(
        `Transcription job ${transcriptionId} completed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing transcription job ${transcriptionId}:`,
        error,
      );

      // Delete original uploaded file even on failure for security and privacy
      try {
        this.logger.log(
          `Deleting original audio file for failed transcription ${transcriptionId}`,
        );
        await this.firebaseService.deleteFile(fileUrl);
        this.logger.log(
          `Successfully deleted original audio file for failed transcription ${transcriptionId}`,
        );
      } catch (deleteError) {
        this.logger.warn(
          `Failed to delete original audio file for failed transcription ${transcriptionId}:`,
          deleteError,
        );
      }

      // Update status to failed
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
