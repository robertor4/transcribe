import {
  Injectable,
  Logger,
  forwardRef,
  Inject,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import {
  Transcription,
  TranscriptionStatus,
  TranscriptionJob,
  QUEUE_NAMES,
  generateJobId,
  AnalysisType,
  Speaker,
  SpeakerSegment,
  ShareSettings,
  ShareEmailRequest,
  SharedTranscriptionView,
  ShareContentOptions,
} from '@transcribe/shared';
import * as prompts from './prompts';
import { FirebaseService } from '../firebase/firebase.service';
import { AudioSplitter, AudioChunk } from '../utils/audio-splitter';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { AssemblyAIService } from '../assembly-ai/assembly-ai.service';
import { EmailService } from '../email/email.service';

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
    @Inject(forwardRef(() => AssemblyAIService))
    private assemblyAIService: AssemblyAIService,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
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
  ): Promise<{
    text: string;
    language?: string;
    speakers?: Speaker[];
    speakerSegments?: SpeakerSegment[];
    transcriptWithSpeakers?: string;
    speakerCount?: number;
  }> {
    try {
      // Always use AssemblyAI as primary service for transcription and diarization
      // AssemblyAI handles files up to 5GB without chunking
      return await this.transcribeWithAssemblyAI(fileUrl, context, onProgress);
    } catch (error) {
      this.logger.warn(
        'AssemblyAI transcription failed, falling back to Whisper:',
        error,
      );

      if (onProgress) {
        onProgress(10, 'Using fallback transcription service...');
      }

      // Fallback to Whisper (without speaker diarization)
      // Whisper requires chunking for files > 25MB
      const result = await this.transcribeAudioWithWhisper(
        fileUrl,
        context,
        onProgress,
      );
      return {
        ...result,
        speakers: undefined,
        speakerSegments: undefined,
        transcriptWithSpeakers: undefined,
        speakerCount: undefined,
      };
    }
  }

  async transcribeWithAssemblyAI(
    fileUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<{
    text: string;
    language?: string;
    speakers?: Speaker[];
    speakerSegments?: SpeakerSegment[];
    transcriptWithSpeakers?: string;
    speakerCount?: number;
  }> {
    try {
      this.logger.log('Starting transcription with AssemblyAI...');

      if (onProgress) {
        onProgress(10, 'Uploading audio to AssemblyAI...');
      }

      // AssemblyAI needs a publicly accessible URL
      // Since our Firebase Storage URLs require auth, we need to create a temporary public URL
      const publicUrl = await this.firebaseService.getPublicUrl(fileUrl);

      if (onProgress) {
        onProgress(15, 'Audio uploaded successfully...');
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onProgress) {
        onProgress(
          20,
          'Starting transcription with automatic language detection...',
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onProgress) {
        onProgress(25, 'Initializing speaker diarization...');
      }

      // Use AssemblyAI for transcription with language detection and speaker diarization
      const result = await this.assemblyAIService.transcribeWithDiarization(
        publicUrl,
        context,
      );

      if (onProgress) {
        onProgress(50, 'Processing complete, analyzing speakers...');
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (onProgress) {
        onProgress(
          55,
          `Detected ${result.speakerCount || 0} speakers in the conversation...`,
        );
      }

      this.logger.log(
        `AssemblyAI transcription complete. Language: ${result.language}, Speakers: ${result.speakerCount}`,
      );

      return {
        text: result.text,
        language: result.language,
        speakers: result.speakers,
        speakerSegments: result.speakerSegments,
        transcriptWithSpeakers: result.transcriptWithSpeakers,
        speakerCount: result.speakerCount,
      };
    } catch (error) {
      this.logger.error('Error transcribing with AssemblyAI:', error);
      throw error;
    }
  }

  // Whisper fallback method with chunking support for files > 25MB
  async transcribeAudioWithWhisper(
    fileUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<{ text: string; language?: string }> {
    return this.transcribeAudio(fileUrl, context, onProgress);
  }

  // Legacy method - kept for backward compatibility
  // Contains the chunking logic for Whisper API
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
        this.logger.warn(
          'Could not extract file extension from URL, using .m4a',
        );
      }

      const tempFilePath = path.join(
        '/tmp',
        `audio_${Date.now()}${fileExtension}`,
      );
      fs.writeFileSync(tempFilePath, fileBuffer);

      // For backward compatibility, keep the chunking logic here
      // This method is now mainly used as a legacy fallback
      const stats = fs.statSync(tempFilePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      let transcriptText = '';
      let detectedLanguage: string | undefined;

      if (fileSizeInMB > 25) {
        this.logger.log(
          `File size ${fileSizeInMB}MB exceeds 25MB limit. Splitting audio...`,
        );

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
            onProgress(
              progress,
              `Processing chunk ${i + 1} of ${chunks.length}...`,
            );
          }

          this.logger.log(
            `Processing chunk ${i + 1}/${chunks.length}: ${chunk.path}`,
          );

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
        this.logger.log(
          `File size ${fileSizeInMB}MB is within limit. Processing directly...`,
        );

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
    // Use default model from config or GPT-4o
    const model = this.configService.get('GPT_MODEL_PREFERENCE') || 'gpt-4o';
    return this.generateSummaryWithModel(
      transcriptionText,
      analysisType,
      context,
      language,
      model,
    );
  }

  async generateSummaryWithModel(
    transcriptionText: string,
    analysisType?: AnalysisType,
    context?: string,
    language?: string,
    model?: string,
  ): Promise<string> {
    try {
      const languageInstruction = language
        ? `\n\nIMPORTANT: The transcription is in ${language}. Please generate the output in ${language} as well. Use appropriate formatting and conventions for ${language}.`
        : '';

      const systemPrompt = this.getSystemPromptForAnalysis(
        analysisType,
        languageInstruction,
      );
      const userPrompt = this.buildPromptForAnalysis(
        transcriptionText,
        analysisType,
        context,
        language,
      );

      // Use specified model or default to GPT-4o
      const selectedModel =
        model || this.configService.get('GPT_MODEL_PREFERENCE') || 'gpt-4o';

      this.logger.log(
        `Using model ${selectedModel} for ${analysisType || 'summary'} generation`,
      );

      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Reduced from 0.3 for more consistent output
        max_tokens: 8000, // Increased from 4000 for comprehensive analyses
        top_p: 0.95, // Added for better quality control
        frequency_penalty: 0.2, // Reduce repetition
        presence_penalty: 0.1, // Encourage diverse vocabulary
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      throw error;
    }
  }

  async generateAllAnalyses(
    transcriptionText: string,
    context?: string,
    language?: string,
  ): Promise<any> {
    try {
      this.logger.log('Generating all analyses in parallel...');

      // Determine if we should use high-quality mode based on env or transcript length
      const qualityMode = this.configService.get('QUALITY_MODE') || 'balanced';
      const useHighQuality =
        qualityMode === 'premium' || transcriptionText.length > 10000;

      // Generate all analyses in parallel for efficiency
      // Use generateSummaryWithModel for critical analyses with GPT-4o
      const analysisPromises = [
        // Primary summary - always use best model
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.SUMMARY,
          context,
          language,
          'gpt-4o', // Always use GPT-4o for main summary
        ).catch((err) => {
          this.logger.error('Summary generation failed:', err);
          return 'Summary generation failed. Please try again.';
        }),
        // Secondary analyses - use quality mode setting
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.COMMUNICATION_STYLES,
          context,
          language,
          useHighQuality ? 'gpt-4o' : 'gpt-4o-mini',
        ).catch((err) => {
          this.logger.error('Communication styles analysis failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.ACTION_ITEMS,
          context,
          language,
          useHighQuality ? 'gpt-4o' : 'gpt-4o-mini',
        ).catch((err) => {
          this.logger.error('Action items extraction failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.EMOTIONAL_INTELLIGENCE,
          context,
          language,
          useHighQuality ? 'gpt-4o' : 'gpt-4o-mini',
        ).catch((err) => {
          this.logger.error('Emotional intelligence analysis failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.INFLUENCE_PERSUASION,
          context,
          language,
          useHighQuality ? 'gpt-4o' : 'gpt-4o-mini',
        ).catch((err) => {
          this.logger.error('Influence/persuasion analysis failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.PERSONAL_DEVELOPMENT,
          context,
          language,
          useHighQuality ? 'gpt-4o' : 'gpt-4o-mini',
        ).catch((err) => {
          this.logger.error('Personal development analysis failed:', err);
          return null;
        }),
      ];

      const [
        summary,
        communicationStyles,
        actionItems,
        emotionalIntelligence,
        influencePersuasion,
        personalDevelopment,
      ] = await Promise.all(analysisPromises);

      this.logger.log(
        'All analyses completed (some may have failed individually)',
      );

      return {
        summary,
        communicationStyles,
        actionItems,
        emotionalIntelligence,
        influencePersuasion,
        personalDevelopment,
      };
    } catch (error) {
      this.logger.error('Critical error generating analyses:', error);
      // Return partial results if some analyses fail
      return {
        summary: 'Analysis generation failed. Please try again.',
        communicationStyles: null,
        actionItems: null,
        emotionalIntelligence: null,
        influencePersuasion: null,
        personalDevelopment: null,
      };
    }
  }

  private getSystemPromptForAnalysis(
    analysisType?: AnalysisType,
    languageInstruction?: string,
  ): string {
    const baseInstruction = `Important: Do NOT attempt to guess or identify specific individuals by name - instead use generic role descriptors and focus on behavioral patterns and communication styles.${languageInstruction || ''}`;
    const systemPrompt = prompts.getSystemPromptByType(
      analysisType || AnalysisType.SUMMARY,
    );
    return `${systemPrompt} ${baseInstruction}`;
  }

  private buildPromptForAnalysis(
    transcription: string,
    analysisType?: AnalysisType,
    context?: string,
    language?: string,
  ): string {
    return prompts.buildAnalysisPrompt(
      transcription,
      analysisType || AnalysisType.SUMMARY,
      context,
      language,
    );
  }

  async getTranscriptions(userId: string, page = 1, pageSize = 20) {
    return this.firebaseService.getTranscriptions(userId, page, pageSize);
  }

  async getTranscription(userId: string, transcriptionId: string) {
    return this.firebaseService.getTranscription(userId, transcriptionId);
  }

  extractTitleFromSummary(summary: string): string | null {
    try {
      // Extract the first H1 heading from the markdown summary
      // Match lines that start with a single # followed by space
      const headingMatch = summary.match(/^#\s+(.+)$/m);

      if (headingMatch && headingMatch[1]) {
        // Clean the title: remove any remaining markdown, trim whitespace
        let title = headingMatch[1]
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .replace(/`/g, '') // Remove code markdown
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
          .trim();

        // Limit title length to 200 characters
        if (title.length > 200) {
          title = title.substring(0, 197) + '...';
        }

        return title;
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting title from summary:', error);
      return null;
    }
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

    const updatedTranscription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
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

    const updatedComment = await this.firebaseService.getSummaryComment(
      transcriptionId,
      commentId,
    );

    // Notify via WebSocket
    if (updatedComment) {
      this.websocketGateway.notifyCommentUpdated(
        transcriptionId,
        updatedComment,
      );
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
    const comments =
      await this.firebaseService.getSummaryComments(transcriptionId);

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

  // Share-related methods
  private async generateShareToken(): Promise<string> {
    // Generate a 10-character URL-safe token using nanoid
    // With 10 characters from 64-char alphabet, we get ~60 bits of entropy
    // This gives us billions of possible combinations
    let token: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Keep generating until we find a unique token (collision check)
    do {
      token = nanoid(10); // Generates something like: "xK9mP2nQr3"
      attempts++;
      
      // Check if this token already exists
      const existing = await this.firebaseService.getTranscriptionByShareToken(token);
      if (!existing) {
        return token;
      }
      
      this.logger.warn(`Share token collision detected, regenerating (attempt ${attempts})`);
    } while (attempts < maxAttempts);
    
    // Fallback to longer token if we somehow can't generate a unique short one
    this.logger.error('Failed to generate unique short token, falling back to long token');
    return crypto.randomBytes(32).toString('hex');
  }

  async createShareLink(
    transcriptionId: string,
    userId: string,
    settings?: {
      expiresAt?: Date;
      maxViews?: number;
      password?: string;
      contentOptions?: ShareContentOptions;
    },
  ): Promise<{ shareToken: string; shareUrl: string }> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Generate unique share token
    const shareToken = await this.generateShareToken();

    // Create share settings - only include defined values
    const shareSettings: ShareSettings = {
      enabled: true,
    };

    // Only add optional fields if they have values
    if (settings?.expiresAt) {
      shareSettings.expiresAt = settings.expiresAt;
    }
    if (settings?.maxViews) {
      shareSettings.maxViews = settings.maxViews;
    }
    if (settings?.password) {
      shareSettings.password = settings.password;
    }
    if (settings?.contentOptions) {
      shareSettings.contentOptions = settings.contentOptions;
    } else {
      // Default to sharing everything for backward compatibility
      shareSettings.contentOptions = {
        includeTranscript: true,
        includeSummary: true,
        includeCommunicationStyles: true,
        includeActionItems: true,
        includeEmotionalIntelligence: true,
        includeInfluencePersuasion: true,
        includePersonalDevelopment: true,
        includeCustomAnalysis: true,
        includeSpeakerInfo: true,
      };
    }

    // Update transcription with share info
    await this.firebaseService.updateTranscription(transcriptionId, {
      shareToken,
      shareSettings,
      sharedAt: new Date(),
      updatedAt: new Date(),
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/s/${shareToken}`;

    this.logger.log(`Share link created for transcription ${transcriptionId}`);

    return { shareToken, shareUrl };
  }

  async revokeShareLink(
    transcriptionId: string,
    userId: string,
  ): Promise<void> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Remove share info - use special method to delete fields
    await this.firebaseService.deleteShareInfo(transcriptionId);

    this.logger.log(`Share link revoked for transcription ${transcriptionId}`);
  }

  async updateShareSettings(
    transcriptionId: string,
    userId: string,
    settings: {
      expiresAt?: Date;
      maxViews?: number;
      password?: string;
      contentOptions?: ShareContentOptions;
    },
  ): Promise<void> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    if (!transcription.shareSettings || !transcription.shareToken) {
      throw new BadRequestException(
        'No share link exists for this transcription',
      );
    }

    // Update share settings - maintain existing values and only update provided ones
    const updatedSettings: ShareSettings = {
      ...transcription.shareSettings,
    };

    // Only update fields that were explicitly provided
    if (settings.expiresAt !== undefined) {
      if (settings.expiresAt === null) {
        delete updatedSettings.expiresAt;
      } else {
        updatedSettings.expiresAt = settings.expiresAt;
      }
    }

    if (settings.maxViews !== undefined) {
      if (settings.maxViews === null) {
        delete updatedSettings.maxViews;
      } else {
        updatedSettings.maxViews = settings.maxViews;
      }
    }

    if (settings.password !== undefined) {
      if (settings.password === null) {
        delete updatedSettings.password;
      } else {
        updatedSettings.password = settings.password;
      }
    }

    if (settings.contentOptions !== undefined) {
      updatedSettings.contentOptions = settings.contentOptions;
    }

    await this.firebaseService.updateTranscription(transcriptionId, {
      shareSettings: updatedSettings,
      updatedAt: new Date(),
    });

    this.logger.log(
      `Share settings updated for transcription ${transcriptionId}`,
    );
  }

  async getSharedTranscription(
    shareToken: string,
    password?: string,
    incrementView: boolean = false,
  ): Promise<SharedTranscriptionView | null> {
    // Find transcription by share token
    const transcription =
      await this.firebaseService.getTranscriptionByShareToken(shareToken);

    if (!transcription || !transcription.shareSettings?.enabled) {
      return null;
    }

    const settings = transcription.shareSettings;

    // Check if link has expired
    if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) {
      this.logger.log(`Share link expired for token ${shareToken}`);
      return null;
    }

    // Check view count limit (use current count, not incremented)
    const currentViewCount = settings.viewCount || 0;
    if (settings.maxViews && currentViewCount >= settings.maxViews) {
      this.logger.log(`View limit reached for share token ${shareToken}`);
      return null;
    }

    // Check password if required
    if (settings.password && settings.password !== password) {
      throw new UnauthorizedException('Invalid password');
    }

    // Only increment view count if requested (to avoid multiple increments)
    let finalViewCount = currentViewCount;
    if (incrementView) {
      finalViewCount = currentViewCount + 1;
      const updatedSettings = {
        ...settings,
        viewCount: finalViewCount,
      };
      await this.firebaseService.updateTranscription(transcription.id, {
        shareSettings: updatedSettings,
      });
      this.logger.log(
        `Incremented view count for share token ${shareToken} to ${finalViewCount}`,
      );
    }

    // Get user display name for sharedBy field
    const user = await this.firebaseService.getUserById(transcription.userId);
    const sharedBy = user?.displayName || user?.email || 'Anonymous';

    // Get content options (default to all if not specified for backward compatibility)
    const contentOptions = settings.contentOptions || {
      includeTranscript: true,
      includeSummary: true,
      includeCommunicationStyles: true,
      includeActionItems: true,
      includeEmotionalIntelligence: true,
      includeInfluencePersuasion: true,
      includePersonalDevelopment: true,
      includeCustomAnalysis: true,
      includeSpeakerInfo: true,
    };

    // Filter analyses based on content options
    let filteredAnalyses: Partial<typeof transcription.analyses> = undefined;
    if (transcription.analyses) {
      filteredAnalyses = {};
      if (contentOptions.includeSummary && transcription.analyses.summary) {
        filteredAnalyses.summary = transcription.analyses.summary;
      }
      if (
        contentOptions.includeCommunicationStyles &&
        transcription.analyses.communicationStyles
      ) {
        filteredAnalyses.communicationStyles =
          transcription.analyses.communicationStyles;
      }
      if (
        contentOptions.includeActionItems &&
        transcription.analyses.actionItems
      ) {
        filteredAnalyses.actionItems = transcription.analyses.actionItems;
      }
      if (
        contentOptions.includeEmotionalIntelligence &&
        transcription.analyses.emotionalIntelligence
      ) {
        filteredAnalyses.emotionalIntelligence =
          transcription.analyses.emotionalIntelligence;
      }
      if (
        contentOptions.includeInfluencePersuasion &&
        transcription.analyses.influencePersuasion
      ) {
        filteredAnalyses.influencePersuasion =
          transcription.analyses.influencePersuasion;
      }
      if (
        contentOptions.includePersonalDevelopment &&
        transcription.analyses.personalDevelopment
      ) {
        filteredAnalyses.personalDevelopment =
          transcription.analyses.personalDevelopment;
      }
      if (
        contentOptions.includeCustomAnalysis &&
        transcription.analyses.custom
      ) {
        filteredAnalyses.custom = transcription.analyses.custom;
      }
    }

    // Return sanitized view without sensitive data
    const sharedView: SharedTranscriptionView = {
      id: transcription.id,
      fileName: transcription.fileName,
      title: transcription.title,
      transcriptText: contentOptions.includeTranscript
        ? transcription.transcriptText
        : undefined,
      analyses: filteredAnalyses,
      speakerSegments: contentOptions.includeSpeakerInfo
        ? transcription.speakerSegments
        : undefined,
      speakers: contentOptions.includeSpeakerInfo
        ? transcription.speakers
        : undefined,
      createdAt: transcription.createdAt,
      sharedBy,
      viewCount: finalViewCount,
      contentOptions,
    };

    return sharedView;
  }

  async sendShareEmail(
    transcriptionId: string,
    userId: string,
    emailRequest: ShareEmailRequest,
  ): Promise<boolean> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Ensure share link exists
    if (!transcription.shareToken) {
      // Create share link if it doesn't exist
      const { shareToken } = await this.createShareLink(
        transcriptionId,
        userId,
        {},
      );
      transcription.shareToken = shareToken;
    }

    // Get user info for sender name
    const user = await this.firebaseService.getUserById(userId);
    const senderName =
      emailRequest.senderName || user?.displayName || user?.email || 'Someone';

    // Send email
    const success = await this.emailService.sendShareEmail(
      transcription.shareToken,
      transcription.title || transcription.fileName,
      {
        ...emailRequest,
        senderName,
      },
      'en', // TODO: Get user's preferred language
    );

    if (success) {
      this.logger.log(
        `Share email sent for transcription ${transcriptionId} to ${emailRequest.recipientEmail}`,
      );
    }

    return success;
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
      const languageInstruction = language
        ? `\n\nIMPORTANT: The transcription is in ${language}. Please generate the summary in ${language} as well. Use appropriate formatting and conventions for ${language}.`
        : '';

      const baseSystemPrompt = this.getSystemPromptForAnalysis(
        analysisType,
        languageInstruction,
      );
      const systemPrompt = `${baseSystemPrompt}\n\nYou are being asked to regenerate the analysis based on user feedback and comments. Pay special attention to the user's comments and incorporate their feedback to improve the output.`;

      const userPrompt = this.buildSummaryPromptWithFeedback(
        transcriptionText,
        analysisType,
        context,
        comments,
        instructions,
        language,
      );

      // Use GPT-4o for maximum quality (configurable via env)
      const model = this.configService.get('GPT_MODEL_PREFERENCE') || 'gpt-4o';

      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Reduced from 0.3 for more consistent output
        max_tokens: 8000, // Increased from 4000 for comprehensive analyses
        top_p: 0.95, // Added for better quality control
        frequency_penalty: 0.2, // Reduce repetition
        presence_penalty: 0.1, // Encourage diverse vocabulary
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
    const languageInstructions = language
      ? `\n\nIMPORTANT: Generate the output in ${language}.`
      : '';

    const analysisTypeName =
      analysisType === AnalysisType.CUSTOM
        ? 'custom analysis'
        : analysisType === AnalysisType.COMMUNICATION_STYLES
          ? 'communication styles analysis'
          : analysisType === AnalysisType.ACTION_ITEMS
            ? 'action items extraction'
            : analysisType === AnalysisType.EMOTIONAL_INTELLIGENCE
              ? 'emotional intelligence analysis'
              : analysisType === AnalysisType.INFLUENCE_PERSUASION
                ? 'influence and persuasion analysis'
                : analysisType === AnalysisType.PERSONAL_DEVELOPMENT
                  ? 'personal development analysis'
                  : 'summary';

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
