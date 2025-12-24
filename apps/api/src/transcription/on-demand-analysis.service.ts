import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { GeneratedAnalysis } from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';
import { TranscriptionService } from './transcription.service';
import { AnalysisTemplateService } from './analysis-template.service';

/**
 * Service for managing on-demand analysis generation
 * Handles generating, retrieving, and deleting user-requested analyses
 */
@Injectable()
export class OnDemandAnalysisService {
  private readonly logger = new Logger(OnDemandAnalysisService.name);

  constructor(
    private firebaseService: FirebaseService,
    private transcriptionService: TranscriptionService,
    private templateService: AnalysisTemplateService,
  ) {}

  /**
   * Generate analysis from a template
   * @param transcriptionId - The transcription to analyze
   * @param templateId - The template to use for analysis
   * @param userId - The user requesting the analysis
   * @param customInstructions - Optional custom instructions to append to context
   * @param options - Optional settings
   * @param options.skipDuplicateCheck - Skip checking for existing analysis (used by processor for initial generation)
   */
  async generateFromTemplate(
    transcriptionId: string,
    templateId: string,
    userId: string,
    customInstructions?: string,
    options?: { skipDuplicateCheck?: boolean },
  ): Promise<GeneratedAnalysis> {
    // 1. Get template
    const template = this.templateService.getTemplateById(templateId);
    if (!template) {
      throw new BadRequestException(`Template not found: ${templateId}`);
    }

    this.logger.log(
      `Generating analysis for transcription ${transcriptionId} using template ${templateId}`,
    );

    // 2. Get transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException(
        `Transcription not found: ${transcriptionId}`,
      );
    }

    // 3. Check if this analysis already exists (prevent duplicates)
    // Skip this check when called from processor during initial transcription
    if (!options?.skipDuplicateCheck) {
      const existing = await this.getUserAnalyses(transcriptionId, userId);
      const duplicate = existing.find((a) => a.templateId === templateId);
      if (duplicate) {
        this.logger.log(
          `Analysis already exists for template ${templateId}, returning cached version`,
        );
        return duplicate; // Return existing instead of regenerating
      }
    }

    // 4. Get transcript text (use transcriptText directly, no longer duplicated in coreAnalyses)
    const transcriptText =
      transcription.transcriptText || transcription.analyses?.transcript; // Legacy fallback

    if (!transcriptText) {
      throw new BadRequestException(
        'No transcript available for this transcription',
      );
    }

    // 5. Generate analysis using the template
    const startTime = Date.now();
    const isStructured = template.outputFormat === 'structured';

    // Combine stored context with custom instructions
    let effectiveContext = transcription.context || '';
    if (customInstructions) {
      if (effectiveContext) {
        effectiveContext = `${effectiveContext}\n\nAdditional instructions: ${customInstructions}`;
      } else {
        effectiveContext = customInstructions;
      }
    }

    this.logger.log(
      `Context for analysis: "${effectiveContext || '(no context)'}"`,
    );

    try {
      const rawContent =
        await this.transcriptionService.generateSummaryWithModel(
          transcriptText,
          undefined, // No AnalysisType enum - use custom prompts
          effectiveContext || undefined,
          transcription.detectedLanguage,
          template.modelPreference,
          template.systemPrompt,
          template.userPrompt,
          template.outputFormat, // V2: Pass output format for JSON mode
        );
      const generationTimeMs = Date.now() - startTime;

      // Validate that we got actual content from the AI
      if (!rawContent || rawContent.trim().length === 0) {
        this.logger.error(
          `AI returned empty content for template ${templateId}. This may indicate a content filter, timeout, or API issue.`,
        );
        throw new BadRequestException(
          'AI returned empty content. Please try again or contact support if the issue persists.',
        );
      }

      this.logger.log(
        `Analysis generated in ${generationTimeMs}ms using ${template.modelPreference} (format: ${template.outputFormat || 'markdown'})`,
      );

      // V2: Parse JSON content for structured outputs
      let content: GeneratedAnalysis['content'] = rawContent;
      if (isStructured) {
        try {
          const parsed = JSON.parse(rawContent);

          // Validate structured output based on template type
          this.validateStructuredOutput(templateId, parsed);

          content = parsed;
          this.logger.log(
            'Successfully parsed and validated structured JSON output',
          );
        } catch (parseError) {
          // For structured templates, JSON parse failure is an error, not a fallback
          this.logger.error(
            `Failed to parse/validate JSON output for ${templateId}: ${parseError.message}`,
          );
          throw new BadRequestException(
            `Failed to generate valid output. The AI response was malformed. Please try again.`,
          );
        }
      }

      // 6. Save to Firestore
      const analysis: Omit<GeneratedAnalysis, 'id'> = {
        transcriptionId,
        userId,
        templateId,
        templateName: template.name,
        templateVersion: template.version, // Store version for compatibility tracking
        content,
        contentType:
          isStructured && typeof content === 'object'
            ? 'structured'
            : 'markdown',
        model: template.modelPreference,
        generatedAt: new Date(),
        generationTimeMs,
        // Only include customInstructions if provided (Firestore doesn't accept undefined)
        ...(customInstructions ? { customInstructions } : {}),
      };

      const analysisId =
        await this.firebaseService.createGeneratedAnalysis(analysis);

      // 7. Add reference to transcription
      await this.firebaseService.addAnalysisReference(
        transcriptionId,
        analysisId,
      );

      this.logger.log(`Analysis saved with ID: ${analysisId}`);

      return { ...analysis, id: analysisId };
    } catch (error) {
      this.logger.error(
        `Failed to generate analysis: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to generate analysis: ${error.message}`,
      );
    }
  }

  /**
   * Get all generated analyses for a transcription
   */
  async getUserAnalyses(
    transcriptionId: string,
    userId: string,
  ): Promise<GeneratedAnalysis[]> {
    return this.firebaseService.getGeneratedAnalyses(transcriptionId, userId);
  }

  /**
   * Get a single generated analysis by ID
   */
  async getAnalysisById(
    analysisId: string,
    userId: string,
  ): Promise<GeneratedAnalysis> {
    const analysis =
      await this.firebaseService.getGeneratedAnalysisById(analysisId);

    if (!analysis) {
      throw new BadRequestException(`Analysis not found: ${analysisId}`);
    }

    if (analysis.userId !== userId) {
      throw new UnauthorizedException('Cannot access this analysis');
    }

    return analysis;
  }

  /**
   * Validate structured output based on template type.
   * Ensures required fields exist and have correct types.
   * Throws an error if validation fails.
   */
  private validateStructuredOutput(
    templateId: string,
    parsed: Record<string, unknown>,
  ): void {
    // Ensure type field exists
    if (!parsed.type) {
      parsed.type = templateId;
    }

    switch (templateId) {
      case 'actionItems':
        // Ensure arrays exist (AI might omit them if no items)
        parsed.immediateActions = Array.isArray(parsed.immediateActions)
          ? parsed.immediateActions
          : [];
        parsed.shortTermActions = Array.isArray(parsed.shortTermActions)
          ? parsed.shortTermActions
          : [];
        parsed.longTermActions = Array.isArray(parsed.longTermActions)
          ? parsed.longTermActions
          : [];
        this.logger.log(
          `Action items validated: immediate=${(parsed.immediateActions as unknown[]).length}, ` +
            `short=${(parsed.shortTermActions as unknown[]).length}, ` +
            `long=${(parsed.longTermActions as unknown[]).length}`,
        );
        break;

      case 'email':
        // Ensure required email fields exist
        if (!parsed.subject || typeof parsed.subject !== 'string') {
          throw new Error('Email output missing required field: subject');
        }
        if (!parsed.body || !Array.isArray(parsed.body)) {
          // Convert non-array body to array
          if (typeof parsed.body === 'string') {
            parsed.body = [parsed.body];
          } else {
            parsed.body = [];
          }
        }
        parsed.keyPoints = Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints
          : [];
        parsed.actionItems = Array.isArray(parsed.actionItems)
          ? parsed.actionItems
          : [];
        break;

      case 'blogPost':
        // Ensure required blog post fields exist
        if (!parsed.headline || typeof parsed.headline !== 'string') {
          throw new Error('Blog post output missing required field: headline');
        }
        if (!parsed.hook || typeof parsed.hook !== 'string') {
          throw new Error('Blog post output missing required field: hook');
        }
        parsed.sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        break;

      case 'linkedin':
        // Ensure required LinkedIn fields exist
        if (!parsed.hook || typeof parsed.hook !== 'string') {
          throw new Error('LinkedIn output missing required field: hook');
        }
        if (!parsed.content || typeof parsed.content !== 'string') {
          throw new Error('LinkedIn output missing required field: content');
        }
        parsed.hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
        break;

      case 'communicationAnalysis':
        // Ensure required communication analysis fields exist
        if (
          typeof parsed.overallScore !== 'number' ||
          parsed.overallScore < 0 ||
          parsed.overallScore > 100
        ) {
          // Try to coerce to number if possible
          const score = Number(parsed.overallScore);
          if (isNaN(score)) {
            throw new Error(
              'Communication analysis missing required field: overallScore',
            );
          }
          parsed.overallScore = Math.min(100, Math.max(0, score));
        }
        parsed.dimensions = Array.isArray(parsed.dimensions)
          ? parsed.dimensions
          : [];
        break;

      default:
        // For unknown templates, just log and allow
        this.logger.log(
          `No specific validation for template ${templateId}, allowing output`,
        );
    }
  }

  /**
   * Delete a generated analysis
   */
  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    const analysis =
      await this.firebaseService.getGeneratedAnalysisById(analysisId);

    if (!analysis || analysis.userId !== userId) {
      throw new UnauthorizedException('Cannot delete this analysis');
    }

    this.logger.log(`Deleting analysis ${analysisId}`);

    // Remove from transcription reference
    await this.firebaseService.removeAnalysisReference(
      analysis.transcriptionId,
      analysisId,
    );

    // Delete the analysis
    await this.firebaseService.deleteGeneratedAnalysis(analysisId);

    this.logger.log(`Analysis ${analysisId} deleted successfully`);
  }
}
