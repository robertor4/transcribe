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
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
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
    let tempFilePath: string | null = null;
    let chunks: AudioChunk[] = [];

    try {
      // Download file from Firebase Storage
      const fileBuffer = await this.firebaseService.downloadFile(fileUrl);

      // Extract file extension from URL
      let fileExtension = '.mp4'; // default
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
          'Could not extract file extension from URL, using .mp4',
        );
      }

      // Create temporary file
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempFilePath = path.join(tempDir, `${Date.now()}_audio${fileExtension}`);
      fs.writeFileSync(tempFilePath, fileBuffer);
      this.logger.log(
        `Created temp file: ${tempFilePath}, size: ${fileBuffer.length} bytes`,
      );

      // Check if file needs to be split
      const shouldSplit =
        await this.audioSplitter.shouldSplitFile(tempFilePath);

      if (shouldSplit) {
        this.logger.log('File exceeds size limit, splitting into chunks...');

        if (onProgress) {
          onProgress(15, 'Large file detected, splitting into chunks...');
        }

        // Split the audio file
        chunks = await this.audioSplitter.splitAudioFile(tempFilePath, {
          outputDir: tempDir,
          format: 'mp3',
          maxDurationSeconds: 600, // 10 minutes per chunk
        });

        this.logger.log(`Split audio into ${chunks.length} chunks`);

        if (onProgress) {
          onProgress(
            20,
            `Split into ${chunks.length} chunks, starting transcription...`,
          );
        }

        // Transcribe each chunk
        const transcriptions: { text: string; chunk: AudioChunk }[] = [];
        let detectedLanguage: string | undefined;

        for (const chunk of chunks) {
          this.logger.log(
            `Transcribing chunk ${chunk.index + 1}/${chunks.length}`,
          );

          if (onProgress) {
            const progressPercentage =
              20 + Math.floor((chunk.index / chunks.length) * 35);
            onProgress(
              progressPercentage,
              `Transcribing chunk ${chunk.index + 1} of ${chunks.length}...`,
            );
          }

          const chunkContext = this.audioSplitter.createChunkContext(
            chunk,
            chunks.length,
            context,
          );

          const transcription = await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(chunk.path),
            model: 'whisper-1',
            prompt: chunkContext,
            response_format: 'verbose_json',
          }) as any;

          // Extract language from first chunk only
          if (!detectedLanguage && transcription.language) {
            detectedLanguage = transcription.language;
            this.logger.log(`Detected language: ${detectedLanguage}`);
          }

          transcriptions.push({
            text: transcription.text,
            chunk,
          });
        }

        // Merge transcriptions
        const mergedText =
          await this.audioSplitter.mergeTranscriptions(transcriptions);

        if (onProgress) {
          onProgress(55, 'Merging transcriptions...');
        }

        // Clean up chunk files
        await this.audioSplitter.cleanupChunks(chunks);

        // Clean up original temp file
        fs.unlinkSync(tempFilePath);

        return { text: mergedText, language: detectedLanguage };
      } else {
        // File is small enough, transcribe normally
        this.logger.log('File within size limits, transcribing directly...');

        const transcription = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: 'whisper-1',
          prompt: context,
          response_format: 'verbose_json',
        }) as any;

        // Extract language
        const detectedLanguage = transcription.language;
        if (detectedLanguage) {
          this.logger.log(`Detected language: ${detectedLanguage}`);
        }

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        return { text: transcription.text, language: detectedLanguage };
      }
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);

      // Clean up any remaining files
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      if (chunks.length > 0) {
        await this.audioSplitter.cleanupChunks(chunks);
      }

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
        `\n\nIMPORTANT: The transcription is in ${language}. Please generate the summary in ${language} as well. Use appropriate formatting and conventions for ${language}.` : 
        '';
      
      const systemPrompt = this.getSystemPromptForAnalysis(analysisType, languageInstruction);
      const userPrompt = this.buildPromptForAnalysis(transcriptionText, analysisType, context, language);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Note: Consider upgrading to gpt-4-turbo or gpt-4o for better performance
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000, // Increased from 2000 to allow for more detailed summaries
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
- Clarity of message delivery
- Active listening indicators
- Question-asking patterns
- Feedback giving/receiving styles

## Interaction dynamics
- Power dynamics in the conversation
- Collaboration vs. competition
- Support and encouragement patterns
- Conflict or tension points

## Recommendations for improvement
- Specific suggestions for each participant type
- Team communication enhancements
- Meeting effectiveness improvements

${context ? `Context: ${context}\n\n` : ''}Transcript:\n${transcription}`;
  }

  private buildActionItemsPrompt(transcription: string, context?: string, language?: string): string {
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    return `Please extract and organize all action items from this conversation.${languageInstructions}

# Action Items and Tasks

## Immediate action items (Due within 1 week)
List each task with:
- Task description
- Responsible party (if mentioned)
- Deadline (if specified)
- Dependencies

## Short-term tasks (1-4 weeks)
List each task with the same format

## Long-term initiatives (1+ months)
List strategic initiatives and projects

## Follow-up items
- Questions that need answers
- Decisions pending
- Information to be gathered

