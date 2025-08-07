import { Injectable, Logger } from '@nestjs/common';
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
  generateJobId 
} from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';
import { AudioSplitter, AudioChunk } from '../utils/audio-splitter';

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
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.audioSplitter = new AudioSplitter();
  }

  async createTranscription(
    userId: string,
    file: Express.Multer.File,
    context?: string,
    contextId?: string,
  ): Promise<Transcription> {
    this.logger.log(`Creating transcription for user ${userId}, file: ${file.originalname}`);

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
    if (context) {
      transcription.context = context;
    }
    if (contextId) {
      transcription.contextId = contextId;
    }

    const transcriptionId = await this.firebaseService.createTranscription(transcription);

    // Create job and add to queue
    const job: TranscriptionJob = {
      id: generateJobId(),
      transcriptionId,
      userId,
      fileUrl,
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
  ): Promise<string> {
    return this.transcribeAudio(fileUrl, context, onProgress);
  }

  async transcribeAudio(
    fileUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<string> {
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
        this.logger.warn('Could not extract file extension from URL, using .mp4');
      }
      
      // Create temporary file
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      tempFilePath = path.join(tempDir, `${Date.now()}_audio${fileExtension}`);
      fs.writeFileSync(tempFilePath, fileBuffer);
      this.logger.log(`Created temp file: ${tempFilePath}, size: ${fileBuffer.length} bytes`);

      // Check if file needs to be split
      const shouldSplit = await this.audioSplitter.shouldSplitFile(tempFilePath);
      
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
          onProgress(20, `Split into ${chunks.length} chunks, starting transcription...`);
        }
        
        // Transcribe each chunk
        const transcriptions: { text: string; chunk: AudioChunk }[] = [];
        
        for (const chunk of chunks) {
          this.logger.log(`Transcribing chunk ${chunk.index + 1}/${chunks.length}`);
          
          if (onProgress) {
            const progressPercentage = 20 + Math.floor((chunk.index / chunks.length) * 35);
            onProgress(
              progressPercentage,
              `Transcribing chunk ${chunk.index + 1} of ${chunks.length}...`
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
          });
          
          transcriptions.push({
            text: transcription.text,
            chunk,
          });
        }
        
        // Merge transcriptions
        const mergedText = await this.audioSplitter.mergeTranscriptions(transcriptions);
        
        if (onProgress) {
          onProgress(55, 'Merging transcriptions...');
        }
        
        // Clean up chunk files
        await this.audioSplitter.cleanupChunks(chunks);
        
        // Clean up original temp file
        fs.unlinkSync(tempFilePath);
        
        return mergedText;
      } else {
        // File is small enough, transcribe normally
        this.logger.log('File within size limits, transcribing directly...');
        
        const transcription = await this.openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: 'whisper-1',
          prompt: context,
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        return transcription.text;
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

  async generateSummary(transcriptionText: string, context?: string): Promise<string> {
    try {
      const systemPrompt = `You are a helpful assistant that creates structured summaries of meeting transcripts and conversations. You are skilled at analyzing communication patterns and group dynamics. Important: Do NOT attempt to guess or identify specific individuals by name - instead use generic role descriptors and focus on behavioral patterns and communication styles.`;
      
      const userPrompt = this.buildSummaryPrompt(transcriptionText, context);

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

  private buildSummaryPrompt(transcription: string, context?: string): string {
    const basePrompt = `Please analyze this conversation transcript and provide a comprehensive summary with the following structure:

## Executive Summary
Provide a 2-3 sentence overview of the entire conversation, highlighting the main purpose and outcome.

## Key Discussion Topics
List the main topics discussed in bullet points, with brief explanations for each.

## Participants and Roles
Note the number of participants and their general roles or areas of expertise based on the discussion. Do NOT attempt to identify specific names unless explicitly stated - use generic descriptors like "technical lead", "project manager", "developer", "stakeholder", etc.

## Technical Issues and Bugs Discussed
- List any bugs, issues, or problems mentioned
- Include any error descriptions or symptoms
- Note the proposed solutions or workarounds

## Decisions Made
List any concrete decisions or agreements reached during the conversation.

## Action Items
Extract all action items mentioned, including:
- What needs to be done
- Who is responsible (if mentioned)
- Timeline or deadline (if specified)

## Important Details
- Any critical dates, deadlines, or milestones mentioned
- Any tools, systems, or technologies discussed
- Any dependencies or blockers identified

## Next Steps
Summarize the immediate next steps and future plans discussed.

## Behavioral Insights
Analyze the conversation dynamics without attempting to identify specific individuals by name:
- **Communication Style**: Describe the overall communication patterns (formal/informal, direct/indirect, technical/layman)
- **Engagement Patterns**: Note the distribution of participation (balanced discussion, single dominant speaker, few active contributors, etc.)
- **Emotional Tone**: Identify the overall mood and any emotional shifts during the conversation
- **Problem-Solving Approach**: How the group approaches challenges (analytical, creative, collaborative, etc.)
- **Participant Dynamics**: General characterization of participant types (e.g., "one participant was very technical", "another focused on timeline concerns")
- **Team Dynamics**: Describe how the group works together, any tensions or particularly good collaboration moments
- **Decision-Making Style**: How decisions were reached (consensus, authority-driven, through debate, etc.)
- **Note**: Keep observations generic and role-based rather than trying to identify specific individuals

---

**IMPORTANT FORMATTING REQUIREMENTS:**
- You MUST format your entire response in proper Markdown syntax
- Use ## for main section headers, ### for subsections if needed
- Use - or * for bullet points
- Use **bold** for emphasis on important items
- Use \`backticks\` for technical terms, code, or system names
- Ensure proper line breaks between sections
- Keep formatting clean and consistent throughout

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

  async getTranscriptions(
    userId: string,
    page = 1,
    pageSize = 20,
  ) {
    return this.firebaseService.getTranscriptions(userId, page, pageSize);
  }

  async getTranscription(userId: string, transcriptionId: string) {
    return this.firebaseService.getTranscription(userId, transcriptionId);
  }

  async deleteTranscription(userId: string, transcriptionId: string) {
    const transcription = await this.firebaseService.getTranscription(userId, transcriptionId);
    
    if (transcription) {
      // Delete file from storage
      await this.firebaseService.deleteFile(transcription.fileUrl);
      
      // Delete transcription document
      await this.firebaseService.deleteTranscription(transcriptionId);
    }
    
    return { success: true };
  }
}