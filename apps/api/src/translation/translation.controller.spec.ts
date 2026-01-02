import { Test, TestingModule } from '@nestjs/testing';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UserRepository } from '../firebase/repositories/user.repository';

describe('TranslationController', () => {
  let controller: TranslationController;
  let mockTranslationService: any;
  let mockUserRepository: any;

  const mockRequest = (uid: string = 'user-123') => ({
    user: { uid },
  });

  beforeEach(async () => {
    mockTranslationService = {
      translateConversation: jest.fn(),
      getTranslationStatus: jest.fn(),
      getTranslationsForLocale: jest.fn(),
      deleteTranslationsForLocale: jest.fn(),
      updateLocalePreference: jest.fn(),
      getSharedTranslationStatus: jest.fn(),
      getSharedTranslationsForLocale: jest.fn(),
    };

    mockUserRepository = {
      getUser: jest.fn().mockResolvedValue({ uid: 'user-123', email: 'test@example.com', subscriptionTier: 'professional' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranslationController],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TranslationController>(TranslationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('translateConversation', () => {
    it('should translate conversation to target locale', async () => {
      const translateResult = {
        translatedCount: 3,
        localeCode: 'de-DE',
        localeName: 'German',
      };
      mockTranslationService.translateConversation.mockResolvedValue(
        translateResult,
      );

      const result = await controller.translateConversation(
        'trans-123',
        { targetLocale: 'de-DE' },
        mockRequest() as any,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(translateResult);
      expect(result.message).toContain('German');
      expect(mockTranslationService.translateConversation).toHaveBeenCalledWith(
        'trans-123',
        'user-123',
        'de-DE',
        { translateSummary: true, translateAssets: true, assetIds: undefined, forceRetranslate: false },
      );
    });

    it('should pass translation options', async () => {
      const translateResult = {
        translatedCount: 1,
        localeCode: 'fr-FR',
        localeName: 'French',
      };
      mockTranslationService.translateConversation.mockResolvedValue(
        translateResult,
      );

      await controller.translateConversation(
        'trans-123',
        {
          targetLocale: 'fr-FR',
          translateSummary: false,
          translateAssets: true,
          assetIds: ['asset-1', 'asset-2'],
        },
        mockRequest() as any,
      );

      expect(mockTranslationService.translateConversation).toHaveBeenCalledWith(
        'trans-123',
        'user-123',
        'fr-FR',
        {
          translateSummary: false,
          translateAssets: true,
          assetIds: ['asset-1', 'asset-2'],
          forceRetranslate: false,
        },
      );
    });
  });

  describe('getTranslationStatus', () => {
    it('should return translation status', async () => {
      const status = {
        availableLocales: ['de-DE', 'fr-FR'],
        currentLocale: 'de-DE',
      };
      mockTranslationService.getTranslationStatus.mockResolvedValue(status);

      const result = await controller.getTranslationStatus(
        'trans-123',
        mockRequest() as any,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(status);
      expect(mockTranslationService.getTranslationStatus).toHaveBeenCalledWith(
        'trans-123',
        'user-123',
      );
    });
  });

  describe('getTranslationsForLocale', () => {
    it('should return translations for locale', async () => {
      const translations = [
        { id: 'trans-1', type: 'summary', content: 'Übersetzung' },
        { id: 'trans-2', type: 'asset', content: 'Übersetzt' },
      ];
      mockTranslationService.getTranslationsForLocale.mockResolvedValue(
        translations,
      );

      const result = await controller.getTranslationsForLocale(
        'trans-123',
        'de-DE',
        mockRequest() as any,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(translations);
      expect(
        mockTranslationService.getTranslationsForLocale,
      ).toHaveBeenCalledWith('trans-123', 'de-DE', 'user-123');
    });
  });

  describe('deleteTranslationsForLocale', () => {
    it('should delete translations for locale', async () => {
      mockTranslationService.deleteTranslationsForLocale.mockResolvedValue(5);

      const result = await controller.deleteTranslationsForLocale(
        'trans-123',
        'de-DE',
        mockRequest() as any,
      );

      expect(result.success).toBe(true);
      expect(result.data.deletedCount).toBe(5);
      expect(result.message).toContain('5');
      expect(
        mockTranslationService.deleteTranslationsForLocale,
      ).toHaveBeenCalledWith('trans-123', 'de-DE', 'user-123');
    });
  });

  describe('updateLocalePreference', () => {
    it('should update locale preference', async () => {
      mockTranslationService.updateLocalePreference.mockResolvedValue(
        undefined,
      );

      const result = await controller.updateLocalePreference(
        'trans-123',
        'fr-FR',
        mockRequest() as any,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Locale preference updated');
      expect(
        mockTranslationService.updateLocalePreference,
      ).toHaveBeenCalledWith('trans-123', 'fr-FR', 'user-123');
    });
  });

  describe('getSharedTranslationStatus', () => {
    it('should return shared translation status', async () => {
      const status = {
        availableLocales: ['es-ES'],
        currentLocale: 'es-ES',
      };
      mockTranslationService.getSharedTranslationStatus.mockResolvedValue(
        status,
      );

      const result = await controller.getSharedTranslationStatus(
        'share-token-123',
        'trans-123',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(status);
      expect(
        mockTranslationService.getSharedTranslationStatus,
      ).toHaveBeenCalledWith('trans-123', 'share-token-123');
    });
  });

  describe('getSharedTranslationsForLocale', () => {
    it('should return translations for shared conversation', async () => {
      const translations = [
        { id: 'trans-1', type: 'summary', content: 'Traducción' },
      ];
      mockTranslationService.getSharedTranslationsForLocale.mockResolvedValue(
        translations,
      );

      const result = await controller.getSharedTranslationsForLocale(
        'share-token-123',
        'es-ES',
        'trans-123',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(translations);
      expect(
        mockTranslationService.getSharedTranslationsForLocale,
      ).toHaveBeenCalledWith('trans-123', 'es-ES', 'share-token-123');
    });
  });
});
