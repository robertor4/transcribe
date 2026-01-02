/**
 * V2 Structured Summary Types
 *
 * These types support the V2 structured data architecture where AI generates
 * JSON directly instead of markdown blobs, separating content from presentation.
 */

/**
 * V2 Summary - Structured JSON format
 *
 * AI generates this directly as JSON. Each field has a specific purpose
 * and length constraint to ensure consistent, scannable summaries.
 */
export interface SummaryV2 {
  version: 2;
  /** Concise title (max 8 words) */
  title: string;
  /** 1-2 sentence overview of the conversation's purpose and outcome */
  intro: string;
  /** Key discussion points with short topics and one-sentence descriptions */
  keyPoints: SummaryKeyPoint[];
  /** Detailed paragraphs expanding on each key point */
  detailedSections: SummaryDetailedSection[];
  /** Concrete decisions made (only if actually discussed - DO NOT fabricate) */
  decisions?: string[];
  /** Forward-looking elements (only if explicitly discussed - DO NOT fabricate) */
  nextSteps?: string[];
  /** When the summary was generated */
  generatedAt: Date;
}

export interface SummaryKeyPoint {
  /** Short topic label (2-5 words MAXIMUM). Examples: "BNNet communicatie", "AI-features prioriteit" */
  topic: string;
  /** One concise sentence describing the topic */
  description: string;
}

export interface SummaryDetailedSection {
  /** Topic matching one of the keyPoints */
  topic: string;
  /** Full paragraph with specifics (3-5 sentences). Includes concrete details, examples, quotes. */
  content: string;
}

/**
 * LEGACY V1 Summary - Markdown blob format
 *
 * This format stores the summary as a markdown string that must be parsed
 * for rendering. Kept for backwards compatibility with existing data.
 */
export interface SummaryV1 {
  /** Version marker - undefined or 1 for legacy data */
  version?: 1;
  /** Markdown blob containing the full summary */
  text: string;
  /** May exist in some V1 data */
  keyPoints?: string[];
  /** When the summary was generated */
  generatedAt: Date;
}

/**
 * Union type for all summary versions
 */
export type Summary = SummaryV1 | SummaryV2;

/**
 * Type guard to check if a summary is V2 structured format
 *
 * @example
 * if (isSummaryV2(summary)) {
 *   // TypeScript knows summary is SummaryV2 here
 *   console.log(summary.keyPoints[0].topic);
 * }
 */
export function isSummaryV2(summary: Summary | null | undefined): summary is SummaryV2 {
  return summary !== null && summary !== undefined && 'version' in summary && summary.version === 2;
}

/**
 * Type guard to check if a summary is V1 legacy format
 */
export function isSummaryV1(summary: Summary | null | undefined): summary is SummaryV1 {
  return (
    summary !== null &&
    summary !== undefined &&
    'text' in summary &&
    (!('version' in summary) || summary.version === 1)
  );
}
