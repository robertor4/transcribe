import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from './qdrant.service';

// Mock QdrantClient
const mockQdrantClient = {
  getCollections: jest.fn(),
  createCollection: jest.fn(),
  createPayloadIndex: jest.fn(),
  upsert: jest.fn(),
  search: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => mockQdrantClient),
}));

describe('QdrantService', () => {
  let service: QdrantService;

  describe('when configured', () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'QDRANT_URL') return 'http://localhost:6333';
        if (key === 'QDRANT_API_KEY') return 'test-api-key';
        if (key === 'QDRANT_COLLECTION') return 'test_collection';
        return null;
      }),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: 'test_collection' }],
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          QdrantService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<QdrantService>(QdrantService);
    });

    describe('isConfigured', () => {
      it('should return true when QDRANT_URL is set', () => {
        expect(service.isConfigured()).toBe(true);
      });
    });

    describe('onModuleInit', () => {
      it('should check if collection exists', async () => {
        await service.onModuleInit();

        expect(mockQdrantClient.getCollections).toHaveBeenCalled();
      });

      it('should create collection if it does not exist', async () => {
        mockQdrantClient.getCollections.mockResolvedValueOnce({
          collections: [],
        });

        await service.onModuleInit();

        expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            vectors: { size: 1536, distance: 'Cosine' },
          }),
        );
      });

      it('should not create collection if it already exists', async () => {
        mockQdrantClient.getCollections.mockResolvedValueOnce({
          collections: [{ name: 'test_collection' }],
        });

        await service.onModuleInit();

        expect(mockQdrantClient.createCollection).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        mockQdrantClient.getCollections.mockRejectedValueOnce(
          new Error('Connection failed'),
        );

        await expect(service.onModuleInit()).resolves.not.toThrow();
      });
    });

    describe('upsertPoints', () => {
      it('should upsert points to collection', async () => {
        const points = [
          { id: 'point-1', vector: [0.1, 0.2], payload: { text: 'test' } },
        ];

        await service.upsertPoints(points);

        expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            points,
            wait: true,
          }),
        );
      });

      it('should do nothing for empty points array', async () => {
        await service.upsertPoints([]);

        expect(mockQdrantClient.upsert).not.toHaveBeenCalled();
      });

      it('should batch upsert in chunks of 100', async () => {
        const points = Array(150)
          .fill(0)
          .map((_, i) => ({
            id: `point-${i}`,
            vector: [0.1],
            payload: {},
          }));

        await service.upsertPoints(points);

        expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(2);
      });
    });

    describe('search', () => {
      it('should search with userId filter', async () => {
        mockQdrantClient.search.mockResolvedValue([
          {
            id: 'result-1',
            score: 0.9,
            payload: { transcriptionId: 'trans-1', text: 'content' },
          },
        ]);

        const result = await service.search([0.1, 0.2], { userId: 'user-123' });

        expect(result).toHaveLength(1);
        expect(result[0].score).toBe(0.9);
        expect(mockQdrantClient.search).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            filter: {
              must: [{ key: 'userId', match: { value: 'user-123' } }],
            },
          }),
        );
      });

      it('should add transcriptionId to filter when provided', async () => {
        mockQdrantClient.search.mockResolvedValue([]);

        await service.search([0.1], {
          userId: 'user-123',
          transcriptionId: 'trans-123',
        });

        expect(mockQdrantClient.search).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            filter: {
              must: [
                { key: 'userId', match: { value: 'user-123' } },
                { key: 'transcriptionId', match: { value: 'trans-123' } },
              ],
            },
          }),
        );
      });

      it('should add folderId to filter when provided', async () => {
        mockQdrantClient.search.mockResolvedValue([]);

        await service.search([0.1], {
          userId: 'user-123',
          folderId: 'folder-123',
        });

        expect(mockQdrantClient.search).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            filter: {
              must: [
                { key: 'userId', match: { value: 'user-123' } },
                { key: 'folderId', match: { value: 'folder-123' } },
              ],
            },
          }),
        );
      });

      it('should respect limit parameter', async () => {
        mockQdrantClient.search.mockResolvedValue([]);

        await service.search([0.1], { userId: 'user-123' }, 5);

        expect(mockQdrantClient.search).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({ limit: 5 }),
        );
      });
    });

    describe('deleteByTranscriptionId', () => {
      it('should delete points by transcription ID', async () => {
        mockQdrantClient.delete.mockResolvedValue({ deleted_count: 5 });

        const result = await service.deleteByTranscriptionId('trans-123');

        expect(result).toBe(5);
        expect(mockQdrantClient.delete).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            filter: {
              must: [{ key: 'transcriptionId', match: { value: 'trans-123' } }],
            },
          }),
        );
      });

      it('should return 0 when no deleted_count in result', async () => {
        mockQdrantClient.delete.mockResolvedValue({});

        const result = await service.deleteByTranscriptionId('trans-123');

        expect(result).toBe(0);
      });
    });

    describe('deleteByUserId', () => {
      it('should delete all points for user', async () => {
        mockQdrantClient.delete.mockResolvedValue({ deleted_count: 100 });

        const result = await service.deleteByUserId('user-123');

        expect(result).toBe(100);
        expect(mockQdrantClient.delete).toHaveBeenCalledWith(
          'test_collection',
          expect.objectContaining({
            filter: {
              must: [{ key: 'userId', match: { value: 'user-123' } }],
            },
          }),
        );
      });
    });

    describe('countByTranscriptionId', () => {
      it('should count points for transcription', async () => {
        mockQdrantClient.count.mockResolvedValue({ count: 10 });

        const result = await service.countByTranscriptionId('trans-123');

        expect(result).toBe(10);
      });

      it('should return 0 on error', async () => {
        mockQdrantClient.count.mockRejectedValue(new Error('Count failed'));

        const result = await service.countByTranscriptionId('trans-123');

        expect(result).toBe(0);
      });
    });

    describe('generatePointId', () => {
      it('should generate a unique ID', () => {
        const id1 = service.generatePointId();
        const id2 = service.generatePointId();

        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toBe(id2);
      });
    });

    describe('healthCheck', () => {
      it('should return true when healthy', async () => {
        mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });

        const result = await service.healthCheck();

        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        mockQdrantClient.getCollections.mockRejectedValue(new Error('Failed'));

        const result = await service.healthCheck();

        expect(result).toBe(false);
      });
    });
  });

  describe('when not configured', () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(null),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          QdrantService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<QdrantService>(QdrantService);
    });

    it('should return false for isConfigured', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('should skip collection check on init', async () => {
      await service.onModuleInit();

      expect(mockQdrantClient.getCollections).not.toHaveBeenCalled();
    });

    it('should throw on upsertPoints', async () => {
      await expect(
        service.upsertPoints([{ id: '1', vector: [], payload: {} }]),
      ).rejects.toThrow('Qdrant not configured');
    });

    it('should throw on search', async () => {
      await expect(
        service.search([0.1], { userId: 'user-123' }),
      ).rejects.toThrow('Qdrant not configured');
    });

    it('should throw on deleteByTranscriptionId', async () => {
      await expect(
        service.deleteByTranscriptionId('trans-123'),
      ).rejects.toThrow('Qdrant not configured');
    });

    it('should return 0 for countByTranscriptionId', async () => {
      const result = await service.countByTranscriptionId('trans-123');

      expect(result).toBe(0);
    });

    it('should return false for healthCheck', async () => {
      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
