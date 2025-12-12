/**
 * V2 Structured Data Types
 *
 * These types support the V2 architecture where AI generates structured JSON
 * instead of markdown blobs, separating content from presentation.
 */

// Summary types
export {
  Summary,
  SummaryV1,
  SummaryV2,
  SummaryKeyPoint,
  SummaryDetailedSection,
  isSummaryV1,
  isSummaryV2,
} from './summary';

// Transcript types
export {
  Transcript,
  TranscriptV1,
  TranscriptV2,
  TranscriptSegment,
  isTranscriptV1,
  isTranscriptV2,
  toSpeakerSegment,
  toTranscriptSegment,
} from './transcript';
