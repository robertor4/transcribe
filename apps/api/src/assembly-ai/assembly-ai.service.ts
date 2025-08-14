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
    const apiKey = this.configService.get('ASSEMBLYAI_API_KEY');
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
  ): Promise<AssemblyAIResult> {
    try {
      this.logger.log(`Starting AssemblyAI transcription for URL: ${audioUrl}`);

      // Start transcription with language detection and speaker diarization
      const transcript = await this.client.transcripts.create({
        audio_url: audioUrl,
        speaker_labels: true, // Enable speaker diarization
        language_detection: true, // Enable automatic language detection
        language_confidence_threshold: 0.7, // Minimum confidence for language detection
        // Add context as custom spelling if provided
        ...(context && { word_boost: context.split(' ').slice(0, 100) }), // AssemblyAI limits word boost
      });

      this.logger.log(`Transcription job created with ID: ${transcript.id}`);

      // Poll for completion
      const completedTranscript = await this.client.transcripts.waitUntilReady(
        transcript.id,
        {
          pollingInterval: 3000, // Poll every 3 seconds
          pollingTimeout: 600000, // 10 minute timeout
        },
      );

      if (completedTranscript.status === 'error') {
        throw new Error(`Transcription failed: ${completedTranscript.error}`);
      }

      // Log detected language
      if (completedTranscript.language_code) {
        this.logger.log(
          `Detected language: ${completedTranscript.language_code} (confidence: ${completedTranscript.language_confidence})`,
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
  ): Promise<AssemblyAIResult> {
    try {
      this.logger.log(`Uploading file to AssemblyAI: ${fileName}`);

      // Upload the file to AssemblyAI
      const uploadUrl = await this.client.files.upload(audioBuffer);

      this.logger.log(`File uploaded successfully, starting transcription`);

      // Use the uploaded URL for transcription
      return this.transcribeWithDiarization(uploadUrl, context);
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
