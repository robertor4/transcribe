/**
 * V2 Structured Transcript Types
 *
 * These types support the V2 structured data architecture for transcripts.
 * The segment structure aligns with AssemblyAI's utterance response format.
 */

import { SpeakerSegment } from '../types';

/**
 * V2 Transcript - Structured format with speaker segments
 *
 * This format stores the transcript as structured segments aligned with
 * AssemblyAI's response. Supports conversations of any length (1-2+ hours,
 * 500-1000+ segments).
 */
export interface TranscriptV2 {
  version: 2;
  /** Number of speakers detected */
  speakerCount: number;
  /** Overall transcription confidence (0-1) */
  confidence: number;
  /** Detected language code (e.g., 'nl-nl', 'en-us') */
  language?: string;
  /** Audio duration in seconds */
  durationSeconds?: number;
  /**
   * Speaker segments - can be large for long conversations.
   * UI should paginate or virtualize for 500+ segments.
   */
  segments: TranscriptSegment[];
  /** Concatenated full text for search indexing */
  fullText: string;
  /** When the transcript was generated */
  generatedAt: Date;
}

/**
 * A single segment of speech from one speaker.
 * Aligns with AssemblyAI's utterance format and existing SpeakerSegment.
 */
export interface TranscriptSegment {
  /** Speaker identifier (e.g., "Speaker 1", "Speaker 2") */
  speaker: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Transcribed text for this segment */
  text: string;
  /** Confidence score for this segment (0-1) */
  confidence?: number;
}

/**
 * LEGACY V1 Transcript - Text blob format
 *
 * This format stores the transcript as a text string with optional
 * speaker segments. Kept for backwards compatibility.
 */
export interface TranscriptV1 {
  /** Version marker - undefined or 1 for legacy data */
  version?: 1;
  /** Full transcript text */
  text: string;
  /** Number of speakers detected */
  speakerCount: number;
  /** Overall confidence */
  confidence: number;
  /** Detected language */
  language?: string;
  /** Audio duration in seconds */
  durationSeconds?: number;
  /**
   * Optional speaker segments - may exist in V1 data.
   * Uses the existing SpeakerSegment interface.
   */
  speakerSegments?: SpeakerSegment[];
  // Note: transcriptWithSpeakers removed - derive from speakerSegments using formatTranscriptWithSpeakers()
  /** When the transcript was generated */
  generatedAt?: Date;
}

/**
 * Union type for all transcript versions
 */
export type Transcript = TranscriptV1 | TranscriptV2;

/**
 * Type guard to check if a transcript is V2 structured format
 */
export function isTranscriptV2(transcript: Transcript | null | undefined): transcript is TranscriptV2 {
  return (
    transcript !== null && transcript !== undefined && 'version' in transcript && transcript.version === 2
  );
}

/**
 * Type guard to check if a transcript is V1 legacy format
 */
export function isTranscriptV1(transcript: Transcript | null | undefined): transcript is TranscriptV1 {
  return (
    transcript !== null &&
    transcript !== undefined &&
    'text' in transcript &&
    (!('version' in transcript) || transcript.version === 1)
  );
}

/**
 * Convert V2 TranscriptSegment to existing SpeakerSegment format
 * Useful for backwards compatibility with existing UI components
 */
export function toSpeakerSegment(segment: TranscriptSegment): SpeakerSegment {
  return {
    speakerTag: segment.speaker,
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text,
    confidence: segment.confidence,
  };
}

/**
 * Convert existing SpeakerSegment to V2 TranscriptSegment format
 */
export function toTranscriptSegment(segment: SpeakerSegment): TranscriptSegment {
  return {
    speaker: segment.speakerTag,
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text,
    confidence: segment.confidence,
  };
}

/**
 * Derive formatted transcript with speaker labels from speaker segments.
 * This replaces the stored transcriptWithSpeakers field to reduce duplication.
 *
 * @param segments - Array of speaker segments from the transcription
 * @returns Formatted string with "Speaker X: text" format, separated by double newlines
 */
export function formatTranscriptWithSpeakers(segments: SpeakerSegment[] | undefined | null): string {
  if (!segments || segments.length === 0) {
    return '';
  }
  return segments.map(s => `${s.speakerTag}: ${s.text}`).join('\n\n');
}
