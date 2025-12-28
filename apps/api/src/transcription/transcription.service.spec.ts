import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { FirebaseService } from '../firebase/firebase.service';
import { StorageService } from '../firebase/services/storage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import { CommentRepository } from '../firebase/repositories/comment.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { AssemblyAIService } from '../assembly-ai/assembly-ai.service';
import { EmailService } from '../email/email.service';
import { UsageService } from '../usage/usage.service';
import {
  createMockStorageService,
  createMockUserRepository,
  createMockAnalysisRepository,
  createMockCommentRepository,
  createMockTranscriptionRepository,
} from '../../test/mocks';
import { createTestTranscription } from '../../test/factories';
import { TranscriptionStatus, QUEUE_NAMES } from '@transcribe/shared';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: '# Summary\n\nTest summary' } }],
      }),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-nanoid-123'),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn((password: string, hash: string) => {
    // Mock: password matches if it equals the stored hash value
    // (in tests, we store plaintext 'correct-password' as the hash for simplicity)
    return Promise.resolve(password === hash);
  }),
  hash: jest.fn((password: string) => Promise.resolve(`hashed-${password}`)),
}));

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockAnalysisRepository: ReturnType<typeof createMockAnalysisRepository>;
  let mockCommentRepository: ReturnType<typeof createMockCommentRepository>;
  let mockTranscriptionQueue: any;
  let mockSummaryQueue: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      if (key === 'FRONTEND_URL') return 'https://app.example.com';
      return null;
    }),
  };

  const mockFirebaseService = {
    firestore: jest.fn(),
    auth: jest.fn(),
    bucket: jest.fn(),
  };

  const mockWebSocketGateway = {
    sendTranscriptionProgress: jest.fn(),
    sendTranscriptionComplete: jest.fn(),
    sendTranscriptionFailed: jest.fn(),
    notifyCommentDeleted: jest.fn(),
    notifyCommentAdded: jest.fn(),
    notifyCommentUpdated: jest.fn(),
  };

  const mockAssemblyAIService = {
    transcribe: jest.fn(),
    transcribeWithSpeakers: jest.fn(),
  };

  const mockEmailService = {
    sendShareEmail: jest.fn(),
  };

  const mockUsageService = {
    checkQuota: jest.fn().mockResolvedValue({ allowed: true }),
    trackTranscription: jest.fn(),
  };

  beforeEach(async () => {
    mockTranscriptionRepository = createMockTranscriptionRepository();
    mockStorageService = createMockStorageService();
    mockUserRepository = createMockUserRepository();
    mockAnalysisRepository = createMockAnalysisRepository();
    mockCommentRepository = createMockCommentRepository();

    mockTranscriptionQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };
    mockSummaryQueue = {
      add: jest.fn().mockResolvedValue({ id: 'summary-job-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AnalysisRepository, useValue: mockAnalysisRepository },
        { provide: CommentRepository, useValue: mockCommentRepository },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: WebSocketGateway, useValue: mockWebSocketGateway },
        { provide: AssemblyAIService, useValue: mockAssemblyAIService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UsageService, useValue: mockUsageService },
        {
          provide: getQueueToken(QUEUE_NAMES.TRANSCRIPTION),
          useValue: mockTranscriptionQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.SUMMARY),
          useValue: mockSummaryQueue,
        },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseTemplateSelection', () => {
    it('should return default values when no templates provided', () => {
      const result = service.parseTemplateSelection(undefined);

      expect(result).toEqual({
        generateSummary: true,
        generateActionItems: false,
        generateCommunicationStyles: false,
      });
    });

    it('should return default values for empty array', () => {
      const result = service.parseTemplateSelection([]);

      expect(result).toEqual({
        generateSummary: true,
        generateActionItems: false,
        generateCommunicationStyles: false,
      });
    });

    it('should enable action items when selected', () => {
      const result = service.parseTemplateSelection(['actionItems']);

      expect(result.generateSummary).toBe(true);
      expect(result.generateActionItems).toBe(true);
      expect(result.generateCommunicationStyles).toBe(false);
    });

    it('should enable communication styles when selected', () => {
      const result = service.parseTemplateSelection(['communicationAnalysis']);

      expect(result.generateSummary).toBe(true);
      expect(result.generateActionItems).toBe(false);
      expect(result.generateCommunicationStyles).toBe(true);
    });

    it('should enable multiple selections', () => {
      const result = service.parseTemplateSelection([
        'actionItems',
        'communicationAnalysis',
      ]);

      expect(result.generateSummary).toBe(true);
      expect(result.generateActionItems).toBe(true);
      expect(result.generateCommunicationStyles).toBe(true);
    });

    it('should ignore unknown template IDs', () => {
      const result = service.parseTemplateSelection([
        'unknown',
        'email',
        'blogPost',
      ]);

      expect(result.generateSummary).toBe(true);
      expect(result.generateActionItems).toBe(false);
      expect(result.generateCommunicationStyles).toBe(false);
    });
  });

  describe('createTranscription', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'test-audio.mp3',
      mimetype: 'audio/mpeg',
      buffer: Buffer.from('audio content'),
      size: 1024,
      fieldname: 'file',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should create transcription and add to queue', async () => {
      mockStorageService.uploadFile.mockResolvedValue({
        url: 'https://storage.example.com/audio.mp3',
        path: 'audio/user-123/test.mp3',
      });
      mockTranscriptionRepository.createTranscription.mockResolvedValue(
        'trans-123',
      );

      const result = await service.createTranscription('user-123', mockFile);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.stringContaining('audio/user-123/'),
        mockFile.mimetype,
      );
      expect(
        mockTranscriptionRepository.createTranscription,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          fileName: 'test-audio.mp3',
          status: TranscriptionStatus.PENDING,
        }),
      );
      expect(mockTranscriptionQueue.add).toHaveBeenCalled();
    });

    it('should include analysis type when provided', async () => {
      mockStorageService.uploadFile.mockResolvedValue({
        url: 'https://storage.example.com/audio.mp3',
        path: 'audio/user-123/test.mp3',
      });
      mockTranscriptionRepository.createTranscription.mockResolvedValue(
        'trans-123',
      );

      await service.createTranscription(
        'user-123',
        mockFile,
        'DETAILED',
        'Meeting context',
      );

      expect(
        mockTranscriptionRepository.createTranscription,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          analysisType: 'DETAILED',
          context: 'Meeting context',
        }),
      );
    });

    it('should include selected templates when provided', async () => {
      mockStorageService.uploadFile.mockResolvedValue({
        url: 'https://storage.example.com/audio.mp3',
        path: 'audio/user-123/test.mp3',
      });
      mockTranscriptionRepository.createTranscription.mockResolvedValue(
        'trans-123',
      );

      await service.createTranscription(
        'user-123',
        mockFile,
        undefined,
        undefined,
        undefined,
        ['actionItems', 'email'],
      );

      expect(
        mockTranscriptionRepository.createTranscription,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedTemplates: ['actionItems', 'email'],
        }),
      );
    });
  });

  describe('getTranscriptions', () => {
    it('should return paginated transcriptions', async () => {
      const mockTranscriptions = [
        createTestTranscription({ id: 'trans-1' }),
        createTestTranscription({ id: 'trans-2' }),
      ];
      mockTranscriptionRepository.getTranscriptions.mockResolvedValue({
        items: mockTranscriptions,
        total: 2,
        page: 1,
        pageSize: 20,
      });

      const result = await service.getTranscriptions('user-123', 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(
        mockTranscriptionRepository.getTranscriptions,
      ).toHaveBeenCalledWith('user-123', 1, 20);
    });
  });

  describe('getTranscription', () => {
    it('should return transcription with analyses', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.getTranscription('user-123', 'trans-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('trans-123');
      expect(mockTranscriptionRepository.getTranscription).toHaveBeenCalledWith(
        'user-123',
        'trans-123',
      );
    });

    it('should return null for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      const result = await service.getTranscription('user-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateTitle', () => {
    it('should update transcription title', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      await service.updateTitle('user-123', 'trans-123', 'New Title');

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          title: 'New Title',
        }),
      );
    });

    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.updateTitle('user-123', 'nonexistent', 'New Title'),
      ).rejects.toThrow(); // Generic error, not BadRequestException
    });
  });

  describe('deleteTranscription', () => {
    it('should return success for deletion request', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      // Returns success object (idempotent operation)
      const result = await service.deleteTranscription('user-123', 'trans-123');
      expect(result.success).toBe(true);
    });
  });

  describe('createShareLink', () => {
    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      // Note: createShareLink takes (transcriptionId, userId, settings)
      await expect(
        service.createShareLink('nonexistent', 'user-123', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create share link for existing transcription', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      // Note: createShareLink takes (transcriptionId, userId, settings)
      const result = await service.createShareLink('trans-123', 'user-123', {});

      expect(result.shareUrl).toBeDefined();
      expect(result.shareToken).toBeDefined();
    });
  });

  describe('getSharedTranscription', () => {
    it('should return null for invalid token', async () => {
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        null,
      );

      const result = await service.getSharedTranscription('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('generateShortTitle', () => {
    it('should return original title on error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.generateShortTitle('Original Title');

      expect(result).toBe('Original Title');
    });
  });

  describe('getSummaryComments', () => {
    it('should return comments for transcription', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComments.mockResolvedValue([
        {
          id: 'comment-1',
          content: 'Test comment',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getSummaryComments('user-123', 'trans-123');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test comment');
    });

    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.getSummaryComments('user-123', 'nonexistent'),
      ).rejects.toThrow(); // Throws Error
    });
  });

  describe('updateSummaryComment', () => {
    it('should throw for non-existent comment', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComment.mockResolvedValue(null);

      await expect(
        service.updateSummaryComment(
          'user-123',
          'trans-123',
          'nonexistent',
          'Content',
        ),
      ).rejects.toThrow(); // Throws Error
    });

    it('should throw when updating another users comment', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComment.mockResolvedValue({
        id: 'comment-1',
        userId: 'other-user',
        content: 'Content',
      });

      await expect(
        service.updateSummaryComment(
          'user-123',
          'trans-123',
          'comment-1',
          'New content',
        ),
      ).rejects.toThrow(); // Throws Error
    });
  });

  describe('deleteSummaryComment', () => {
    it('should throw when deleting another users comment', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComment.mockResolvedValue({
        id: 'comment-1',
        userId: 'other-user',
      });

      // Note: deleteSummaryComment takes (transcriptionId, commentId, userId)
      await expect(
        service.deleteSummaryComment('trans-123', 'comment-1', 'user-123'),
      ).rejects.toThrow(); // Throws Error
    });

    it('should delete own comment successfully', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComment.mockResolvedValue({
        id: 'comment-1',
        userId: 'user-123',
        content: 'My comment',
      });
      mockCommentRepository.deleteSummaryComment.mockResolvedValue(undefined);

      // Note: deleteSummaryComment takes (transcriptionId, commentId, userId)
      await service.deleteSummaryComment('trans-123', 'comment-1', 'user-123');

      expect(mockCommentRepository.deleteSummaryComment).toHaveBeenCalledWith(
        'trans-123',
        'comment-1',
      );
    });
  });

  describe('searchTranscriptions', () => {
    it('should search transcriptions with query', async () => {
      mockTranscriptionRepository.searchTranscriptions.mockResolvedValue([
        createTestTranscription({
          id: 'trans-1',
          title: 'Meeting about project',
        }),
      ]);

      const result = await service.searchTranscriptions('user-123', 'meeting');

      expect(result).toHaveLength(1);
      expect(
        mockTranscriptionRepository.searchTranscriptions,
      ).toHaveBeenCalledWith('user-123', 'meeting', undefined);
    });

    it('should respect limit parameter', async () => {
      mockTranscriptionRepository.searchTranscriptions.mockResolvedValue([]);

      await service.searchTranscriptions('user-123', 'test', 5);

      expect(
        mockTranscriptionRepository.searchTranscriptions,
      ).toHaveBeenCalledWith('user-123', 'test', 5);
    });
  });

  describe('recordTranscriptionAccess', () => {
    it('should record access time', async () => {
      mockTranscriptionRepository.recordTranscriptionAccess.mockResolvedValue(
        undefined,
      );

      await service.recordTranscriptionAccess('user-123', 'trans-123');

      expect(
        mockTranscriptionRepository.recordTranscriptionAccess,
      ).toHaveBeenCalledWith('user-123', 'trans-123');
    });
  });

  describe('getRecentlyOpenedTranscriptions', () => {
    it('should return recently opened transcriptions', async () => {
      const transcriptions = [
        createTestTranscription({ id: 'trans-1' }),
        createTestTranscription({ id: 'trans-2' }),
      ];
      mockTranscriptionRepository.getRecentlyOpenedTranscriptions.mockResolvedValue(
        transcriptions,
      );

      const result = await service.getRecentlyOpenedTranscriptions('user-123');

      expect(result).toHaveLength(2);
      expect(
        mockTranscriptionRepository.getRecentlyOpenedTranscriptions,
      ).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should respect limit parameter', async () => {
      mockTranscriptionRepository.getRecentlyOpenedTranscriptions.mockResolvedValue(
        [],
      );

      await service.getRecentlyOpenedTranscriptions('user-123', 5);

      expect(
        mockTranscriptionRepository.getRecentlyOpenedTranscriptions,
      ).toHaveBeenCalledWith('user-123', 5);
    });
  });

  describe('clearRecentlyOpened', () => {
    it('should clear recently opened timestamps', async () => {
      mockTranscriptionRepository.clearRecentlyOpened.mockResolvedValue(5);

      const result = await service.clearRecentlyOpened('user-123');

      expect(result).toBe(5);
      expect(
        mockTranscriptionRepository.clearRecentlyOpened,
      ).toHaveBeenCalledWith('user-123');
    });
  });

  describe('moveToFolder', () => {
    it('should move transcription to folder', async () => {
      mockTranscriptionRepository.moveToFolder.mockResolvedValue(undefined);

      await service.moveToFolder('user-123', 'trans-123', 'folder-456');

      expect(mockTranscriptionRepository.moveToFolder).toHaveBeenCalledWith(
        'user-123',
        'trans-123',
        'folder-456',
      );
    });

    it('should remove from folder when folderId is null', async () => {
      mockTranscriptionRepository.moveToFolder.mockResolvedValue(undefined);

      await service.moveToFolder('user-123', 'trans-123', null);

      expect(mockTranscriptionRepository.moveToFolder).toHaveBeenCalledWith(
        'user-123',
        'trans-123',
        null,
      );
    });
  });

  describe('revokeShareLink', () => {
    it('should clear share settings', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.deleteShareInfo.mockResolvedValue(undefined);

      // Note: revokeShareLink takes (transcriptionId, userId)
      await service.revokeShareLink('trans-123', 'user-123');

      expect(mockTranscriptionRepository.deleteShareInfo).toHaveBeenCalledWith(
        'trans-123',
      );
    });

    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      // Note: revokeShareLink takes (transcriptionId, userId)
      await expect(
        service.revokeShareLink('nonexistent', 'user-123'),
      ).rejects.toThrow();
    });
  });

  describe('getRecentAnalyses', () => {
    it('should return recent analyses for user', async () => {
      mockAnalysisRepository.getRecentGeneratedAnalyses.mockResolvedValue([
        {
          id: 'analysis-1',
          templateId: 'summary',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getRecentAnalyses('user-123', 5);

      expect(result).toHaveLength(1);
      expect(
        mockAnalysisRepository.getRecentGeneratedAnalyses,
      ).toHaveBeenCalledWith('user-123', 5);
    });
  });

  describe('createShareLink with options', () => {
    it('should create share link with expiration', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const expiresAt = new Date(Date.now() + 86400000); // 1 day from now
      // Note: createShareLink takes (transcriptionId, userId, settings)
      const result = await service.createShareLink('trans-123', 'user-123', {
        expiresAt,
      });

      expect(result.shareUrl).toBeDefined();
      expect(result.shareToken).toBeDefined();
    });

    it('should create share link with view limit', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      // Note: createShareLink takes (transcriptionId, userId, settings)
      const result = await service.createShareLink('trans-123', 'user-123', {
        maxViews: 10,
      });

      expect(result.shareUrl).toBeDefined();
      expect(result.shareToken).toBeDefined();
    });
  });

  describe('updateShareSettings', () => {
    it('should update share settings', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'existing-token',
        shareSettings: { createdAt: new Date() },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      // Note: updateShareSettings takes (transcriptionId, userId, settings)
      await service.updateShareSettings('trans-123', 'user-123', {
        maxViews: 50,
      });

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          shareSettings: expect.objectContaining({
            maxViews: 50,
          }),
        }),
      );
    });

    it('should throw for transcription without share link', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: null,
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      // Note: updateShareSettings takes (transcriptionId, userId, settings)
      await expect(
        service.updateShareSettings('trans-123', 'user-123', {}),
      ).rejects.toThrow();
    });
  });

  describe('getSharedTranscription with expired link', () => {
    it('should return null for expired share link', async () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          expiresAt: pastDate,
          createdAt: new Date(Date.now() - 172800000),
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );

      const result = await service.getSharedTranscription('abc123');

      expect(result).toBeNull();
    });

    it('should return null when max views exceeded', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          maxViews: 5,
          viewCount: 5,
          createdAt: new Date(),
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );

      const result = await service.getSharedTranscription('abc123');

      expect(result).toBeNull();
    });
  });

  describe('sendShareEmail', () => {
    it('should send share email', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        title: 'Meeting Notes',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        uid: 'user-123',
        displayName: 'Test User',
      });
      mockEmailService.sendShareEmail.mockResolvedValue(true);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      // Note: sendShareEmail takes (transcriptionId, userId, emailRequest) and returns boolean
      const result = await service.sendShareEmail('trans-123', 'user-123', {
        recipientEmail: 'recipient@example.com',
        message: 'Check this out',
      });

      expect(result).toBe(true);
      expect(mockEmailService.sendShareEmail).toHaveBeenCalled();
    });

    it('should create share link when transcription has no share token', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: null,
        title: 'Meeting Notes',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        uid: 'user-123',
        displayName: 'Test User',
      });
      // When share link doesn't exist, it creates one first
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );
      mockEmailService.sendShareEmail.mockResolvedValue(true);

      const result = await service.sendShareEmail('trans-123', 'user-123', {
        recipientEmail: 'recipient@example.com',
      });

      expect(result).toBe(true);
    });

    it('should throw when transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.sendShareEmail('trans-123', 'user-123', {
          recipientEmail: 'recipient@example.com',
        }),
      ).rejects.toThrow();
    });
  });

  describe('extractTitleFromSummary', () => {
    it('should extract H1 heading from summary', () => {
      const summary = '# Meeting about Project X\n\nThis is the content';
      const result = service.extractTitleFromSummary(summary);
      expect(result).toBe('Meeting about Project X');
    });

    it('should remove markdown formatting from title', () => {
      const summary = '# **Important** Meeting about `code`\n\nContent here';
      const result = service.extractTitleFromSummary(summary);
      expect(result).toBe('Important Meeting about code');
    });

    it('should convert links to text', () => {
      const summary = '# Meeting about [Project](https://example.com)\n\n';
      const result = service.extractTitleFromSummary(summary);
      expect(result).toBe('Meeting about Project');
    });

    it('should truncate long titles to 200 characters', () => {
      const longTitle = 'A'.repeat(250);
      const summary = `# ${longTitle}\n\nContent`;
      const result = service.extractTitleFromSummary(summary);
      expect(result).toHaveLength(200);
      expect(result?.endsWith('...')).toBe(true);
    });

    it('should return null when no H1 heading exists', () => {
      const summary = '## Secondary heading\n\nNo H1 here';
      const result = service.extractTitleFromSummary(summary);
      expect(result).toBeNull();
    });

    it('should return null for empty summary', () => {
      const result = service.extractTitleFromSummary('');
      expect(result).toBeNull();
    });
  });

  describe('generateShortTitle', () => {
    it('should return original title if 10 words or less', async () => {
      const shortTitle = 'This is a short title';
      const result = await service.generateShortTitle(shortTitle);
      expect(result).toBe(shortTitle);
    });

    it('should call OpenAI for titles longer than 10 words', async () => {
      const longTitle =
        'This is a very long title that contains more than ten words and needs shortening';
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Shortened title here' } }],
      });

      const result = await service.generateShortTitle(longTitle);

      expect(result).toBe('Shortened title here');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should use fallback when OpenAI returns title exceeding word limit', async () => {
      const longTitle =
        'This is a very long title that contains more than ten words and needs shortening';
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content:
                'This is still a very long title that exceeds the ten word limit',
            },
          },
        ],
      });

      const result = await service.generateShortTitle(longTitle);

      // Fallback should take first 10 words and add ellipsis
      // Input: "This is a very long title that contains more than ten words and needs shortening"
      // First 10 words: "This is a very long title that contains more than"
      expect(result).toBe(
        'This is a very long title that contains more than...',
      );
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const longTitle =
        'This is a very long title that contains more than ten words and needs shortening';
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.generateShortTitle(longTitle);

      // Fallback should take first 10 words and add ellipsis
      // Input: "This is a very long title that contains more than ten words and needs shortening"
      // First 10 words: "This is a very long title that contains more than"
      expect(result).toBe(
        'This is a very long title that contains more than...',
      );
    });
  });

  describe('addSummaryComment', () => {
    it('should add comment to transcription', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.addSummaryComment.mockResolvedValue('comment-123');
      mockCommentRepository.getSummaryComment.mockResolvedValue({
        id: 'comment-123',
        content: 'Test comment',
        userId: 'user-123',
        transcriptionId: 'trans-123',
        position: { section: 'summary' },
        resolved: false,
        createdAt: new Date(),
      });

      const result = await service.addSummaryComment(
        'trans-123',
        'user-123',
        { section: 'summary' },
        'Test comment',
      );

      expect(result).toBeDefined();
      expect(result.content).toBe('Test comment');
      expect(mockCommentRepository.addSummaryComment).toHaveBeenCalled();
      expect(mockWebSocketGateway.notifyCommentAdded).toHaveBeenCalled();
    });

    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.addSummaryComment(
          'nonexistent',
          'user-123',
          { section: 'summary' },
          'Comment',
        ),
      ).rejects.toThrow();
    });
  });

  describe('deleteTranscription with existing transcription', () => {
    it('should soft delete transcription', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const result = await service.deleteTranscription('user-123', 'trans-123');

      expect(result.success).toBe(true);
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getSharedTranscription with password', () => {
    it('should throw UnauthorizedException for wrong password', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
          password: 'correct-password',
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );

      await expect(
        service.getSharedTranscription('abc123', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return transcription with correct password', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
          password: 'correct-password',
        },
        transcriptText: 'Test transcript',
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        displayName: 'Test User',
      });
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.getSharedTranscription(
        'abc123',
        'correct-password',
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe('trans-123');
    });

    it('should increment view count when requested', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
          viewCount: 5,
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        displayName: 'Test User',
      });
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      await service.getSharedTranscription('abc123', undefined, true);

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          shareSettings: expect.objectContaining({
            viewCount: 6,
          }),
        }),
      );
    });
  });

  describe('generateSummary', () => {
    it('should generate summary using GPT model', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: '# Summary\n\nTest summary content' },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100, completion_tokens: 50 },
      });

      const result = await service.generateSummary('Test transcript text');

      expect(result).toBe('# Summary\n\nTest summary content');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should include language instruction when language is provided', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: 'German summary' },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100 },
      });

      await service.generateSummary(
        'Test transcript',
        undefined,
        undefined,
        'German',
      );

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(call.messages[0].content).toContain('German');
    });
  });

  describe('generateSummaryWithModel', () => {
    it('should throw on content filter', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: null },
            finish_reason: 'content_filter',
          },
        ],
      });

      await expect(
        service.generateSummaryWithModel('Transcript', undefined, undefined),
      ).rejects.toThrow('Content was blocked by safety filters');
    });

    it('should throw when no choices returned', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [],
      });

      await expect(
        service.generateSummaryWithModel('Transcript', undefined, undefined),
      ).rejects.toThrow('OpenAI returned no choices in response');
    });

    it('should return empty string when content is null but not filtered', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: null },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100, completion_tokens: 50 },
      });

      const result = await service.generateSummaryWithModel(
        'Transcript',
        undefined,
        undefined,
      );

      expect(result).toBe('');
    });

    it('should use JSON format when structured output requested', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: '{"key": "value"}' },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100 },
      });

      await service.generateSummaryWithModel(
        'Transcript',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'structured',
      );

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(call.response_format).toEqual({ type: 'json_object' });
    });
  });

  describe('regenerateSummary', () => {
    it('should regenerate summary with comments and instructions', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        transcriptText: 'Original transcript',
        summaryVersion: 1,
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComments.mockResolvedValue([
        { id: 'comment-1', content: 'Please add more details', position: {} },
      ]);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Regenerated summary' } }],
      });

      const result = await service.regenerateSummary(
        'trans-123',
        'user-123',
        'Focus on action items',
      );

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          summary: 'Regenerated summary',
          summaryVersion: 2,
        }),
      );
    });

    it('should throw if no transcript available', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        transcriptText: null,
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.regenerateSummary('trans-123', 'user-123'),
      ).rejects.toThrow('No transcript available');
    });

    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.regenerateSummary('nonexistent', 'user-123'),
      ).rejects.toThrow();
    });
  });

  describe('translateTranscription', () => {
    it('should return existing translation if available', async () => {
      const existingTranslation = {
        language: 'de',
        languageName: 'German',
        analyses: { summary: 'German summary' },
      };
      const transcription = createTestTranscription({
        id: 'trans-123',
        transcriptText: 'Test transcript',
        translations: { de: existingTranslation },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      const result = await service.translateTranscription(
        'trans-123',
        'user-123',
        'de',
      );

      expect(result).toEqual(existingTranslation);
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should throw for unsupported language', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        transcriptText: 'Test transcript',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.translateTranscription(
          'trans-123',
          'user-123',
          'invalid-lang-code',
        ),
      ).rejects.toThrow('Unsupported language');
    });

    it('should throw if no transcript available', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        transcriptText: null,
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.translateTranscription('trans-123', 'user-123', 'de'),
      ).rejects.toThrow('No transcript available');
    });
  });

  describe('getTranslation', () => {
    it('should return translation for valid language', async () => {
      const translation = {
        language: 'de',
        languageName: 'German',
        analyses: { summary: 'German summary' },
      };
      const transcription = createTestTranscription({
        id: 'trans-123',
        translations: { de: translation },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      const result = await service.getTranslation(
        'trans-123',
        'user-123',
        'de',
      );

      expect(result).toEqual(translation);
    });

    it('should throw for non-existent translation', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        translations: {},
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.getTranslation('trans-123', 'user-123', 'de'),
      ).rejects.toThrow('No translation available');
    });
  });

  describe('deleteTranslation', () => {
    it('should delete existing translation', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        translations: {
          de: { language: 'de', analyses: {} },
          fr: { language: 'fr', analyses: {} },
        },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      await service.deleteTranslation('trans-123', 'user-123', 'de');

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          translations: { fr: { language: 'fr', analyses: {} } },
        }),
      );
    });

    it('should throw for non-existent translation', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        translations: {},
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await expect(
        service.deleteTranslation('trans-123', 'user-123', 'de'),
      ).rejects.toThrow('No translation exists');
    });
  });

  describe('updateTranslationPreference', () => {
    it('should update preferred translation language', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      await service.updateTranslationPreference('trans-123', 'user-123', 'de');

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          preferredTranslationLanguage: 'de',
        }),
      );
    });

    it('should throw for non-existent transcription', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.updateTranslationPreference('nonexistent', 'user-123', 'de'),
      ).rejects.toThrow();
    });
  });

  describe('getRecentAnalysesByFolder', () => {
    it('should return recent analyses for folder', async () => {
      const analyses = [
        { id: 'analysis-1', templateId: 'email', createdAt: new Date() },
        { id: 'analysis-2', templateId: 'summary', createdAt: new Date() },
      ];
      mockAnalysisRepository.getRecentGeneratedAnalysesByFolder.mockResolvedValue(
        analyses,
      );

      const result = await service.getRecentAnalysesByFolder(
        'user-123',
        'folder-456',
        10,
      );

      expect(result).toHaveLength(2);
      expect(
        mockAnalysisRepository.getRecentGeneratedAnalysesByFolder,
      ).toHaveBeenCalledWith('user-123', 'folder-456', 10);
    });
  });

  describe('updateTitle with summaryV2', () => {
    it('should update both title and summaryV2.title', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        summaryV2: {
          title: 'Old Title',
          keyPoints: [],
          detailedSections: [],
        },
      });
      mockTranscriptionRepository.getTranscription
        .mockResolvedValueOnce(transcription)
        .mockResolvedValueOnce({
          ...transcription,
          title: 'New Title',
          summaryV2: { ...transcription.summaryV2, title: 'New Title' },
        });
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const result = await service.updateTitle(
        'user-123',
        'trans-123',
        'New Title',
      );

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          title: 'New Title',
          summaryV2: expect.objectContaining({
            title: 'New Title',
          }),
        }),
      );
    });
  });

  describe('generateSummaryV2Only', () => {
    it('should return null on failure', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.generateSummaryV2Only('Transcript text');

      expect(result).toBeNull();
    });
  });

  describe('updateSummaryComment with valid update', () => {
    it('should update comment and notify via WebSocket', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      const existingComment = {
        id: 'comment-1',
        userId: 'user-123',
        content: 'Original content',
      };
      const updatedComment = {
        ...existingComment,
        content: 'Updated content',
      };

      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComment
        .mockResolvedValueOnce(existingComment)
        .mockResolvedValueOnce(updatedComment);
      mockCommentRepository.updateSummaryComment.mockResolvedValue(undefined);

      const result = await service.updateSummaryComment(
        'trans-123',
        'comment-1',
        'user-123',
        { content: 'Updated content' },
      );

      expect(mockCommentRepository.updateSummaryComment).toHaveBeenCalledWith(
        'trans-123',
        'comment-1',
        { content: 'Updated content' },
      );
      expect(mockWebSocketGateway.notifyCommentUpdated).toHaveBeenCalled();
    });
  });

  describe('generateAllAnalyses', () => {
    it('should generate all analysis types in parallel', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: 'Generated content' }, finish_reason: 'stop' },
        ],
        usage: { total_tokens: 100 },
      });

      const result = await service.generateAllAnalyses(
        'Test transcript',
        'Context',
        'English',
      );

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('communicationStyles');
      expect(result).toHaveProperty('actionItems');
      expect(result).toHaveProperty('emotionalIntelligence');
      expect(result).toHaveProperty('influencePersuasion');
      expect(result).toHaveProperty('personalDevelopment');
    });

    it('should handle individual analysis failures gracefully', async () => {
      // Make all calls succeed except the first
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Summary' }, finish_reason: 'stop' }],
          usage: { total_tokens: 100 },
        })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          choices: [
            { message: { content: 'Action items' }, finish_reason: 'stop' },
          ],
          usage: { total_tokens: 100 },
        })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValue({
          choices: [{ message: { content: 'Content' }, finish_reason: 'stop' }],
          usage: { total_tokens: 100 },
        });

      const result = await service.generateAllAnalyses('Test transcript');

      // Should have some results even with failures
      expect(result.summary).toBe('Summary');
      expect(result.communicationStyles).toBeNull();
    });
  });

  describe('generateCoreAnalyses', () => {
    it('should generate only selected analyses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"title":"Test","keyPoints":[],"detailedSections":[]}',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100 },
      });

      const result = await service.generateCoreAnalyses(
        'Test transcript',
        'Context',
        'English',
        {
          generateSummary: true,
          generateActionItems: false,
          generateCommunicationStyles: false,
        },
      );

      expect(result.summaryV2).toBeDefined();
      expect(result.actionItems).toBe('');
      expect(result.communicationStyles).toBe('');
    });

    it('should default to all analyses when no selection provided', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"title":"Test","keyPoints":[],"detailedSections":[]}',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100 },
      });

      const result = await service.generateCoreAnalyses('Test transcript');

      // Should have attempted to generate all analyses
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('generateSummaryV2', () => {
    it('should generate structured summary', async () => {
      const mockSummaryV2Response = JSON.stringify({
        title: 'Test Summary',
        intro: 'Introduction text',
        keyPoints: [
          { topic: 'Point 1', description: 'Description 1' },
          { topic: 'Point 2', description: 'Description 2' },
        ],
        detailedSections: [{ topic: 'Section 1', content: 'Content 1' }],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: mockSummaryV2Response },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100 },
      });

      const result = await service.generateSummaryV2(
        'Test transcript',
        'Context',
        'English',
      );

      expect(result.title).toBe('Test Summary');
      expect(result.keyPoints).toHaveLength(2);
      expect(result.keyPoints[0].topic).toBe('Point 1');
    });
  });

  describe('generateSummaryV2WithMarkdown', () => {
    it('should return both structured and markdown format', async () => {
      const mockSummaryV2Response = JSON.stringify({
        title: 'Test Summary',
        intro: 'Introduction',
        keyPoints: [{ topic: 'Point 1', description: 'Desc' }],
        detailedSections: [{ topic: 'Section 1', content: 'Content' }],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: { content: mockSummaryV2Response },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 100 },
      });

      const result =
        await service.generateSummaryV2WithMarkdown('Test transcript');

      expect(result.summaryV2).toBeDefined();
      expect(result.markdownSummary).toContain('Test Summary');
    });
  });

  describe('updateShareSettings edge cases', () => {
    it.each([
      ['expiresAt', { expiresAt: new Date() }],
      ['password', { password: 'secret' }],
      ['maxViews', { maxViews: 10 }],
    ])('should remove %s when set to null', async (field, existingSettings) => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
          ...existingSettings,
        },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      await service.updateShareSettings('trans-123', 'user-123', {
        [field]: null,
      } as any);

      const updateCall =
        mockTranscriptionRepository.updateTranscription.mock.calls[0][1];
      expect(updateCall.shareSettings[field]).toBeUndefined();
    });

    it('should update contentOptions', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
        },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      await service.updateShareSettings('trans-123', 'user-123', {
        contentOptions: {
          includeTranscript: false,
          includeSummary: true,
          includeActionItems: false,
          includeCommunicationStyles: false,
          includeSpeakerInfo: false,
          includeOnDemandAnalyses: false,
          selectedAnalysisIds: [],
        },
      });

      const updateCall =
        mockTranscriptionRepository.updateTranscription.mock.calls[0][1];
      expect(updateCall.shareSettings.contentOptions.includeTranscript).toBe(
        false,
      );
    });
  });

  describe('createShareLink with options', () => {
    it('should create share link with password', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        null,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const result = await service.createShareLink('trans-123', 'user-123', {
        password: 'secret123',
      });

      expect(result.shareUrl).toBeDefined();
      const updateCall =
        mockTranscriptionRepository.updateTranscription.mock.calls[0][1];
      expect(updateCall.shareSettings.password).toBe('secret123');
    });

    it('should create share link with content options', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        null,
      );
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const contentOptions = {
        includeTranscript: false,
        includeSummary: true,
        includeActionItems: true,
        includeCommunicationStyles: false,
        includeSpeakerInfo: false,
        includeOnDemandAnalyses: false,
        selectedAnalysisIds: [],
      };

      const result = await service.createShareLink('trans-123', 'user-123', {
        contentOptions,
      });

      expect(result.shareUrl).toBeDefined();
      const updateCall =
        mockTranscriptionRepository.updateTranscription.mock.calls[0][1];
      expect(updateCall.shareSettings.contentOptions).toEqual(contentOptions);
    });
  });

  describe('getSharedTranscription with content filtering', () => {
    it('should filter transcript based on content options', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        transcriptText: 'Full transcript text',
        shareSettings: {
          enabled: true,
          contentOptions: {
            includeTranscript: false,
            includeSummary: true,
            includeActionItems: true,
            includeCommunicationStyles: true,
            includeSpeakerInfo: true,
            includeOnDemandAnalyses: false,
            selectedAnalysisIds: [],
          },
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        displayName: 'Test User',
      });
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.getSharedTranscription('abc123');

      expect(result?.transcriptText).toBeUndefined();
    });

    it('should include on-demand analyses when enabled', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
          contentOptions: {
            includeTranscript: true,
            includeSummary: true,
            includeActionItems: true,
            includeCommunicationStyles: true,
            includeSpeakerInfo: true,
            includeOnDemandAnalyses: true,
            selectedAnalysisIds: [],
          },
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        displayName: 'Test User',
      });
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        { id: 'analysis-1', templateId: 'email', content: 'Email content' },
      ]);

      const result = await service.getSharedTranscription('abc123');

      expect(result?.generatedAnalyses).toHaveLength(1);
    });

    it('should filter on-demand analyses by selected IDs', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        shareToken: 'abc123',
        shareSettings: {
          enabled: true,
          contentOptions: {
            includeTranscript: true,
            includeSummary: true,
            includeActionItems: true,
            includeCommunicationStyles: true,
            includeSpeakerInfo: true,
            includeOnDemandAnalyses: true,
            selectedAnalysisIds: ['analysis-1'],
          },
        },
      });
      mockTranscriptionRepository.getTranscriptionByShareToken.mockResolvedValue(
        transcription,
      );
      mockUserRepository.getUserById.mockResolvedValue({
        displayName: 'Test User',
      });
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        { id: 'analysis-1', templateId: 'email', content: 'Email content' },
        { id: 'analysis-2', templateId: 'blog', content: 'Blog content' },
      ]);

      const result = await service.getSharedTranscription('abc123');

      expect(result?.generatedAnalyses).toHaveLength(1);
      expect(result?.generatedAnalyses?.[0].id).toBe('analysis-1');
    });
  });

  describe('deleteSummaryComment with WebSocket notification', () => {
    it('should notify via WebSocket after deletion', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockCommentRepository.getSummaryComment.mockResolvedValue({
        id: 'comment-1',
        userId: 'user-123',
      });
      mockCommentRepository.deleteSummaryComment.mockResolvedValue(undefined);

      await service.deleteSummaryComment('trans-123', 'comment-1', 'user-123');

      expect(mockWebSocketGateway.notifyCommentDeleted).toHaveBeenCalledWith(
        'trans-123',
        'comment-1',
      );
    });
  });
});
