import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { VectorService } from './vector.service';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { FolderRepository } from '../firebase/repositories/folder.repository';
import {
  createMockTranscriptionRepository,
  createMockFolderRepository,
} from '../../test/mocks';
import { createTestTranscription } from '../../test/factories';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'This is the synthesized answer.' } }],
      }),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('VectorService', () => {
  let service: VectorService;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockFolderRepository: ReturnType<typeof createMockFolderRepository>;
  let mockQdrantService: any;
  let mockEmbeddingService: any;
  let mockChunkingService: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  beforeEach(async () => {
    mockTranscriptionRepository = createMockTranscriptionRepository();
    mockFolderRepository = createMockFolderRepository();

    mockQdrantService = {
      isConfigured: jest.fn().mockReturnValue(true),
      deleteByTranscriptionId: jest.fn().mockResolvedValue(undefined),
      upsertPoints: jest.fn().mockResolvedValue(undefined),
      countByTranscriptionId: jest.fn().mockResolvedValue(0),
      search: jest.fn().mockResolvedValue([]),
      generatePointId: jest.fn().mockReturnValue('point-123'),
    };

    mockEmbeddingService = {
      embed: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
      embedBatch: jest.fn().mockResolvedValue([new Array(1536).fill(0.1)]),
    };

    mockChunkingService = {
      chunkSegments: jest.fn().mockReturnValue([
        {
          text: 'Hello, this is a test segment.',
          speaker: 'Speaker A',
          startTime: 0,
          endTime: 10,
          segmentIndex: 0,
          chunkIndex: 0,
          totalChunks: 1,
        },
      ]),
      formatTimestamp: jest.fn((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: QdrantService, useValue: mockQdrantService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
        { provide: ChunkingService, useValue: mockChunkingService },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: FolderRepository, useValue: mockFolderRepository },
      ],
    }).compile();

    service = module.get<VectorService>(VectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when qdrant is configured', () => {
      mockQdrantService.isConfigured.mockReturnValue(true);

      const result = service.isAvailable();

      expect(result).toBe(true);
      expect(mockQdrantService.isConfigured).toHaveBeenCalled();
    });

    it('should return false when qdrant is not configured', () => {
      mockQdrantService.isConfigured.mockReturnValue(false);

      const result = service.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('indexTranscription', () => {
    it('should index transcription and return chunk count', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        speakerSegments: [
          { speaker: 'Speaker A', text: 'Hello', start: 0, end: 5 },
        ],
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockEmbeddingService.embedBatch.mockResolvedValue([
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ]);

      const result = await service.indexTranscription('user-123', 'trans-123');

      expect(result).toBe(2); // 1 content chunk + 1 metadata chunk
      expect(mockQdrantService.deleteByTranscriptionId).toHaveBeenCalledWith(
        'trans-123',
      );
      expect(mockQdrantService.upsertPoints).toHaveBeenCalled();
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          vectorIndexedAt: expect.any(Date),
          vectorChunkCount: 2,
        }),
      );
    });

    it('should throw NotFoundException when transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.indexTranscription('user-123', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 0 when transcription has no speaker segments', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        speakerSegments: [],
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      const result = await service.indexTranscription('user-123', 'trans-123');

      expect(result).toBe(0);
    });

    it('should include summary info in metadata chunk', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        title: 'Team Meeting',
        speakerSegments: [
          { speaker: 'Speaker A', text: 'Hello', start: 0, end: 5 },
        ],
        summaryV2: {
          intro: 'A discussion about project updates.',
          keyPoints: [
            { topic: 'Budget', description: 'Reviewed budget allocation.' },
          ],
        },
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockEmbeddingService.embedBatch.mockResolvedValue([
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ]);

      await service.indexTranscription('user-123', 'trans-123');

      // Check that embedBatch was called with text including summary info
      const embedBatchCall = mockEmbeddingService.embedBatch.mock.calls[0][0];
      expect(embedBatchCall).toContainEqual(
        expect.stringContaining('Team Meeting'),
      );
    });
  });

  describe('isIndexed', () => {
    it('should return true when chunks exist', async () => {
      mockQdrantService.countByTranscriptionId.mockResolvedValue(5);

      const result = await service.isIndexed('trans-123');

      expect(result).toBe(true);
      expect(mockQdrantService.countByTranscriptionId).toHaveBeenCalledWith(
        'trans-123',
      );
    });

    it('should return false when no chunks exist', async () => {
      mockQdrantService.countByTranscriptionId.mockResolvedValue(0);

      const result = await service.isIndexed('trans-123');

      expect(result).toBe(false);
    });
  });

  describe('ensureIndexed', () => {
    it('should index when not already indexed', async () => {
      mockQdrantService.countByTranscriptionId.mockResolvedValue(0);
      const transcription = createTestTranscription({
        id: 'trans-123',
        speakerSegments: [
          { speaker: 'Speaker A', text: 'Hello', start: 0, end: 5 },
        ],
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockEmbeddingService.embedBatch.mockResolvedValue([
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ]);

      await service.ensureIndexed('user-123', 'trans-123');

      expect(mockQdrantService.upsertPoints).toHaveBeenCalled();
    });

    it('should not re-index when already indexed', async () => {
      mockQdrantService.countByTranscriptionId.mockResolvedValue(5);

      await service.ensureIndexed('user-123', 'trans-123');

      expect(mockQdrantService.upsertPoints).not.toHaveBeenCalled();
    });
  });

  describe('askConversation', () => {
    it('should return answer with citations', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        summary: 'This is a test summary.',
        speakerSegments: [
          { speaker: 'Speaker A', text: 'Hello', start: 0, end: 5 },
        ],
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockQdrantService.countByTranscriptionId.mockResolvedValue(5);
      mockQdrantService.search.mockResolvedValue([
        {
          score: 0.9,
          payload: {
            transcriptionId: 'trans-123',
            conversationTitle: 'Test Conversation',
            speaker: 'Speaker A',
            startTime: 30,
            text: 'This is relevant content.',
          },
        },
      ]);

      const result = await service.askConversation(
        'user-123',
        'trans-123',
        'What was discussed?',
      );

      expect(result.answer).toBe('This is the synthesized answer.');
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].speaker).toBe('Speaker A');
      expect(result.searchScope).toBe('conversation');
      expect(result.indexed).toBe(true);
    });

    it('should throw NotFoundException when transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.askConversation('user-123', 'nonexistent', 'Question'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use summaryV2 when available', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        summaryV2: {
          title: 'Product Review',
          intro: 'Discussion of Q4 products.',
          keyPoints: [{ topic: 'Sales', description: 'Strong sales numbers.' }],
        },
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockQdrantService.countByTranscriptionId.mockResolvedValue(5);
      mockQdrantService.search.mockResolvedValue([]);

      await service.askConversation(
        'user-123',
        'trans-123',
        'What about sales?',
      );

      // Check that OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('askGlobal', () => {
    it('should search across all user conversations', async () => {
      mockQdrantService.search.mockResolvedValue([
        {
          score: 0.85,
          payload: {
            transcriptionId: 'trans-1',
            conversationTitle: 'Meeting 1',
            speaker: 'John',
            startTime: 60,
            text: 'We discussed the project timeline.',
          },
        },
      ]);

      const result = await service.askGlobal(
        'user-123',
        'What is the project timeline?',
      );

      expect(result.answer).toBe('This is the synthesized answer.');
      expect(result.searchScope).toBe('global');
      expect(mockQdrantService.search).toHaveBeenCalledWith(
        expect.any(Array),
        { userId: 'user-123' },
        20,
      );
    });

    it('should return default message when no results found', async () => {
      mockQdrantService.search.mockResolvedValue([]);

      const result = await service.askGlobal('user-123', 'Random question');

      expect(result.answer).toContain("couldn't find relevant information");
      expect(result.citations).toHaveLength(0);
    });

    it('should respect maxResults parameter', async () => {
      mockQdrantService.search.mockResolvedValue([]);

      await service.askGlobal('user-123', 'Question', 5);

      expect(mockQdrantService.search).toHaveBeenCalledWith(
        expect.any(Array),
        { userId: 'user-123' },
        5,
      );
    });
  });

  describe('askFolder', () => {
    it('should search within folder', async () => {
      mockFolderRepository.getFolder.mockResolvedValue({
        id: 'folder-123',
        name: 'Work',
        userId: 'user-123',
      });
      mockTranscriptionRepository.getTranscriptionsByFolder.mockResolvedValue(
        [],
      );
      mockQdrantService.search.mockResolvedValue([
        {
          score: 0.9,
          payload: {
            transcriptionId: 'trans-1',
            conversationTitle: 'Work Meeting',
            speaker: 'Manager',
            startTime: 0,
            text: 'Quarterly review.',
          },
        },
      ]);

      const result = await service.askFolder(
        'user-123',
        'folder-123',
        'Review?',
      );

      expect(result.searchScope).toBe('folder');
      expect(mockQdrantService.search).toHaveBeenCalledWith(
        expect.any(Array),
        { userId: 'user-123', folderId: 'folder-123' },
        15,
      );
    });

    it('should throw NotFoundException when folder not found', async () => {
      mockFolderRepository.getFolder.mockResolvedValue(null);

      await expect(
        service.askFolder('user-123', 'nonexistent', 'Question'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should index unindexed transcriptions in folder', async () => {
      mockFolderRepository.getFolder.mockResolvedValue({
        id: 'folder-123',
        name: 'Work',
        userId: 'user-123',
      });
      const transcription = createTestTranscription({
        id: 'trans-1',
        speakerSegments: [{ speaker: 'A', text: 'Hello', start: 0, end: 5 }],
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscriptionsByFolder.mockResolvedValue([
        transcription,
      ]);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockQdrantService.search.mockResolvedValue([]);
      mockEmbeddingService.embedBatch.mockResolvedValue([
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ]);

      await service.askFolder('user-123', 'folder-123', 'Question');

      expect(mockQdrantService.upsertPoints).toHaveBeenCalled();
    });

    it('should return default message when no results', async () => {
      mockFolderRepository.getFolder.mockResolvedValue({
        id: 'folder-123',
        name: 'Work',
      });
      mockTranscriptionRepository.getTranscriptionsByFolder.mockResolvedValue(
        [],
      );
      mockQdrantService.search.mockResolvedValue([]);

      const result = await service.askFolder(
        'user-123',
        'folder-123',
        'Question',
      );

      expect(result.answer).toContain("couldn't find relevant information");
    });
  });

  describe('findConversations', () => {
    it('should find and group conversations', async () => {
      mockQdrantService.search.mockResolvedValue([
        {
          score: 0.95,
          payload: {
            transcriptionId: 'trans-1',
            conversationTitle: 'Meeting Notes',
            conversationDate: '2024-01-01T00:00:00Z',
            speaker: 'John',
            startTime: 30,
            text: 'Discussed budget.',
            folderId: null,
          },
        },
        {
          score: 0.85,
          payload: {
            transcriptionId: 'trans-1',
            conversationTitle: 'Meeting Notes',
            conversationDate: '2024-01-01T00:00:00Z',
            speaker: 'Jane',
            startTime: 60,
            text: 'Timeline review.',
            folderId: null,
          },
        },
      ]);

      const result = await service.findConversations(
        'user-123',
        'budget meeting',
      );

      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].transcriptionId).toBe('trans-1');
      expect(result.conversations[0].matchedSnippets.length).toBeGreaterThan(0);
      expect(result.searchScope).toBe('global');
    });

    it('should filter by folder when provided', async () => {
      mockQdrantService.search.mockResolvedValue([]);

      await service.findConversations('user-123', 'query', 'folder-123');

      expect(mockQdrantService.search).toHaveBeenCalledWith(
        expect.any(Array),
        { userId: 'user-123', folderId: 'folder-123' },
        30, // maxResults * 3
      );
    });

    it('should include folder names when available', async () => {
      mockQdrantService.search.mockResolvedValue([
        {
          score: 0.9,
          payload: {
            transcriptionId: 'trans-1',
            conversationTitle: 'Work Meeting',
            conversationDate: '2024-01-01T00:00:00Z',
            speaker: 'A',
            startTime: 0,
            text: 'Content',
            folderId: 'folder-1',
          },
        },
      ]);
      mockFolderRepository.getFolder.mockResolvedValue({
        id: 'folder-1',
        name: 'Work',
      });

      const result = await service.findConversations('user-123', 'work');

      expect(result.conversations[0].folderName).toBe('Work');
    });
  });

  describe('deleteTranscriptionVectors', () => {
    it('should delete vectors for transcription', async () => {
      await service.deleteTranscriptionVectors('trans-123');

      expect(mockQdrantService.deleteByTranscriptionId).toHaveBeenCalledWith(
        'trans-123',
      );
    });
  });

  describe('reindexTranscription', () => {
    it('should reindex transcription', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        speakerSegments: [{ speaker: 'A', text: 'Hello', start: 0, end: 5 }],
        createdAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockEmbeddingService.embedBatch.mockResolvedValue([
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ]);

      const result = await service.reindexTranscription(
        'user-123',
        'trans-123',
      );

      expect(result).toBe(2);
      expect(mockQdrantService.deleteByTranscriptionId).toHaveBeenCalledWith(
        'trans-123',
      );
    });
  });

  describe('getIndexingStatus', () => {
    it('should return indexing status', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        vectorIndexedAt: new Date('2024-01-01'),
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockQdrantService.countByTranscriptionId.mockResolvedValue(10);

      const result = await service.getIndexingStatus('user-123', 'trans-123');

      expect(result.indexed).toBe(true);
      expect(result.chunkCount).toBe(10);
      expect(result.indexedAt).toEqual(new Date('2024-01-01'));
    });

    it('should throw NotFoundException when transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.getIndexingStatus('user-123', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return not indexed when chunk count is 0', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockQdrantService.countByTranscriptionId.mockResolvedValue(0);

      const result = await service.getIndexingStatus('user-123', 'trans-123');

      expect(result.indexed).toBe(false);
      expect(result.chunkCount).toBe(0);
    });
  });
});
