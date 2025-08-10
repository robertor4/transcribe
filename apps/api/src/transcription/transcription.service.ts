import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import {
  Transcription,
  TranscriptionStatus,
  TranscriptionJob,
  QUEUE_NAMES,
  generateJobId,
  AnalysisType,
} from '@transcribe/shared';
import * as prompts from '../../../../cli/prompts';
import { FirebaseService } from '../firebase/firebase.service';
import { AudioSplitter, AudioChunk } from '../utils/audio-splitter';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private openai: OpenAI;
  private audioSplitter: AudioSplitter;

  constructor(
    @InjectQueue(QUEUE_NAMES.TRANSCRIPTION) private transcriptionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SUMMARY) private summaryQueue: Queue,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.audioSplitter = new AudioSplitter();
  }

  async createTranscription(
    userId: string,
    file: Express.Multer.File,
    analysisType?: AnalysisType,
    context?: string,
    contextId?: string,
  ): Promise<Transcription> {
    this.logger.log(
      `Creating transcription for user ${userId}, file: ${file.originalname}`,
    );

    // Upload file to Firebase Storage
    const fileUrl = await this.firebaseService.uploadFile(
      file.buffer,
      `audio/${userId}/${Date.now()}_${file.originalname}`,
      file.mimetype,
    );

    // Create transcription document
    const transcription: Omit<Transcription, 'id'> = {
      userId,
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: TranscriptionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add optional fields if they have values
    if (analysisType) {
      transcription.analysisType = analysisType;
    }
    if (context) {
      transcription.context = context;
    }
    if (contextId) {
      transcription.contextId = contextId;
    }

    const transcriptionId =
      await this.firebaseService.createTranscription(transcription);

    // Create job and add to queue
    const job: TranscriptionJob = {
      id: generateJobId(),
      transcriptionId,
      userId,
      fileUrl,
      analysisType,
      context,
      priority: 1,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };

    await this.transcriptionQueue.add('transcribe', job, {
      priority: job.priority,
      attempts: job.maxRetries,
    });

    return { ...transcription, id: transcriptionId };
  }

  async transcribeAudioWithProgress(
    fileUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<{ text: string; language?: string }> {
    return this.transcribeAudio(fileUrl, context, onProgress);
  }

  async transcribeAudio(
    fileUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<{ text: string; language?: string }> {
    try {
      // Download file from Firebase Storage
      const fileBuffer = await this.firebaseService.downloadFile(fileUrl);
      
      // Extract file extension from URL
      let fileExtension = '.m4a'; // default for compatibility
      try {
        const urlPath = new URL(fileUrl).pathname;
        const decodedPath = decodeURIComponent(urlPath);
        const match = decodedPath.match(/\.([^.]+)$/);
        if (match) {
          fileExtension = `.${match[1]}`;
          this.logger.log(`Detected file extension: ${fileExtension}`);
        }
      } catch (e) {
        this.logger.warn('Could not extract file extension from URL, using .m4a');
      }
      
      const tempFilePath = path.join('/tmp', `audio_${Date.now()}${fileExtension}`);
      fs.writeFileSync(tempFilePath, fileBuffer);

      // Check file size
      const stats = fs.statSync(tempFilePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      let transcriptText = '';
      let detectedLanguage: string | undefined;

      if (fileSizeInMB > 25) {
        this.logger.log(`File size ${fileSizeInMB}MB exceeds 25MB limit. Splitting audio...`);
        
        if (onProgress) {
          onProgress(15, 'Large file detected, splitting into chunks...');
        }

        // Split the audio file into chunks
        const chunks = await this.audioSplitter.splitAudioFile(tempFilePath);
        this.logger.log(`Split audio into ${chunks.length} chunks`);

        // Process each chunk
        const transcriptions: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          if (onProgress) {
            const progress = 20 + (i / chunks.length) * 30;
            onProgress(progress, `Processing chunk ${i + 1} of ${chunks.length}...`);
          }

          this.logger.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.path}`);
          
          // Transcribe chunk using Whisper API
          const response: any = await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(chunk.path) as any,
            model: 'whisper-1',
            prompt: context,
            response_format: 'verbose_json',
          });

          transcriptions.push(response.text);
          
          // Get language from first chunk
          if (i === 0 && response.language) {
            detectedLanguage = response.language;
            this.logger.log(`Detected language: ${detectedLanguage}`);
          }

          // Clean up chunk file
          fs.unlinkSync(chunk.path);
        }

        // Combine all transcriptions
        transcriptText = transcriptions.join(' ');
        this.logger.log(`Combined ${chunks.length} chunk transcriptions`);
      } else {
        this.logger.log(`File size ${fileSizeInMB}MB is within limit. Processing directly...`);
        
        if (onProgress) {
          onProgress(20, 'Processing audio file...');
        }

        // File is small enough to process directly
        const response: any = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath) as any,
          model: 'whisper-1',
          prompt: context,
          response_format: 'verbose_json',
        });

        transcriptText = response.text;
        detectedLanguage = response.language;
        
        if (detectedLanguage) {
          this.logger.log(`Detected language: ${detectedLanguage}`);
        }
      }

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      return { text: transcriptText, language: detectedLanguage };
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async generateSummary(
    transcriptionText: string,
    analysisType?: AnalysisType,
    context?: string,
    language?: string,
  ): Promise<string> {
    try {
      const languageInstruction = language ? 
        `\n\nIMPORTANT: The transcription is in ${language}. Please generate the output in ${language} as well. Use appropriate formatting and conventions for ${language}.` : 
        '';
      
      const systemPrompt = this.getSystemPromptForAnalysis(analysisType, languageInstruction);
      const userPrompt = this.buildPromptForAnalysis(transcriptionText, analysisType, context, language);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      throw error;
    }
  }

  private getSystemPromptForAnalysis(analysisType?: AnalysisType, languageInstruction?: string): string {
    const baseInstruction = `Important: Do NOT attempt to guess or identify specific individuals by name - instead use generic role descriptors and focus on behavioral patterns and communication styles.${languageInstruction || ''}`;
    const systemPrompt = prompts.getSystemPromptByType(analysisType || AnalysisType.SUMMARY);
    return `${systemPrompt} ${baseInstruction}`;
  }

  private buildPromptForAnalysis(
    transcription: string,
    analysisType?: AnalysisType,
    context?: string,
    language?: string,
  ): string {
    return prompts.buildAnalysisPrompt(transcription, analysisType || AnalysisType.SUMMARY, context, language);
  }

  async getTranscriptions(userId: string, page = 1, pageSize = 20) {
    return this.firebaseService.getTranscriptions(userId, page, pageSize);
  }

  async getTranscription(userId: string, transcriptionId: string) {
    return this.firebaseService.getTranscription(userId, transcriptionId);
  }

  async updateTitle(
    userId: string,
    transcriptionId: string,
    title: string,
  ): Promise<Transcription> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    // Update the title
    const updates = {
      title,
      updatedAt: new Date(),
    };

    await this.firebaseService.updateTranscription(transcriptionId, updates);

    const updatedTranscription = await this.firebaseService.getTranscription(userId, transcriptionId);
    if (!updatedTranscription) {
      throw new Error('Failed to retrieve updated transcription');
    }

    return updatedTranscription;
  }

  async deleteTranscription(userId: string, transcriptionId: string) {
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );

    if (transcription) {
      // Delete file from storage
      await this.firebaseService.deleteFile(transcription.fileUrl);

      // Delete transcription document
      await this.firebaseService.deleteTranscription(transcriptionId);
    }

    return { success: true };
  }

  // Summary Comment Methods
  async addSummaryComment(
    transcriptionId: string,
    userId: string,
    position: any,
    content: string,
  ): Promise<any> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    const commentData = {
      transcriptionId,
      userId,
      content,
      position,
      resolved: false,
    };
    
    const commentId = await this.firebaseService.addSummaryComment(
      transcriptionId,
      commentData,
    );
    
    // Fetch the complete comment object
    const comment = await this.firebaseService.getSummaryComment(
      transcriptionId,
      commentId,
    );
    
    // Notify via WebSocket
    if (comment) {
      this.websocketGateway.notifyCommentAdded(transcriptionId, comment);
    }

    return comment;
  }

  async getSummaryComments(
    transcriptionId: string,
    userId: string,
  ): Promise<any[]> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    return this.firebaseService.getSummaryComments(transcriptionId);
  }

  async updateSummaryComment(
    transcriptionId: string,
    commentId: string,
    userId: string,
    updates: any,
  ): Promise<any> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    // Verify user owns this comment
    const existingComment = await this.firebaseService.getSummaryComment(
      transcriptionId,
      commentId,
    );
    if (!existingComment || existingComment.userId !== userId) {
      throw new Error('Comment not found or access denied');
    }

    await this.firebaseService.updateSummaryComment(
      transcriptionId,
      commentId,
      updates,
    );

    const updatedComment = await this.firebaseService.getSummaryComment(transcriptionId, commentId);
    
    // Notify via WebSocket
    if (updatedComment) {
      this.websocketGateway.notifyCommentUpdated(transcriptionId, updatedComment);
    }

    return updatedComment;
  }

  async deleteSummaryComment(
    transcriptionId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    // Verify user owns this comment
    const commentToDelete = await this.firebaseService.getSummaryComment(
      transcriptionId,
      commentId,
    );
    if (!commentToDelete || commentToDelete.userId !== userId) {
      throw new Error('Comment not found or access denied');
    }

    await this.firebaseService.deleteSummaryComment(transcriptionId, commentId);
    
    // Notify via WebSocket
    this.websocketGateway.notifyCommentDeleted(transcriptionId, commentId);
  }

  async regenerateSummary(
    transcriptionId: string,
    userId: string,
    instructions?: string,
  ): Promise<any> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    if (!transcription.transcriptText) {
      throw new Error('No transcript available for this transcription');
    }

    // Get existing comments for this transcription
    const comments = await this.firebaseService.getSummaryComments(
      transcriptionId,
    );

    // Generate new summary with feedback in the same language
    const newSummary = await this.generateSummaryWithFeedback(
      transcription.transcriptText,
      transcription.analysisType,
      transcription.context,
      comments,
      instructions,
      transcription.detectedLanguage,
    );

    // Update transcription with new summary and increment version
    const updates = {
      summary: newSummary,
      summaryVersion: (transcription.summaryVersion || 1) + 1,
      updatedAt: new Date(),
    };

    await this.firebaseService.updateTranscription(transcriptionId, updates);

    return this.firebaseService.getTranscription(userId, transcriptionId);
  }

  async generateSummaryWithFeedback(
    transcriptionText: string,
    analysisType?: AnalysisType,
    context?: string,
    comments: any[] = [],
    instructions?: string,
    language?: string,
  ): Promise<string> {
    try {
      const languageInstruction = language ? 
        `\n\nIMPORTANT: The transcription is in ${language}. Please generate the summary in ${language} as well. Use appropriate formatting and conventions for ${language}.` : 
        '';
      
      const baseSystemPrompt = this.getSystemPromptForAnalysis(analysisType, languageInstruction);
      const systemPrompt = `${baseSystemPrompt}\n\nYou are being asked to regenerate the analysis based on user feedback and comments. Pay special attention to the user's comments and incorporate their feedback to improve the output.`;

      const userPrompt = this.buildSummaryPromptWithFeedback(
        transcriptionText,
        analysisType,
        context,
        comments,
        instructions,
        language,
      );

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating summary with feedback:', error);
      throw error;
    }
  }

  private buildSummaryPromptWithFeedback(
    transcription: string,
    analysisType?: AnalysisType,
    context?: string,
    comments: any[] = [],
    instructions?: string,
    language?: string,
  ): string {
    // Language-specific instructions
    const languageInstructions = language ? 
      `\n\nIMPORTANT: Generate the output in ${language}.` : '';
    
    const analysisTypeName = analysisType === AnalysisType.CUSTOM ? 'custom analysis' : 
                           analysisType === AnalysisType.COMMUNICATION_STYLES ? 'communication styles analysis' :
                           analysisType === AnalysisType.ACTION_ITEMS ? 'action items extraction' :
                           analysisType === AnalysisType.EMOTIONAL_INTELLIGENCE ? 'emotional intelligence analysis' :
                           analysisType === AnalysisType.INFLUENCE_PERSUASION ? 'influence and persuasion analysis' :
                           analysisType === AnalysisType.PERSONAL_DEVELOPMENT ? 'personal development analysis' :
                           'summary';
    
    let prompt = `Please regenerate the ${analysisTypeName} for this conversation transcript, taking into account the user feedback provided below.${languageInstructions}

## User Feedback and Comments:
`;

    if (comments.length > 0) {
      comments.forEach((comment, index) => {
        prompt += `
**Comment ${index + 1}** (Section: ${comment.position?.section || 'General'}):
${comment.content}
`;
      });
    } else {
      prompt += 'No specific comments provided.\n';
    }

    if (instructions) {
      prompt += `
## Additional Instructions:
${instructions}
`;
    }

    prompt += `
## Requirements:
Please create a comprehensive ${analysisTypeName}, addressing the feedback above.

${context ? `## Context:\n${context}\n\n` : ''}

---
TRANSCRIPT:
${transcription}`;

    return prompt;
  }
}