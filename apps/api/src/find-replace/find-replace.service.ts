import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import type {
  FindReplaceMatch,
  FindReplaceResults,
  ReplaceRequest,
  ReplaceResponse,
  Transcription,
  GeneratedAnalysis,
  SpeakerSegment,
  StructuredOutput,
} from '@transcribe/shared';
import { SummaryV2 } from '@transcribe/shared/dist/types/summary';

interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

@Injectable()
export class FindReplaceService {
  private readonly logger = new Logger(FindReplaceService.name);

  constructor(
    private readonly transcriptionRepository: TranscriptionRepository,
    private readonly analysisRepository: AnalysisRepository,
  ) {}

  /**
   * Find all matches in a conversation across summary, transcript, and AI assets
   */
  async findMatches(
    userId: string,
    transcriptionId: string,
    findText: string,
    options: FindOptions,
  ): Promise<FindReplaceResults> {
    // Get the transcription
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new NotFoundException('Conversation not found');
    }

    // Get all AI assets for this conversation
    const analyses = await this.analysisRepository.getGeneratedAnalyses(
      transcriptionId,
      userId,
    );

    // Find matches in each content type
    const summaryMatches = this.findInSummary(transcription, findText, options);
    const transcriptMatches = this.findInTranscript(
      transcription.speakerSegments || [],
      findText,
      options,
    );
    const aiAssetMatches = this.findInAnalyses(analyses, findText, options);

    const totalMatches =
      summaryMatches.length +
      transcriptMatches.length +
      aiAssetMatches.reduce((sum, asset) => sum + asset.matches.length, 0);

