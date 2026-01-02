import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  GeneratedAnalysis,
  BlogPostOutput,
  BlogHeroImage,
  FollowUpEmailOutput,
  SalesEmailOutput,
  InternalUpdateOutput,
  ClientProposalOutput,
} from '@transcribe/shared';
import { StorageService } from '../firebase/services/storage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { TranscriptionService } from './transcription.service';
import { AnalysisTemplateService } from './analysis-template.service';
import { ImagePromptService } from './image-prompt.service';
import { ReplicateService } from '../replicate/replicate.service';
import { EmailService } from '../email/email.service';
import { TranslationService } from '../translation/translation.service';

// Email template type IDs
const EMAIL_TEMPLATE_IDS = [
  'followUpEmail',
  'salesEmail',
  'internalUpdate',
  'clientProposal',
] as const;

type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];

type EmailDraftData =
  | FollowUpEmailOutput
  | SalesEmailOutput
  | InternalUpdateOutput
  | ClientProposalOutput;

/**
 * Service for managing on-demand analysis generation
 * Handles generating, retrieving, and deleting user-requested analyses
 */
@Injectable()
export class OnDemandAnalysisService {
  private readonly logger = new Logger(OnDemandAnalysisService.name);

  constructor(
    private storageService: StorageService,
    private userRepository: UserRepository,
    private analysisRepository: AnalysisRepository,
    private transcriptionRepository: TranscriptionRepository,
    private transcriptionService: TranscriptionService,
    private templateService: AnalysisTemplateService,
    private imagePromptService: ImagePromptService,
    private replicateService: ReplicateService,
    private emailService: EmailService,
    private translationService: TranslationService,
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
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException(
        `Transcription not found: ${transcriptionId}`,
      );
    }

