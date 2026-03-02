import { Logger } from '@nestjs/common';
import {
  SummaryV2,
  SummaryKeyPoint,
  SummaryDetailedSection,
  ConversationCategory,
} from '@transcribe/shared';

const logger = new Logger('SummaryParser');

/**
 * Raw JSON structure from AI response (before validation)
 */
interface RawSummaryJson {
  title?: unknown;
  intro?: unknown;
  conversationCategory?: unknown;
  keyPoints?: unknown[];
  detailedSections?: unknown[];
  decisions?: unknown[];
  nextSteps?: unknown[];
}

/**
 * Result of parsing the AI summary response, including the summary and any extra metadata.
 */
export interface ParsedSummaryResult {
  summary: SummaryV2;
  conversationCategory?: ConversationCategory;
}

const VALID_CATEGORIES: ConversationCategory[] = [
  'sales-call', 'business-meeting', 'one-on-one', 'interview', 'brainstorm',
  'solo-recording', 'presentation', 'workshop', 'support-call', 'general',
];

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
export function parseSummaryV2(aiResponse: string): SummaryV2;
export function parseSummaryV2(aiResponse: string, extractMetadata: true): ParsedSummaryResult;
export function parseSummaryV2(aiResponse: string, extractMetadata?: boolean): SummaryV2 | ParsedSummaryResult {
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
    logger.warn('Initial JSON parse failed, attempting repair...');

    // Try to repair truncated JSON by closing open structures
    const repaired = attemptJsonRepair(jsonString);
    if (repaired) {
      try {
        raw = JSON.parse(repaired);
        logger.log('JSON repair successful');
      } catch {
        logger.error('Failed to parse summary JSON:', parseError);
        logger.debug('Raw response:', aiResponse.substring(0, 500));
        throw new Error(
          `Failed to parse AI summary response as JSON: ${parseError.message}`,
        );
      }
    } else {
      logger.error('Failed to parse summary JSON:', parseError);
      logger.debug('Raw response:', aiResponse.substring(0, 500));
      throw new Error(
        `Failed to parse AI summary response as JSON: ${parseError.message}`,
      );
    }
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

  // Extract conversation category if present
  let conversationCategory: ConversationCategory | undefined;
  if (typeof raw.conversationCategory === 'string') {
    const cat = raw.conversationCategory.trim().toLowerCase() as ConversationCategory;
    if (VALID_CATEGORIES.includes(cat)) {
      conversationCategory = cat;
    } else {
      logger.warn(`Invalid conversationCategory "${raw.conversationCategory}", defaulting to undefined`);
    }
  }

  // Log validation results
  logger.debug(
    `Parsed summary: ${summary.keyPoints.length} key points, ${summary.detailedSections.length} detailed sections, category: ${conversationCategory || 'none'}`,
  );

  if (extractMetadata) {
    return { summary, conversationCategory };
  }

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
  // Coerce other types to string - explicitly handle as primitive or object
  if (typeof value === 'object') {
    return JSON.stringify(value).trim();
  }
  // Value is a primitive (number, boolean, etc.) - safe to convert
  return String(value as string | number | boolean).trim();
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

/**
 * Attempt to repair truncated JSON by closing open structures.
 * This handles cases where the AI output was cut off due to token limits.
 *
 * Strategy:
 * 1. Find the last complete value (string, number, object, array)
 * 2. Close any open strings, arrays, and objects
 *
 * @param jsonString The truncated JSON string
 * @returns Repaired JSON string or null if repair failed
 */
function attemptJsonRepair(jsonString: string): string | null {
  try {
    // Track open structures
    const stack: Array<'{' | '['> = [];
    let inString = false;
    let escaped = false;
    let _lastCompleteIndex = 0;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
        if (!inString) {
          // Just closed a string - this is a valid break point
          _lastCompleteIndex = i + 1;
        }
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
          _lastCompleteIndex = i + 1;
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
          _lastCompleteIndex = i + 1;
        }
      } else if (char === ',' || char === ':') {
        // After comma or colon is a valid break point
        _lastCompleteIndex = i + 1;
      }
    }

    // If we're in the middle of a string, try to find and close it
    let repaired = jsonString;
    if (inString) {
      // Find the last unescaped quote and truncate there, or close the string
      repaired = jsonString + '"';
    }

    // Remove any trailing incomplete values (partial strings, numbers, etc.)
    // Look for the last comma or colon and truncate after valid content
    const trimmed = repaired.trimEnd();
    let truncateAt = trimmed.length;

    // If ends with incomplete content after comma/colon, remove it
    const lastChar = trimmed[trimmed.length - 1];
    if (
      lastChar !== '"' &&
      lastChar !== '}' &&
      lastChar !== ']' &&
      lastChar !== 'e' &&
      lastChar !== 'l'
    ) {
      // Find last comma or structural character
      for (let i = trimmed.length - 1; i >= 0; i--) {
        const c = trimmed[i];
        if (c === ',' || c === ':' || c === '{' || c === '[') {
          truncateAt = i + 1;
          break;
        }
        if (c === '"' || c === '}' || c === ']') {
          truncateAt = i + 1;
          break;
        }
      }
    }

    repaired = trimmed.substring(0, truncateAt);

    // Remove trailing commas before closing brackets
    repaired = repaired.replace(/,(\s*$)/g, '$1');

    // Close any remaining open structures
    // Recount after our modifications
    stack.length = 0;
    inString = false;
    escaped = false;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }

    // Close remaining structures
    while (stack.length > 0) {
      const open = stack.pop();
      repaired += open === '{' ? '}' : ']';
    }

    logger.debug(
      `JSON repair: original ${jsonString.length} chars, repaired ${repaired.length} chars`,
    );
    return repaired;
  } catch (error) {
    logger.error('JSON repair failed:', error);
    return null;
  }
}
