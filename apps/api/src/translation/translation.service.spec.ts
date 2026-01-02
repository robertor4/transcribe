import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import { TranslationRepository } from '../firebase/repositories/translation.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import {
  createMockAnalysisRepository,
  createMockTranslationRepository,
  createMockTranscriptionRepository,
} from '../../test/mocks';
import { createTestTranscription } from '../../test/factories';
import { Translation, GeneratedAnalysis } from '@transcribe/shared';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Translated text' } }],
      }),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('TranslationService', () => {
  let service: TranslationService;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockTranslationRepository: ReturnType<
    typeof createMockTranslationRepository
  >;
  let mockAnalysisRepository: ReturnType<typeof createMockAnalysisRepository>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  const createMockTranslation = (
    overrides: Partial<Translation> = {},
  ): Translation => ({
    id: 'translation-123',
    sourceType: 'summary',
    sourceId: 'trans-123',
    transcriptionId: 'trans-123',
    userId: 'user-123',
    localeCode: 'es-ES',
    localeName: 'Spanish',
    content: { type: 'summaryV1', text: 'Texto traducido' },
    translatedAt: new Date(),
    translatedBy: 'gpt-5-mini',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockAnalysis = (
    overrides: Partial<GeneratedAnalysis> = {},
  ): GeneratedAnalysis => ({
    id: 'analysis-123',
    transcriptionId: 'trans-123',
    userId: 'user-123',
    templateId: 'template-123',
    templateName: 'Action Items',
    content: '# Action Items\n\n- Item 1\n- Item 2',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockTranscriptionRepository = createMockTranscriptionRepository();
    mockTranslationRepository = createMockTranslationRepository();
    mockAnalysisRepository = createMockAnalysisRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: TranslationRepository, useValue: mockTranslationRepository },
        { provide: AnalysisRepository, useValue: mockAnalysisRepository },
      ],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('translateConversation', () => {
    it('should throw if transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.translateConversation('trans-123', 'user-123', 'es'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for unsupported locale', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.translateConversation(
          'trans-123',
          'user-123',
          'invalid-locale',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should translate V1 summary when no existing translation', async () => {
      const transcription = createTestTranscription({
        summary: '# Summary\n\nThis is a test summary',
        summaryV2: undefined,
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslation.mockResolvedValue(null);
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.translateConversation(
        'trans-123',
        'user-123',
        'es-ES',
      );

      expect(result.translationsCreated).toBe(1);
      expect(result.localeCode).toBe('es-ES');
      expect(mockTranslationRepository.createTranslation).toHaveBeenCalled();
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('trans-123', expect.any(Object));
    });

    it('should skip existing summary translation', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslation.mockResolvedValue(
        createMockTranslation(),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.translateConversation(
        'trans-123',
        'user-123',
        'es-ES',
      );

      expect(result.translationsCreated).toBe(0);
      expect(
        mockTranslationRepository.createTranslation,
      ).not.toHaveBeenCalled();
    });

    it('should translate analyses when requested', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      // First call for summary (exists), subsequent for analyses (don't exist)
      mockTranslationRepository.getTranslation
        .mockResolvedValueOnce(createMockTranslation()) // summary exists
        .mockResolvedValue(null); // analyses don't exist
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        createMockAnalysis({ id: 'analysis-1' }),
        createMockAnalysis({ id: 'analysis-2' }),
      ]);

      const result = await service.translateConversation(
        'trans-123',
        'user-123',
        'es-ES',
        { translateSummary: true, translateAssets: true },
      );

      expect(result.translationsCreated).toBe(2);
      expect(mockTranslationRepository.createTranslation).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should only translate specific asset IDs when provided', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslation.mockResolvedValue(null);
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        createMockAnalysis({ id: 'analysis-1' }),
        createMockAnalysis({ id: 'analysis-2' }),
        createMockAnalysis({ id: 'analysis-3' }),
      ]);

      const result = await service.translateConversation(
        'trans-123',
        'user-123',
        'es-ES',
        {
          translateSummary: false,
          translateAssets: true,
          assetIds: ['analysis-1', 'analysis-3'],
        },
      );

      expect(result.translationsCreated).toBe(2);
    });

    it('should not translate summary when translateSummary is false', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslation.mockResolvedValue(null);
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.translateConversation(
        'trans-123',
        'user-123',
        'es-ES',
        { translateSummary: false, translateAssets: false },
      );

      expect(result.translationsCreated).toBe(0);
    });
  });

  describe('getTranslationStatus', () => {
    it('should throw if transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.getTranslationStatus('trans-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty available locales when no translations', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [],
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.getTranslationStatus(
        'trans-123',
        'user-123',
      );

      expect(result.transcriptionId).toBe('trans-123');
      expect(result.availableLocales).toEqual([]);
    });

    it('should group translations by locale', async () => {
      const transcription = createTestTranscription({
        detectedLanguage: 'English',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [
          createMockTranslation({ localeCode: 'es-ES', sourceType: 'summary' }),
          createMockTranslation({
            localeCode: 'es-ES',
            sourceType: 'analysis',
            sourceId: 'analysis-1',
          }),
          createMockTranslation({ localeCode: 'fr-FR', sourceType: 'summary' }),
        ],
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        createMockAnalysis(),
      ]);

      const result = await service.getTranslationStatus(
        'trans-123',
        'user-123',
      );

      expect(result.availableLocales).toHaveLength(2);
      const spanish = result.availableLocales.find((l) => l.code === 'es-ES');
      expect(spanish?.hasSummaryTranslation).toBe(true);
      expect(spanish?.translatedAssetCount).toBe(1);
    });

    it('should return preferred locale from transcription', async () => {
      const transcription = createTestTranscription({
        preferredLocale: 'es-ES',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [],
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.getTranslationStatus(
        'trans-123',
        'user-123',
      );

      expect(result.preferredLocale).toBe('es-ES');
    });
  });

  describe('getSharedTranslationStatus', () => {
    it('should throw for invalid share token', async () => {
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        null,
      );

      await expect(
        service.getSharedTranslationStatus('trans-123', 'invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if token transcription ID does not match', async () => {
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        createTestTranscription({ id: 'different-id' }),
      );

      await expect(
        service.getSharedTranslationStatus('trans-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return translation status for valid shared conversation', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslationsForSharedConversation.mockResolvedValue(
        [createMockTranslation({ localeCode: 'es-ES' })],
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.getSharedTranslationStatus(
        'trans-123',
        'valid-token',
      );

      expect(result.transcriptionId).toBe('trans-123');
      expect(result.availableLocales).toHaveLength(1);
    });
  });

  describe('getTranslationsForLocale', () => {
    it('should throw if transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.getTranslationsForLocale('trans-123', 'es-ES', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return translations for specific locale', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslationsForLocale.mockResolvedValue([
        createMockTranslation({ localeCode: 'es-ES' }),
      ]);

      const result = await service.getTranslationsForLocale(
        'trans-123',
        'es-ES',
        'user-123',
      );

      expect(result).toHaveLength(1);
      expect(
        mockTranslationRepository.getTranslationsForLocale,
      ).toHaveBeenCalledWith('trans-123', 'es-ES', 'user-123');
    });
  });

  describe('getSharedTranslationsForLocale', () => {
    it('should throw for invalid share token', async () => {
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        null,
      );

      await expect(
        service.getSharedTranslationsForLocale(
          'trans-123',
          'es-ES',
          'invalid-token',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should filter translations by locale for shared conversation', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.getTranslationsForSharedConversation.mockResolvedValue(
        [
          createMockTranslation({ localeCode: 'es-ES' }),
          createMockTranslation({ localeCode: 'fr-FR' }),
        ],
      );

      const result = await service.getSharedTranslationsForLocale(
        'trans-123',
        'es-ES',
        'valid-token',
      );

      expect(result).toHaveLength(1);
      expect(result[0].localeCode).toBe('es-ES');
    });
  });

  describe('deleteTranslationsForLocale', () => {
    it('should throw if transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.deleteTranslationsForLocale('trans-123', 'es-ES', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete translations and return count', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranslationRepository.deleteTranslationsForLocale.mockResolvedValue(
        3,
      );

      const result = await service.deleteTranslationsForLocale(
        'trans-123',
        'es-ES',
        'user-123',
      );

      expect(result).toBe(3);
      expect(
        mockTranslationRepository.deleteTranslationsForLocale,
      ).toHaveBeenCalledWith('trans-123', 'es-ES', 'user-123');
    });
  });

  describe('updateLocalePreference', () => {
    it('should throw if transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.updateLocalePreference('trans-123', 'es-ES', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for unsupported locale', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.updateLocalePreference(
          'trans-123',
          'invalid-locale',
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow "original" as locale preference', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await service.updateLocalePreference('trans-123', 'original', 'user-123');

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({ preferredLocale: 'original' }),
      );
    });

    it('should update locale preference for valid locale', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await service.updateLocalePreference('trans-123', 'es-ES', 'user-123');

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({ preferredLocale: 'es-ES' }),
      );
    });
  });

  describe('translateNewAsset', () => {
    it('should do nothing if no existing translations', async () => {
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [],
      );

      await service.translateNewAsset(
        createMockAnalysis(),
        'trans-123',
        'user-123',
      );

      expect(
        mockTranslationRepository.createTranslation,
      ).not.toHaveBeenCalled();
    });

    it('should translate to all existing locales', async () => {
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [
          createMockTranslation({ localeCode: 'es-ES' }),
          createMockTranslation({ localeCode: 'fr-FR' }),
        ],
      );

      await service.translateNewAsset(
        createMockAnalysis(),
        'trans-123',
        'user-123',
      );

      expect(mockTranslationRepository.createTranslation).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should skip unknown locale codes', async () => {
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [createMockTranslation({ localeCode: 'unknown-locale' })],
      );

      await service.translateNewAsset(
        createMockAnalysis(),
        'trans-123',
        'user-123',
      );

      expect(
        mockTranslationRepository.createTranslation,
      ).not.toHaveBeenCalled();
    });

    it('should continue on translation error', async () => {
      mockTranslationRepository.getTranslationsByConversation.mockResolvedValue(
        [
          createMockTranslation({ localeCode: 'es-ES' }),
          createMockTranslation({ localeCode: 'fr-FR' }),
        ],
      );
      mockTranslationRepository.createTranslation
        .mockRejectedValueOnce(new Error('Translation failed'))
        .mockResolvedValueOnce('translation-id');

      // Should not throw
      await expect(
        service.translateNewAsset(
          createMockAnalysis(),
          'trans-123',
          'user-123',
        ),
      ).resolves.not.toThrow();

      // Should still attempt second translation
      expect(mockTranslationRepository.createTranslation).toHaveBeenCalledTimes(
        2,
      );
    });
  });
});
