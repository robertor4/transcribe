import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SpeakerSegment } from '@transcribe/shared';

export interface SimpleReplacement {
  find: string;
  replace: string;
  caseSensitive: boolean;
  estimatedMatches: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ComplexCorrection {
  description: string;
  affectedSegmentIndices: number[];
  speakerTag?: string;
  reason: string;
}

export interface RoutingPlan {
  simpleReplacements: SimpleReplacement[];
  complexCorrections: ComplexCorrection[];
  estimatedTime: {
    regex: string;
    ai: string;
    total: string;
  };
  summary: {
    totalCorrections: number;
    simpleCount: number;
    complexCount: number;
    totalSegmentsAffected: number;
    totalSegments: number;
    percentageAffected: string;
  };
}

@Injectable()
export class TranscriptCorrectionRouterService {
  private readonly logger = new Logger(TranscriptCorrectionRouterService.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Phase 1: Analyze user's correction request and return routing plan
   */
  async analyzeAndRoute(
    segments: SpeakerSegment[],
    instructions: string,
    language: string = 'en',
    duration?: number,
  ): Promise<RoutingPlan> {
    this.logger.log('Analyzing correction request for intelligent routing...');

    // Prepare sample segments for pattern detection
    const sampleSegments = this.getSampleSegments(segments);

    // Build routing analysis prompt
    const prompt = this.buildRoutingPrompt(
      instructions,
      segments.length,
      language,
      duration,
      sampleSegments,
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getRoutingSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Low for consistent JSON output
        max_tokens: 4000, // Routing plan is small
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from routing AI');
      }

      const routingPlan: RoutingPlan = JSON.parse(responseText);

      // Validate routing plan structure
      this.validateRoutingPlan(routingPlan);

      // Recalculate totalSegmentsAffected based on actual data (don't trust AI's count)
      routingPlan.summary.totalSegmentsAffected = this.calculateAffectedSegments(
        segments,
        routingPlan.simpleReplacements,
        routingPlan.complexCorrections,
      );

      // Recalculate percentage
      routingPlan.summary.percentageAffected =
        ((routingPlan.summary.totalSegmentsAffected / segments.length) * 100).toFixed(1) + '%';

      this.logger.log(
        `Routing analysis complete: ${routingPlan.summary.simpleCount} simple, ${routingPlan.summary.complexCount} complex corrections affecting ${routingPlan.summary.totalSegmentsAffected} segments`,
      );

      return routingPlan;
    } catch (error) {
      this.logger.error('Routing analysis failed:', error);
      throw new Error(
        'Unable to analyze correction request. Please try simplifying your instructions.',
      );
    }
  }

  /**
   * Phase 3A: Apply simple regex replacements
   */
  applySimpleReplacements(
    segments: SpeakerSegment[],
    replacements: SimpleReplacement[],
  ): { correctedSegments: SpeakerSegment[]; affectedCount: number } {
    this.logger.log(`Applying ${replacements.length} simple regex replacements...`);

    const correctedSegments = segments.map((segment) => ({ ...segment }));
    let affectedCount = 0;

    for (const replacement of replacements) {
      const flags = replacement.caseSensitive ? 'g' : 'gi';
      const escapedFind = this.escapeRegex(replacement.find);
      const regex = new RegExp(`\\b${escapedFind}\\b`, flags);

      correctedSegments.forEach((segment) => {
        const newText = segment.text.replace(regex, replacement.replace);
        if (newText !== segment.text) {
          segment.text = newText;
          affectedCount++;
        }
      });
    }

    this.logger.log(`Simple replacements complete: ${affectedCount} segments affected`);

    return { correctedSegments, affectedCount };
  }

  /**
   * Phase 4: Merge regex and AI results
   */
  mergeResults(
    originalSegments: SpeakerSegment[],
    regexSegments: SpeakerSegment[],
    aiSegments: Map<number, string>, // index -> corrected text
  ): SpeakerSegment[] {
    this.logger.log('Merging regex and AI correction results...');

    // Start with regex results (which started from original)
    const mergedSegments = regexSegments.map((segment) => ({ ...segment }));

    // Apply AI corrections (overwrites regex if same segment)
    for (const [index, aiText] of aiSegments.entries()) {
      if (mergedSegments[index]) {
        mergedSegments[index].text = aiText;
      }
    }

    this.logger.log('Merge complete');

    return mergedSegments;
  }

