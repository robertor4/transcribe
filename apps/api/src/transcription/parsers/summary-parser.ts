import { Logger } from '@nestjs/common';
import {
  SummaryV2,
  SummaryKeyPoint,
  SummaryDetailedSection,
} from '@transcribe/shared';

const logger = new Logger('SummaryParser');

/**
 * Raw JSON structure from AI response (before validation)
 */
interface RawSummaryJson {
  title?: unknown;
  intro?: unknown;
  keyPoints?: unknown[];
  detailedSections?: unknown[];
  decisions?: unknown[];
  nextSteps?: unknown[];
}

/**
 * Parse and validate AI JSON response into SummaryV2 structure.
 *
 * This parser is defensive - it handles:
 * - JSON wrapped in markdown code blocks
 * - Missing or malformed fields
 * - Type coercion for unexpected types
 *
 * @param aiResponse Raw string response from GPT
 * @returns Validated SummaryV2 object
 * @throws Error if JSON parsing fails completely
 */
export function parseSummaryV2(aiResponse: string): SummaryV2 {
  // Clean up the response - remove markdown code blocks if present
  let jsonString = aiResponse.trim();

  // Remove ```json ... ``` wrapper if present
  if (jsonString.startsWith('```')) {
    const endIndex = jsonString.lastIndexOf('```');
    if (endIndex > 3) {
      jsonString = jsonString
        .substring(jsonString.indexOf('\n') + 1, endIndex)
        .trim();
    }
  }

  // Parse JSON
  let raw: RawSummaryJson;
  try {
    raw = JSON.parse(jsonString);
  } catch (parseError) {
    logger.error('Failed to parse summary JSON:', parseError);
    logger.debug('Raw response:', aiResponse.substring(0, 500));
    throw new Error(
      `Failed to parse AI summary response as JSON: ${parseError.message}`,
    );
  }

  // Validate and transform to SummaryV2
  const summary: SummaryV2 = {
    version: 2,
    title: validateString(raw.title, 'Untitled'),
    intro: validateString(raw.intro, ''),
    keyPoints: validateKeyPoints(raw.keyPoints),
    detailedSections: validateDetailedSections(raw.detailedSections),
    generatedAt: new Date(),
  };

  // Only add decisions if they exist and have content
  const decisions = validateStringArray(raw.decisions);
  if (decisions.length > 0) {
    summary.decisions = decisions;
  }

  // Only add nextSteps if they exist and have content
  const nextSteps = validateStringArray(raw.nextSteps);
  if (nextSteps.length > 0) {
    summary.nextSteps = nextSteps;
  }

  // Log validation results
  logger.debug(
    `Parsed summary: ${summary.keyPoints.length} key points, ${summary.detailedSections.length} detailed sections`,
  );

  return summary;
}

/**
 * Validate and coerce a value to string
 */
function validateString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  // Coerce other types to string
  return String(value).trim();
}

/**
 * Validate and transform key points array
 */
function validateKeyPoints(value: unknown): SummaryKeyPoint[] {
  if (!Array.isArray(value)) {
    logger.warn('keyPoints is not an array, returning empty');
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        logger.warn(`keyPoint[${index}] is not an object, skipping`);
        return null;
      }

      const obj = item as Record<string, unknown>;
      const topic = validateString(obj.topic, '');
      const description = validateString(obj.description, '');

      // Skip items with empty topic
      if (!topic) {
        logger.warn(`keyPoint[${index}] has empty topic, skipping`);
        return null;
      }

      return { topic, description };
    })
    .filter((item): item is SummaryKeyPoint => item !== null);
}

/**
 * Validate and transform detailed sections array
 */
function validateDetailedSections(value: unknown): SummaryDetailedSection[] {
  if (!Array.isArray(value)) {
    logger.warn('detailedSections is not an array, returning empty');
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        logger.warn(`detailedSection[${index}] is not an object, skipping`);
        return null;
      }

      const obj = item as Record<string, unknown>;
      const topic = validateString(obj.topic, '');
      const content = validateString(obj.content, '');

      // Skip items with empty topic or content
      if (!topic || !content) {
        logger.warn(
          `detailedSection[${index}] has empty topic or content, skipping`,
        );
        return null;
      }

      return { topic, content };
    })
    .filter((item): item is SummaryDetailedSection => item !== null);
}

/**
 * Validate and transform string array
 */
function validateStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item === null || item === undefined) {
        return '';
      }
      return String(item).trim();
    })
    .filter((item) => item.length > 0);
}

/**
 * Check if a summary appears to be valid V2 format
 */
export function isValidSummaryV2(summary: SummaryV2): boolean {
  return (
    summary.version === 2 &&
    typeof summary.title === 'string' &&
    summary.title.length > 0 &&
    typeof summary.intro === 'string' &&
    Array.isArray(summary.keyPoints) &&
    summary.keyPoints.length > 0 &&
    Array.isArray(summary.detailedSections)
  );
}

/**
 * Convert SummaryV2 to markdown string for backwards compatibility
 * with systems that expect markdown format.
 */
export function summaryV2ToMarkdown(summary: SummaryV2): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${summary.title}`);
  lines.push('');

  // Intro with HTML styling (V1 format)
  lines.push(`<p style="font-size: 1.4em;">${summary.intro}</p>`);
  lines.push('');

  // Key points
  if (summary.keyPoints.length > 0) {
    lines.push('## Key discussion points');
    for (const point of summary.keyPoints) {
      lines.push(`- **${point.topic}:** ${point.description}`);
    }
    lines.push('');
  }

  // Detailed sections
  if (summary.detailedSections.length > 0) {
    lines.push('## Detailed discussion');
    for (const section of summary.detailedSections) {
      lines.push(`**${section.topic}**`);
      lines.push(section.content);
      lines.push('');
    }
  }

  // Decisions (if present)
  if (summary.decisions && summary.decisions.length > 0) {
    lines.push('## Decisions made');
    for (const decision of summary.decisions) {
      lines.push(`- ${decision}`);
    }
    lines.push('');
  }

  // Next steps (if present)
  if (summary.nextSteps && summary.nextSteps.length > 0) {
    lines.push('## Next steps');
    for (const step of summary.nextSteps) {
      lines.push(`- ${step}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
