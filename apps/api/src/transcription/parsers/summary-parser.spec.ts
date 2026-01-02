import {
  parseSummaryV2,
  isValidSummaryV2,
  summaryV2ToMarkdown,
} from './summary-parser';

describe('SummaryParser', () => {
  describe('parseSummaryV2', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        title: 'Meeting Summary',
        intro: 'This was a productive meeting.',
        keyPoints: [
          { topic: 'Budget', description: 'Discussed Q4 budget allocation.' },
        ],
        detailedSections: [
          { topic: 'Budget Details', content: 'We reviewed the spreadsheet.' },
        ],
        decisions: ['Approve the budget'],
        nextSteps: ['Send the report'],
      });

      const result = parseSummaryV2(response);

      expect(result.version).toBe(2);
      expect(result.title).toBe('Meeting Summary');
      expect(result.intro).toBe('This was a productive meeting.');
      expect(result.keyPoints).toHaveLength(1);
      expect(result.keyPoints[0].topic).toBe('Budget');
      expect(result.detailedSections).toHaveLength(1);
      expect(result.decisions).toEqual(['Approve the budget']);
      expect(result.nextSteps).toEqual(['Send the report']);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle markdown code block wrapper', () => {
      const response = `\`\`\`json
{
  "title": "Test Meeting",
  "intro": "Overview here",
  "keyPoints": [{ "topic": "Topic 1", "description": "Desc 1" }],
  "detailedSections": []
}
\`\`\``;

      const result = parseSummaryV2(response);

      expect(result.title).toBe('Test Meeting');
      expect(result.keyPoints).toHaveLength(1);
    });

    it('should use fallback values for missing fields', () => {
      const response = JSON.stringify({});

      const result = parseSummaryV2(response);

      expect(result.title).toBe('Untitled');
      expect(result.intro).toBe('');
      expect(result.keyPoints).toEqual([]);
      expect(result.detailedSections).toEqual([]);
      expect(result.decisions).toBeUndefined();
      expect(result.nextSteps).toBeUndefined();
    });

    it('should throw error for invalid JSON', () => {
      const response = 'not valid json {';

      expect(() => parseSummaryV2(response)).toThrow(
        'Failed to parse AI summary response as JSON',
      );
    });

    it('should handle null and undefined values', () => {
      const response = JSON.stringify({
        title: null,
        intro: undefined,
        keyPoints: null,
        detailedSections: undefined,
      });

      const result = parseSummaryV2(response);

      expect(result.title).toBe('Untitled');
      expect(result.intro).toBe('');
      expect(result.keyPoints).toEqual([]);
      expect(result.detailedSections).toEqual([]);
    });

    it('should skip key points with empty topics', () => {
      const response = JSON.stringify({
        title: 'Test',
        intro: 'Intro',
        keyPoints: [
          { topic: '', description: 'No topic' },
          { topic: 'Valid', description: 'Valid description' },
          { topic: null, description: 'Null topic' },
        ],
        detailedSections: [],
      });

      const result = parseSummaryV2(response);

      expect(result.keyPoints).toHaveLength(1);
      expect(result.keyPoints[0].topic).toBe('Valid');
    });

    it('should skip detailed sections with empty topic or content', () => {
      const response = JSON.stringify({
        title: 'Test',
        intro: 'Intro',
        keyPoints: [],
        detailedSections: [
          { topic: '', content: 'Has content' },
          { topic: 'Has topic', content: '' },
          { topic: 'Valid', content: 'Valid content' },
        ],
      });

      const result = parseSummaryV2(response);

      expect(result.detailedSections).toHaveLength(1);
      expect(result.detailedSections[0].topic).toBe('Valid');
    });

    it('should skip non-object items in arrays', () => {
      const response = JSON.stringify({
        title: 'Test',
        intro: 'Intro',
        keyPoints: [
          'string',
          null,
          123,
          { topic: 'Valid', description: 'Desc' },
        ],
        detailedSections: [],
      });

      const result = parseSummaryV2(response);

      expect(result.keyPoints).toHaveLength(1);
    });

    it('should coerce non-string values to strings', () => {
      const response = JSON.stringify({
        title: 123,
        intro: { nested: 'object' },
        keyPoints: [{ topic: 456, description: true }],
        detailedSections: [],
      });

      const result = parseSummaryV2(response);

      expect(result.title).toBe('123');
      expect(result.intro).toContain('nested');
      expect(result.keyPoints[0].topic).toBe('456');
      expect(result.keyPoints[0].description).toBe('true');
    });

    it('should filter empty strings from decisions and nextSteps', () => {
      const response = JSON.stringify({
        title: 'Test',
        intro: 'Intro',
        keyPoints: [],
        detailedSections: [],
        decisions: ['Valid', '', null, 'Another valid'],
        nextSteps: ['Step 1', undefined, 'Step 2'],
      });

      const result = parseSummaryV2(response);

      expect(result.decisions).toEqual(['Valid', 'Another valid']);
      expect(result.nextSteps).toEqual(['Step 1', 'Step 2']);
    });

    it('should not include empty decisions/nextSteps arrays', () => {
      const response = JSON.stringify({
        title: 'Test',
        intro: 'Intro',
        keyPoints: [],
        detailedSections: [],
        decisions: [],
        nextSteps: ['', null],
      });

      const result = parseSummaryV2(response);

      expect(result.decisions).toBeUndefined();
      expect(result.nextSteps).toBeUndefined();
    });
  });

  describe('isValidSummaryV2', () => {
    it('should return true for valid summary', () => {
      const summary = {
        version: 2,
        title: 'Valid Title',
        intro: 'Valid intro',
        keyPoints: [{ topic: 'Topic', description: 'Desc' }],
        detailedSections: [],
        generatedAt: new Date(),
      };

      expect(isValidSummaryV2(summary)).toBe(true);
    });

    it('should return false for empty title', () => {
      const summary = {
        version: 2,
        title: '',
        intro: 'Intro',
        keyPoints: [{ topic: 'Topic', description: 'Desc' }],
        detailedSections: [],
        generatedAt: new Date(),
      };

      expect(isValidSummaryV2(summary)).toBe(false);
    });

    it('should return false for empty keyPoints', () => {
      const summary = {
        version: 2,
        title: 'Title',
        intro: 'Intro',
        keyPoints: [],
        detailedSections: [],
        generatedAt: new Date(),
      };

      expect(isValidSummaryV2(summary)).toBe(false);
    });

    it('should return false for wrong version', () => {
      const summary = {
        version: 1,
        title: 'Title',
        intro: 'Intro',
        keyPoints: [{ topic: 'Topic', description: 'Desc' }],
        detailedSections: [],
        generatedAt: new Date(),
      } as any;

      expect(isValidSummaryV2(summary)).toBe(false);
    });
  });

  describe('summaryV2ToMarkdown', () => {
    it('should convert complete summary to markdown', () => {
      const summary = {
        version: 2 as const,
        title: 'Meeting Summary',
        intro: 'This was a great meeting.',
        keyPoints: [
          { topic: 'Budget', description: 'Discussed budget allocation.' },
          { topic: 'Timeline', description: 'Set project milestones.' },
        ],
        detailedSections: [
          { topic: 'Budget Details', content: 'We reviewed the Q4 budget.' },
        ],
        decisions: ['Approve budget', 'Start project'],
        nextSteps: ['Send report', 'Schedule follow-up'],
        generatedAt: new Date(),
      };

      const result = summaryV2ToMarkdown(summary);

      expect(result).toContain('# Meeting Summary');
      expect(result).toContain('This was a great meeting.');
      expect(result).toContain('## Key discussion points');
      expect(result).toContain('**Budget:** Discussed budget allocation.');
      expect(result).toContain('**Timeline:** Set project milestones.');
      expect(result).toContain('## Detailed discussion');
      expect(result).toContain('**Budget Details**');
      expect(result).toContain('We reviewed the Q4 budget.');
      expect(result).toContain('## Decisions made');
      expect(result).toContain('- Approve budget');
      expect(result).toContain('## Next steps');
      expect(result).toContain('- Send report');
    });

    it('should skip sections with empty arrays', () => {
      const summary = {
        version: 2 as const,
        title: 'Simple Summary',
        intro: 'Brief overview.',
        keyPoints: [],
        detailedSections: [],
        generatedAt: new Date(),
      };

      const result = summaryV2ToMarkdown(summary);

      expect(result).toContain('# Simple Summary');
      expect(result).not.toContain('## Key discussion points');
      expect(result).not.toContain('## Detailed discussion');
      expect(result).not.toContain('## Decisions made');
      expect(result).not.toContain('## Next steps');
    });

    it('should include styled intro', () => {
      const summary = {
        version: 2 as const,
        title: 'Test',
        intro: 'This is the intro.',
        keyPoints: [],
        detailedSections: [],
        generatedAt: new Date(),
      };

      const result = summaryV2ToMarkdown(summary);

      expect(result).toContain(
        '<p style="font-size: 1.4em;">This is the intro.</p>',
      );
    });
  });
});
