/**
 * Conversation Types - V2 UI
 *
 * Maps backend "Transcription" to frontend "Conversation" terminology.
 * This adapter provides a clean separation between backend data structures
 * and frontend display requirements.
 */

import type {
  Transcription,
  TranscriptionStatus,
  SpeakerSegment,
  Speaker,
  CoreAnalyses,
  AnalysisResults,
  SummaryV2,
} from '@transcribe/shared';

/**
 * Conversation - Frontend representation of a Transcription
 * Used throughout the V2 UI components
 */
export interface Conversation {
  id: string;
  title: string;
  folderId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: ConversationStatus;
  source: ConversationSource;
  tags: string[];
  sharing: ConversationSharing;
}

export type ConversationStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface ConversationSource {
  audioUrl?: string;
  audioDuration: number; // seconds
  transcript: {
    text: string;
    speakers: number;
    confidence: number;
    speakerSegments?: SpeakerSegment[];
  };
  summary: {
    text: string; // V1 markdown summary (for backwards compatibility)
    keyPoints: string[]; // Extracted from markdown (V1) or from summaryV2.keyPoints (V2)
    generatedAt: Date;
    summaryV2?: SummaryV2; // V2 structured JSON summary (new)
  };
}

export interface ConversationSharing {
  isPublic: boolean;
  publicLinkId?: string;
  viewCount: number;
  sharedWith: string[];
}

/**
 * Map TranscriptionStatus to ConversationStatus
 */
function mapStatus(status: TranscriptionStatus): ConversationStatus {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'ready';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Extract summary text from various source locations in Transcription.
 * Supports both V1 (markdown) and V2 (structured JSON) summary formats.
 */
function extractSummary(transcription: Transcription): {
  text: string;
  keyPoints: string[];
  generatedAt: Date;
  summaryV2?: SummaryV2;
} {
  // Try coreAnalyses.summaryV2 first (V2 structured format - new)
  if (transcription.coreAnalyses?.summaryV2) {
    const v2 = transcription.coreAnalyses.summaryV2;
    return {
      // V2: summary.text may be empty - UI should check summaryV2 first
      text: transcription.coreAnalyses.summary || '', // Empty for V2 transcriptions
      keyPoints: v2.keyPoints.map((kp) => `${kp.topic}: ${kp.description}`),
      generatedAt: v2.generatedAt || transcription.completedAt || transcription.updatedAt,
      summaryV2: v2, // Pass through V2 structured data - this is the primary source for V2
    };
  }

  // Try coreAnalyses.summary (V1 markdown format)
  if (transcription.coreAnalyses?.summary) {
    return {
      text: transcription.coreAnalyses.summary,
      keyPoints: extractKeyPointsFromMarkdown(transcription.coreAnalyses.summary),
      generatedAt: transcription.completedAt || transcription.updatedAt,
    };
  }

  // Fall back to analyses.summary (legacy V1)
  if (transcription.analyses?.summary) {
    return {
      text: transcription.analyses.summary,
      keyPoints: extractKeyPointsFromMarkdown(transcription.analyses.summary),
      generatedAt: transcription.completedAt || transcription.updatedAt,
    };
  }

  // Legacy summary field
  if (transcription.summary) {
    return {
      text: transcription.summary,
      keyPoints: [],
      generatedAt: transcription.completedAt || transcription.updatedAt,
    };
  }

  return {
    text: '',
    keyPoints: [],
    generatedAt: transcription.createdAt,
  };
}

/**
 * Extract bullet points from markdown summary
 */
function extractKeyPointsFromMarkdown(markdown: string): string[] {
  const bulletPointRegex = /^[-*•]\s+(.+)$/gm;
  const matches = markdown.match(bulletPointRegex);
  if (!matches) return [];

  return matches
    .map(match => match.replace(/^[-*•]\s+/, '').trim())
    .filter(point => point.length > 0)
    .slice(0, 5); // Limit to 5 key points
}

/**
 * Extract transcript text from various source locations
 */
function extractTranscript(transcription: Transcription): {
  text: string;
  speakers: number;
  confidence: number;
  speakerSegments?: SpeakerSegment[];
} {
  // Use transcriptText directly (no longer duplicated in coreAnalyses)
  // Derive transcriptWithSpeakers from speakerSegments if needed
  const text =
    transcription.transcriptText ||
    transcription.analyses?.transcript || // Legacy fallback
    '';

  return {
    text,
    speakers: transcription.speakerCount || 1,
    confidence: transcription.diarizationConfidence || 0.9,
    speakerSegments: transcription.speakerSegments,
  };
}

/**
 * Convert a Transcription to a Conversation
 * This is the main adapter function used throughout the V2 UI
 */
export function transcriptionToConversation(transcription: Transcription): Conversation {
  const summary = extractSummary(transcription);
  const transcript = extractTranscript(transcription);

  return {
    id: transcription.id,
    title: transcription.title || transcription.fileName || 'Untitled',
    folderId: transcription.folderId || null,
    userId: transcription.userId,
    createdAt: new Date(transcription.createdAt),
    updatedAt: new Date(transcription.updatedAt),
    status: mapStatus(transcription.status),
    source: {
      audioUrl: transcription.fileUrl,
      audioDuration: transcription.duration || 0,
      transcript,
      summary,
    },
    tags: [], // Tags not implemented in backend yet
    sharing: {
      isPublic: !!transcription.shareToken,
      publicLinkId: transcription.shareToken,
      viewCount: transcription.shareSettings?.viewCount || 0,
      sharedWith: transcription.sharedWith?.map(s => s.email) || [],
    },
  };
}

/**
 * Convert an array of Transcriptions to Conversations
 */
export function transcriptionsToConversations(
  transcriptions: Transcription[]
): Conversation[] {
  return transcriptions.map(transcriptionToConversation);
}