    // 3. Check if this analysis already exists (prevent exact duplicates)
    // Skip this check when called from processor during initial transcription
    // Allow regeneration if custom instructions differ from existing analysis
    if (!options?.skipDuplicateCheck) {
      const existing = await this.getUserAnalyses(transcriptionId, userId);
      const duplicate = existing.find((a) => a.templateId === templateId);
      if (duplicate) {
        // Allow regeneration if custom instructions are different
        const existingInstructions = duplicate.customInstructions || '';
        const newInstructions = customInstructions || '';
        if (existingInstructions === newInstructions) {
          this.logger.log(
            `Analysis already exists for template ${templateId} with same instructions, returning cached version`,
          );
          return duplicate; // Return existing instead of regenerating
        }
        this.logger.log(
          `Regenerating analysis for template ${templateId} with different custom instructions`,
        );
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

          // Generate hero image for blog posts
          if (
            templateId === 'blogPost' &&
            this.replicateService.isAvailable()
          ) {
            const blogContent = content as BlogPostOutput;
            await this.generateBlogHeroImage(blogContent, userId);
          }
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
        await this.analysisRepository.createGeneratedAnalysis(analysis);

      // 7. Add reference to transcription
      await this.analysisRepository.addAnalysisReference(
        transcriptionId,
        analysisId,
      );

      this.logger.log(`Analysis saved with ID: ${analysisId}`);

      const savedAnalysis = { ...analysis, id: analysisId };

      // 8. Auto-translate to existing translation locales (fire-and-forget)
      // This runs in the background and doesn't block the response
      this.translationService
        .translateNewAsset(savedAnalysis, transcriptionId, userId)
        .catch((err) => {
          this.logger.error(
            `Background auto-translation failed for asset ${analysisId}: ${err.message}`,
          );
        });

      return savedAnalysis;
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
    return this.analysisRepository.getGeneratedAnalyses(
      transcriptionId,
      userId,
    );
  }

  /**
   * Get a single generated analysis by ID
   */
  async getAnalysisById(
    analysisId: string,
    userId: string,
  ): Promise<GeneratedAnalysis> {
    const analysis =
      await this.analysisRepository.getGeneratedAnalysisById(analysisId);

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
   * Generate a hero image for a blog post using AI.
   * Generates a prompt using GPT, then creates the image with Replicate's Flux model.
   * The image is uploaded to Firebase Storage for persistence.
   */
  private async generateBlogHeroImage(
    blogContent: BlogPostOutput,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Generating hero image for blog post: "${blogContent.headline.substring(0, 50)}..."`,
      );

      // 1. Generate image prompt using GPT
      const promptResult = await this.imagePromptService.generateImagePrompt({
        headline: blogContent.headline,
        subheading: blogContent.subheading,
        hook: blogContent.hook,
      });

      // 2. Generate image with Replicate
      const imageResult = await this.replicateService.generateImage({
        prompt: promptResult.prompt,
        aspectRatio: '4:5', // Portrait ratio for float layout
        outputFormat: 'webp',
        model: 'flux-schnell', // Fast model for quick generation
      });

      if (!imageResult) {
        this.logger.warn(
          'Image generation failed, blog post will not have hero image',
        );
        return;
      }

      // 3. Download and upload to Firebase Storage for persistence
      const imageBuffer = await this.replicateService.downloadImage(
        imageResult.url,
      );
      if (!imageBuffer) {
        this.logger.warn('Failed to download generated image');
        return;
      }

      const storagePath = `users/${userId}/blog-images/${Date.now()}.webp`;
      const uploadResult = await this.storageService.uploadFile(
        imageBuffer,
        storagePath,
        'image/webp',
      );

      // 4. Add hero image to blog content
      blogContent.heroImage = {
        url: uploadResult.url,
        alt: promptResult.alt,
        prompt: promptResult.prompt,
      };

      this.logger.log(
        `Hero image generated and uploaded in ${imageResult.generationTimeMs}ms`,
      );
    } catch (error) {
      // Don't fail the entire blog post generation if image fails
      this.logger.error('Error generating blog hero image:', error);
      this.logger.warn('Continuing without hero image');
    }
  }

  /**
   * Delete a generated analysis
   */
  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    const analysis =
      await this.analysisRepository.getGeneratedAnalysisById(analysisId);

    if (!analysis || analysis.userId !== userId) {
      throw new UnauthorizedException('Cannot delete this analysis');
    }

    this.logger.log(`Deleting analysis ${analysisId}`);

    // Remove from transcription reference
    await this.analysisRepository.removeAnalysisReference(
      analysis.transcriptionId,
      analysisId,
    );

    // Delete the analysis
    await this.analysisRepository.deleteGeneratedAnalysis(analysisId);

    this.logger.log(`Analysis ${analysisId} deleted successfully`);
  }

  /**
   * Generate a hero image for an existing blog post analysis.
   * Only available for premium users (professional or payg tiers).
   */
  async generateImageForBlogPost(
    analysisId: string,
    userId: string,
  ): Promise<BlogHeroImage> {
    // 1. Check if Replicate is available
    if (!this.replicateService.isAvailable()) {
      throw new BadRequestException(
        'Image generation is not available. Please contact support.',
      );
    }

    // 2. Get user and check premium status (admins bypass)
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isAdmin = user.role === 'admin';
    const tier = user.subscriptionTier || 'free';
    if (!isAdmin && tier === 'free') {
      throw new BadRequestException(
        'Image generation is only available for Premium users. Upgrade to Professional or purchase credits to access this feature.',
      );
    }

    // 3. Get the analysis
    const analysis =
      await this.analysisRepository.getGeneratedAnalysisById(analysisId);

    if (!analysis) {
      throw new BadRequestException(`Analysis not found: ${analysisId}`);
    }

    if (analysis.userId !== userId) {
      throw new UnauthorizedException('Cannot access this analysis');
    }

    // 4. Verify it's a blog post
    if (analysis.templateId !== 'blogPost') {
      throw new BadRequestException(
        'Image generation is only available for blog posts',
      );
    }

    const blogContent = analysis.content as BlogPostOutput;
    if (!blogContent || !blogContent.headline) {
      throw new BadRequestException('Invalid blog post content');
    }

    this.logger.log(
      `Generating hero image for existing blog post: "${blogContent.headline.substring(0, 50)}..."`,
    );

    // 5. Generate image prompt using GPT
    const promptResult = await this.imagePromptService.generateImagePrompt({
      headline: blogContent.headline,
      subheading: blogContent.subheading,
      hook: blogContent.hook,
    });

    // 6. Generate image with Replicate (flux-dev for premium/admin users)
    const imageResult = await this.replicateService.generateImage({
      prompt: promptResult.prompt,
      aspectRatio: '4:5',
      outputFormat: 'webp',
      model: 'flux-dev',
    });

    if (!imageResult) {
      throw new BadRequestException(
        'Failed to generate image. Please try again.',
      );
    }

    // 7. Download and upload to Firebase Storage
    const imageBuffer = await this.replicateService.downloadImage(
      imageResult.url,
    );
    if (!imageBuffer) {
      throw new BadRequestException(
        'Failed to download generated image. Please try again.',
      );
    }

    const storagePath = `users/${userId}/blog-images/${Date.now()}.webp`;
    const uploadResult = await this.storageService.uploadFile(
      imageBuffer,
      storagePath,
      'image/webp',
    );

    // 8. Create hero image object
    const heroImage: BlogHeroImage = {
      url: uploadResult.url,
      alt: promptResult.alt,
      prompt: promptResult.prompt,
    };

    // 9. Update the analysis with the new hero image
    blogContent.heroImage = heroImage;
    await this.analysisRepository.updateGeneratedAnalysis(analysisId, {
      content: blogContent,
    });

    this.logger.log(
      `Hero image generated and saved for analysis ${analysisId} in ${imageResult.generationTimeMs}ms`,
    );

    return heroImage;
  }

  /**
   * Send an email analysis to the user's own email address
   * This allows users to review, edit, and forward from their own mailbox
   */
  async sendEmailToSelf(
    analysisId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Get the analysis
    const analysis =
      await this.analysisRepository.getGeneratedAnalysisById(analysisId);

    if (!analysis) {
      throw new BadRequestException(`Analysis not found: ${analysisId}`);
    }

    if (analysis.userId !== userId) {
      throw new UnauthorizedException('Cannot access this analysis');
    }

    // 2. Verify it's an email template
    if (!EMAIL_TEMPLATE_IDS.includes(analysis.templateId as EmailTemplateId)) {
      throw new BadRequestException(
        'This analysis type cannot be sent as an email',
      );
    }

    // 3. Get user info
    const user = await this.userRepository.getUser(userId);
    if (!user || !user.email) {
      throw new BadRequestException('User email not found');
    }

    // 4. Send the email
    const emailData = analysis.content as EmailDraftData;
    const userName = user.displayName || user.email.split('@')[0];

    this.logger.log(
      `Sending email draft "${emailData.subject}" to ${user.email}`,
    );

    const success = await this.emailService.sendEmailDraftToSelf(
      user.email,
      userName,
      emailData,
    );

    if (!success) {
      throw new BadRequestException(
        'Failed to send email. Please try again later.',
      );
    }

    return {
      success: true,
      message: `Email draft sent to ${user.email}`,
    };
  }
}
