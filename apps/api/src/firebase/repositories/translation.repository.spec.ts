import { Test, TestingModule } from '@nestjs/testing';
import { TranslationRepository } from './translation.repository';
import { FirebaseService } from '../firebase.service';

describe('TranslationRepository', () => {
  let repository: TranslationRepository;
  let mockFirebaseService: any;
  let mockDb: any;
  let mockCollection: any;
  let mockBatch: any;

  const mockTranslationData = {
    sourceType: 'summary',
    sourceId: 'trans123',
    transcriptionId: 'trans123',
    userId: 'user123',
    localeCode: 'es-ES',
    localeName: 'Spanish',
    content: { title: 'Título traducido', body: 'Contenido...' },
    translatedAt: { toDate: () => new Date('2024-01-15') },
    translatedBy: 'gpt-5',
    tokenUsage: { prompt: 100, completion: 50, total: 150 },
    createdAt: { toDate: () => new Date('2024-01-15') },
    updatedAt: { toDate: () => new Date('2024-01-15') },
  };

  beforeEach(async () => {
    mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnThis(),
      add: jest.fn().mockResolvedValue({ id: 'newTranslation123' }),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        size: 1,
        docs: [
          {
            id: 'translation123',
            data: () => mockTranslationData,
            ref: { delete: jest.fn() },
          },
        ],
      }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      batch: jest.fn().mockReturnValue(mockBatch),
    };

    mockFirebaseService = {
      firestore: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationRepository,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    repository = module.get<TranslationRepository>(TranslationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTranslation', () => {
    it('should create translation and return ID', async () => {
      const translation = {
        sourceType: 'summary' as const,
        sourceId: 'trans123',
        transcriptionId: 'trans123',
        userId: 'user123',
        localeCode: 'es-ES',
        localeName: 'Spanish',
        content: { title: 'Título' },
        translatedAt: new Date('2024-01-15'),
        translatedBy: 'gpt-5' as const,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const result = await repository.createTranslation(translation);

      expect(mockDb.collection).toHaveBeenCalledWith('translations');
      expect(mockCollection.add).toHaveBeenCalled();
      expect(result).toBe('newTranslation123');
    });
  });

  describe('getTranslation', () => {
    it('should return translation by source and locale', async () => {
      const result = await repository.getTranslation(
        'trans123',
        'summary',
        'trans123',
        'es-ES',
        'user123',
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'transcriptionId',
        '==',
        'trans123',
      );
      expect(mockCollection.where).toHaveBeenCalledWith(
        'sourceType',
        '==',
        'summary',
      );
      expect(mockCollection.where).toHaveBeenCalledWith(
        'localeCode',
        '==',
        'es-ES',
      );
      expect(mockCollection.limit).toHaveBeenCalledWith(1);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('translation123');
    });

    it('should return null if translation does not exist', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await repository.getTranslation(
        'trans123',
        'summary',
        'trans123',
        'de-DE',
        'user123',
      );

      expect(result).toBeNull();
    });
  });

  describe('getTranslationsByConversation', () => {
    it('should return all translations for a conversation', async () => {
      const result = await repository.getTranslationsByConversation(
        'trans123',
        'user123',
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'transcriptionId',
        '==',
        'trans123',
      );
      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user123',
      );
      expect(result).toHaveLength(1);
      expect(result[0].localeCode).toBe('es-ES');
    });
  });

  describe('getTranslationsForLocale', () => {
    it('should return translations for a specific locale', async () => {
      const result = await repository.getTranslationsForLocale(
        'trans123',
        'es-ES',
        'user123',
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'localeCode',
        '==',
        'es-ES',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getTranslationsForSharedConversation', () => {
    it('should return translations without userId filter', async () => {
      const result =
        await repository.getTranslationsForSharedConversation('trans123');

      expect(mockCollection.where).toHaveBeenCalledWith(
        'transcriptionId',
        '==',
        'trans123',
      );
      // Should NOT have userId filter
      expect(mockCollection.where).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteTranslationsForLocale', () => {
    it('should batch delete translations for a locale', async () => {
      mockCollection.get.mockResolvedValue({
        empty: false,
        size: 2,
        docs: [
          { id: 't1', ref: { id: 't1' } },
          { id: 't2', ref: { id: 't2' } },
        ],
      });

      const result = await repository.deleteTranslationsForLocale(
        'trans123',
        'es-ES',
        'user123',
      );

      expect(mockDb.batch).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toBe(2);
    });

    it('should return 0 if no translations to delete', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, size: 0, docs: [] });

      const result = await repository.deleteTranslationsForLocale(
        'trans123',
        'de-DE',
        'user123',
      );

      expect(mockBatch.commit).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('deleteTranslationsByConversation', () => {
    it('should batch delete all translations for a conversation', async () => {
      mockCollection.get.mockResolvedValue({
        empty: false,
        size: 3,
        docs: [
          { id: 't1', ref: { id: 't1' } },
          { id: 't2', ref: { id: 't2' } },
          { id: 't3', ref: { id: 't3' } },
        ],
      });

      const result = await repository.deleteTranslationsByConversation(
        'trans123',
        'user123',
      );

      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it('should return 0 if no translations to delete', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, size: 0, docs: [] });

      const result = await repository.deleteTranslationsByConversation(
        'trans123',
        'user123',
      );

      expect(result).toBe(0);
    });
  });
});
