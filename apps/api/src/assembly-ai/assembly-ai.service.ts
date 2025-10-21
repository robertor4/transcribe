import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssemblyAI } from 'assemblyai';
import { Speaker, SpeakerSegment } from '@transcribe/shared';

export interface AssemblyAIResult {
  text: string;
  language?: string;
  languageConfidence?: number;
  speakers?: Speaker[];
  speakerSegments?: SpeakerSegment[];
  transcriptWithSpeakers?: string;
  confidence?: number;
  speakerCount?: number;
}

@Injectable()
export class AssemblyAIService {
  private readonly logger = new Logger(AssemblyAIService.name);
  private client: AssemblyAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ASSEMBLYAI_API_KEY');
    if (!apiKey) {
      throw new Error('ASSEMBLYAI_API_KEY is not configured');
    }

    this.client = new AssemblyAI({
      apiKey: apiKey,
    });
  }

  async transcribeWithDiarization(
    audioUrl: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<AssemblyAIResult> {
    try {
      this.logger.log(`Starting AssemblyAI transcription for URL: ${audioUrl}`);

      // Prepare word boost from context - extract important keywords
      const wordBoost = context
        ? context
            .split(' ')
            .filter((word) => word.length > 3) // Filter out short words
            .slice(0, 100) // AssemblyAI limits word boost
        : [];

      // Start transcription with enhanced quality settings
      const transcript = await this.client.transcripts.create({
        audio_url: audioUrl,

        // Core transcription settings
        speech_model: 'best', // Use Best tier for maximum accuracy
        speaker_labels: true, // Enable speaker diarization
        language_detection: true, // Enable automatic language detection
        language_confidence_threshold: 0.5, // Industry standard for production use

        // Quality enhancement parameters
        punctuate: true, // Add proper punctuation
        format_text: true, // Improve formatting with proper capitalization
        disfluencies: false, // Remove filler words like "um", "uh" for cleaner transcript

        // Word boosting for context-specific terms
        ...(wordBoost.length > 0 && {
          word_boost: wordBoost,
          boost_param: 'high', // Maximum boost weight for important terms
        }),

        // Additional quality settings
        auto_chapters: true, // Automatically detect chapter/topic changes
        entity_detection: true, // Detect and tag entities like names, locations
        sentiment_analysis: true, // Add sentiment scores to utterances
        iab_categories: true, // Categorize content by IAB taxonomy

        // Audio processing enhancements
        audio_start_from: 0,
        // audio_end_at is optional, don't specify to process entire file
        filter_profanity: false, // Keep original content
        redact_pii: false, // Don't redact personal info (user's own content)
        redact_pii_policies: [], // No PII redaction
      });

      this.logger.log(`Transcription job created with ID: ${transcript.id}`);

      // Send initial progress update
      if (onProgress) {
        onProgress(15, 'Audio uploaded, transcription in progress...');
      }

      // Poll for completion with custom polling to send progress updates
      let completedTranscript;
      const startTime = Date.now();
      const pollingInterval = 3000; // Poll every 3 seconds
      const pollingTimeout = 600000; // 10 minute timeout
      let lastProgressUpdate = 15;

      while (true) {
        const elapsed = Date.now() - startTime;

        // Check if we've exceeded the timeout
        if (elapsed > pollingTimeout) {
          throw new Error('Transcription polling timeout exceeded');
        }

        // Get current status
        const currentTranscript = await this.client.transcripts.get(transcript.id);

        // Check if completed
        if (currentTranscript.status === 'completed' || currentTranscript.status === 'error') {
          completedTranscript = currentTranscript;
          break;
        }

        // Send progress updates every poll (gradually increase from 15% to 55%)
        // This keeps the frontend timeout from expiring
        if (onProgress) {
          // Calculate progress based on elapsed time (assume max 5 minutes for transcription)
          const maxTranscriptionTime = 300000; // 5 minutes in ms
          const progressIncrement = Math.min(40 * (elapsed / maxTranscriptionTime), 40);
          const currentProgress = Math.min(15 + progressIncrement, 55);

          // Only send update if progress changed by at least 1%
          if (Math.floor(currentProgress) > Math.floor(lastProgressUpdate)) {
            lastProgressUpdate = currentProgress;
            onProgress(Math.floor(currentProgress), 'Processing audio transcription...');
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }

      if (completedTranscript.status === 'error') {
        throw new Error(`Transcription failed: ${completedTranscript.error}`);
      }

      // Log detected language
      if (completedTranscript.language_code) {
        this.logger.log(
          `Detected language: ${completedTranscript.language_code} (confidence: ${completedTranscript.language_confidence})`,
        );
      }

      // Log quality metrics if available
      if (completedTranscript.confidence) {
        this.logger.log(
          `Transcription confidence score: ${completedTranscript.confidence}`,
        );
      }

      // Process the results
      return this.processTranscriptionResponse(completedTranscript);
    } catch (error) {
      this.logger.error('Error in AssemblyAI transcription:', error);
      throw error;
    }
  }

  async transcribeFile(
    audioBuffer: Buffer,
    fileName: string,
    context?: string,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<AssemblyAIResult> {
    try {
      this.logger.log(`Uploading file to AssemblyAI: ${fileName}`);

      // Upload the file to AssemblyAI
      const uploadUrl = await this.client.files.upload(audioBuffer);

      this.logger.log(`File uploaded successfully, starting transcription`);

      // Use the uploaded URL for transcription
      return this.transcribeWithDiarization(uploadUrl, context, onProgress);
    } catch (error) {
      this.logger.error('Error uploading file to AssemblyAI:', error);
      throw error;
    }
  }

  private processTranscriptionResponse(transcript: any): AssemblyAIResult {
    // Map language codes from AssemblyAI to our format
    const languageMap: Record<string, string> = {
      en: 'en-us',
      en_us: 'en-us',
      en_uk: 'en-gb',
      nl: 'nl-nl',
      de: 'de-de',
      fr: 'fr-fr',
      es: 'es-es',
    };

    const mappedLanguage = transcript.language_code
      ? languageMap[transcript.language_code.toLowerCase()] ||
        transcript.language_code
      : undefined;

    // Process speaker segments if speaker diarization was enabled
    let speakers: Speaker[] = [];
    const speakerSegments: SpeakerSegment[] = [];
    let transcriptWithSpeakers = '';

    if (transcript.utterances && transcript.utterances.length > 0) {
      // Build speaker segments from utterances
      const speakerMap = new Map<string, Speaker>();

      for (const utterance of transcript.utterances) {
        // Create or update speaker info
        const speakerTag = `Speaker ${utterance.speaker}`;
        if (!speakerMap.has(speakerTag)) {
          // Convert speaker letter to number (A=1, B=2, etc.) or use the number directly if it's numeric
          let speakerId = parseInt(utterance.speaker);
          if (isNaN(speakerId)) {
            // If it's a letter, convert to number (A=1, B=2, etc.)
            speakerId = utterance.speaker.toUpperCase().charCodeAt(0) - 64;
          }
          speakerMap.set(speakerTag, {
            speakerId: speakerId,
            speakerTag: speakerTag,
            totalSpeakingTime: 0,
            wordCount: 0,
            firstAppearance: utterance.start / 1000, // Convert ms to seconds
          });
        }

        const speaker = speakerMap.get(speakerTag)!;
        const duration = (utterance.end - utterance.start) / 1000;
        speaker.totalSpeakingTime += duration;
        speaker.wordCount += utterance.words
          ? utterance.words.length
          : utterance.text.split(' ').length;

        // Create speaker segment
        speakerSegments.push({
          speakerTag: speakerTag,
          startTime: utterance.start / 1000, // Convert ms to seconds
          endTime: utterance.end / 1000,
          text: utterance.text,
          confidence: utterance.confidence,
        });

        // Build transcript with speakers
        transcriptWithSpeakers += `${speakerTag}: ${utterance.text}\n\n`;
      }

      speakers = Array.from(speakerMap.values()).sort(
        (a, b) => a.speakerId - b.speakerId,
      );

      this.logger.log(
        `Processed ${speakers.length} speakers with ${speakerSegments.length} segments`,
      );
    }

    return {
      text: transcript.text || '',
      language: mappedLanguage,
      languageConfidence: transcript.language_confidence,
      speakers,
      speakerSegments,
      transcriptWithSpeakers: transcriptWithSpeakers.trim(),
      confidence: transcript.confidence,
      speakerCount: speakers.length,
    };
  }

  // Helper method to get transcription status (for progress updates)
  async getTranscriptionStatus(transcriptId: string): Promise<string> {
    try {
      const transcript = await this.client.transcripts.get(transcriptId);
      return transcript.status;
    } catch (error) {
      this.logger.error('Error getting transcription status:', error);
      return 'error';
    }
  }
}
