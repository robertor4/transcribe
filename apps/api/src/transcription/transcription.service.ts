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
  Speaker,
  SpeakerSegment,
} from '@transcribe/shared';
import * as prompts from '../../../../cli/prompts';
import { FirebaseService } from '../firebase/firebase.service';
import { AudioSplitter, AudioChunk } from '../utils/audio-splitter';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { GoogleSpeechService, GoogleSpeechResult } from '../google-speech/google-speech.service';
import { AssemblyAIService, AssemblyAIResult } from '../assembly-ai/assembly-ai.service';

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
    @Inject(forwardRef(() => GoogleSpeechService))
    private googleSpeechService: GoogleSpeechService,
    @Inject(forwardRef(() => AssemblyAIService))
    private assemblyAIService: AssemblyAIService,
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
    // Check which service to use for speaker diarization
    const useAssemblyAI = this.configService.get('USE_ASSEMBLYAI') === 'true';
    const useGoogleSpeech = !useAssemblyAI && this.configService.get('USE_GOOGLE_SPEECH') === 'true';
    
    if (useAssemblyAI) {
      return this.transcribeWithAssemblyAI(fileUrl, context, onProgress);
    } else if (useGoogleSpeech) {
      return this.transcribeWithGoogleSpeech(fileUrl, context, onProgress);
    } else {
      return this.transcribeAudio(fileUrl, context, onProgress);
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
        onProgress(20, 'Starting transcription with automatic language detection and speaker diarization...');
      }

      // Use AssemblyAI for transcription with language detection and speaker diarization
      const result = await this.assemblyAIService.transcribeWithDiarization(
        publicUrl,
        context,
      );

      if (onProgress) {
        onProgress(70, `Transcription complete. Detected language: ${result.language || 'unknown'}`);
      }

      this.logger.log(`AssemblyAI transcription complete. Language: ${result.language}, Speakers: ${result.speakerCount}`);

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

  async transcribeWithGoogleSpeech(
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
      // Download file from Firebase Storage
      const fileBuffer = await this.firebaseService.downloadFile(fileUrl);
      
      // Extract file extension from URL
      let fileExtension = '.m4a'; // default
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

      if (onProgress) {
        onProgress(10, 'Converting audio to optimal format for speech recognition...');
      }

      // Process with Google Speech - will handle chunking if needed
      let result: any;
      
      if (onProgress) {
        onProgress(20, 'Preparing audio for speaker diarization...');
      }

      // Use splitForGoogleSpeech which handles both conversion and chunking
      const chunks = await this.audioSplitter.splitForGoogleSpeech(tempFilePath);
      
      if (chunks.length === 1) {
        // File can be processed as a single chunk
        if (onProgress) {
          onProgress(30, 'Processing complete audio with speaker diarization...');
        }
        
        // Upload to GCS for processing
        const chunkBuffer = fs.readFileSync(chunks[0].path);
        const gcsPath = `speech-chunks/${Date.now()}_full_audio.flac`;
        const gcsUrl = await this.firebaseService.uploadFile(
          chunkBuffer,
          gcsPath,
          'audio/flac',
        );
        
        // Convert to GCS URI
        const bucketName = this.configService.get('FIREBASE_STORAGE_BUCKET');
        const gcsUri = `gs://${bucketName}/${gcsPath}`;
        
        this.logger.log(`Uploaded full audio to GCS: ${gcsUri}`);
        
        result = await this.googleSpeechService.transcribeWithDiarization(
          chunks[0].path,
          context,
          undefined,
          gcsUri,
        );
        
        // Clean up GCS file
        try {
          await this.firebaseService.deleteFile(gcsUrl);
        } catch (e) {
          this.logger.warn(`Failed to delete GCS file: ${e}`);
        }
        
        // Clean up if we created a converted file
        if (chunks[0].path !== tempFilePath) {
          fs.unlinkSync(chunks[0].path);
        }
      } else {
        // File was split into multiple chunks
        this.logger.log(`Processing ${chunks.length} chunks for Google Speech...`);
        
        if (onProgress) {
          onProgress(25, `Audio split into ${chunks.length} chunks (10 min each) for processing...`);
        }

        const results: GoogleSpeechResult[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
          if (onProgress) {
            const progress = 30 + (i / chunks.length) * 40;
            onProgress(progress, `Processing chunk ${i + 1} of ${chunks.length} with speaker diarization...`);
          }
          
          try {
            // Upload chunk to Firebase Storage for GCS URI
            const chunkBuffer = fs.readFileSync(chunks[i].path);
            const gcsPath = `speech-chunks/${Date.now()}_chunk_${i + 1}.flac`;
            const gcsUrl = await this.firebaseService.uploadFile(
              chunkBuffer,
              gcsPath,
              'audio/flac',
            );
            
            // Convert Firebase Storage URL to GCS URI format
            // Firebase URL: https://firebasestorage.googleapis.com/v0/b/bucket/o/path
            // GCS URI: gs://bucket/path
            const bucketName = this.configService.get('FIREBASE_STORAGE_BUCKET');
            const gcsUri = `gs://${bucketName}/${gcsPath}`;
            
            this.logger.log(`Uploaded chunk ${i + 1} to GCS: ${gcsUri}`);
            
            const chunkResult = await this.googleSpeechService.transcribeWithDiarization(
              chunks[i].path,
              context,
              undefined, // language code
              gcsUri,
            );
            
            // Clean up GCS file after processing
            try {
              await this.firebaseService.deleteFile(gcsUrl);
            } catch (e) {
              this.logger.warn(`Failed to delete GCS chunk: ${e}`);
            }
            
            results.push(chunkResult);
          } catch (error) {
            this.logger.error(`Error processing chunk ${i + 1} with Google Speech:`, error);
            this.logger.log(`Falling back to Whisper for chunk ${i + 1}`);
            
            // Fall back to Whisper API for this chunk
            try {
              const whisperResponse: any = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(chunks[i].path) as any,
                model: 'whisper-1',
                prompt: context,
                response_format: 'verbose_json',
              });
              
              // Create a result with just the transcript (no speaker info)
              results.push({
                text: whisperResponse.text,
                language: whisperResponse.language,
                speakers: [],
                speakerSegments: [],
                transcriptWithSpeakers: '',
                speakerCount: 0,
              });
            } catch (whisperError) {
              this.logger.error(`Whisper also failed for chunk ${i + 1}:`, whisperError);
              // Last resort: empty result for this chunk
              results.push({
                text: '',
                speakers: [],
                speakerSegments: [],
                transcriptWithSpeakers: '',
                speakerCount: 0,
              });
            }
          }
          
          // Clean up chunk
          try {
            fs.unlinkSync(chunks[i].path);
          } catch (e) {
            this.logger.warn(`Failed to delete chunk ${chunks[i].path}`);
          }
        }
        
        // Merge results
        result = this.mergeGoogleSpeechResults(results);
      }

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      if (onProgress) {
        onProgress(70, 'Speaker identification complete');
      }

      return {
        text: result.text,
        language: result.language,
        speakers: result.speakers,
        speakerSegments: result.speakerSegments,
        transcriptWithSpeakers: result.transcriptWithSpeakers,
        speakerCount: result.speakerCount,
      };
    } catch (error) {
      this.logger.error('Error transcribing with Google Speech:', error);
      throw error;
    }
  }

  private mergeGoogleSpeechResults(results: any[]): any {
    if (results.length === 0) {
      return {
        text: '',
        speakers: [],
        speakerSegments: [],
        transcriptWithSpeakers: '',
        speakerCount: 0,
      };
    }

    // Merge text
    const fullText = results.map(r => r.text).join(' ');
    
    // Merge speaker segments with time offset adjustment
    let timeOffset = 0;
    const allSegments: SpeakerSegment[] = [];
    
    for (const result of results) {
      for (const segment of result.speakerSegments || []) {
        allSegments.push({
          ...segment,
          startTime: segment.startTime + timeOffset,
          endTime: segment.endTime + timeOffset,
        });
      }
      // Assume each chunk adds to the total time
      if (result.speakerSegments && result.speakerSegments.length > 0) {
        const lastSegment = result.speakerSegments[result.speakerSegments.length - 1];
        timeOffset += lastSegment.endTime;
      }
    }

    // Recalculate speaker statistics from merged segments
    const speakerMap = new Map<string, Speaker>();
    
    for (const segment of allSegments) {
      if (!speakerMap.has(segment.speakerTag)) {
        speakerMap.set(segment.speakerTag, {
          speakerId: parseInt(segment.speakerTag.replace('Speaker ', '')),
          speakerTag: segment.speakerTag,
          totalSpeakingTime: 0,
          wordCount: 0,
          firstAppearance: segment.startTime,
        });
      }
      
      const speaker = speakerMap.get(segment.speakerTag)!;
      speaker.totalSpeakingTime += segment.endTime - segment.startTime;
      speaker.wordCount += segment.text.split(' ').length;
    }

    const speakers = Array.from(speakerMap.values());
    const transcriptWithSpeakers = allSegments
      .map(s => `[${s.speakerTag}]: ${s.text}`)
      .join('\n\n');

    return {
      text: fullText,
      language: results[0].language,
      speakers,
      speakerSegments: allSegments,
      transcriptWithSpeakers,
      speakerCount: speakers.length,
    };
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

  async generateAllAnalyses(
    transcriptionText: string,
    context?: string,
    language?: string,
  ): Promise<any> {
    try {
      this.logger.log('Generating all analyses in parallel...');
      
      // Generate all analyses in parallel for efficiency
      const analysisPromises = [
        this.generateSummary(transcriptionText, AnalysisType.SUMMARY, context, language)
          .catch(err => {
            this.logger.error('Summary generation failed:', err);
            return 'Summary generation failed. Please try again.';
          }),
        this.generateSummary(transcriptionText, AnalysisType.COMMUNICATION_STYLES, context, language)
          .catch(err => {
            this.logger.error('Communication styles analysis failed:', err);
            return null;
          }),
        this.generateSummary(transcriptionText, AnalysisType.ACTION_ITEMS, context, language)
          .catch(err => {
            this.logger.error('Action items extraction failed:', err);
            return null;
          }),
        this.generateSummary(transcriptionText, AnalysisType.EMOTIONAL_INTELLIGENCE, context, language)
          .catch(err => {
            this.logger.error('Emotional intelligence analysis failed:', err);
            return null;
          }),
        this.generateSummary(transcriptionText, AnalysisType.INFLUENCE_PERSUASION, context, language)
          .catch(err => {
            this.logger.error('Influence/persuasion analysis failed:', err);
            return null;
          }),
        this.generateSummary(transcriptionText, AnalysisType.PERSONAL_DEVELOPMENT, context, language)
          .catch(err => {
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
        personalDevelopment
      ] = await Promise.all(analysisPromises);

      this.logger.log('All analyses completed (some may have failed individually)');

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