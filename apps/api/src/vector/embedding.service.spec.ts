import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';

// Mock OpenAI
const mockOpenAI = {
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [{ index: 0, embedding: new Array(1536).fill(0.1) }],
    }),
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  describe('embed', () => {
    it('should generate embedding for single text', async () => {
      const result = await service.embed('Hello world');

      expect(result).toHaveLength(1536);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        input: 'Hello world',
        model: 'text-embedding-3-small',
        dimensions: 1536,
      });
    });

    it('should return embedding array', async () => {
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
      });

      const result = await service.embed('Test');

      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('embedBatch', () => {
    it('should return empty array for empty input', async () => {
      const result = await service.embedBatch([]);

      expect(result).toEqual([]);
      expect(mockOpenAI.embeddings.create).not.toHaveBeenCalled();
    });

    it('should generate embeddings for multiple texts', async () => {
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: [
          { index: 0, embedding: [0.1, 0.2] },
          { index: 1, embedding: [0.3, 0.4] },
          { index: 2, embedding: [0.5, 0.6] },
        ],
      });

      const result = await service.embedBatch(['text1', 'text2', 'text3']);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([0.1, 0.2]);
      expect(result[1]).toEqual([0.3, 0.4]);
      expect(result[2]).toEqual([0.5, 0.6]);
    });

    it('should sort embeddings by index', async () => {
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: [
          { index: 2, embedding: [0.5] },
          { index: 0, embedding: [0.1] },
          { index: 1, embedding: [0.3] },
        ],
      });

      const result = await service.embedBatch(['a', 'b', 'c']);

      expect(result[0]).toEqual([0.1]);
      expect(result[1]).toEqual([0.3]);
      expect(result[2]).toEqual([0.5]);
    });

    it('should process in batches of 100', async () => {
      // Create 150 texts
      const texts = Array(150).fill('test');

      mockOpenAI.embeddings.create
        .mockResolvedValueOnce({
          data: Array(100)
            .fill(0)
            .map((_, i) => ({ index: i, embedding: [i] })),
        })
        .mockResolvedValueOnce({
          data: Array(50)
            .fill(0)
            .map((_, i) => ({ index: i, embedding: [i + 100] })),
        });

      const result = await service.embedBatch(texts);

      expect(result).toHaveLength(150);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getModelInfo', () => {
    it('should return model info', () => {
      const result = service.getModelInfo();

      expect(result.model).toBe('text-embedding-3-small');
      expect(result.dimensions).toBe(1536);
    });
  });
});