## Blocked items
- Tasks waiting on dependencies
- Items needing clarification

## Meeting scheduling
- Proposed meetings
- Required participants
- Suggested timeframes

${context ? `Context: ${context}\n\n` : ''}Transcript:\n${transcription}`;
  }

  private buildEmotionalIntelligencePrompt(transcription: string, context?: string, language?: string): string {
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    return `Please analyze the emotional intelligence aspects of this conversation.${languageInstructions}

# Emotional Intelligence Analysis

## Emotional tone
- Overall emotional climate
- Emotional shifts during conversation
- Stress or tension indicators

## Empathy and understanding
- Examples of empathetic responses
- Missed opportunities for empathy
- Active listening demonstrations

## Conflict handling
- Points of disagreement
- Conflict resolution strategies used
- Effectiveness of conflict management

## Emotional regulation
- Self-control demonstrations
- Emotional reactions to challenges
- Stress management indicators

## Relationship building
- Rapport-building behaviors
- Trust indicators
- Collaborative moments

## Recommendations
- Areas for emotional intelligence development
- Strategies for better emotional engagement
- Team dynamics improvements

${context ? `Context: ${context}\n\n` : ''}Transcript:\n${transcription}`;
  }

  private buildInfluencePersuasionPrompt(transcription: string, context?: string, language?: string): string {
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    return `Please analyze influence and persuasion techniques used in this conversation.${languageInstructions}

# Influence and Persuasion Analysis

## Persuasion techniques identified
- Logical arguments used
- Emotional appeals
- Credibility establishment
- Social proof references

## Argumentation patterns
- Claim-evidence structures
- Counter-argument handling
- Concession and rebuttal strategies

## Influence dynamics
- Who influenced whom
- Successful persuasion moments
- Resistance points

## Negotiation elements
- Positions taken
- Compromises offered
- Win-win solutions proposed

## Decision-making influence
- How decisions were shaped
- Key influencing factors
- Consensus building efforts

## Effectiveness assessment
- Most effective techniques
- Missed opportunities
- Recommendations for improvement

${context ? `Context: ${context}\n\n` : ''}Transcript:\n${transcription}`;
  }

  private buildPersonalDevelopmentPrompt(transcription: string, context?: string, language?: string): string {
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    return `Please provide personal development insights based on this conversation.${languageInstructions}

# Personal Development Analysis

## Strengths demonstrated
- Communication strengths
- Leadership qualities
- Technical expertise shown
- Collaborative abilities

## Areas for improvement
- Communication gaps
- Knowledge areas to develop
- Soft skills to enhance
- Technical skills needed

## Learning opportunities
- Topics requiring deeper understanding
- Skills mentioned but not demonstrated
- Industry knowledge gaps

## Recommended training/development
- Specific courses or training programs
- Books or resources to explore
- Mentoring opportunities
- Practice exercises

## Professional growth strategies
- Short-term development goals
- Long-term career considerations
- Networking opportunities identified

## Behavioral patterns to address
- Limiting behaviors observed
- Opportunities for behavior change
- Positive patterns to reinforce

${context ? `Context: ${context}\n\n` : ''}Transcript:\n${transcription}`;
  }

  private buildCustomPrompt(transcription: string, context?: string, language?: string): string {
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    if (!context) {
      return this.buildSummaryPrompt(transcription, context, language);
    }
    return `${context}${languageInstructions}\n\nTranscript:\n${transcription}`;
  }

  private getLanguageSpecificInstructions(language?: string): string {
    if (!language) return '';
    
    const languageMap: Record<string, string> = {
      'dutch': `

LANGUAGE: Generate the entire summary in Dutch (Nederlands).
Use Dutch conventions for formatting and writing style.`,
      'german': `

LANGUAGE: Generate the entire summary in German (Deutsch).
Use German conventions for formatting and writing style.`,
      'french': `

LANGUAGE: Generate the entire summary in French (Français).
Use French conventions for formatting and writing style.`,
      'spanish': `

LANGUAGE: Generate the entire summary in Spanish (Español).
Use Spanish conventions for formatting and writing style.`,
      'english': '',
    };
    
    return languageMap[language.toLowerCase()] || '';
  }

  private buildSummaryPrompt(transcription: string, context?: string, language?: string): string {
    // Language-specific instructions
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    
    const basePrompt = `Please analyze this conversation transcript and provide a comprehensive summary.${languageInstructions}

