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
   */
  async generateFromTemplate(
    transcriptionId: string,
    templateId: string,
    userId: string,
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
    const existing = await this.getUserAnalyses(transcriptionId, userId);
    const duplicate = existing.find((a) => a.templateId === templateId);
    if (duplicate) {
      this.logger.log(
        `Analysis already exists for template ${templateId}, returning cached version`,
      );
      return duplicate; // Return existing instead of regenerating
    }

    // 4. Get transcript text
    const transcriptText =
      transcription.coreAnalyses?.transcript ||
      transcription.analyses?.transcript ||
      transcription.transcriptText;

    if (!transcriptText) {
      throw new BadRequestException(
        'No transcript available for this transcription',
      );
    }

    // 5. Generate analysis using the template
    const startTime = Date.now();
    try {
      const content = await this.transcriptionService.generateSummaryWithModel(
        transcriptText,
        undefined, // No AnalysisType enum - use custom prompts
        transcription.context,
        transcription.detectedLanguage,
        template.modelPreference,
        template.systemPrompt,
        template.userPrompt,
      );
      const generationTimeMs = Date.now() - startTime;

      this.logger.log(
        `Analysis generated in ${generationTimeMs}ms using ${template.modelPreference}`,
      );

      // 6. Save to Firestore
      const analysis: Omit<GeneratedAnalysis, 'id'> = {
        transcriptionId,
        userId,
        templateId,
        templateName: template.name,
        content,
        model: template.modelPreference,
        generatedAt: new Date(),
        generationTimeMs,
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
