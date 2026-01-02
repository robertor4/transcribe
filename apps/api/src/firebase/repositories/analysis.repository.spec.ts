import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisRepository } from './analysis.repository';
import { FirebaseService } from '../firebase.service';

describe('AnalysisRepository', () => {
  let repository: AnalysisRepository;
  let mockFirebaseService: any;
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;

  const mockAnalysisData = {
    templateId: 'blogPost',
    transcriptionId: 'trans123',
    userId: 'user123',
    content: { title: 'Test Blog', body: 'Content...' },
    generatedAt: { toDate: () => new Date('2024-01-15') },
  };

  beforeEach(async () => {
    mockDoc = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockAnalysisData,
        id: 'analysis123',
      }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      add: jest.fn().mockResolvedValue({ id: 'newAnalysis123' }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'analysis123',
            data: () => mockAnalysisData,
            ref: { delete: jest.fn().mockResolvedValue(undefined) },
          },
        ],
      }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    mockFirebaseService = {
      firestore: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisRepository,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    repository = module.get<AnalysisRepository>(AnalysisRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGeneratedAnalysis', () => {
    it('should create analysis and return ID', async () => {
      const analysis = {
        templateId: 'blogPost',
        transcriptionId: 'trans123',
        userId: 'user123',
        content: { title: 'Test' },
        generatedAt: new Date('2024-01-15'),
      };

      const result = await repository.createGeneratedAnalysis(analysis);

      expect(mockDb.collection).toHaveBeenCalledWith('generatedAnalyses');
      expect(mockCollection.add).toHaveBeenCalled();
      expect(result).toBe('newAnalysis123');
    });
  });

  describe('getGeneratedAnalyses', () => {
    it('should return analyses for transcription', async () => {
      const result = await repository.getGeneratedAnalyses(
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
      expect(mockCollection.orderBy).toHaveBeenCalledWith(
        'generatedAt',
        'desc',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('analysis123');
      expect(result[0].generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getGeneratedAnalysisById', () => {
    it('should return analysis by ID', async () => {
      const result = await repository.getGeneratedAnalysisById('analysis123');

      expect(mockDb.collection).toHaveBeenCalledWith('generatedAnalyses');
      expect(mockCollection.doc).toHaveBeenCalledWith('analysis123');
      expect(result).not.toBeNull();
      expect(result.id).toBe('analysis123');
    });

    it('should return null if analysis does not exist', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await repository.getGeneratedAnalysisById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateGeneratedAnalysis', () => {
    it('should update analysis document', async () => {
      await repository.updateGeneratedAnalysis('analysis123', {
        content: { title: 'Updated' },
      });

      expect(mockDoc.update).toHaveBeenCalledWith({
        content: { title: 'Updated' },
      });
    });
  });

  describe('deleteGeneratedAnalysis', () => {
    it('should delete analysis document', async () => {
      await repository.deleteGeneratedAnalysis('analysis123');

      expect(mockDoc.delete).toHaveBeenCalled();
    });
  });

  describe('deleteGeneratedAnalysesByTranscription', () => {
    it('should batch delete all analyses for transcription', async () => {
      const mockRefDelete = jest.fn().mockResolvedValue(undefined);
      mockCollection.get.mockResolvedValue({
        docs: [
          { id: 'a1', ref: { delete: mockRefDelete } },
          { id: 'a2', ref: { delete: mockRefDelete } },
        ],
      });

      const result = await repository.deleteGeneratedAnalysesByTranscription(
        'trans123',
        'user123',
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'transcriptionId',
        '==',
        'trans123',
      );
      expect(mockRefDelete).toHaveBeenCalledTimes(2);
      expect(result).toEqual(['a1', 'a2']);
    });
  });

  describe('addAnalysisReference', () => {
    it('should add analysis ID to transcription', async () => {
      await repository.addAnalysisReference('trans123', 'analysis123');

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
      expect(mockDoc.update).toHaveBeenCalled();
    });
  });

  describe('removeAnalysisReference', () => {
    it('should remove analysis ID from transcription', async () => {
      await repository.removeAnalysisReference('trans123', 'analysis123');

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
      expect(mockDoc.update).toHaveBeenCalled();
    });
  });

  describe('getRecentGeneratedAnalyses', () => {
    it('should return recent analyses with conversation titles', async () => {
      // Mock analyses query
      mockCollection.get
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'a1',
              data: () => ({
                ...mockAnalysisData,
                transcriptionId: 'trans1',
              }),
            },
          ],
        })
        // Mock transcription lookup
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ title: 'My Conversation' }),
        });

      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ title: 'My Conversation' }),
      });

      const result = await repository.getRecentGeneratedAnalyses('user123', 8);

      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user123',
      );
      expect(mockCollection.limit).toHaveBeenCalledWith(8);
      expect(result).toHaveLength(1);
      expect(result[0].conversationTitle).toBe('My Conversation');
    });

    it('should return empty array if no analyses', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await repository.getRecentGeneratedAnalyses('user123', 8);

      expect(result).toEqual([]);
    });
  });

  describe('getRecentGeneratedAnalysesByFolder', () => {
    it('should return analyses from folder conversations', async () => {
      // Mock transcriptions in folder
      mockCollection.get
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'trans1', data: () => ({ title: 'Conversation 1' }) }],
        })
        // Mock analyses for those transcriptions
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'a1',
              data: () => ({
                ...mockAnalysisData,
                transcriptionId: 'trans1',
              }),
            },
          ],
        });

      const result = await repository.getRecentGeneratedAnalysesByFolder(
        'user123',
        'folder123',
        8,
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'folderId',
        '==',
        'folder123',
      );
      expect(result).toHaveLength(1);
      expect(result[0].conversationTitle).toBe('Conversation 1');
    });

    it('should return empty array if no transcriptions in folder', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await repository.getRecentGeneratedAnalysesByFolder(
        'user123',
        'folder123',
        8,
      );

      expect(result).toEqual([]);
    });
  });
});
