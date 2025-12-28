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
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import { TranslationRepository } from '../firebase/repositories/translation.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private analysisRepository: AnalysisRepository,
    private translationRepository: TranslationRepository,
    private transcriptionRepository: TranscriptionRepository,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Translate conversation content (Summary + AI Assets) to target locale
   *
   * @param forceRetranslate - If true, delete existing translations and re-translate
   *                          Use this to fix corrupt/partial translations
   */
  async translateConversation(
    transcriptionId: string,
    userId: string,
    targetLocale: string,
    options: {
      translateSummary?: boolean;
      translateAssets?: boolean;
      assetIds?: string[];
      forceRetranslate?: boolean;
    } = {},
  ): Promise<TranslateConversationResponse> {
    const {
      translateSummary = true,
      translateAssets = true,
      assetIds,
      forceRetranslate = false,
    } = options;

    // If force retranslate, delete existing translations first
    if (forceRetranslate) {
      this.logger.log(
        `Force retranslate requested for ${transcriptionId} to ${targetLocale}, deleting existing translations`,
      );
      await this.translationRepository.deleteTranslationsForLocale(
        transcriptionId,
        targetLocale,
        userId,
      );
    }

    // Verify ownership
    const transcription = await this.transcriptionRepository.getTranscription(
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

    // Prepare translation tasks to run in parallel
    const translationTasks: Promise<Translation[]>[] = [];

    // 1. Summary translation task
    if (translateSummary) {
      translationTasks.push(
        this.translateSummaryTask(
          transcription,
          transcriptionId,
          userId,
          targetLocale,
          locale.language,
          now,
        ),
      );
    }

    // 2. Analyses translation task
    if (translateAssets) {
      translationTasks.push(
        this.translateAnalysesTask(
          transcriptionId,
          userId,
          targetLocale,
          locale.language,
          assetIds,
          now,
        ),
      );
    }

    // Run all translation tasks in parallel
    if (translationTasks.length > 0) {
      const startTime = Date.now();
      this.logger.log(
        `Starting ${translationTasks.length} translation task(s) in parallel for ${transcriptionId}`,
      );

      const results = await Promise.all(translationTasks);

      this.logger.log(
        `All translation tasks completed in ${Date.now() - startTime}ms`,
      );

      // Flatten results
      for (const taskResults of results) {
        translationsCreated.push(...taskResults);
      }
    }

    // Update user's locale preference on transcription
    await this.transcriptionRepository.updateTranscription(transcriptionId, {
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
   * Task to translate summary content
   * Returns array of created translations (0 or 1)
   */
  private async translateSummaryTask(
    transcription: Transcription,
    transcriptionId: string,
    userId: string,
    targetLocale: string,
    targetLanguage: string,
    now: Date,
  ): Promise<Translation[]> {
    const startTime = Date.now();

    // Check if already translated
    const existingTranslation = await this.translationRepository.getTranslation(
      transcriptionId,
      'summary',
      transcriptionId,
      targetLocale,
      userId,
    );

    if (existingTranslation) {
      this.logger.log(
        `Summary translation already exists for ${transcriptionId} in ${targetLanguage}`,
      );
      return [];
    }

    this.logger.log(
      `Translating summary for ${transcriptionId} to ${targetLanguage}`,
    );

    const translatedContent = await this.translateSummaryContent(
      transcription,
      targetLanguage,
    );

    const summaryTranslation: Omit<Translation, 'id'> = {
      sourceType: 'summary',
      sourceId: transcriptionId,
      transcriptionId,
      userId,
      localeCode: targetLocale,
      localeName: targetLanguage,
      content: translatedContent,
      translatedAt: now,
      translatedBy: 'gpt-5-mini',
      createdAt: now,
      updatedAt: now,
    };

    const id =
      await this.translationRepository.createTranslation(summaryTranslation);

    this.logger.debug(
      `Summary translation completed in ${Date.now() - startTime}ms`,
    );

    return [{ id, ...summaryTranslation }];
  }

  /**
   * Task to translate analyses/AI assets
   * Returns array of created translations
   */
  private async translateAnalysesTask(
    transcriptionId: string,
    userId: string,
    targetLocale: string,
    targetLanguage: string,
    assetIds: string[] | undefined,
    now: Date,
  ): Promise<Translation[]> {
    const startTime = Date.now();
    const results: Translation[] = [];

    const analyses = await this.analysisRepository.getGeneratedAnalyses(
      transcriptionId,
      userId,
    );
    const toTranslate = assetIds
      ? analyses.filter((a) => assetIds.includes(a.id))
      : analyses;

    // Filter out already translated assets
    const needsTranslation: GeneratedAnalysis[] = [];
    for (const analysis of toTranslate) {
      const existingTranslation =
        await this.translationRepository.getTranslation(
          transcriptionId,
          'analysis',
          analysis.id,
          targetLocale,
          userId,
        );
      if (!existingTranslation) {
        needsTranslation.push(analysis);
      }
    }

    if (needsTranslation.length === 0) {
      this.logger.log(
        `All ${toTranslate.length} analyses already translated for ${transcriptionId}`,
      );
      return [];
    }

    this.logger.log(
      `Batch translating ${needsTranslation.length} analyses to ${targetLanguage}`,
    );

    // Batch translate all assets
    const translatedContents = await this.translateAnalysesBatch(
      needsTranslation,
      targetLanguage,
    );

    // Save all translations
    for (let i = 0; i < needsTranslation.length; i++) {
      const analysis = needsTranslation[i];
      const translatedContent = translatedContents[i];

      const analysisTranslation: Omit<Translation, 'id'> = {
        sourceType: 'analysis',
        sourceId: analysis.id,
        transcriptionId,
        userId,
        localeCode: targetLocale,
        localeName: targetLanguage,
        content: translatedContent,
        translatedAt: now,
        translatedBy: 'gpt-5-mini',
        createdAt: now,
        updatedAt: now,
      };

      const id =
        await this.translationRepository.createTranslation(analysisTranslation);
      results.push({ id, ...analysisTranslation });
    }

    this.logger.debug(
      `Analyses translation completed in ${Date.now() - startTime}ms (${needsTranslation.length} items)`,
    );

    return results;
  }

  /**
   * Get translation status for a conversation
   */
  async getTranslationStatus(
    transcriptionId: string,
    userId: string,
  ): Promise<ConversationTranslations> {
    // Get transcription for original locale
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    // Get all translations
    const translations =
      await this.translationRepository.getTranslationsByConversation(
        transcriptionId,
        userId,
      );

    // Get total asset count
    const analyses = await this.analysisRepository.getGeneratedAnalyses(
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
      await this.transcriptionRepository.getTranscriptionByShareToken(
        shareToken,
      );
    if (!transcription || transcription.id !== transcriptionId) {
      throw new BadRequestException('Invalid share token or transcription');
    }

    // Get all translations (no userId filter for shared)
    const translations =
      await this.translationRepository.getTranslationsForSharedConversation(
        transcriptionId,
      );

    // Get total asset count
    const analyses = await this.analysisRepository.getGeneratedAnalyses(
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
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    return this.translationRepository.getTranslationsForLocale(
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
      await this.transcriptionRepository.getTranscriptionByShareToken(
        shareToken,
      );
    if (!transcription || transcription.id !== transcriptionId) {
      throw new BadRequestException('Invalid share token or transcription');
    }

    const allTranslations =
      await this.translationRepository.getTranslationsForSharedConversation(
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
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found or access denied');
    }

    const deletedCount =
      await this.translationRepository.deleteTranslationsForLocale(
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
    const transcription = await this.transcriptionRepository.getTranscription(
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

    await this.transcriptionRepository.updateTranscription(transcriptionId, {
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
   * Translate V2 structured summary using batch translation
   */
  private async translateStructuredSummary(
    summary: SummaryV2,
    targetLanguage: string,
  ): Promise<TranslatedSummaryV2> {
    // Collect all texts to translate in a single batch
    const textsToTranslate: string[] = [];
    const indexMap: {
      title: number;
      intro: number;
      keyPointTopics: number[];
      keyPointDescriptions: number[];
      detailedSectionTopics: number[];
      detailedSectionContents: number[];
      decisions: number[];
      nextSteps: number[];
    } = {
      title: -1,
      intro: -1,
      keyPointTopics: [],
      keyPointDescriptions: [],
      detailedSectionTopics: [],
      detailedSectionContents: [],
      decisions: [],
      nextSteps: [],
    };

    // Add title and intro
    indexMap.title = textsToTranslate.length;
    textsToTranslate.push(summary.title);

    indexMap.intro = textsToTranslate.length;
    textsToTranslate.push(summary.intro);

    // Add key points
    for (const kp of summary.keyPoints) {
      indexMap.keyPointTopics.push(textsToTranslate.length);
      textsToTranslate.push(kp.topic);
      indexMap.keyPointDescriptions.push(textsToTranslate.length);
      textsToTranslate.push(kp.description);
    }

    // Add detailed sections
    for (const ds of summary.detailedSections) {
      indexMap.detailedSectionTopics.push(textsToTranslate.length);
      textsToTranslate.push(ds.topic);
      indexMap.detailedSectionContents.push(textsToTranslate.length);
      textsToTranslate.push(ds.content);
    }

    // Add decisions if present
    if (summary.decisions) {
      for (const d of summary.decisions) {
        indexMap.decisions.push(textsToTranslate.length);
        textsToTranslate.push(d);
      }
    }

    // Add next steps if present
    if (summary.nextSteps) {
      for (const s of summary.nextSteps) {
        indexMap.nextSteps.push(textsToTranslate.length);
        textsToTranslate.push(s);
      }
    }

    // Batch translate all texts in a single API call
    const translated = await this.translateTextBatch(
      textsToTranslate,
      targetLanguage,
    );

    // Reconstruct the structured summary from translated texts
    const keyPoints = summary.keyPoints.map((_, i) => ({
      topic: translated[indexMap.keyPointTopics[i]],
      description: translated[indexMap.keyPointDescriptions[i]],
    }));

    const detailedSections = summary.detailedSections.map((_, i) => ({
      topic: translated[indexMap.detailedSectionTopics[i]],
      content: translated[indexMap.detailedSectionContents[i]],
    }));

    // Build result object
    const result: TranslatedSummaryV2 = {
      type: 'summaryV2',
      title: translated[indexMap.title],
      intro: translated[indexMap.intro],
      keyPoints,
      detailedSections,
    };

    // Only include optional fields if they have values
    if (indexMap.decisions.length > 0) {
      result.decisions = indexMap.decisions.map((idx) => translated[idx]);
    }
    if (indexMap.nextSteps.length > 0) {
      result.nextSteps = indexMap.nextSteps.map((idx) => translated[idx]);
    }

    return result;
  }

  /**
   * Translate analysis content (single analysis)
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
   * Batch translate multiple analyses in fewer API calls
   * Groups markdown content together for batch translation
   */
  private async translateAnalysesBatch(
    analyses: GeneratedAnalysis[],
    targetLanguage: string,
  ): Promise<TranslatedAnalysis[]> {
    if (analyses.length === 0) {
      return [];
    }

    // Separate markdown and structured content (structured needs individual calls)
    const markdownAnalyses: { index: number; analysis: GeneratedAnalysis }[] =
      [];
    const structuredAnalyses: { index: number; analysis: GeneratedAnalysis }[] =
      [];

    for (let i = 0; i < analyses.length; i++) {
      const analysis = analyses[i];
      if (
        typeof analysis.content === 'string' ||
        !isStructuredOutput(analysis.content)
      ) {
        markdownAnalyses.push({ index: i, analysis });
      } else {
        structuredAnalyses.push({ index: i, analysis });
      }
    }

    const results: TranslatedAnalysis[] = new Array(analyses.length);

    this.logger.debug(
      `Analyses breakdown: ${markdownAnalyses.length} markdown, ${structuredAnalyses.length} structured`,
    );

    // Batch translate all markdown content in one call
    if (markdownAnalyses.length > 0) {
      const startTime = Date.now();
      const textsToTranslate = markdownAnalyses.map((item) =>
        typeof item.analysis.content === 'string'
          ? item.analysis.content
          : JSON.stringify(item.analysis.content),
      );

      const translatedTexts = await this.translateTextBatch(
        textsToTranslate,
        targetLanguage,
      );

      this.logger.debug(
        `Markdown batch translation completed in ${Date.now() - startTime}ms`,
      );

      for (let i = 0; i < markdownAnalyses.length; i++) {
        const originalIndex = markdownAnalyses[i].index;
        results[originalIndex] = {
          type: 'analysis',
          content: translatedTexts[i],
          contentType: 'markdown',
        };
      }
    }

    // Translate structured content in parallel (they need JSON parsing individually)
    if (structuredAnalyses.length > 0) {
      const startTime = Date.now();
      this.logger.debug(
        `Translating ${structuredAnalyses.length} structured analyses in parallel`,
      );
      const structuredPromises = structuredAnalyses.map(
        async ({ index, analysis }) => {
          const translatedStructured = await this.translateStructuredOutput(
            analysis.content as StructuredOutput,
            targetLanguage,
          );
          return { index, translatedStructured };
        },
      );

      const structuredResults = await Promise.all(structuredPromises);
      this.logger.debug(
        `Structured translations completed in ${Date.now() - startTime}ms`,
      );

      for (const { index, translatedStructured } of structuredResults) {
        results[index] = {
          type: 'analysis',
          content: translatedStructured,
          contentType: 'structured',
        };
      }
    }

    return results;
  }

  /**
   * Translate structured output (action items, emails, etc.)
   * Includes retry logic for empty responses
   */
  private async translateStructuredOutput(
    content: StructuredOutput,
    targetLanguage: string,
    retryCount = 0,
  ): Promise<StructuredOutput> {
    const maxRetries = 2;

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
        if (retryCount < maxRetries) {
          this.logger.warn(
            `Empty response for structured translation, retrying (${retryCount + 1}/${maxRetries})`,
          );
          return this.translateStructuredOutput(
            content,
            targetLanguage,
            retryCount + 1,
          );
        }
        throw new Error('Empty translation response after retries');
      }

      return JSON.parse(translatedJson) as StructuredOutput;
    } catch (error) {
      if (
        retryCount < maxRetries &&
        error instanceof Error &&
        error.message.includes('Empty')
      ) {
        this.logger.warn(
          `Retrying structured translation after error (${retryCount + 1}/${maxRetries})`,
        );
        return this.translateStructuredOutput(
          content,
          targetLanguage,
          retryCount + 1,
        );
      }
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
      await this.translationRepository.getTranslationsByConversation(
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

        await this.translationRepository.createTranslation(translation);
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
   * Translate plain text (single item - used as fallback)
   */
  private async translateText(
    text: string,
    targetLanguage: string,
    _contentType: string = 'text',
  ): Promise<string> {
    if (!text || text.trim() === '') {
      return text;
    }

    // Use batch translation with single item
    const results = await this.translateTextBatch([text], targetLanguage);
    return results[0] || text;
  }

  /**
   * Batch translate multiple text items in a single API call
   * Returns translations in the same order as input
   */
  private async translateTextBatch(
    texts: string[],
    targetLanguage: string,
  ): Promise<string[]> {
    // Filter out empty texts, keeping track of their positions
    const nonEmptyItems: { index: number; text: string }[] = [];
    for (let i = 0; i < texts.length; i++) {
      if (texts[i] && texts[i].trim() !== '') {
        nonEmptyItems.push({ index: i, text: texts[i] });
      }
    }

    // If no non-empty texts, return original array
    if (nonEmptyItems.length === 0) {
      return texts;
    }

    // If only one item, use simpler prompt
    if (nonEmptyItems.length === 1) {
      try {
        const systemPrompt = `You are a professional translator. Translate to ${targetLanguage}.

CRITICAL INSTRUCTIONS:
- Maintain ALL original formatting including markdown, line breaks, bullet points, headings, tables, and special characters
- Preserve speaker labels (e.g., "Speaker 1:", "Speaker 2:") exactly as they appear
- Keep technical terms and proper nouns when appropriate
- Maintain the same tone, style, and level of formality
- Do NOT add any introductions, explanations, or comments
- Output ONLY the translated content`;

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: nonEmptyItems[0].text },
          ],
          max_completion_tokens: 8000,
        });

        const result = [...texts];
        result[nonEmptyItems[0].index] =
          completion.choices[0].message.content || nonEmptyItems[0].text;
        return result;
      } catch (error) {
        this.logger.error('Error translating single text:', error);
        return texts;
      }
    }

    // Build numbered batch prompt
    const numberedTexts = nonEmptyItems
      .map((item, idx) => `[${idx + 1}]\n${item.text}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are a professional translator. Translate each numbered section to ${targetLanguage}.

CRITICAL INSTRUCTIONS:
- Translate each section independently
- Output format: [1] translated text, [2] translated text, etc.
- Maintain ALL original formatting including markdown, line breaks, bullet points
- Preserve speaker labels (e.g., "Speaker 1:", "Speaker 2:") exactly as they appear
- Keep technical terms and proper nouns when appropriate
- Maintain the same tone, style, and level of formality
- Use "---" as separator between sections
- Do NOT add any introductions or explanations`;

    const userPrompt = `Translate these ${nonEmptyItems.length} sections to ${targetLanguage}:\n\n${numberedTexts}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 16000,
      });

      const responseText = completion.choices[0].message.content || '';

      // Parse numbered response
      const translations = this.parseNumberedResponse(
        responseText,
        nonEmptyItems.length,
      );

      // Validate translations
      const validationResult = this.validateBatchTranslations(
        nonEmptyItems.map((item) => item.text),
        translations,
      );

      if (!validationResult.isValid) {
        this.logger.warn(
          `Batch translation validation failed: ${validationResult.reason}. Falling back to individual translations.`,
        );
        return this.translateIndividually(texts, targetLanguage);
      }

      // Build result array with translations in correct positions
      const result = [...texts];
      for (let i = 0; i < nonEmptyItems.length; i++) {
        const originalIndex = nonEmptyItems[i].index;
        result[originalIndex] = translations[i];
      }

      return result;
    } catch (error) {
      this.logger.error('Error in batch translation:', error);
      // Fallback to individual translations
      this.logger.warn('Falling back to individual translations after error');
      return this.translateIndividually(texts, targetLanguage);
    }
  }

  /**
   * Validate that batch translations are reasonable
   * Returns { isValid: true } or { isValid: false, reason: string }
   */
  private validateBatchTranslations(
    originals: string[],
    translations: string[],
  ): { isValid: boolean; reason?: string } {
    // Check count matches
    if (translations.length !== originals.length) {
      return {
        isValid: false,
        reason: `Count mismatch: expected ${originals.length}, got ${translations.length}`,
      };
    }

    // Check each translation
    for (let i = 0; i < originals.length; i++) {
      const original = originals[i];
      const translated = translations[i];

      // Empty translation for non-empty original is suspicious
      if (
        original.trim().length > 0 &&
        (!translated || translated.trim().length === 0)
      ) {
        return {
          isValid: false,
          reason: `Empty translation for item ${i + 1} (original: "${original.substring(0, 50)}...")`,
        };
      }

      // Translation significantly shorter than original is suspicious (>80% reduction)
      // Allow for language differences but catch truncation
      if (original.length > 50 && translated.length < original.length * 0.2) {
        return {
          isValid: false,
          reason: `Suspiciously short translation for item ${i + 1}: ${translated.length} chars vs ${original.length} original`,
        };
      }

      // Check if translation is identical to original (might indicate parsing failure)
      // Only flag if it's a substantial text that should differ after translation
      if (
        original.length > 20 &&
        translated === original &&
        !/^[A-Z0-9\s\-_.@]+$/i.test(original) // Allow identical if it's just codes/names
      ) {
        this.logger.debug(
          `Translation identical to original for item ${i + 1}, may indicate issue`,
        );
      }
    }

    return { isValid: true };
  }

  /**
   * Fallback: translate texts individually when batch fails
   */
  private async translateIndividually(
    texts: string[],
    targetLanguage: string,
  ): Promise<string[]> {
    const results: string[] = [...texts];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || text.trim() === '') {
        continue;
      }

      try {
        const systemPrompt = `You are a professional translator. Translate to ${targetLanguage}.

CRITICAL INSTRUCTIONS:
- Maintain ALL original formatting including markdown, line breaks, bullet points, headings, tables, and special characters
- Preserve speaker labels (e.g., "Speaker 1:", "Speaker 2:") exactly as they appear
- Keep technical terms and proper nouns when appropriate
- Maintain the same tone, style, and level of formality
- Do NOT add any introductions, explanations, or comments
- Output ONLY the translated content`;

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_completion_tokens: 8000,
        });

        results[i] = completion.choices[0].message.content || text;
      } catch (error) {
        this.logger.error(`Error translating item ${i}:`, error);
        // Keep original on error
      }
    }

    return results;
  }

  /**
   * Parse numbered response from batch translation
   * Handles formats like "[1] text" or "1. text" with --- separators
   */
  private parseNumberedResponse(
    response: string,
    expectedCount: number,
  ): string[] {
    const results: string[] = [];

    // Try splitting by --- first
    const sections = response.split(/\n---\n|\n-{3,}\n/);

    if (sections.length >= expectedCount) {
      // Clean up each section
      for (let i = 0; i < expectedCount; i++) {
        let section = sections[i] || '';
        // Remove leading [n] or n. markers
        section = section.replace(/^\s*\[?\d+\]?\.?\s*/, '').trim();
        results.push(section);
      }
      return results;
    }

    // Fallback: try to find [n] markers
    const markerRegex = /\[(\d+)\]\s*/g;
    const matches = [...response.matchAll(markerRegex)];

    if (matches.length >= expectedCount) {
      for (let i = 0; i < expectedCount; i++) {
        const startPos = matches[i].index + matches[i][0].length;
        const endPos =
          i < matches.length - 1 ? matches[i + 1].index : response.length;
        let section = response.slice(startPos, endPos).trim();
        // Remove trailing --- separator
        section = section.replace(/\n---\s*$/, '').trim();
        results.push(section);
      }
      return results;
    }

    // Last fallback: split by double newlines and take first expectedCount
    const paragraphs = response
      .split(/\n\n+/)
      .map((p) => p.replace(/^\s*\[?\d+\]?\.?\s*/, '').trim())
      .filter((p) => p.length > 0);

    for (let i = 0; i < expectedCount; i++) {
      results.push(paragraphs[i] || '');
    }

    return results;
  }
}