**CRITICAL FORMATTING RULES:**
1. START WITH A MAIN HEADING (using #) that is a clear, descriptive title showing what this conversation was about. This should be the specific subject matter and context (e.g., "# Technical Discussion: Implementing OAuth2 Authentication in React App" or "# Team Meeting: Q3 Product Roadmap and Resource Allocation"). Do NOT use a generic label like "Conversation Topic" - make the heading itself BE the topic.

2. Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns:
   - CORRECT: "## Key discussion topics"
   - WRONG: "## Key Discussion Topics"
   - CORRECT: "## Technical issues and bugs discussed"
   - WRONG: "## Technical Issues and Bugs Discussed"

Then provide a 1-2 sentence overview directly under the main heading that elaborates on the conversation's purpose and outcome.

## Key discussion topics
List the main topics discussed in bullet points, with brief explanations for each.

## Participants and roles
Note the number of participants and their general roles or areas of expertise based on the discussion. Do NOT attempt to identify specific names unless explicitly stated - use generic descriptors like "technical lead", "project manager", "developer", "stakeholder", etc.

## Technical issues and bugs discussed
- List any bugs, issues, or problems mentioned
- Include any error descriptions or symptoms
- Note the proposed solutions or workarounds

## Decisions made
List any concrete decisions or agreements reached during the conversation.

## Action items
Extract all action items mentioned, including:
- What needs to be done
- Who is responsible (if mentioned)
- Timeline or deadline (if specified)

## Important details
- Any critical dates, deadlines, or milestones mentioned
- Any tools, systems, or technologies discussed
- Any dependencies or blockers identified

## Next steps
Summarize the immediate next steps and future plans discussed.

## Behavioral insights
Analyze the conversation dynamics without attempting to identify specific individuals by name:
- **Communication style**: Describe the overall communication patterns (formal/informal, direct/indirect, technical/layman)
- **Engagement patterns**: Note the distribution of participation (balanced discussion, single dominant speaker, few active contributors, etc.)
- **Emotional tone**: Identify the overall mood and any emotional shifts during the conversation
- **Problem-solving approach**: How the group approaches challenges (analytical, creative, collaborative, etc.)
- **Participant dynamics**: General characterization of participant types (e.g., "one participant was very technical", "another focused on timeline concerns")
- **Team dynamics**: Describe how the group works together, any tensions or particularly good collaboration moments
- **Decision-making style**: How decisions were reached (consensus, authority-driven, through debate, etc.)
- **Note**: Keep observations generic and role-based rather than trying to identify specific individuals

---

**IMPORTANT FORMATTING REQUIREMENTS:**
- You MUST format your entire response in proper Markdown syntax
- Use ## for main section headers (in sentence case), ### for subsections if needed
- Use - or * for bullet points
- Use **bold** for emphasis on important items
- Use \`backticks\` for technical terms, code, or system names
- Ensure proper line breaks between sections
- Keep formatting clean and consistent throughout
- REMEMBER: All headers must be in sentence case!

Format your response in clean, well-structured Markdown with proper headers and bullet points. Be specific and include relevant details while keeping each section concise.`;

    let fullPrompt = basePrompt;

    if (context) {
      fullPrompt = `## Context
The following context information is provided about this conversation:
${context}

Please use this context to better understand references, participants, technical terms, and the overall discussion.

---

${basePrompt}`;
    }

    return `${fullPrompt}\n\n---\nTRANSCRIPT:\n${transcription}`;
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
      position,
      content,
    };

    const commentId = await this.firebaseService.addSummaryComment(
      transcriptionId,
      commentData,
    );

    const comment = await this.firebaseService.getSummaryComment(transcriptionId, commentId);
    
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

    // Get all comments for this transcription
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
    const languageInstructions = this.getLanguageSpecificInstructions(language);
    
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
Please create a comprehensive summary, addressing the feedback above.

**CRITICAL FORMATTING RULES:**
1. START WITH A MAIN HEADING (using #) that is a clear, descriptive title showing what this conversation was about. This should be the specific subject matter and context (e.g., "# Technical Discussion: Implementing OAuth2 Authentication in React App" or "# Team Meeting: Q3 Product Roadmap and Resource Allocation"). Do NOT use a generic label like "Conversation Topic" - make the heading itself BE the topic.

2. Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns:
   - CORRECT: "## Key discussion topics"
   - WRONG: "## Key Discussion Topics"
   - CORRECT: "## Technical issues and bugs discussed"
   - WRONG: "## Technical Issues and Bugs Discussed"

Then provide a 1-2 sentence overview directly under the main heading that elaborates on the conversation's purpose and outcome.

## Key discussion topics
List the main topics discussed in bullet points, with brief explanations for each.

## Participants and roles
Note the number of participants and their general roles or areas of expertise based on the discussion. Use generic descriptors.

## Technical issues and bugs discussed
- List any bugs, issues, or problems mentioned
- Include any error descriptions or symptoms
- Note the proposed solutions or workarounds

## Decisions made
List any concrete decisions or agreements reached during the conversation.

## Action items
List specific tasks, assignments, or follow-ups mentioned.

## Next steps
Outline any planned future activities or meetings.

## Key insights and observations
- **Communication patterns**: How information flows, who asks questions vs provides answers
- **Team dynamics**: How the group works together
- **Decision-making style**: How decisions were reached

**IMPORTANT FORMATTING REQUIREMENTS:**
- Format response in proper Markdown syntax
- Use ## for main section headers (in sentence case), ### for subsections if needed
- Use - or * for bullet points
- Use **bold** for emphasis
- Use \`backticks\` for technical terms
- REMEMBER: All headers must be in sentence case!`;

    if (context) {
      prompt = `## Context
The following context information is provided about this conversation:
${context}

---

${prompt}`;
    }

    return `${prompt}\n\n---\nTRANSCRIPT:\n${transcription}`;
  }
}
