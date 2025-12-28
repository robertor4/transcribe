'use client';

import React, { useMemo } from 'react';

/**
 * LEGACY V1: SummaryV1Renderer
 *
 * This component handles rendering of V1 markdown-based summaries.
 * For backwards compatibility with existing transcriptions that have
 * markdown blob summaries instead of structured V2 JSON.
 *
 * New transcriptions use V2 structured format rendered by SummaryV2Renderer.
 */

interface SummaryV1RendererProps {
  content: string;
}

interface ParsedSummary {
  title: string | null;
  intro: string | null;
  keyPointsTitle: string | null;
  keyPoints: string[];
  detailedSections: {
    title: string;
    content: string;
  }[];
}

/**
 * LEGACY V1: Render section content, handling bullet points
 */
const SectionContent: React.FC<{ content: string }> = ({ content }) => {
  // Check if content has bullet points (starts with "- " pattern after splitting)
  const hasBulletPoints = /(?:^|\s)-\s+\S/.test(content);

  if (hasBulletPoints) {
    // Split by bullet point pattern and filter empty items
    const items = content
      .split(/\s*-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    // First item might be intro text (before first bullet)
    const introText = items[0] && !content.trim().startsWith('-') ? items.shift() : null;

    return (
      <div className="text-base text-gray-700 dark:text-gray-300 leading-loose">
        {introText && <p className="mb-2">{introText}</p>}
        {items.length > 0 && (
          <ul className="space-y-1 list-disc list-inside">
            {items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // No bullet points, render as paragraph
  return (
    <p className="text-base text-gray-700 dark:text-gray-300 leading-loose">
      {content}
    </p>
  );
};

export const SummaryV1Renderer: React.FC<SummaryV1RendererProps> = ({ content }) => {
  const parsed = useMemo(() => parseSummaryContent(content), [content]);

  return (
    <div className="space-y-8 pb-12">
      {/* Intro Paragraph */}
      {parsed.intro && (
        <p className="text-xl font-light text-gray-700 dark:text-gray-300 leading-relaxed">
          {parsed.intro}
        </p>
      )}

      {/* Key Points Box */}
      {parsed.keyPoints.length > 0 && (
        <div className="px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#8D6AFA] rounded-r-lg">
          <h3 className="text-lg font-bold text-[#8D6AFA] mb-5 uppercase tracking-wide">
            {parsed.keyPointsTitle && parsed.keyPointsTitle.length < 50
              ? parsed.keyPointsTitle
              : 'Key Points'}
          </h3>
          <ol className="mx-4 list-decimal list-inside divide-y divide-gray-200 dark:divide-gray-700">
            {parsed.keyPoints.map((point, idx) => (
              <li key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed py-4 first:pt-0 last:pb-0">
                {renderKeyPoint(point)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Detailed Discussion Sections */}
      {parsed.detailedSections.length > 0 && (
        <div className="space-y-6 mt-2">
          {parsed.detailedSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {section.title.replace(/:$/, '')}
              </h4>
              <SectionContent content={section.content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * LEGACY V1: Parse markdown/HTML content into structured format for rendering
 */
function parseSummaryContent(content: string): ParsedSummary {
  const result: ParsedSummary = {
    title: null,
    intro: null,
    keyPointsTitle: null,
    keyPoints: [],
    detailedSections: [],
  };

  // Extract HTML-styled intro paragraph if present
  const htmlIntroMatch = content.match(/<p\s+style="font-size:\s*1\.4em;">([^<]+)<\/p>/);
  if (htmlIntroMatch) {
    result.intro = htmlIntroMatch[1].trim();
  }

  // Split content into lines for processing
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection: 'intro' | 'keypoints' | 'detailed' | 'detailed_blob' = 'intro';
  let currentDetailedTitle: string | null = null;
  let currentDetailedContent: string[] = [];
  let detailedBlobContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip HTML intro (already extracted)
    if (line.includes('<p style=')) continue;

    // Check for main title (# Title or ## Title at the start)
    if (i === 0 && (line.startsWith('# ') || line.startsWith('## '))) {
      result.title = line.replace(/^#+\s*/, '');
      continue;
    }

    // Check for key points section header (must be a header line, not content)
    // Header lines start with # or are short (< 100 chars)
    if (isKeyPointsHeader(line) && (line.startsWith('#') || line.length < 100)) {
      result.keyPointsTitle = line.replace(/^#+\s*/, '').replace(/[*_]/g, '');
      currentSection = 'keypoints';
      continue;
    }

    // Check for detailed discussion section header (e.g., "## Gedetailleerde bespreking")
    if (isDetailedSectionHeader(line)) {
      currentSection = 'detailed_blob';
      detailedBlobContent = [];
      continue;
    }

    // Collect all content after detailed section header for blob parsing
    if (currentSection === 'detailed_blob') {
      // Check for ### subsection headers (common format)
      if (line.startsWith('### ')) {
        // Save previous detailed section if exists
        if (currentDetailedTitle && currentDetailedContent.length > 0) {
          result.detailedSections.push({
            title: currentDetailedTitle,
            content: cleanSectionContent(currentDetailedContent.join(' ')),
          });
        }
        currentDetailedTitle = line.replace(/^###\s*/, '');
        currentDetailedContent = [];
        currentSection = 'detailed'; // Switch to detailed mode for line-by-line collection
        continue;
      }
      // Also check for other section headers that end detailed blob (## Besluiten, ## Volgende stappen, etc.)
      if (line.startsWith('## ') && !isDetailedSectionHeader(line)) {
        // This is a new top-level section, stop collecting detailed blob
        // Don't continue - let it fall through to be processed
      } else {
        detailedBlobContent.push(line);
        continue;
      }
    }

    // Check for detailed section headers (bold text or ## headers)
    // Can appear after intro, keypoints, or other detailed sections
    if (currentSection === 'intro' || currentSection === 'keypoints' || currentSection === 'detailed') {
      const detailedHeader = extractDetailedHeader(line);
      if (detailedHeader && !isKeyPointsHeader(line) && !isDetailedSectionHeader(line)) {
        // Save previous detailed section if exists
        if (currentDetailedTitle && currentDetailedContent.length > 0) {
          result.detailedSections.push({
            title: currentDetailedTitle,
            content: currentDetailedContent.join(' '),
          });
        }
        currentDetailedTitle = detailedHeader;
        currentDetailedContent = [];
        currentSection = 'detailed';
        continue;
      }
    }

    // Process bullet points (key points)
    if (currentSection === 'keypoints') {
      // Standard bullet format: - item or * item or 1. item
      if (line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\.\s/)) {
        const bulletContent = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        result.keyPoints.push(bulletContent);
        continue;
      }
      // Bold format: **Topic:** description - extract just the topic as key point
      const boldKeyPointMatch = line.match(/^\*\*([^*]+)\*\*:?\s*(.*)/);
      if (boldKeyPointMatch) {
        const topic = boldKeyPointMatch[1].trim();
        const description = boldKeyPointMatch[2]?.trim();
        // Format as "Topic: description" or just "Topic" if no description
        result.keyPoints.push(description ? `${topic}: ${description}` : topic);
        continue;
      }
    }

    // Process detailed section content
    if (currentSection === 'detailed' && currentDetailedTitle) {
      // Check for new ### subsection header
      if (line.startsWith('### ')) {
        // Save previous detailed section
        if (currentDetailedContent.length > 0) {
          result.detailedSections.push({
            title: currentDetailedTitle,
            content: cleanSectionContent(currentDetailedContent.join(' ')),
          });
        }
        currentDetailedTitle = line.replace(/^###\s*/, '');
        currentDetailedContent = [];
        continue;
      }
      // Check for ## header (end of detailed sections)
      if (line.startsWith('## ')) {
        // Save current section and reset
        if (currentDetailedContent.length > 0) {
          result.detailedSections.push({
            title: currentDetailedTitle,
            content: cleanSectionContent(currentDetailedContent.join(' ')),
          });
        }
        currentDetailedTitle = null;
        currentDetailedContent = [];
        currentSection = 'intro'; // Reset to allow other sections to be parsed
        // Don't continue - let this ## header be processed by other logic
      } else {
        // Regular content line - add to current section
        const cleanLine = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        if (cleanLine) {
          currentDetailedContent.push(cleanLine);
        }
        continue;
      }
    }

    // Default: if no intro yet and not a header, use as intro
    if (
      !result.intro &&
      currentSection === 'intro' &&
      !line.startsWith('#') &&
      !line.startsWith('-') &&
      !line.startsWith('*')
    ) {
      result.intro = line;
    }
  }

  // Save last detailed section (for line-by-line parsing)
  if (currentDetailedTitle && currentDetailedContent.length > 0) {
    result.detailedSections.push({
      title: currentDetailedTitle,
      content: currentDetailedContent.join(' '),
    });
  }

  // Parse detailed blob content (for inline **bold** marker format)
  // This handles legacy format where sections use **Bold Title** instead of ### Headers
  if (detailedBlobContent.length > 0) {
    const blobText = detailedBlobContent.join(' ');
    const parsedSections = parseDetailedContent(blobText);
    result.detailedSections.push(...parsedSections);
  }

  return result;
}

/**
 * LEGACY V1: Check if a line is a key points section header
 */
function isKeyPointsHeader(line: string): boolean {
  const lowerLine = line.toLowerCase();
  const patterns = [
    'key points',
    'keypoints',
    'key discussion points',
    'key discussion',
    'belangrijkste',
    'discussiepunten',
    'hoofdpunten',
    'kernpunten',
    'puntos clave',
    'points clés',
    'wichtigste punkte',
    'highlights',
    'summary points',
    'main points',
    'takeaways',
    'key takeaways',
  ];
  return patterns.some((pattern) => lowerLine.includes(pattern));
}

/**
 * LEGACY V1: Check if a line is a detailed discussion section header (multilingual)
 */
function isDetailedSectionHeader(line: string): boolean {
  const lowerLine = line.toLowerCase();
  const patterns = [
    'detailed discussion',
    'detailed analysis',
    'gedetailleerde bespreking',
    'gedetailleerde analyse',
    'discussion détaillée',
    'analyse détaillée',
    'discusión detallada',
    'análisis detallado',
    'detaillierte diskussion',
    'detaillierte analyse',
  ];
  return patterns.some((pattern) => lowerLine.includes(pattern));
}

/**
 * LEGACY V1: Parse detailed content by splitting on section markers
 * Handles both:
 * - Inline **bold** markers: **Topic Title** Content text...
 * - Markdown ## headers: ## Section Title content...
 */
function parseDetailedContent(content: string): { title: string; content: string }[] {
  // Combined regex to match either ## headers or **bold** markers
  // For ## headers: match "## " followed by text until next ## or **
  // For **bold**: match **text** with optional colon
  const regex = /(?:##\s+([^#*]+?)(?=\s*(?:##|\*\*|$))|\*\*([^*]+)\*\*:?\s*)/g;
  const sections: { title: string; content: string }[] = [];

  let lastIndex = 0;
  let lastTitle: string | null = null;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Save previous section content
    if (lastTitle !== null) {
      let sectionContent = content.slice(lastIndex, match.index).trim();
      // Clean up the content
      sectionContent = cleanSectionContent(sectionContent);
      if (sectionContent) {
        sections.push({ title: lastTitle, content: sectionContent });
      }
    }
    // match[1] is for ## headers, match[2] is for **bold**
    lastTitle = (match[1] || match[2]).trim();
    lastIndex = regex.lastIndex;
  }

  // Save final section
  if (lastTitle !== null) {
    let sectionContent = content.slice(lastIndex).trim();
    sectionContent = cleanSectionContent(sectionContent);
    if (sectionContent) {
      sections.push({ title: lastTitle, content: sectionContent });
    }
  }

  return sections;
}

/**
 * LEGACY V1: Clean up section content by removing markdown artifacts
 * Preserves bullet point structure (- item) for proper rendering
 */
function cleanSectionContent(content: string): string {
  return content
    // Remove trailing standalone hyphens/dashes (but preserve bullet points)
    .replace(/\s+[-–—]\s*$/, '')
    // Remove standalone # characters (markdown artifacts)
    .replace(/\s*#\s*$/g, '')
    .replace(/\s+#\s+/g, ' ')
    // Normalize spaces around bullet points to ensure consistent parsing
    // Convert "text - item" to "text - item" (preserve the dash as bullet)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * LEGACY V1: Extract detailed section header from bold text or ## header
 */
function extractDetailedHeader(line: string): string | null {
  // Match ## Header
  if (line.startsWith('## ')) {
    return line.replace(/^##\s*/, '');
  }

  // Match **Bold text:** at start of line (common in detailed sections)
  const boldMatch = line.match(/^\*\*([^*]+)\*\*:?\s*/);
  if (boldMatch && boldMatch[1].length > 10 && boldMatch[1].length < 100) {
    return boldMatch[1];
  }

  return null;
}

/**
 * LEGACY V1: Render a key point with topic:description format
 *
 * Handles multiple formats:
 * - "TOPIC: description" (uppercase topic with colon)
 * - "**Topic:** description" (markdown bold with colon)
 * - "Topic: description" (plain text with colon)
 * - "Just a plain point" (no colon - render as-is)
 */
function renderKeyPoint(point: string): React.ReactNode {
  // First, try to extract **bold** topic format: **Topic:** description
  const boldMatch = point.match(/^\*\*([^*]+)\*\*:?\s*(.*)/);
  if (boldMatch) {
    // Remove trailing colon from topic if present (since we add one in rendering)
    const topic = boldMatch[1].trim().replace(/:$/, '');
    const description = boldMatch[2]?.trim();
    return (
      <>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {topic}:
        </span>{' '}
        {description}
      </>
    );
  }

  // Try to extract "Topic: description" format (colon-separated)
  // Match everything up to the first colon as topic, rest as description
  const colonMatch = point.match(/^([^:]+):\s*(.+)/);
  if (colonMatch) {
    const topic = colonMatch[1].trim();
    const description = colonMatch[2].trim();
    return (
      <>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {topic}:
        </span>{' '}
        {description}
      </>
    );
  }

  // No recognizable format - render as plain text
  return point;
}