    return {
      transcriptionId,
      findText,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      summary: summaryMatches,
      transcript: transcriptMatches,
      aiAssets: aiAssetMatches,
      totalMatches,
    };
  }

  /**
   * Replace matches based on selection criteria
   */
  async replaceMatches(
    userId: string,
    transcriptionId: string,
    request: ReplaceRequest,
  ): Promise<ReplaceResponse> {
    const { findText, replaceText, caseSensitive, wholeWord } = request;

    // First, find all matches to know what we're working with
    const results = await this.findMatches(userId, transcriptionId, findText, {
      caseSensitive,
      wholeWord,
    });

    // Determine which matches to replace
    let matchesToReplace: FindReplaceMatch[] = [];

    if (request.replaceAll) {
      // Replace all matches
      matchesToReplace = [
        ...results.summary,
        ...results.transcript,
        ...results.aiAssets.flatMap((a) => a.matches),
      ];
    } else if (request.replaceCategories) {
      // Replace by category
      if (request.replaceCategories.includes('summary')) {
        matchesToReplace.push(...results.summary);
      }
      if (request.replaceCategories.includes('transcript')) {
        matchesToReplace.push(...results.transcript);
      }
      if (request.replaceCategories.includes('aiAssets')) {
        matchesToReplace.push(...results.aiAssets.flatMap((a) => a.matches));
      }
    } else if (request.matchIds) {
      // Replace specific matches
      const matchIdSet = new Set(request.matchIds);
      const allMatches = [
        ...results.summary,
        ...results.transcript,
        ...results.aiAssets.flatMap((a) => a.matches),
      ];
      matchesToReplace = allMatches.filter((m) => matchIdSet.has(m.id));
    }

    if (matchesToReplace.length === 0) {
      return {
        transcriptionId,
        replacedCount: 0,
        replacedLocations: {
          summary: 0,
          transcript: 0,
          aiAssets: [],
        },
      };
    }

    // Perform replacements
    const replacedLocations = await this.performReplacements(
      userId,
      transcriptionId,
      matchesToReplace,
      findText,
      replaceText,
      { caseSensitive, wholeWord },
    );

    return {
      transcriptionId,
      replacedCount: matchesToReplace.length,
      replacedLocations,
    };
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Generate a deterministic ID for a match based on its location.
   * This ensures the same match gets the same ID across multiple findMatches calls.
   */
  private generateMatchId(
    type: 'summary' | 'transcript' | 'aiAsset',
    field: string,
    charOffset: number,
    arrayIndex?: number,
    analysisId?: string,
  ): string {
    const parts = [type, field, charOffset.toString()];
    if (arrayIndex !== undefined) {
      parts.push(arrayIndex.toString());
    }
    if (analysisId) {
      parts.push(analysisId);
    }
    return parts.join('-');
  }

  /**
   * Create a regex for finding text
   */
  private createSearchRegex(findText: string, options: FindOptions): RegExp {
    // Escape special regex characters
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let pattern = escaped;
    if (options.wholeWord) {
      pattern = `\\b${escaped}\\b`;
    }

    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  }

  /**
   * Get context around a match (50 chars before and after)
   */
  private getMatchContext(
    text: string,
    matchStart: number,
    matchLength: number,
  ): string {
    const contextLength = 50;
    const start = Math.max(0, matchStart - contextLength);
    const end = Math.min(text.length, matchStart + matchLength + contextLength);

    let context = text.slice(start, end);

    if (start > 0) {
      context = '...' + context;
    }
    if (end < text.length) {
      context = context + '...';
    }

    return context;
  }

  /**
   * Find matches in summary (both V1 and V2)
   */
  private findInSummary(
    transcription: Transcription,
    findText: string,
    options: FindOptions,
  ): FindReplaceMatch[] {
    const matches: FindReplaceMatch[] = [];
    const regex = this.createSearchRegex(findText, options);

    // Check summaryV2 (structured)
    if (transcription.summaryV2) {
      const summary = transcription.summaryV2;

      // Title
      this.findInTextField(summary.title, regex, 'title').forEach((m) => {
        matches.push({
          id: this.generateMatchId('summary', 'title', m.charOffset),
          matchedText: m.matchedText,
          context: m.context,
          location: { type: 'summary', summaryField: 'title' },
        });
      });

      // Intro
      this.findInTextField(summary.intro, regex, 'intro').forEach((m) => {
        matches.push({
          id: this.generateMatchId('summary', 'intro', m.charOffset),
          matchedText: m.matchedText,
          context: m.context,
          location: { type: 'summary', summaryField: 'intro' },
        });
      });

      // Key points
      summary.keyPoints?.forEach((point, index) => {
        this.findInTextField(point.topic, regex, 'topic').forEach((m) => {
          matches.push({
            id: this.generateMatchId(
              'summary',
              'keyPoint-topic',
              m.charOffset,
              index,
            ),
            matchedText: m.matchedText,
            context: m.context,
            location: {
              type: 'summary',
              summaryField: 'keyPoint',
              arrayIndex: index,
              subField: 'topic',
            },
          });
        });
        this.findInTextField(point.description, regex, 'description').forEach(
          (m) => {
            matches.push({
              id: this.generateMatchId(
                'summary',
                'keyPoint-description',
                m.charOffset,
                index,
              ),
              matchedText: m.matchedText,
              context: m.context,
              location: {
                type: 'summary',
                summaryField: 'keyPoint',
                arrayIndex: index,
                subField: 'description',
              },
            });
          },
        );
      });

      // Detailed sections
      summary.detailedSections?.forEach((section, index) => {
        this.findInTextField(section.topic, regex, 'topic').forEach((m) => {
          matches.push({
            id: this.generateMatchId(
              'summary',
              'detailedSection-topic',
              m.charOffset,
              index,
            ),
            matchedText: m.matchedText,
            context: m.context,
            location: {
              type: 'summary',
              summaryField: 'detailedSection',
              arrayIndex: index,
              subField: 'topic',
            },
          });
        });
        this.findInTextField(section.content, regex, 'content').forEach((m) => {
          matches.push({
            id: this.generateMatchId(
              'summary',
              'detailedSection-content',
              m.charOffset,
              index,
            ),
            matchedText: m.matchedText,
            context: m.context,
            location: {
              type: 'summary',
              summaryField: 'detailedSection',
              arrayIndex: index,
              subField: 'content',
            },
          });
        });
      });

      // Decisions
      summary.decisions?.forEach((decision, index) => {
        this.findInTextField(decision, regex, 'decision').forEach((m) => {
          matches.push({
            id: this.generateMatchId(
              'summary',
              'decision',
              m.charOffset,
              index,
            ),
            matchedText: m.matchedText,
            context: m.context,
            location: {
              type: 'summary',
              summaryField: 'decision',
              arrayIndex: index,
            },
          });
        });
      });

      // Next steps
      summary.nextSteps?.forEach((step, index) => {
        this.findInTextField(step, regex, 'nextStep').forEach((m) => {
          matches.push({
            id: this.generateMatchId(
              'summary',
              'nextStep',
              m.charOffset,
              index,
            ),
            matchedText: m.matchedText,
            context: m.context,
            location: {
              type: 'summary',
              summaryField: 'nextStep',
              arrayIndex: index,
            },
          });
        });
      });
    }

    return matches;
  }

  /**
   * Find matches in a text field
   * Returns partial match objects with charOffset for deterministic ID generation
   */
  private findInTextField(
    text: string | undefined,
    regex: RegExp,
    _fieldName: string,
  ): { matchedText: string; context: string; charOffset: number }[] {
    if (!text) return [];

    const matches: {
      matchedText: string;
      context: string;
      charOffset: number;
    }[] = [];
    let match: RegExpExecArray | null;

    // Reset regex lastIndex
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        matchedText: match[0],
        context: this.getMatchContext(text, match.index, match[0].length),
        charOffset: match.index,
      });
    }

    return matches;
  }

  /**
   * Find matches in transcript segments
   */
  private findInTranscript(
    segments: SpeakerSegment[],
    findText: string,
    options: FindOptions,
  ): FindReplaceMatch[] {
    const matches: FindReplaceMatch[] = [];
    const regex = this.createSearchRegex(findText, options);

    segments.forEach((segment, segmentIndex) => {
      if (!segment.text) return;

      let match: RegExpExecArray | null;
      regex.lastIndex = 0;

      while ((match = regex.exec(segment.text)) !== null) {
        matches.push({
          id: this.generateMatchId(
            'transcript',
            'segment',
            match.index,
            segmentIndex,
          ),
          location: {
            type: 'transcript',
            segmentIndex,
            charOffset: match.index,
          },
          matchedText: match[0],
          context: this.getMatchContext(
            segment.text,
            match.index,
            match[0].length,
          ),
        });
      }
    });

    return matches;
  }

  /**
   * Find matches in AI assets
   */
  private findInAnalyses(
    analyses: GeneratedAnalysis[],
    findText: string,
    options: FindOptions,
  ): {
    analysisId: string;
    templateName: string;
    matches: FindReplaceMatch[];
  }[] {
    const results: {
      analysisId: string;
      templateName: string;
      matches: FindReplaceMatch[];
    }[] = [];

    for (const analysis of analyses) {
      const matches: FindReplaceMatch[] = [];
      const regex = this.createSearchRegex(findText, options);

      if (
        analysis.contentType === 'markdown' &&
        typeof analysis.content === 'string'
      ) {
        // Simple string content
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((match = regex.exec(analysis.content)) !== null) {
          matches.push({
            id: this.generateMatchId(
              'aiAsset',
              'content',
              match.index,
              undefined,
              analysis.id,
            ),
            location: {
              type: 'aiAsset',
              analysisId: analysis.id,
              contentPath: 'content',
            },
            matchedText: match[0],
            context: this.getMatchContext(
              analysis.content,
              match.index,
              match[0].length,
            ),
          });
        }
      } else if (
        analysis.contentType === 'structured' &&
        typeof analysis.content === 'object'
      ) {
        // Structured content - traverse and find string values
        this.findInStructuredContent(
          analysis.content,
          regex,
          analysis.id,
          '',
          matches,
        );
      }

      if (matches.length > 0) {
        results.push({
          analysisId: analysis.id,
          templateName: analysis.templateName,
          matches,
        });
      }
    }

    return results;
  }

  /**
   * Recursively find matches in structured content
   */
  private findInStructuredContent(
    obj: unknown,
    regex: RegExp,
    analysisId: string,
    path: string,
    matches: FindReplaceMatch[],
  ): void {
    if (typeof obj === 'string') {
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;

      while ((match = regex.exec(obj)) !== null) {
        const contentPath = path || 'content';
        matches.push({
          id: this.generateMatchId(
            'aiAsset',
            contentPath,
            match.index,
            undefined,
            analysisId,
          ),
          location: {
            type: 'aiAsset',
            analysisId,
            contentPath,
          },
          matchedText: match[0],
          context: this.getMatchContext(obj, match.index, match[0].length),
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.findInStructuredContent(
          item,
          regex,
          analysisId,
          `${path}[${index}]`,
          matches,
        );
      });
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        // Skip 'type' field as it's a discriminator
        if (key === 'type') continue;
        this.findInStructuredContent(
          value,
          regex,
          analysisId,
          path ? `${path}.${key}` : key,
          matches,
        );
      }
    }
  }

  /**
   * Perform the actual replacements in the database
   */
  private async performReplacements(
    userId: string,
    transcriptionId: string,
    matches: FindReplaceMatch[],
    findText: string,
    replaceText: string,
    options: FindOptions,
  ): Promise<ReplaceResponse['replacedLocations']> {
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new NotFoundException('Conversation not found');
    }

    const result: ReplaceResponse['replacedLocations'] = {
      summary: 0,
      transcript: 0,
      aiAssets: [],
    };

    // Group matches by type
    const summaryMatches = matches.filter((m) => m.location.type === 'summary');
    const transcriptMatches = matches.filter(
      (m) => m.location.type === 'transcript',
    );
    const aiAssetMatches = matches.filter((m) => m.location.type === 'aiAsset');

    const regex = this.createSearchRegex(findText, options);

    // Replace in summary - only at specific match locations
    if (summaryMatches.length > 0 && transcription.summaryV2) {
      const updatedSummary = this.replaceInSummaryV2Selective(
        transcription.summaryV2,
        summaryMatches,
        replaceText,
      );
      await this.transcriptionRepository.updateTranscription(transcriptionId, {
        summaryV2: updatedSummary,
      });
      result.summary = summaryMatches.length;
    }

    // Replace in transcript - only at specific match locations
    if (transcriptMatches.length > 0 && transcription.speakerSegments) {
      const { transcriptText, speakerSegments } =
        this.replaceInTranscriptSelective(
          transcription,
          transcriptMatches,
          replaceText,
        );
      await this.transcriptionRepository.updateTranscription(transcriptionId, {
        transcriptText,
        speakerSegments,
      });
      result.transcript = transcriptMatches.length;
    }

    // Replace in AI assets (grouped by analysisId)
    const assetMatchesByAnalysis = new Map<string, FindReplaceMatch[]>();
    for (const match of aiAssetMatches) {
      const analysisId = match.location.analysisId!;
      if (!assetMatchesByAnalysis.has(analysisId)) {
        assetMatchesByAnalysis.set(analysisId, []);
      }
      assetMatchesByAnalysis.get(analysisId)!.push(match);
    }

    for (const [analysisId, assetMatches] of assetMatchesByAnalysis) {
      const analysis =
        await this.analysisRepository.getGeneratedAnalysisById(analysisId);
      if (analysis) {
        const updatedContent = this.replaceInAnalysis(
          analysis,
          regex,
          replaceText,
        );
        await this.analysisRepository.updateGeneratedAnalysis(analysisId, {
          content: updatedContent,
        });
        result.aiAssets.push({
          analysisId,
          count: assetMatches.length,
        });
      }
    }

    return result;
  }

  /**
   * Replace a string at a specific character offset
   */
  private replaceAtOffset(
    str: string,
    offset: number,
    matchedText: string,
    replaceText: string,
  ): string {
    return (
      str.substring(0, offset) +
      replaceText +
      str.substring(offset + matchedText.length)
    );
  }

  /**
   * Replace only specific matches in SummaryV2 based on their locations
   */
  private replaceInSummaryV2Selective(
    summary: SummaryV2,
    matches: FindReplaceMatch[],
    replaceText: string,
  ): SummaryV2 {
    // Create a mutable copy
    const result: SummaryV2 = {
      ...summary,
      keyPoints: summary.keyPoints?.map((p) => ({ ...p })),
      detailedSections: summary.detailedSections?.map((s) => ({ ...s })),
      decisions: summary.decisions ? [...summary.decisions] : undefined,
      nextSteps: summary.nextSteps ? [...summary.nextSteps] : undefined,
    };

    // Group matches by field and sort by offset descending (replace from end to preserve offsets)
    const matchesByField = new Map<string, FindReplaceMatch[]>();
    for (const match of matches) {
      const loc = match.location;
      let key: string;
      if (loc.summaryField === 'title') {
        key = 'title';
      } else if (loc.summaryField === 'intro') {
        key = 'intro';
      } else if (loc.summaryField === 'keyPoint') {
        key = `keyPoint-${loc.arrayIndex}-${loc.subField}`;
      } else if (loc.summaryField === 'detailedSection') {
        key = `detailedSection-${loc.arrayIndex}-${loc.subField}`;
      } else if (loc.summaryField === 'decision') {
        key = `decision-${loc.arrayIndex}`;
      } else if (loc.summaryField === 'nextStep') {
        key = `nextStep-${loc.arrayIndex}`;
      } else {
        continue;
      }

      if (!matchesByField.has(key)) {
        matchesByField.set(key, []);
      }
      matchesByField.get(key)!.push(match);
    }

    // Sort matches within each field by charOffset descending
    for (const fieldMatches of matchesByField.values()) {
      fieldMatches.sort((a, b) => {
        const offsetA = this.getCharOffsetFromMatch(a);
        const offsetB = this.getCharOffsetFromMatch(b);
        return offsetB - offsetA; // Descending order
      });
    }

    // Apply replacements
    for (const [key, fieldMatches] of matchesByField) {
      for (const match of fieldMatches) {
        const offset = this.getCharOffsetFromMatch(match);

        if (key === 'title' && result.title) {
          result.title = this.replaceAtOffset(
            result.title,
            offset,
            match.matchedText,
            replaceText,
          );
        } else if (key === 'intro' && result.intro) {
          result.intro = this.replaceAtOffset(
            result.intro,
            offset,
            match.matchedText,
            replaceText,
          );
        } else if (key.startsWith('keyPoint-') && result.keyPoints) {
          const parts = key.split('-');
          const index = parseInt(parts[1], 10);
          const subField = parts[2];
          if (subField === 'topic' && result.keyPoints[index]?.topic) {
            result.keyPoints[index].topic = this.replaceAtOffset(
              result.keyPoints[index].topic,
              offset,
              match.matchedText,
              replaceText,
            );
          } else if (
            subField === 'description' &&
            result.keyPoints[index]?.description
          ) {
            result.keyPoints[index].description = this.replaceAtOffset(
              result.keyPoints[index].description,
              offset,
              match.matchedText,
              replaceText,
            );
          }
        } else if (
          key.startsWith('detailedSection-') &&
          result.detailedSections
        ) {
          const parts = key.split('-');
          const index = parseInt(parts[1], 10);
          const subField = parts[2];
          if (subField === 'topic' && result.detailedSections[index]?.topic) {
            result.detailedSections[index].topic = this.replaceAtOffset(
              result.detailedSections[index].topic,
              offset,
              match.matchedText,
              replaceText,
            );
          } else if (
            subField === 'content' &&
            result.detailedSections[index]?.content
          ) {
            result.detailedSections[index].content = this.replaceAtOffset(
              result.detailedSections[index].content,
              offset,
              match.matchedText,
              replaceText,
            );
          }
        } else if (key.startsWith('decision-') && result.decisions) {
          const index = parseInt(key.split('-')[1], 10);
          if (result.decisions[index]) {
            result.decisions[index] = this.replaceAtOffset(
              result.decisions[index],
              offset,
              match.matchedText,
              replaceText,
            );
          }
        } else if (key.startsWith('nextStep-') && result.nextSteps) {
          const index = parseInt(key.split('-')[1], 10);
          if (result.nextSteps[index]) {
            result.nextSteps[index] = this.replaceAtOffset(
              result.nextSteps[index],
              offset,
              match.matchedText,
              replaceText,
            );
          }
        }
      }
    }

    return result;
  }

  /**
   * Get character offset from a match's ID (deterministic ID format: type-field-offset-...)
   */
  private getCharOffsetFromMatch(match: FindReplaceMatch): number {
    // ID format: type-field-charOffset[-arrayIndex][-analysisId]
    const parts = match.id.split('-');
    // charOffset is always the 3rd part (index 2)
    return parseInt(parts[2], 10);
  }

  /**
   * Replace only specific matches in transcript based on their locations
   */
  private replaceInTranscriptSelective(
    transcription: Transcription,
    matches: FindReplaceMatch[],
    replaceText: string,
  ): { transcriptText: string; speakerSegments: SpeakerSegment[] } {
    const segments = transcription.speakerSegments || [];

    // Create mutable copies of segments
    const updatedSegments = segments.map((segment) => ({ ...segment }));

    // Group matches by segment index
    const matchesBySegment = new Map<number, FindReplaceMatch[]>();
    for (const match of matches) {
      const segmentIndex = match.location.segmentIndex!;
      if (!matchesBySegment.has(segmentIndex)) {
        matchesBySegment.set(segmentIndex, []);
      }
      matchesBySegment.get(segmentIndex)!.push(match);
    }

    // Sort matches within each segment by charOffset descending
    for (const segmentMatches of matchesBySegment.values()) {
      segmentMatches.sort((a, b) => {
        const offsetA = a.location.charOffset!;
        const offsetB = b.location.charOffset!;
        return offsetB - offsetA; // Descending order
      });
    }

    // Apply replacements
    for (const [segmentIndex, segmentMatches] of matchesBySegment) {
      if (!updatedSegments[segmentIndex]?.text) continue;

      for (const match of segmentMatches) {
        const offset = match.location.charOffset!;
        updatedSegments[segmentIndex].text = this.replaceAtOffset(
          updatedSegments[segmentIndex].text,
          offset,
          match.matchedText,
          replaceText,
        );
      }
    }

    // Rebuild full transcript text from segments
    const transcriptText = updatedSegments
      .map((s) => s.text || '')
      .join('\n\n');

    return { transcriptText, speakerSegments: updatedSegments };
  }

  /**
   * Replace matches in an analysis
   */
  private replaceInAnalysis(
    analysis: GeneratedAnalysis,
    regex: RegExp,
    replaceText: string,
  ): string | StructuredOutput {
    if (
      analysis.contentType === 'markdown' &&
      typeof analysis.content === 'string'
    ) {
      regex.lastIndex = 0;
      return analysis.content.replace(regex, replaceText);
    }

    if (
      analysis.contentType === 'structured' &&
      typeof analysis.content === 'object'
    ) {
      return this.replaceInStructuredObject(
        analysis.content,
        regex,
        replaceText,
      );
    }

    return analysis.content;
  }

  /**
   * Recursively replace in structured object
   */
  private replaceInStructuredObject<T>(
    obj: T,
    regex: RegExp,
    replaceText: string,
  ): T {
    if (typeof obj === 'string') {
      regex.lastIndex = 0;
      return obj.replace(regex, replaceText) as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.replaceInStructuredObject(item, regex, replaceText),
      ) as T;
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Preserve 'type' field as-is
        if (key === 'type') {
          result[key] = value;
        } else {
          result[key] = this.replaceInStructuredObject(
            value,
            regex,
            replaceText,
          );
        }
      }
      return result as T;
    }

    return obj;
  }
}
