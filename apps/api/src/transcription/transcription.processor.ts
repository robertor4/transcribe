import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { 
  TranscriptionJob, 
  TranscriptionStatus,
  QUEUE_NAMES 
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
    const { transcriptionId, userId, fileUrl, context } = job.data;
    
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
      const transcriptText = await this.transcriptionService.transcribeAudioWithProgress(
        fileUrl,
        context,
        (progress: number, message: string) => {
          this.websocketGateway.sendTranscriptionProgress(userId, {
            transcriptionId,
            status: TranscriptionStatus.PROCESSING,
            progress,
            message,
          });
        }
      );
      
      // Update progress
      this.websocketGateway.sendTranscriptionProgress(userId, {
        transcriptionId,
        status: TranscriptionStatus.PROCESSING,
        progress: 60,
        message: 'Transcription complete, generating summary...',
      });

      // Generate summary
      const summary = await this.transcriptionService.generateSummary(transcriptText, context);
      
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

      // Update transcription document
      await this.firebaseService.updateTranscription(transcriptionId, {
        status: TranscriptionStatus.COMPLETED,
        transcriptText,
        summary,
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      // Send completion notification
      this.websocketGateway.sendTranscriptionComplete(userId, {
        transcriptionId,
        status: TranscriptionStatus.COMPLETED,
        progress: 100,
        message: 'Transcription completed successfully!',
      });

      this.logger.log(`Transcription job ${transcriptionId} completed successfully`);
    } catch (error) {
      this.logger.error(`Error processing transcription job ${transcriptionId}:`, error);
      
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