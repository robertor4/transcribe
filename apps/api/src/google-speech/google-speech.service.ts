import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpeechClient, protos } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import { Speaker, SpeakerSegment } from '@transcribe/shared';

type IRecognizeResponse = protos.google.cloud.speech.v1.IRecognizeResponse;
type ILongRunningRecognizeResponse = protos.google.cloud.speech.v1.ILongRunningRecognizeResponse;
type ISpeechRecognitionResult = protos.google.cloud.speech.v1.ISpeechRecognitionResult;
type IWordInfo = protos.google.cloud.speech.v1.IWordInfo;

export interface GoogleSpeechResult {
  text: string;
  language?: string;
  speakers?: Speaker[];
  speakerSegments?: SpeakerSegment[];
  transcriptWithSpeakers?: string;
  confidence?: number;
  speakerCount?: number;
}

@Injectable()
export class GoogleSpeechService {
  private readonly logger = new Logger(GoogleSpeechService.name);
  private client: SpeechClient;

  constructor(private configService: ConfigService) {
    // Initialize using existing Firebase credentials
    this.client = new SpeechClient({
      projectId: this.configService.get('FIREBASE_PROJECT_ID'),
      credentials: {
        client_email: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        private_key: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
    });
  }

  async transcribeWithDiarization(
    audioPath: string,
    context?: string,
    languageCode?: string,
  ): Promise<GoogleSpeechResult> {
    try {
      const fileSize = fs.statSync(audioPath).size;
      const fileSizeInMB = fileSize / (1024 * 1024);
      
      // Determine if we should use synchronous or asynchronous recognition
      // Use async for files > 1 minute or > 10MB
      const useAsync = fileSizeInMB > 10;

      if (useAsync) {
        this.logger.log(`Using asynchronous recognition for file ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);
        return await this.transcribeAsyncWithDiarization(audioPath, context, languageCode);
      } else {
        this.logger.log(`Using synchronous recognition for file ${audioPath} (${fileSizeInMB.toFixed(2)}MB)`);
        return await this.transcribeSyncWithDiarization(audioPath, context, languageCode);
      }
    } catch (error) {
      this.logger.error('Error in Google Speech transcription:', error);
      throw error;
    }
  }

  private async transcribeSyncWithDiarization(
    audioPath: string,
    context?: string,
    languageCode?: string,
  ): Promise<GoogleSpeechResult> {
    const audioBytes = fs.readFileSync(audioPath).toString('base64');

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: this.getAudioEncoding(audioPath),
        languageCode: languageCode || 'en-US',
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: 10,
        model: 'latest_long',
        useEnhanced: true,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true,
        speechContexts: context ? [{ phrases: [context] }] : undefined,
      },
    };

    const [response] = await this.client.recognize(request as any);
    return this.processRecognitionResponse(response);
  }

  private async transcribeAsyncWithDiarization(
    audioPath: string,
    context?: string,
    languageCode?: string,
  ): Promise<GoogleSpeechResult> {
    const audioBytes = fs.readFileSync(audioPath).toString('base64');

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: this.getAudioEncoding(audioPath),
        languageCode: languageCode || 'en-US',
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: 10,
        model: 'latest_long',
        useEnhanced: true,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true,
        speechContexts: context ? [{ phrases: [context] }] : undefined,
      },
    };

    this.logger.log('Starting long-running recognition...');
    const [operation] = await this.client.longRunningRecognize(request as any);
    
    this.logger.log('Waiting for operation to complete...');
    const [response] = await operation.promise();
    
    return this.processRecognitionResponse(response);
  }

  private processRecognitionResponse(
    response: IRecognizeResponse | ILongRunningRecognizeResponse,
  ): GoogleSpeechResult {
    const results = response.results || [];
    
    if (results.length === 0) {
      return {
        text: '',
        speakers: [],
        speakerSegments: [],
        transcriptWithSpeakers: '',
        confidence: 0,
        speakerCount: 0,
      };
    }

    // Extract all words with speaker tags
    const allWords: Array<{
      word: string;
      speakerTag: number;
      startTime: number;
      endTime: number;
      confidence: number;
    }> = [];

    let fullTranscript = '';
    let totalConfidence = 0;
    let resultCount = 0;

    for (const result of results) {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        fullTranscript += alternative.transcript + ' ';
        
        if (alternative.confidence) {
          totalConfidence += alternative.confidence;
          resultCount++;
        }

        // Process words with speaker tags
        if (alternative.words) {
          for (const word of alternative.words) {
            if (word.word && word.speakerTag !== undefined && word.speakerTag !== null) {
              allWords.push({
                word: word.word,
                speakerTag: word.speakerTag as number,
                startTime: this.timeToSeconds(word.startTime),
                endTime: this.timeToSeconds(word.endTime),
                confidence: word.confidence || 0,
              });
            }
          }
        }
      }
    }

    // Process speaker data
    const speakerData = this.processSpeakerData(allWords);
    const speakerSegments = this.createSpeakerSegments(allWords);
    const transcriptWithSpeakers = this.formatTranscriptWithSpeakers(speakerSegments);

    // Get detected language from the first result
    const detectedLanguage = results[0]?.languageCode || undefined;

    return {
      text: fullTranscript.trim(),
      language: detectedLanguage,
      speakers: speakerData.speakers,
      speakerSegments,
      transcriptWithSpeakers,
      confidence: resultCount > 0 ? totalConfidence / resultCount : 0,
      speakerCount: speakerData.speakerCount,
    };
  }

  private processSpeakerData(words: Array<{
    word: string;
    speakerTag: number;
    startTime: number;
    endTime: number;
    confidence: number;
  }>): { speakers: Speaker[]; speakerCount: number } {
    const speakerMap = new Map<number, {
      wordCount: number;
      totalTime: number;
      firstAppearance: number;
      lastEndTime: number;
    }>();

    for (const word of words) {
      if (!speakerMap.has(word.speakerTag)) {
        speakerMap.set(word.speakerTag, {
          wordCount: 0,
          totalTime: 0,
          firstAppearance: word.startTime,
          lastEndTime: word.endTime,
        });
      }

      const speaker = speakerMap.get(word.speakerTag)!;
      speaker.wordCount++;
      speaker.lastEndTime = Math.max(speaker.lastEndTime, word.endTime);
    }

    // Calculate total speaking time for each speaker
    const speakers: Speaker[] = [];
    for (const [speakerId, data] of speakerMap.entries()) {
      // Calculate speaking time by summing up segments
      let speakingTime = 0;
      let lastEndTime = -1;
      
      for (const word of words) {
        if (word.speakerTag === speakerId) {
          if (lastEndTime === -1 || word.startTime - lastEndTime > 1) {
            // New segment
            speakingTime += word.endTime - word.startTime;
          } else {
            // Continuation
            speakingTime += word.endTime - lastEndTime;
          }
          lastEndTime = word.endTime;
        }
      }

      speakers.push({
        speakerId,
        speakerTag: `Speaker ${speakerId}`,
        totalSpeakingTime: speakingTime,
        wordCount: data.wordCount,
        firstAppearance: data.firstAppearance,
      });
    }

    // Sort speakers by first appearance
    speakers.sort((a, b) => a.firstAppearance - b.firstAppearance);

    return {
      speakers,
      speakerCount: speakers.length,
    };
  }

  private createSpeakerSegments(words: Array<{
    word: string;
    speakerTag: number;
    startTime: number;
    endTime: number;
    confidence: number;
  }>): SpeakerSegment[] {
    if (words.length === 0) return [];

    const segments: SpeakerSegment[] = [];
    let currentSegment: SpeakerSegment | null = null;
    let segmentWords: string[] = [];
    let segmentConfidences: number[] = [];

    for (const word of words) {
      if (!currentSegment || currentSegment.speakerTag !== `Speaker ${word.speakerTag}`) {
        // Save previous segment
        if (currentSegment && segmentWords.length > 0) {
          currentSegment.text = segmentWords.join(' ');
          currentSegment.confidence = segmentConfidences.length > 0
            ? segmentConfidences.reduce((a, b) => a + b, 0) / segmentConfidences.length
            : 0;
          segments.push(currentSegment);
        }

        // Start new segment
        currentSegment = {
          speakerTag: `Speaker ${word.speakerTag}`,
          startTime: word.startTime,
          endTime: word.endTime,
          text: '',
          confidence: 0,
        };
        segmentWords = [word.word];
        segmentConfidences = word.confidence ? [word.confidence] : [];
      } else {
        // Continue current segment
        currentSegment.endTime = word.endTime;
        segmentWords.push(word.word);
        if (word.confidence) {
          segmentConfidences.push(word.confidence);
        }
      }
    }

    // Save last segment
    if (currentSegment && segmentWords.length > 0) {
      currentSegment.text = segmentWords.join(' ');
      currentSegment.confidence = segmentConfidences.length > 0
        ? segmentConfidences.reduce((a, b) => a + b, 0) / segmentConfidences.length
        : 0;
      segments.push(currentSegment);
    }

    return segments;
  }

  private formatTranscriptWithSpeakers(segments: SpeakerSegment[]): string {
    return segments
      .map(segment => `[${segment.speakerTag}]: ${segment.text}`)
      .join('\n\n');
  }

  private timeToSeconds(time: any): number {
    if (!time) return 0;
    const seconds = parseInt(time.seconds || 0);
    const nanos = parseInt(time.nanos || 0);
    return seconds + nanos / 1e9;
  }

  private getAudioEncoding(audioPath: string): string {
    const ext = path.extname(audioPath).toLowerCase();
    switch (ext) {
      case '.flac':
        return 'FLAC';
      case '.wav':
        return 'LINEAR16';
      case '.mp3':
        return 'MP3';
      case '.ogg':
      case '.opus':
        return 'OGG_OPUS';
      case '.webm':
        return 'WEBM_OPUS';
      case '.m4a':
      case '.mp4':
        return 'MP3'; // Will need conversion
      default:
        return 'ENCODING_UNSPECIFIED';
    }
  }

  async convertToOptimalFormat(inputPath: string, outputDir: string): Promise<string> {
    const ext = path.extname(inputPath).toLowerCase();
    
    // Already in optimal format
    if (ext === '.flac' || ext === '.wav' || ext === '.opus') {
      return inputPath;
    }

    // Need to convert to FLAC for best results
    const outputPath = path.join(
      outputDir,
      `${path.basename(inputPath, ext)}_converted.flac`
    );

    // This would use FFmpeg to convert, but for now return the original
    // The audio-splitter already has conversion logic we can leverage
    this.logger.log(`Audio format ${ext} may need conversion for optimal results`);
    return inputPath;
  }
}