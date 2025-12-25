import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  Translation,
  TranslatedContent,
  TranslatedSummaryV2,
  TranslatedAnalysis,
  ConversationTranslations,
  LocaleTranslationStatus,
  TranslateConversationResponse,
  SUPPORTED_LOCALES,
  getLocaleByCode,
  Transcription,
  GeneratedAnalysis,
  StructuredOutput,
  isStructuredOutput,
  SummaryV2,
} from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Translate conversation content (Summary + AI Assets) to target locale
   */
  async translateConversation(
    transcriptionId: string,
    userId: string,
    targetLocale: string,
    options: {
      translateSummary?: boolean;
      translateAssets?: boolean;
      assetIds?: string[];
    } = {},
  ): Promise<TranslateConversationResponse> {
    const {
      translateSummary = true,
      translateAssets = true,
      assetIds,
    } = options;

    // Verify ownership
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Validate locale
    const locale = getLocaleByCode(targetLocale);
    if (!locale) {
      throw new BadRequestException(
        `Unsupported locale: ${targetLocale}. Supported locales: ${SUPPORTED_LOCALES.map((l) => l.code).join(', ')}`,
      );
    }

    const translationsCreated: Translation[] = [];
    const now = new Date();

    // 1. Translate Summary (if requested and not already translated)
    if (translateSummary) {
      const existingSummaryTranslation =
        await this.firebaseService.getTranslation(
          transcriptionId,
          'summary',
          transcriptionId, // For summary, sourceId = transcriptionId
          targetLocale,
          userId,
        );

      if (!existingSummaryTranslation) {
        this.logger.log(
          `Translating summary for ${transcriptionId} to ${locale.language}`,
        );

        const translatedContent = await this.translateSummaryContent(
          transcription,
          locale.language,
        );

        const summaryTranslation: Omit<Translation, 'id'> = {
          sourceType: 'summary',
          sourceId: transcriptionId,
          transcriptionId,
          userId,
          localeCode: targetLocale,
          localeName: locale.language,
          content: translatedContent,
          translatedAt: now,
          translatedBy: 'gpt-5-mini',
          createdAt: now,
          updatedAt: now,
        };

        const id =
          await this.firebaseService.createTranslation(summaryTranslation);
        translationsCreated.push({ id, ...summaryTranslation });
      } else {
        this.logger.log(
          `Summary translation already exists for ${transcriptionId} in ${locale.language}`,
        );
      }
    }

    // 2. Translate AI Assets (if requested)
    if (translateAssets) {
      const analyses = await this.firebaseService.getGeneratedAnalyses(
        transcriptionId,
        userId,
      );
      const toTranslate = assetIds
        ? analyses.filter((a) => assetIds.includes(a.id))
        : analyses;

      for (const analysis of toTranslate) {
        const existingTranslation = await this.firebaseService.getTranslation(
          transcriptionId,
          'analysis',
          analysis.id,
          targetLocale,
          userId,
        );

        if (!existingTranslation) {
          this.logger.log(
            `Translating analysis ${analysis.id} (${analysis.templateName}) to ${locale.language}`,
          );

          const translatedContent = await this.translateAnalysisContent(
            analysis,
            locale.language,
          );

          const analysisTranslation: Omit<Translation, 'id'> = {
            sourceType: 'analysis',
            sourceId: analysis.id,
            transcriptionId,
            userId,
            localeCode: targetLocale,
            localeName: locale.language,
            content: translatedContent,
            translatedAt: now,
            translatedBy: 'gpt-5-mini',
            createdAt: now,
            updatedAt: now,
          };

          const id =
            await this.firebaseService.createTranslation(analysisTranslation);
          translationsCreated.push({ id, ...analysisTranslation });
        }
      }
    }

    // Update user's locale preference on transcription
    await this.firebaseService.updateTranscription(transcriptionId, {
      preferredLocale: targetLocale,
      updatedAt: now,
    });

    this.logger.log(
      `Translation to ${locale.language} completed for ${transcriptionId}. Created ${translationsCreated.length} translations.`,
    );

    return {
      transcriptionId,
      localeCode: targetLocale,
      localeName: locale.language,
      translationsCreated: translationsCreated.length,
      translations: translationsCreated,
    };
  }

  /**
   * Get translation status for a conversation
   */
  async getTranslationStatus(
    transcriptionId: string,
    userId: string,
  ): Promise<ConversationTranslations> {
    // Get transcription for original locale
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Get all translations
    const translations =
      await this.firebaseService.getTranslationsByConversation(
        transcriptionId,
        userId,
      );

    // Get total asset count
    const analyses = await this.firebaseService.getGeneratedAnalyses(
      transcriptionId,
      userId,
    );
    const totalAssetCount = analyses.length;

    // Group by locale
    const byLocale = new Map<string, Translation[]>();
    for (const t of translations) {
      const list = byLocale.get(t.localeCode) || [];
      list.push(t);
      byLocale.set(t.localeCode, list);
    }

    // Build status for each locale
    const availableLocales: LocaleTranslationStatus[] = [];
    for (const [code, localeTranslations] of byLocale) {
      const summaryTranslation = localeTranslations.find(
        (t) => t.sourceType === 'summary',
      );
      const assetTranslations = localeTranslations.filter(
        (t) => t.sourceType === 'analysis',
      );

      const locale = getLocaleByCode(code);
      availableLocales.push({
        code,
        name: locale?.language || code,
        nativeName: locale?.nativeName || code,
        hasSummaryTranslation: !!summaryTranslation,
        translatedAssetCount: assetTranslations.length,
        totalAssetCount,
        lastTranslatedAt:
          summaryTranslation?.translatedAt ||
          assetTranslations[0]?.translatedAt,
      });
    }

    // Sort by last translated (most recent first)
    availableLocales.sort((a, b) => {
      if (!a.lastTranslatedAt) return 1;
      if (!b.lastTranslatedAt) return -1;
      return b.lastTranslatedAt.getTime() - a.lastTranslatedAt.getTime();
    });

    return {
      transcriptionId,
      originalLocale: transcription.detectedLanguage,
      availableLocales,
      preferredLocale: transcription.preferredLocale || 'original',
    };
  }

  /**
   * Get translation status for a shared conversation (no auth)
   */
  async getSharedTranslationStatus(
    transcriptionId: string,
    shareToken: string,
  ): Promise<ConversationTranslations> {
    // Verify share token
    const transcription =
      await this.firebaseService.getTranscriptionByShareToken(shareToken);
    if (!transcription || transcription.id !== transcriptionId) {
      throw new BadRequestException('Invalid share token or transcription');
    }

    // Get all translations (no userId filter for shared)
    const translations =
      await this.firebaseService.getTranslationsForSharedConversation(
        transcriptionId,
      );

    // Get total asset count
    const analyses = await this.firebaseService.getGeneratedAnalyses(
      transcriptionId,
      transcription.userId,
    );
    const totalAssetCount = analyses.length;

    // Group by locale
    const byLocale = new Map<string, Translation[]>();
    for (const t of translations) {
      const list = byLocale.get(t.localeCode) || [];
      list.push(t);
      byLocale.set(t.localeCode, list);
    }

    // Build status for each locale
    const availableLocales: LocaleTranslationStatus[] = [];
    for (const [code, localeTranslations] of byLocale) {
      const summaryTranslation = localeTranslations.find(
        (t) => t.sourceType === 'summary',
      );
      const assetTranslations = localeTranslations.filter(
        (t) => t.sourceType === 'analysis',
      );

      const locale = getLocaleByCode(code);
      availableLocales.push({
        code,
        name: locale?.language || code,
        nativeName: locale?.nativeName || code,
        hasSummaryTranslation: !!summaryTranslation,
        translatedAssetCount: assetTranslations.length,
        totalAssetCount,
        lastTranslatedAt:
          summaryTranslation?.translatedAt ||
          assetTranslations[0]?.translatedAt,
      });
    }

    return {
      transcriptionId,
      originalLocale: transcription.detectedLanguage,
      availableLocales,
      preferredLocale: transcription.preferredLocale || 'original',
    };
  }

  /**
   * Get translations for a specific locale
   */
  async getTranslationsForLocale(
    transcriptionId: string,
    localeCode: string,
    userId: string,
  ): Promise<Translation[]> {
    // Verify ownership
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    return this.firebaseService.getTranslationsForLocale(
      transcriptionId,
      localeCode,
      userId,
    );
  }

  /**
   * Get translations for a shared conversation (no auth)
   */
  async getSharedTranslationsForLocale(
    transcriptionId: string,
    localeCode: string,
    shareToken: string,
  ): Promise<Translation[]> {
    // Verify share token
    const transcription =
      await this.firebaseService.getTranscriptionByShareToken(shareToken);
    if (!transcription || transcription.id !== transcriptionId) {
      throw new BadRequestException('Invalid share token or transcription');
    }

    const allTranslations =
      await this.firebaseService.getTranslationsForSharedConversation(
        transcriptionId,
      );

    return allTranslations.filter((t) => t.localeCode === localeCode);
  }

  /**
   * Delete all translations for a locale
   */
  async deleteTranslationsForLocale(
    transcriptionId: string,
    localeCode: string,
    userId: string,
  ): Promise<number> {
    // Verify ownership
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    const deletedCount = await this.firebaseService.deleteTranslationsForLocale(
      transcriptionId,
      localeCode,
      userId,
    );

    this.logger.log(
      `Deleted ${deletedCount} translations for ${localeCode} from ${transcriptionId}`,
    );

    return deletedCount;
  }

  /**
   * Update locale preference for a conversation
   */
  async updateLocalePreference(
    transcriptionId: string,
    localeCode: string,
    userId: string,
  ): Promise<void> {
    // Verify ownership
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Validate locale (allow 'original' or any supported locale)
    if (localeCode !== 'original' && !getLocaleByCode(localeCode)) {
      throw new BadRequestException(`Unsupported locale: ${localeCode}`);
    }

    await this.firebaseService.updateTranscription(transcriptionId, {
      preferredLocale: localeCode,
      updatedAt: new Date(),
    });
  }

  // ============================================================
  // PRIVATE TRANSLATION METHODS
  // ============================================================

  /**
   * Translate summary content
   */
  private async translateSummaryContent(
    transcription: Transcription,
    targetLanguage: string,
  ): Promise<TranslatedContent> {
    if (transcription.summaryV2) {
      // Translate V2 structured summary
      const translated = await this.translateStructuredSummary(
        transcription.summaryV2,
        targetLanguage,
      );
      return translated;
    } else {
      // Translate V1 markdown summary
      const summaryText =
        transcription.coreAnalyses?.summary ||
        transcription.analyses?.summary ||
        transcription.summary ||
        '';
      const translatedText = await this.translateText(
        summaryText,
        targetLanguage,
        'summary',
      );
      return { type: 'summaryV1', text: translatedText };
    }
  }

  /**
   * Translate V2 structured summary
   */
  private async translateStructuredSummary(
    summary: SummaryV2,
    targetLanguage: string,
  ): Promise<TranslatedSummaryV2> {
    // Translate each field in parallel for efficiency
    const [title, intro, keyPoints, detailedSections, decisions, nextSteps] =
      await Promise.all([
        this.translateText(summary.title, targetLanguage, 'title'),
        this.translateText(summary.intro, targetLanguage, 'intro'),
        Promise.all(
          summary.keyPoints.map(async (kp) => ({
            topic: await this.translateText(kp.topic, targetLanguage, 'topic'),
            description: await this.translateText(
              kp.description,
              targetLanguage,
              'description',
            ),
          })),
        ),
        Promise.all(
          summary.detailedSections.map(async (ds) => ({
            topic: await this.translateText(ds.topic, targetLanguage, 'topic'),
            content: await this.translateText(
              ds.content,
              targetLanguage,
              'content',
            ),
          })),
        ),
        summary.decisions
          ? Promise.all(
              summary.decisions.map((d) =>
                this.translateText(d, targetLanguage, 'decision'),
              ),
            )
          : undefined,
        summary.nextSteps
          ? Promise.all(
              summary.nextSteps.map((s) =>
                this.translateText(s, targetLanguage, 'next step'),
              ),
            )
          : undefined,
      ]);

    // Build result object, excluding undefined fields (Firestore doesn't accept undefined)
    const result: TranslatedSummaryV2 = {
      type: 'summaryV2',
      title,
      intro,
      keyPoints,
      detailedSections,
    };

    // Only include optional fields if they have values
    if (decisions) {
      result.decisions = decisions;
    }
    if (nextSteps) {
      result.nextSteps = nextSteps;
    }

    return result;
  }

  /**
   * Translate analysis content
   */
  private async translateAnalysisContent(
    analysis: GeneratedAnalysis,
    targetLanguage: string,
  ): Promise<TranslatedAnalysis> {
    if (typeof analysis.content === 'string') {
      const translatedText = await this.translateText(
        analysis.content,
        targetLanguage,
        `${analysis.templateName} analysis`,
      );
      return {
        type: 'analysis',
        content: translatedText,
        contentType: 'markdown',
      };
    } else if (isStructuredOutput(analysis.content)) {
      // Translate structured output
      const translatedStructured = await this.translateStructuredOutput(
        analysis.content,
        targetLanguage,
      );
      return {
        type: 'analysis',
        content: translatedStructured,
        contentType: 'structured',
      };
    } else {
      // Fallback - stringify and translate
      const translatedText = await this.translateText(
        JSON.stringify(analysis.content),
        targetLanguage,
        `${analysis.templateName} analysis`,
      );
      return {
        type: 'analysis',
        content: translatedText,
        contentType: 'markdown',
      };
    }
  }

  /**
   * Translate structured output (action items, emails, etc.)
   */
  private async translateStructuredOutput(
    content: StructuredOutput,
    targetLanguage: string,
  ): Promise<StructuredOutput> {
    // For structured outputs, we translate the JSON as a whole
    // This preserves the structure while translating text values
    const systemPrompt = `You are a professional translator. Translate the JSON content to ${targetLanguage}.

CRITICAL INSTRUCTIONS:
- ONLY translate text values (strings), NOT keys or structure
- Maintain the exact JSON structure
- Preserve all non-text values (numbers, booleans, arrays structure)
- Keep technical terms when appropriate
- Output valid JSON only`;

    const userPrompt = `Translate this JSON to ${targetLanguage}:\n\n${JSON.stringify(content, null, 2)}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8000,
        response_format: { type: 'json_object' },
      });

      const translatedJson = completion.choices[0].message.content;
      if (!translatedJson) {
        throw new Error('Empty translation response');
      }

      return JSON.parse(translatedJson) as StructuredOutput;
    } catch (error) {
      this.logger.error('Error translating structured output:', error);
      // Return original on error
      return content;
    }
  }

  /**
   * Auto-translate a newly created asset to all existing translation locales
   *
   * Called when a new AI asset is generated for a conversation that already
   * has translations. This keeps translations in sync automatically.
   *
   * @param asset - The newly created GeneratedAnalysis
   * @param transcriptionId - The conversation ID
   * @param userId - The user ID
   */
  async translateNewAsset(
    asset: GeneratedAnalysis,
    transcriptionId: string,
    userId: string,
  ): Promise<void> {
    // Get existing translations to find which locales we need to translate to
    const existingTranslations =
      await this.firebaseService.getTranslationsByConversation(
        transcriptionId,
        userId,
      );

    if (existingTranslations.length === 0) {
      // No translations exist for this conversation, nothing to do
      return;
    }

    // Get unique locale codes that have translations
    const existingLocales = [
      ...new Set(existingTranslations.map((t) => t.localeCode)),
    ];

    this.logger.log(
      `Auto-translating new asset ${asset.id} to ${existingLocales.length} locale(s): ${existingLocales.join(', ')}`,
    );

    const now = new Date();

    for (const localeCode of existingLocales) {
      const locale = getLocaleByCode(localeCode);
      if (!locale) {
        this.logger.warn(`Unknown locale code: ${localeCode}, skipping`);
        continue;
      }

      try {
        this.logger.log(
          `Translating asset ${asset.id} (${asset.templateName}) to ${locale.language}`,
        );

        const translatedContent = await this.translateAnalysisContent(
          asset,
          locale.language,
        );

        const translation: Omit<Translation, 'id'> = {
          sourceType: 'analysis',
          sourceId: asset.id,
          transcriptionId,
          userId,
          localeCode,
          localeName: locale.language,
          content: translatedContent,
          translatedAt: now,
          translatedBy: 'gpt-5-mini',
          createdAt: now,
          updatedAt: now,
        };

        await this.firebaseService.createTranslation(translation);
        this.logger.log(
          `Successfully translated asset ${asset.id} to ${locale.language}`,
        );
      } catch (error) {
        // Log error but don't fail - translation is best-effort
        this.logger.error(
          `Failed to auto-translate asset ${asset.id} to ${locale.language}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Translate plain text
   */
  private async translateText(
    text: string,
    targetLanguage: string,
    contentType: string = 'text',
  ): Promise<string> {
    if (!text || text.trim() === '') {
      return text;
    }

    try {
      const systemPrompt = `You are a professional translator. Translate the following ${contentType} to ${targetLanguage}.

CRITICAL INSTRUCTIONS:
- Maintain ALL original formatting including markdown, line breaks, bullet points, headings, tables, and special characters
- Preserve speaker labels (e.g., "Speaker 1:", "Speaker 2:") exactly as they appear
- Keep technical terms and proper nouns when appropriate
- Maintain the same tone, style, and level of formality
- Do NOT add any introductions, explanations, or comments
- Output ONLY the translated content`;

      const userPrompt = `Translate this to ${targetLanguage}:\n\n${text}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8000,
      });

      return completion.choices[0].message.content || text;
    } catch (error) {
      this.logger.error(`Error translating ${contentType}:`, error);
      throw error;
    }
  }
}
