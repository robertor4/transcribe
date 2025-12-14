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
  BatchUploadResponse,
  SUPPORTED_LANGUAGES,
  GeneratedAnalysis,
  SummaryV2,
} from '@transcribe/shared';
import * as prompts from './prompts';
import { parseSummaryV2, summaryV2ToMarkdown } from './parsers/summary-parser';
import { FirebaseService } from '../firebase/firebase.service';
import { AudioSplitter, AudioChunk } from '../utils/audio-splitter';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { AssemblyAIService } from '../assembly-ai/assembly-ai.service';
import { EmailService } from '../email/email.service';
import { UsageService } from '../usage/usage.service';
import {
  TranscriptCorrectionRouterService,
  RoutingPlan,
  ComplexCorrection,
} from './transcript-correction-router.service';

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
    @Inject(forwardRef(() => UsageService))
    private usageService: UsageService,
    private correctionRouter: TranscriptCorrectionRouterService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.audioSplitter = new AudioSplitter();
  }

  /**
   * V2: Parse selected templates into analysis selection flags.
   * Maps frontend template IDs to backend analysis types.
   *
   * Template mapping:
   * - 'transcribe-only' → summaryV2 only (no action items, no communication)
   * - 'email', 'blogPost', 'linkedinPost' → summaryV2 only (output format templates)
   * - 'actionItems' → generate ACTION_ITEMS analysis
   * - 'communicationAnalysis' → generate COMMUNICATION_STYLES analysis
   *
   * @param selectedTemplates Array of template IDs from frontend
   * @returns Object with flags for each analysis type
   */
  parseTemplateSelection(selectedTemplates?: string[]): {
    generateSummary: boolean;
    generateActionItems: boolean;
    generateCommunicationStyles: boolean;
  } {
    // Default behavior: generate all core analyses (backwards compatibility for old clients)
    if (!selectedTemplates || selectedTemplates.length === 0) {
      this.logger.log(
        'No selectedTemplates provided - generating all analyses (backwards compat)',
      );
      return {
        generateSummary: true,
        generateActionItems: true,
        generateCommunicationStyles: true,
      };
    }

    // V2: Check what templates are selected
    const hasActionItems = selectedTemplates.includes('actionItems');
    const hasCommunication = selectedTemplates.includes(
      'communicationAnalysis',
    );

    // Summary (summaryV2) is always generated when any template is selected
    // Action items and communication styles are ONLY generated when explicitly requested
    const result = {
      generateSummary: true, // Always generate summaryV2
      generateActionItems: hasActionItems,
      generateCommunicationStyles: hasCommunication,
    };

    this.logger.log(
      `Parsed template selection: ${JSON.stringify(selectedTemplates)} → ` +
        `summary=${result.generateSummary}, actionItems=${result.generateActionItems}, ` +
        `communication=${result.generateCommunicationStyles}`,
    );

    return result;
  }

  async createTranscription(
    userId: string,
    file: Express.Multer.File,
    analysisType?: AnalysisType,
    context?: string,
    contextId?: string,
    selectedTemplates?: string[], // V2: Template IDs to control which analyses are generated
  ): Promise<Transcription> {
    this.logger.log(
      `Creating transcription for user ${userId}, file: ${file.originalname}`,
    );

    // Upload file to Firebase Storage
    const uploadResult = await this.firebaseService.uploadFile(
      file.buffer,
      `audio/${userId}/${Date.now()}_${file.originalname}`,
      file.mimetype,
    );

    // Create transcription document
    const transcription: Omit<Transcription, 'id'> = {
      userId,
      fileName: file.originalname,
      fileUrl: uploadResult.url,
      storagePath: uploadResult.path,
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
    if (selectedTemplates?.length) {
      transcription.selectedTemplates = selectedTemplates;
    }

    const transcriptionId =
      await this.firebaseService.createTranscription(transcription);

    // Create job and add to queue
    const job: TranscriptionJob = {
      id: generateJobId(),
      transcriptionId,
      userId,
      fileUrl: uploadResult.url,
      analysisType,
      context,
      priority: 1,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      selectedTemplates, // V2: Pass template selection to processor
    };

    await this.transcriptionQueue.add('transcribe', job, {
      priority: job.priority,
      attempts: job.maxRetries,
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000, // Max 1000 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days (for debugging)
        count: 5000, // Max 5000 failed jobs
      },
    });

    return { ...transcription, id: transcriptionId };
  }

  async createBatchTranscription(
    userId: string,
    files: Express.Multer.File[],
    mergeFiles: boolean,
    analysisType?: AnalysisType,
    context?: string,
    contextId?: string,
  ): Promise<BatchUploadResponse> {
    this.logger.log(
      `Creating batch transcription for user ${userId}, ${files.length} files, merge: ${mergeFiles}`,
    );

    if (mergeFiles) {
      // Merge files and create single transcription
      const tempDir = path.join(process.cwd(), 'temp', userId);
      await fs.promises.mkdir(tempDir, { recursive: true });

      try {
        // Write files to temporary directory
        const tempFilePaths: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const tempPath = path.join(tempDir, `${i}_${file.originalname}`);
          await fs.promises.writeFile(tempPath, file.buffer);
          tempFilePaths.push(tempPath);
        }

        // Merge files
        const mergedFileName = `merged_${Date.now()}.mp3`;
        const mergedFilePath = path.join(tempDir, mergedFileName);
        await this.audioSplitter.mergeAudioFiles(tempFilePaths, mergedFilePath);

        // Read merged file
        const mergedBuffer = await fs.promises.readFile(mergedFilePath);
        const mergedStats = await fs.promises.stat(mergedFilePath);

        this.logger.log(
          `Merged file created: ${mergedFilePath}, size: ${mergedStats.size} bytes`,
        );

        // Upload merged file to Firebase
        const uploadResult = await this.firebaseService.uploadFile(
          mergedBuffer,
          `audio/${userId}/${Date.now()}_${mergedFileName}`,
          'audio/mpeg',
        );

        this.logger.log(
          `Merged file uploaded to Firebase: ${uploadResult.url}, path: ${uploadResult.path}`,
        );

        // Create transcription document
        const fileNames = files.map((f) => f.originalname).join(', ');
        const transcription: Omit<Transcription, 'id'> = {
          userId,
          fileName: `Merged: ${fileNames}`,
          fileUrl: uploadResult.url,
          storagePath: uploadResult.path,
          fileSize: mergedStats.size,
          mimeType: 'audio/mpeg',
          status: TranscriptionStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (analysisType) transcription.analysisType = analysisType;
        if (context) transcription.context = context;
        if (contextId) transcription.contextId = contextId;

        const transcriptionId =
          await this.firebaseService.createTranscription(transcription);

        // Create job and add to queue
        const job: TranscriptionJob = {
          id: generateJobId(),
          transcriptionId,
          userId,
          fileUrl: uploadResult.url,
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
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Max 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days (for debugging)
            count: 5000, // Max 5000 failed jobs
          },
        });

        // Clean up temporary files
        for (const tempPath of tempFilePaths) {
          await fs.promises
            .unlink(tempPath)
            .catch((err) =>
              this.logger.warn(`Failed to delete temp file ${tempPath}:`, err),
            );
        }
        await fs.promises
          .unlink(mergedFilePath)
          .catch((err) =>
            this.logger.warn(
              `Failed to delete merged file ${mergedFilePath}:`,
              err,
            ),
          );
        await fs.promises.rmdir(tempDir).catch(() => {
          // Ignore if directory is not empty
        });

        return {
          transcriptionIds: [transcriptionId],
          fileNames: [transcription.fileName],
          merged: true,
        };
      } catch (error) {
        // Clean up on error
        await fs.promises
          .rm(tempDir, { recursive: true, force: true })
          .catch((err) =>
            this.logger.warn(`Failed to cleanup temp directory:`, err),
          );
        throw error;
      }
    } else {
      // Process each file individually
      const transcriptionIds: string[] = [];
      const fileNames: string[] = [];

      for (const file of files) {
        const transcription = await this.createTranscription(
          userId,
          file,
          analysisType,
          context,
          contextId,
        );
        transcriptionIds.push(transcription.id);
        fileNames.push(file.originalname);
      }

      return {
        transcriptionIds,
        fileNames,
        merged: false,
      };
    }
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
    durationSeconds?: number;
  }> {
    try {
      // Always use AssemblyAI as primary service for transcription and diarization
      // AssemblyAI handles files up to 5GB without chunking
      return await this.transcribeWithAssemblyAI(fileUrl, context, onProgress);
    } catch (error) {
      this.logger.warn(
        'AssemblyAI transcription failed, falling back to OpenAI Whisper API:',
        error,
      );

      if (onProgress) {
        onProgress(
          10,
          'Using fallback transcription service (OpenAI Whisper)...',
        );
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
    durationSeconds?: number;
  }> {
    try {
      this.logger.log(
        'Starting transcription with AssemblyAI (speaker diarization + language detection)',
      );

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
      // Pass the progress callback so AssemblyAI can send updates during polling
      const result = await this.assemblyAIService.transcribeWithDiarization(
        publicUrl,
        context,
        onProgress,
      );

      if (onProgress) {
        onProgress(56, 'Processing complete, analyzing speakers...');
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (onProgress) {
        onProgress(
          58,
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
        durationSeconds: result.durationSeconds,
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
  ): Promise<{ text: string; language?: string; durationSeconds?: number }> {
    return this.transcribeAudio(fileUrl, context, onProgress);
  }

  // Legacy method - kept for backward compatibility
  // Contains the chunking logic for Whisper API
  async transcribeAudio(
    fileUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<{ text: string; language?: string; durationSeconds?: number }> {
    try {
      this.logger.log(
        'Starting transcription with OpenAI Whisper API (with auto-chunking for large files)',
      );

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
      let totalDuration: number | undefined;

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
        let accumulatedDuration = 0;
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

          // Accumulate duration from each chunk
          if (response.duration) {
            accumulatedDuration += response.duration;
          }

          // Clean up chunk file
          fs.unlinkSync(chunk.path);
        }

        // Combine all transcriptions
        transcriptText = transcriptions.join(' ');
        totalDuration =
          accumulatedDuration > 0 ? accumulatedDuration : undefined;
        this.logger.log(
          `Combined ${chunks.length} chunk transcriptions, total duration: ${totalDuration}s`,
        );
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
        totalDuration = response.duration;

        if (detectedLanguage) {
          this.logger.log(`Detected language: ${detectedLanguage}`);
        }
        if (totalDuration) {
          this.logger.log(`Audio duration from Whisper: ${totalDuration}s`);
        }
      }

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      return {
        text: transcriptText,
        language: detectedLanguage,
        durationSeconds: totalDuration,
      };
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
    // Use default model from config or GPT-5
    const model = this.configService.get('GPT_MODEL_PREFERENCE') || 'gpt-5';
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
    customSystemPrompt?: string, // NEW: For on-demand analysis templates
    customUserPrompt?: string, // NEW: For on-demand analysis templates
    outputFormat?: 'markdown' | 'structured', // V2: Output format for structured JSON
  ): Promise<string> {
    try {
      const languageInstruction = language
        ? `\n\nIMPORTANT: The transcription is in ${language}. Please generate the output in ${language} as well. Use appropriate formatting and conventions for ${language}.`
        : '';

      // Use custom prompts if provided, otherwise use analysisType prompts
      const systemPrompt =
        customSystemPrompt ||
        this.getSystemPromptForAnalysis(analysisType, languageInstruction);

      let userPrompt: string;
      if (customUserPrompt) {
        // When using custom prompt, we need to append the transcript
        // (buildAnalysisPrompt does this automatically, but custom prompts bypass it)
        let fullCustomPrompt = customUserPrompt;

        // Add context if provided
        if (context) {
          fullCustomPrompt = `## Context
The following context information is provided about this conversation:
${context}

Please use this context to better understand references, participants, technical terms, and the overall discussion.

---

${customUserPrompt}`;
        }

        // Add language instructions if specified
        if (language && language !== 'english') {
          fullCustomPrompt = `CRITICAL LANGUAGE REQUIREMENT:
- The transcription is in ${language}
- You MUST generate ALL output text in ${language}
- This includes ALL section headings, titles, labels, and content
- Only keep English for: proper nouns, company names, and technical terms without standard translations
- Use appropriate formatting and conventions for ${language}

${fullCustomPrompt}`;
        }

        userPrompt = `${fullCustomPrompt}\n\n---\nTRANSCRIPT:\n${transcriptionText}`;
      } else {
        userPrompt = this.buildPromptForAnalysis(
          transcriptionText,
          analysisType,
          context,
          language,
        );
      }

      // Use specified model or default to GPT-5
      const selectedModel =
        model || this.configService.get('GPT_MODEL_PREFERENCE') || 'gpt-5';

      this.logger.log(
        `Using model ${selectedModel} for ${analysisType || 'custom'} generation`,
      );

      // V2: Use JSON output format for structured outputs
      const useJsonFormat = outputFormat === 'structured';
      if (useJsonFormat) {
        this.logger.log('Using JSON output format for structured response');
      }

      const completion = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8000, // GPT-5 uses max_completion_tokens instead of max_tokens
        // GPT-5 only supports default temperature (1), so we remove custom temperature/top_p/penalties
        ...(useJsonFormat && { response_format: { type: 'json_object' as const } }),
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * V2: Generate structured JSON summary using the new V2 prompt and parser.
   * Returns a SummaryV2 object with structured data instead of markdown.
   */
  async generateSummaryV2(
    transcriptionText: string,
    context?: string,
    language?: string,
  ): Promise<SummaryV2> {
    try {
      this.logger.log('Generating V2 structured summary...');

      const systemPrompt = prompts.SUMMARIZATION_SYSTEM_PROMPT_V2;
      const userPrompt = prompts.buildSummaryPromptV2(
        transcriptionText,
        context,
        language,
      );

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5', // Always use GPT-5 for summaries
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8000,
      });

      const aiResponse = completion.choices[0].message.content || '';

      // Parse and validate the JSON response
      const summaryV2 = parseSummaryV2(aiResponse);

      this.logger.log(
        `V2 summary generated: ${summaryV2.keyPoints.length} key points, ${summaryV2.detailedSections.length} sections`,
      );

      return summaryV2;
    } catch (error) {
      this.logger.error('Error generating V2 summary:', error);
      throw error;
    }
  }

  /**
   * Generate V2 summary and also return markdown version for backwards compatibility.
   * Used during transition period.
   */
  async generateSummaryV2WithMarkdown(
    transcriptionText: string,
    context?: string,
    language?: string,
  ): Promise<{ summaryV2: SummaryV2; markdownSummary: string }> {
    const summaryV2 = await this.generateSummaryV2(
      transcriptionText,
      context,
      language,
    );

    // Convert to markdown for backwards compatibility
    const markdownSummary = summaryV2ToMarkdown(summaryV2);

    return { summaryV2, markdownSummary };
  }

  /**
   * DEPRECATED: Use generateCoreAnalyses() instead
   * Kept for backward compatibility
   */
  async generateAllAnalyses(
    transcriptionText: string,
    context?: string,
    language?: string,
  ): Promise<any> {
    try {
      // Determine if we should use high-quality mode based on env or transcript length
      const qualityMode = this.configService.get('QUALITY_MODE') || 'balanced';
      const useHighQuality =
        qualityMode === 'premium' || transcriptionText.length > 10000;

      this.logger.log(
        `Generating analyses using GPT-5 (summary) + ${useHighQuality ? 'GPT-5' : 'GPT-5-mini'} (secondary analyses) - Quality mode: ${qualityMode}`,
      );

      // Generate all analyses in parallel for efficiency
      // Use generateSummaryWithModel for critical analyses with GPT-5
      const analysisPromises = [
        // Primary summary - always use best model
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.SUMMARY,
          context,
          language,
          'gpt-5', // Always use GPT-5 for main summary
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
          useHighQuality ? 'gpt-5' : 'gpt-5-mini',
        ).catch((err) => {
          this.logger.error('Communication styles analysis failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.ACTION_ITEMS,
          context,
          language,
          useHighQuality ? 'gpt-5' : 'gpt-5-mini',
        ).catch((err) => {
          this.logger.error('Action items extraction failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.EMOTIONAL_INTELLIGENCE,
          context,
          language,
          useHighQuality ? 'gpt-5' : 'gpt-5-mini',
        ).catch((err) => {
          this.logger.error('Emotional intelligence analysis failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.INFLUENCE_PERSUASION,
          context,
          language,
          useHighQuality ? 'gpt-5' : 'gpt-5-mini',
        ).catch((err) => {
          this.logger.error('Influence/persuasion analysis failed:', err);
          return null;
        }),
        this.generateSummaryWithModel(
          transcriptionText,
          AnalysisType.PERSONAL_DEVELOPMENT,
          context,
          language,
          useHighQuality ? 'gpt-5' : 'gpt-5-mini',
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

  /**
   * NEW: Generate only core analyses (Summary, Action Items, Communication, Transcript)
   * This is the new default for the on-demand analysis system.
   *
   * V2 UPDATE: Now generates structured SummaryV2 JSON only (no markdown summary).
   * Respects template selection to only generate requested analyses.
   *
   * @param transcriptionText The transcript text to analyze
   * @param context Optional context to improve analysis quality
   * @param language Detected language of the transcript
   * @param selection Optional flags to control which analyses are generated (V2)
   */
  async generateCoreAnalyses(
    transcriptionText: string,
    context?: string,
    language?: string,
    selection?: {
      generateSummary: boolean;
      generateActionItems: boolean;
      generateCommunicationStyles: boolean;
    },
  ): Promise<{
    summary: string;
    summaryV2?: SummaryV2;
    actionItems: string;
    communicationStyles: string;
    transcript: string;
  }> {
    // Default to all analyses if no selection provided (backwards compatibility)
    const sel = selection ?? {
      generateSummary: true,
      generateActionItems: true,
      generateCommunicationStyles: true,
    };

    try {
      this.logger.log(
        `Generating core analyses: summary=${sel.generateSummary}, ` +
          `actionItems=${sel.generateActionItems}, communication=${sel.generateCommunicationStyles}`,
      );

      // Build promises array based on selection - only generate what's requested
      const analysisPromises: Promise<unknown>[] = [];
      let summaryIndex = -1;
      let actionItemsIndex = -1;
      let communicationIndex = -1;

      // V2 Summary - Structured JSON format with GPT-5
      if (sel.generateSummary) {
        summaryIndex = analysisPromises.length;
        analysisPromises.push(
          this.generateSummaryV2WithMarkdown(
            transcriptionText,
            context,
            language,
          ).catch((err) => {
            this.logger.error('V2 Summary generation failed:', err);
            return null;
          }),
        );
      }

      // Action Items - Use GPT-5-mini (only if requested)
      if (sel.generateActionItems) {
        actionItemsIndex = analysisPromises.length;
        analysisPromises.push(
          this.generateSummaryWithModel(
            transcriptionText,
            AnalysisType.ACTION_ITEMS,
            context,
            language,
            'gpt-5-mini',
          ).catch((err) => {
            this.logger.error('Action items generation failed:', err);
            return null;
          }),
        );
      }

      // Communication Styles - Use GPT-5-mini (only if requested)
      if (sel.generateCommunicationStyles) {
        communicationIndex = analysisPromises.length;
        analysisPromises.push(
          this.generateSummaryWithModel(
            transcriptionText,
            AnalysisType.COMMUNICATION_STYLES,
            context,
            language,
            'gpt-5-mini',
          ).catch((err) => {
            this.logger.error('Communication styles generation failed:', err);
            return null;
          }),
        );
      }

      const results = await Promise.all(analysisPromises);

      this.logger.log(
        `Core analyses completed (${analysisPromises.length} generated)`,
      );

      // Extract results based on indices
      const summaryData =
        summaryIndex >= 0
          ? (results[summaryIndex] as {
              summaryV2: SummaryV2;
              markdownSummary: string;
            } | null)
          : null;
      const actionItems =
        actionItemsIndex >= 0
          ? (results[actionItemsIndex] as string | null)
          : null;
      const communicationStyles =
        communicationIndex >= 0
          ? (results[communicationIndex] as string | null)
          : null;

      return {
        // V2: summary field is empty for new transcriptions (UI uses summaryV2)
        summary: '',
        summaryV2: summaryData?.summaryV2, // V2 structured data (undefined if not generated or failed)
        actionItems: actionItems || '',
        communicationStyles: communicationStyles || '',
        transcript: transcriptionText, // No AI needed - just the text
      };
    } catch (error) {
      this.logger.error('Critical error generating core analyses:', error);
      throw error;
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

  async generateShortTitle(fullTitle: string): Promise<string> {
    try {
      // Count words in the title
      const wordCount = fullTitle.trim().split(/\s+/).length;

      // If title is already 8 words or less, use as-is
      if (wordCount <= 8) {
        this.logger.log(
          `Title already concise (${wordCount} words), skipping API call`,
        );
        return fullTitle;
      }

      this.logger.log(
        `Generating short title for: "${fullTitle}" (${wordCount} words)`,
      );

      // Use gpt-5-mini for cost efficiency
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a title optimization expert. Create concise, scannable titles that preserve the core meaning. You MUST follow the word limit strictly.',
          },
          {
            role: 'user',
            content: `Shorten this heading to MAXIMUM 6 words while preserving the core meaning and language:\n\n"${fullTitle}"\n\nIMPORTANT: Your response must be 6 words or less. Return ONLY the shortened title, nothing else. Keep the same language as the original.`,
          },
        ],
        max_completion_tokens: 30,
      });

      const shortTitle =
        completion.choices[0].message.content?.trim() || fullTitle;

      // Verify the shortened title actually follows the word limit
      const shortTitleWordCount = shortTitle.trim().split(/\s+/).length;
      if (shortTitleWordCount > 8) {
        this.logger.warn(
          `AI-generated title still too long (${shortTitleWordCount} words), applying fallback`,
        );
        // Use fallback if AI didn't follow instructions
        const words = fullTitle.trim().split(/\s+/);
        return words.slice(0, 6).join(' ') + '...';
      }

      this.logger.log(`Short title generated: "${shortTitle}"`);

      return shortTitle;
    } catch (error) {
      this.logger.error('Error generating short title, using fallback:', error);

      // Fallback: Take first 6 words and add ellipsis if truncated
      const words = fullTitle.trim().split(/\s+/);
      if (words.length > 6) {
        return words.slice(0, 6).join(' ') + '...';
      }
      return fullTitle;
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

  /**
   * Move a transcription to a folder (or remove from folder with null)
   */
  async moveToFolder(
    userId: string,
    transcriptionId: string,
    folderId: string | null,
  ): Promise<void> {
    await this.firebaseService.moveToFolder(userId, transcriptionId, folderId);
  }

  async deleteTranscription(userId: string, transcriptionId: string) {
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );

    if (transcription) {
      // Delete file from storage if it exists and hasn't been deleted already
      try {
        if (transcription.storagePath) {
          // Use the storage path for reliable deletion (new transcriptions)
          await this.firebaseService.deleteFileByPath(
            transcription.storagePath,
          );
          this.logger.log(
            `Deleted file via storage path for transcription ${transcriptionId}`,
          );
        } else if (transcription.fileUrl) {
          // Fallback to URL-based deletion for older transcriptions
          await this.firebaseService.deleteFile(transcription.fileUrl);
          this.logger.log(
            `Deleted file via URL for transcription ${transcriptionId}`,
          );
        } else {
          // File already deleted (e.g., after processing)
          this.logger.log(
            `No file to delete for transcription ${transcriptionId} - already cleaned up`,
          );
        }
      } catch (error) {
        // Log but don't fail the deletion if file is already gone
        this.logger.warn(
          `File deletion failed for transcription ${transcriptionId}, continuing with document deletion`,
        );
      }

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
      const existing =
        await this.firebaseService.getTranscriptionByShareToken(token);
      if (!existing) {
        return token;
      }

      this.logger.warn(
        `Share token collision detected, regenerating (attempt ${attempts})`,
      );
    } while (attempts < maxAttempts);

    // Fallback to longer token if we somehow can't generate a unique short one
    this.logger.error(
      'Failed to generate unique short token, falling back to long token',
    );
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
      // Default to sharing core analyses only (on-demand analyses excluded by default)
      shareSettings.contentOptions = {
        includeTranscript: true,
        includeSummary: true,
        includeCommunicationStyles: true,
        includeActionItems: true,
        includeSpeakerInfo: true,
        includeOnDemandAnalyses: false,
        selectedAnalysisIds: [],
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

    // Get content options (default to core analyses for backward compatibility)
    const contentOptions = settings.contentOptions || {
      includeTranscript: true,
      includeSummary: true,
      includeCommunicationStyles: true,
      includeActionItems: true,
      includeSpeakerInfo: true,
      includeOnDemandAnalyses: false,
      selectedAnalysisIds: [],
    };

    // Filter analyses based on content options
    // Support both old format (analyses) and new format (coreAnalyses)
    let filteredAnalyses: Partial<typeof transcription.analyses> = undefined;

    // Build analyses object from either coreAnalyses (new) or analyses (old)
    const analysesSource = transcription.coreAnalyses
      ? {
          summary: transcription.coreAnalyses.summary,
          actionItems: transcription.coreAnalyses.actionItems,
          communicationStyles: transcription.coreAnalyses.communicationStyles,
        }
      : transcription.analyses;

    if (analysesSource) {
      filteredAnalyses = {};
      if (contentOptions.includeSummary && analysesSource.summary) {
        filteredAnalyses.summary = analysesSource.summary;
      }
      if (
        contentOptions.includeCommunicationStyles &&
        analysesSource.communicationStyles
      ) {
        filteredAnalyses.communicationStyles =
          analysesSource.communicationStyles;
      }
      if (contentOptions.includeActionItems && analysesSource.actionItems) {
        filteredAnalyses.actionItems = analysesSource.actionItems;
      }
    }

    // Fetch on-demand analyses if requested
    let sharedOnDemandAnalyses: GeneratedAnalysis[] = [];
    if (contentOptions.includeOnDemandAnalyses) {
      const allGeneratedAnalyses =
        await this.firebaseService.getGeneratedAnalyses(
          transcription.id,
          transcription.userId,
        );

      // Filter by selected IDs if specified
      if (
        contentOptions.selectedAnalysisIds &&
        contentOptions.selectedAnalysisIds.length > 0
      ) {
        sharedOnDemandAnalyses = allGeneratedAnalyses.filter((analysis) =>
          contentOptions.selectedAnalysisIds!.includes(analysis.id),
        );
      } else {
        // Share all on-demand analyses
        sharedOnDemandAnalyses = allGeneratedAnalyses;
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
      generatedAnalyses: sharedOnDemandAnalyses,
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
      // Include all available translations (automatically shared)
      translations: transcription.translations || undefined,
      preferredTranslationLanguage:
        transcription.preferredTranslationLanguage || undefined,
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

      // Track the shared email address in the transcription document
      const sharedWith = transcription.sharedWith || [];
      sharedWith.push({
        email: emailRequest.recipientEmail,
        sentAt: new Date(),
      });

      await this.firebaseService.updateTranscription(transcriptionId, {
        sharedWith,
      });
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

      // Use GPT-5 for maximum quality (configurable via env)
      const model = this.configService.get('GPT_MODEL_PREFERENCE') || 'gpt-5';

      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8000, // GPT-5 uses max_completion_tokens instead of max_tokens
        // GPT-5 only supports default temperature (1), so we remove custom temperature/top_p/penalties
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

  // Translation methods
  async translateTranscription(
    transcriptionId: string,
    userId: string,
    targetLanguage: string,
  ): Promise<any> {
    // Verify user owns this transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    if (!transcription.transcriptText) {
      throw new BadRequestException(
        'No transcript available for this transcription',
      );
    }

    // Check if translation already exists
    if (
      transcription.translations &&
      transcription.translations[targetLanguage]
    ) {
      this.logger.log(
        `Translation to ${targetLanguage} already exists for transcription ${transcriptionId}`,
      );
      return transcription.translations[targetLanguage];
    }

    // Get language name
    const targetLang = SUPPORTED_LANGUAGES.find(
      (l) => l.code === targetLanguage,
    );
    if (!targetLang) {
      throw new BadRequestException(`Unsupported language: ${targetLanguage}`);
    }

    this.logger.log(
      `Translating analyses for transcription ${transcriptionId} to ${targetLang.name} using GPT-5-mini (transcript text is NOT translated - always shown in original)`,
    );

    // Translate all analyses in parallel using GPT-5-mini for cost efficiency
    // Note: Transcript text is intentionally NOT translated to preserve the original
    const translationPromises: Promise<string>[] = [];

    // Translate all available analyses
    // Use coreAnalyses (new structure) if available, otherwise fall back to analyses (old structure)
    const analysesSource = transcription.coreAnalyses || transcription.analyses;

    const analysisKeys: string[] = [
      'summary',
      'communicationStyles',
      'actionItems',
      'emotionalIntelligence',
      'influencePersuasion',
      'personalDevelopment',
      'custom',
    ];

    const analysisTranslations: Record<string, Promise<string>> = {};
    if (analysesSource) {
      for (const key of analysisKeys) {
        const analysisValue =
          analysesSource[key as keyof typeof analysesSource];
        if (analysisValue) {
          analysisTranslations[key] = this.translateText(
            analysisValue,
            targetLang.name,
            `${key} analysis`,
          );
          translationPromises.push(analysisTranslations[key]);
        }
      }
    }

    // Execute all translations in parallel
    await Promise.all(translationPromises);

    // Build translation data object (analyses only - transcript is NOT translated)
    const translatedAnalyses: any = {};
    for (const key in analysisTranslations) {
      translatedAnalyses[key] = await analysisTranslations[key];
    }

    const translationData = {
      language: targetLanguage,
      languageName: targetLang.name,
      analyses: translatedAnalyses,
      translatedAt: new Date(),
      translatedBy: 'gpt-5-mini' as const,
    };

    // Save core analyses translation to Firestore
    const translations = transcription.translations || {};
    translations[targetLanguage] = translationData;

    await this.firebaseService.updateTranscription(transcriptionId, {
      translations,
      preferredTranslationLanguage: targetLanguage, // Auto-save user's language preference
      updatedAt: new Date(),
    });

    // Translate and update on-demand analyses (stored in separate collection)
    if (
      transcription.generatedAnalysisIds &&
      transcription.generatedAnalysisIds.length > 0
    ) {
      this.logger.log(
        `Translating ${transcription.generatedAnalysisIds.length} on-demand analyses for transcription ${transcriptionId}`,
      );

      // Fetch all generated analyses for this transcription
      const generatedAnalyses = await this.firebaseService.getGeneratedAnalyses(
        transcriptionId,
        transcription.userId,
      );

      if (generatedAnalyses.length > 0) {
        // Translate all on-demand analyses in parallel
        const analysisTranslationPromises = generatedAnalyses.map(
          async (analysis) => {
            // Skip if already translated
            if (
              analysis.translations &&
              analysis.translations[targetLanguage]
            ) {
              this.logger.log(
                `On-demand analysis ${analysis.id} already has ${targetLanguage} translation, skipping`,
              );
              return;
            }

            try {
              // Translate the analysis content
              const translatedContent = await this.translateText(
                analysis.content,
                targetLang.name,
                `${analysis.templateName} analysis`,
              );

              // Update the analysis document with translation
              const updatedTranslations = analysis.translations || {};
              updatedTranslations[targetLanguage] = translatedContent;

              await this.firebaseService.updateGeneratedAnalysis(analysis.id, {
                translations: updatedTranslations,
                updatedAt: new Date(),
              });

              this.logger.log(
                `Translated on-demand analysis ${analysis.id} (${analysis.templateName}) to ${targetLang.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Failed to translate on-demand analysis ${analysis.id}:`,
                error,
              );
              // Continue with other translations even if one fails
            }
          },
        );

        await Promise.all(analysisTranslationPromises);
        this.logger.log(
          `Completed translation of on-demand analyses to ${targetLang.name}`,
        );
      }
    }

    this.logger.log(
      `Translation to ${targetLang.name} completed for transcription ${transcriptionId}`,
    );

    return translationData;
  }

  private async translateText(
    text: string,
    targetLanguage: string,
    contentType: string = 'text',
  ): Promise<string> {
    try {
      const systemPrompt = `You are a professional translator. Translate the following ${contentType} to ${targetLanguage}.

CRITICAL INSTRUCTIONS:
- Maintain ALL original formatting including markdown, line breaks, bullet points, headings, tables, and special characters
- Preserve speaker labels (e.g., "Speaker 1:", "Speaker 2:") exactly as they appear
- Keep technical terms and proper nouns when appropriate
- Maintain the same tone, style, and level of formality
- Do NOT add any introductions, explanations, or comments
- Output ONLY the translated content`;

      const userPrompt = `Translate this to ${targetLanguage}:\n\n${text}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-mini', // Use mini version for cost efficiency
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8000,
      });

      return completion.choices[0].message.content || text;
    } catch (error) {
      this.logger.error(`Error translating ${contentType}:`, error);
      throw error;
    }
  }

  async getTranslation(
    transcriptionId: string,
    userId: string,
    language: string,
  ): Promise<any> {
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    if (!transcription.translations || !transcription.translations[language]) {
      throw new BadRequestException(
        `No translation available for language: ${language}`,
      );
    }

    return transcription.translations[language];
  }

  async deleteTranslation(
    transcriptionId: string,
    userId: string,
    language: string,
  ): Promise<void> {
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    if (!transcription.translations || !transcription.translations[language]) {
      throw new BadRequestException(
        `No translation exists for language: ${language}`,
      );
    }

    // Remove the translation
    const translations = { ...transcription.translations };
    delete translations[language];

    await this.firebaseService.updateTranscription(transcriptionId, {
      translations,
      updatedAt: new Date(),
    });

    this.logger.log(
      `Deleted translation for language ${language} from transcription ${transcriptionId}`,
    );
  }

  async updateTranslationPreference(
    transcriptionId: string,
    userId: string,
    languageCode: string,
  ): Promise<void> {
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Update the preferred translation language
    await this.firebaseService.updateTranscription(transcriptionId, {
      preferredTranslationLanguage: languageCode,
      updatedAt: new Date(),
    });

    this.logger.log(
      `Updated translation preference to ${languageCode} for transcription ${transcriptionId}`,
    );
  }

  /**
   * Correct transcript using AI-First intelligent routing
   * Supports preview mode and apply mode
   */
  async correctTranscriptWithAI(
    userId: string,
    transcriptionId: string,
    instructions: string,
    previewOnly: boolean = true,
    routingPlan?: RoutingPlan, // Optional: can be provided to skip routing phase
  ): Promise<any> {
    this.logger.log(
      `Correcting transcript ${transcriptionId} for user ${userId}, previewOnly: ${previewOnly}`,
    );

    // Fetch transcription and validate ownership
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Validate transcript exists and is completed
    if (!transcription.transcriptText || transcription.status !== 'completed') {
      throw new BadRequestException(
        'Transcription must be completed before correction',
      );
    }

    const segments = transcription.speakerSegments || [];

    if (segments.length === 0) {
      throw new BadRequestException(
        'No speaker segments available for correction',
      );
    }

    // Phase 1: Routing analysis (if not provided)
    const plan =
      routingPlan ||
      (await this.correctionRouter.analyzeAndRoute(
        segments,
        instructions,
        transcription.detectedLanguage || 'en',
        transcription.duration,
      ));

    // Phase 3: Parallel execution
    const [regexResult, aiResult] = await Promise.all([
      // Path A: Simple replacements (instant)
      Promise.resolve(
        this.correctionRouter.applySimpleReplacements(
          segments,
          plan.simpleReplacements,
        ),
      ),

      // Path B: Complex corrections (AI-powered)
      plan.complexCorrections.length > 0
        ? this.applyComplexCorrections(
            segments,
            plan.complexCorrections,
            instructions,
          )
        : Promise.resolve(new Map<number, string>()),
    ]);

    // Phase 4: Merge results
    const mergedSegments = this.correctionRouter.mergeResults(
      segments,
      regexResult.correctedSegments,
      aiResult,
    );

    // Generate diff
    const diff = this.generateDiff(segments, mergedSegments);

    if (previewOnly) {
      return {
        original: this.reconstructTranscriptFromSegments(segments),
        corrected: this.reconstructTranscriptFromSegments(mergedSegments),
        diff,
        summary: {
          totalChanges: diff.length,
          affectedSegments: new Set([...diff.map((d) => d.segmentIndex)]).size,
          method: 'intelligent-routing',
          routingPlan: plan,
        },
      };
    }

    // Apply mode: Save changes and clean up
    return this.applyCorrection(
      transcriptionId,
      userId,
      transcription,
      mergedSegments,
    );
  }

  /**
   * Apply complex corrections using AI on affected segments only
   */
  private async applyComplexCorrections(
    allSegments: SpeakerSegment[],
    complexCorrections: ComplexCorrection[],
    originalInstructions: string,
  ): Promise<Map<number, string>> {
    this.logger.log(
      `Applying ${complexCorrections.length} complex corrections with AI...`,
    );

    // Flatten all affected segment indices
    const affectedIndices = [
      ...new Set(complexCorrections.flatMap((c) => c.affectedSegmentIndices)),
    ].sort((a, b) => a - b);

    if (affectedIndices.length === 0) {
      return new Map();
    }

    // Extract affected segments with context (previous/next for continuity)
    const segmentsWithContext = affectedIndices.map((index) => {
      const prev = index > 0 ? allSegments[index - 1] : null;
      const current = allSegments[index];
      const next =
        index < allSegments.length - 1 ? allSegments[index + 1] : null;

      return {
        index,
        context: {
          previous: prev ? `${prev.speakerTag}: ${prev.text}` : null,
          current: `${current.speakerTag}: ${current.text}`,
          next: next ? `${next.speakerTag}: ${next.text}` : null,
        },
      };
    });

    // Build focused correction prompt
    const correctionDetails = complexCorrections
      .map((c) => `- ${c.description} (Reason: ${c.reason})`)
      .join('\n');

    const segmentsList = segmentsWithContext
      .map(
        (s) => `[${s.index}]
${s.context.previous ? `  Context (before): ${s.context.previous}` : ''}
  Target: ${s.context.current}
${s.context.next ? `  Context (after): ${s.context.next}` : ''}`,
      )
      .join('\n\n');

    const prompt = `You are correcting specific segments of a transcript based on user instructions.

ORIGINAL USER REQUEST:
${originalInstructions}

CORRECTIONS TO APPLY:
${correctionDetails}

SEGMENTS TO CORRECT (with context):
${segmentsList}

TASK: Return ONLY the corrected text for each target segment, maintaining the exact format:

[index] Speaker Tag: corrected text

IMPORTANT:
- Return ALL segments in the same order
- Keep speaker tags unchanged
- Only modify the spoken text based on user instructions
- Maintain natural flow and context
- Do not add or remove segments`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a transcript correction assistant. Return only the corrected segments in the exact format requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: Math.min(affectedIndices.length * 250, 16000),
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from AI correction');
      }

      // Parse AI response
      const correctedMap = new Map<number, string>();
      const lines = responseText.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        const match = line.match(/^\[(\d+)\]\s+(.+?):\s+(.+)$/);
        if (match) {
          const index = parseInt(match[1]);
          const correctedText = match[3].trim();
          correctedMap.set(index, correctedText);
        }
      }

      this.logger.log(
        `Complex corrections complete: ${correctedMap.size} segments corrected`,
      );

      return correctedMap;
    } catch (error) {
      this.logger.error('Complex correction failed:', error);
      throw new Error('Failed to apply complex corrections');
    }
  }

  /**
   * Reconstruct full transcript from speaker segments
   */
  private reconstructTranscriptFromSegments(
    segments: SpeakerSegment[],
  ): string {
    let currentSpeaker = '';
    const lines: string[] = [];

    for (const segment of segments) {
      if (segment.speakerTag !== currentSpeaker) {
        currentSpeaker = segment.speakerTag;
        lines.push(`${segment.speakerTag}: ${segment.text}`);
      } else {
        lines.push(segment.text);
      }
    }

    return lines.join('\n\n');
  }

  /**
   * Apply correction to Firestore
   */
  private async applyCorrection(
    transcriptionId: string,
    userId: string,
    transcription: any,
    correctedSegments: SpeakerSegment[],
  ): Promise<any> {
    this.logger.log('Applying transcript corrections...');

    const correctedTranscript =
      this.reconstructTranscriptFromSegments(correctedSegments);

    // Get existing translations for tracking what was cleared
    const existingTranslations = Object.keys(transcription.translations || {});

    // Delete custom analyses
    const deletedAnalysisIds =
      await this.firebaseService.deleteGeneratedAnalysesByTranscription(
        transcriptionId,
        userId,
      );

    // Update Firestore
    await this.firebaseService.updateTranscription(transcriptionId, {
      transcriptText: correctedTranscript,
      transcriptWithSpeakers: correctedTranscript,
      speakerSegments: correctedSegments,
      translations: {},
      generatedAnalysisIds: [],
      coreAnalysesOutdated: true, // Mark core analyses as stale
      updatedAt: new Date(),
    });

    // Fetch updated transcription
    const updatedTranscription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );

    this.logger.log(
      `Transcript correction applied successfully. Deleted ${deletedAnalysisIds.length} custom analyses, cleared ${existingTranslations.length} translations`,
    );

    return {
      success: true,
      transcription: updatedTranscription,
      deletedAnalysisIds,
      clearedTranslations: existingTranslations,
    };
  }

  /**
   * Apply corrections from corrected text to speaker segments
   * Parses corrected text by speaker labels and updates segment text
   */
  private applyCorrectionsToSegments(
    originalSegments: SpeakerSegment[],
    correctedText: string,
  ): SpeakerSegment[] {
    // Parse corrected text into speaker segments
    // Match pattern: "Speaker N: text" or "Speaker A: text"
    const regex = /(Speaker [A-Z0-9]+):\s*/gi;
    const parts = correctedText.split(regex).filter((p) => p.trim());

    const parsedSegments: Array<{ speakerTag: string; text: string }> = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        parsedSegments.push({
          speakerTag: parts[i].trim(),
          text: parts[i + 1].trim(),
        });
      }
    }

    // Match parsed segments to original by order and speaker tag
    const updatedSegments = originalSegments.map((original, index) => {
      const parsed = parsedSegments[index];

      // If structure mismatch, keep original
      if (
        !parsed ||
        parsed.speakerTag.toLowerCase() !== original.speakerTag.toLowerCase()
      ) {
        this.logger.warn(
          `Segment mismatch at index ${index}, preserving original`,
        );
        return original;
      }

      // Update only the text field, preserve timestamps and metadata
      return {
        ...original,
        text: parsed.text,
      };
    });

    return updatedSegments;
  }

  /**
   * Generate diff between original and corrected segments
   */
  private generateDiff(
    originalSegments: SpeakerSegment[],
    correctedSegments: SpeakerSegment[],
  ): any[] {
    const diff: any[] = [];

    originalSegments.forEach((original, index) => {
      const corrected = correctedSegments[index];

      // Only include segments where text changed
      if (corrected && original.text !== corrected.text) {
        diff.push({
          segmentIndex: index,
          speakerTag: original.speakerTag,
          timestamp: this.formatTime(original.startTime),
          oldText: original.text,
          newText: corrected.text,
        });
      }
    });

    return diff;
  }

  /**
   * Format time in seconds to MM:SS format
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Regenerate core analyses for a transcription
   * Used after transcript corrections to update analyses with corrected text
   */
  async regenerateCoreAnalysesForTranscription(
    userId: string,
    transcriptionId: string,
  ): Promise<any> {
    this.logger.log(
      `Regenerating core analyses for transcription ${transcriptionId}`,
    );

    // Fetch transcription and validate ownership
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Validate transcript exists and is completed
    if (!transcription.transcriptText || transcription.status !== 'completed') {
      throw new BadRequestException(
        'Transcription must be completed before regenerating analyses',
      );
    }

    // Generate new core analyses using the corrected transcript
    const coreAnalyses = await this.generateCoreAnalyses(
      transcription.transcriptText,
      undefined, // no context
      transcription.detectedLanguage,
    );

    // Update transcription with new core analyses
    await this.firebaseService.updateTranscription(transcriptionId, {
      coreAnalyses,
      coreAnalysesOutdated: false, // Clear stale flag
      updatedAt: new Date(),
    });

    this.logger.log(
      `Core analyses regenerated successfully for transcription ${transcriptionId}`,
    );

    // Fetch and return updated transcription
    return this.firebaseService.getTranscription(userId, transcriptionId);
  }
}