  /**
   * Build routing analysis prompt
   */
  private buildRoutingPrompt(
    instructions: string,
    totalSegments: number,
    language: string,
    duration: number | undefined,
    sampleSegments: Array<{ index: number; speakerTag: string; text: string }>,
  ): string {
    return `TRANSCRIPT METADATA:
- Language: ${language}
- Total segments: ${totalSegments}
${duration ? `- Duration: ${Math.round(duration / 60)} minutes` : ''}

USER CORRECTION REQUEST:
${instructions}

SAMPLE SEGMENTS (for pattern detection):
${sampleSegments.map((s) => `[${s.index}] ${s.speakerTag}: ${s.text}`).join('\n')}

TASK: Analyze the user's correction request and categorize corrections.

Return a JSON object with this exact structure:
{
  "simpleReplacements": [
    {
      "find": "exact text to find (case-sensitive)",
      "replace": "exact replacement text",
      "caseSensitive": true or false,
      "estimatedMatches": number,
      "confidence": "high" or "medium" or "low"
    }
  ],
  "complexCorrections": [
    {
      "description": "brief description of what needs to change",
      "affectedSegmentIndices": [array of segment indices],
      "speakerTag": "optional: if specific to one speaker",
      "reason": "why AI processing is needed"
    }
  ],
  "estimatedTime": {
    "regex": "< 1 second",
    "ai": "X-Y seconds",
    "total": "X-Y seconds"
  },
  "summary": {
    "totalCorrections": total number of corrections,
    "simpleCount": number of simple replacements,
    "complexCount": number of complex corrections,
    "totalSegmentsAffected": unique segment count,
    "totalSegments": ${totalSegments},
    "percentageAffected": "X%"
  }
}

ROUTING GUIDELINES:

**Simple Replacements** (use regex) - HIGH confidence:
- Exact word/phrase replacements: "Change X to Y"
- Spelling corrections: "Fix misspelling of X"
- Consistent terminology: "Replace X with Y throughout"
- Name corrections: "Update Dr. Smith to Dr. Johnson"

**Complex Corrections** (require AI) - Route to AI:
- Tone changes: "Make more professional/casual/formal"
- Contextual fixes: "Fix grammar", "Improve clarity"
- Multi-word to single-word (or vice versa): "aardbeen" → "haar been"
- Word completion from fragments: "tuur" → "factuur"
- Cross-language corrections: "invloed" (Dutch) → "invoice" (English)
- Subjective improvements: "Better phrasing", "Remove filler words"

**Language-Specific Considerations** (${language}):
- For Dutch: Common phonetic errors in transcription (e.g., "tuur" missing "fac")
- For English: Homophones (their/there/they're)
- For code-switching: Allow cross-language corrections in business contexts

**Confidence Levels**:
- HIGH: Exact string match, no ambiguity, safe for regex
- MEDIUM: Could work with regex but might have edge cases
- LOW: Contextual understanding needed, route to AI

**Be Conservative**: When in doubt, route to AI for accuracy.`;
  }

  /**
   * System prompt for routing AI
   */
  private getRoutingSystemPrompt(): string {
    return `You are a transcript correction routing assistant. Your job is to analyze correction requests and intelligently categorize them as simple (regex-based) or complex (AI-required).

You must return valid JSON matching the exact structure provided in the user prompt.

Be conservative: if a correction requires contextual understanding, language nuance, or could have ambiguous matches, route it to AI processing.

Simple replacements should be HIGH confidence only - exact string matches with no ambiguity.`;
  }

  /**
   * Get sample segments for pattern detection
   */
  private getSampleSegments(
    segments: SpeakerSegment[],
  ): Array<{ index: number; speakerTag: string; text: string }> {
    const firstSegments = segments.slice(0, 20).map((s, i) => ({
      index: i,
      speakerTag: s.speakerTag,
      text: s.text,
    }));

    const lastSegments = segments.slice(-20).map((s, i) => ({
      index: segments.length - 20 + i,
      speakerTag: s.speakerTag,
      text: s.text,
    }));

    return [...firstSegments, ...lastSegments];
  }

  /**
   * Calculate the actual number of affected segments based on replacements and corrections
   */
  private calculateAffectedSegments(
    segments: SpeakerSegment[],
    simpleReplacements: SimpleReplacement[],
    complexCorrections: ComplexCorrection[],
  ): number {
    const affectedIndices = new Set<number>();

    // Find segments affected by simple replacements
    for (const replacement of simpleReplacements) {
      const flags = replacement.caseSensitive ? 'g' : 'gi';
      const escapedFind = this.escapeRegex(replacement.find);
      const regex = new RegExp(`\\b${escapedFind}\\b`, flags);

      segments.forEach((segment, index) => {
        if (segment.text.match(regex)) {
          affectedIndices.add(index);
        }
      });
    }

    // Add segments affected by complex corrections
    for (const correction of complexCorrections) {
      for (const index of correction.affectedSegmentIndices) {
        affectedIndices.add(index);
      }
    }

    return affectedIndices.size;
  }

  /**
   * Validate routing plan structure
   */
  private validateRoutingPlan(plan: any): void {
    if (!plan.simpleReplacements || !Array.isArray(plan.simpleReplacements)) {
      throw new Error('Invalid routing plan: missing simpleReplacements array');
    }

    if (!plan.complexCorrections || !Array.isArray(plan.complexCorrections)) {
      throw new Error('Invalid routing plan: missing complexCorrections array');
    }

    if (!plan.summary || typeof plan.summary.totalCorrections !== 'number') {
      throw new Error('Invalid routing plan: missing or invalid summary');
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
