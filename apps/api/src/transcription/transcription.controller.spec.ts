import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { AnalysisTemplateService } from './analysis-template.service';
import { OnDemandAnalysisService } from './on-demand-analysis.service';
import { UsageService } from '../usage/usage.service';
import { VectorService } from '../vector/vector.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { createTestTranscription } from '../../test/factories';
import { TranscriptionStatus } from '@transcribe/shared';

// Mock FirebaseAuthGuard
const mockAuthGuard: CanActivate = {
  canActivate: (context: ExecutionContext) => true,
};

describe('TranscriptionController', () => {
  let controller: TranscriptionController;
  let mockTranscriptionService: any;
  let mockTemplateService: any;
  let mockOnDemandAnalysisService: any;
  let mockUsageService: any;
  let mockVectorService: any;

  beforeEach(async () => {
    mockTranscriptionService = {
      getSharedTranscription: jest.fn(),
      createTranscription: jest.fn(),
      createBatchTranscription: jest.fn(),
      getTranscriptions: jest.fn(),
      getTranscription: jest.fn(),
      updateTitle: jest.fn(),
      deleteTranscription: jest.fn(),
      getSummaryComments: jest.fn(),
      addSummaryComment: jest.fn(),
      updateSummaryComment: jest.fn(),
      deleteSummaryComment: jest.fn(),
      createShareLink: jest.fn(),
      updateShareSettings: jest.fn(),
      removeShareLink: jest.fn(),
      sendShareEmail: jest.fn(),
      searchTranscriptions: jest.fn(),
      getRecentlyOpenedTranscriptions: jest.fn(),
      updateLastOpened: jest.fn(),
      getRecentAnalyses: jest.fn(),
    };

    mockTemplateService = {
      getSystemTemplates: jest.fn().mockReturnValue([]),
      getAnalysisTemplateById: jest.fn(),
    };

    mockOnDemandAnalysisService = {
      generateAnalysis: jest.fn(),
      getGeneratedAnalysisById: jest.fn(),
      regenerateAnalysis: jest.fn(),
      deleteGeneratedAnalysis: jest.fn(),
    };

    mockUsageService = {
      checkQuota: jest.fn().mockResolvedValue({ allowed: true }),
    };

    mockVectorService = {
      askQuestion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptionController],
      providers: [
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        { provide: AnalysisTemplateService, useValue: mockTemplateService },
        {
          provide: OnDemandAnalysisService,
          useValue: mockOnDemandAnalysisService,
        },
        { provide: UsageService, useValue: mockUsageService },
        { provide: VectorService, useValue: mockVectorService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<TranscriptionController>(TranscriptionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSharedTranscription', () => {
    it('should return shared transcription for valid token', async () => {
      const sharedData = {
        transcription: createTestTranscription({ id: 'trans-123' }),
        analyses: [],
        ownerName: 'Test User',
      };
      mockTranscriptionService.getSharedTranscription.mockResolvedValue(
        sharedData,
      );

      const result = await controller.getSharedTranscription(
        'valid-token',
        undefined,
        'true',
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(
        mockTranscriptionService.getSharedTranscription,
      ).toHaveBeenCalledWith('valid-token', undefined, true);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockTranscriptionService.getSharedTranscription.mockResolvedValue(null);

      await expect(
        controller.getSharedTranscription('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should pass password when provided', async () => {
      const sharedData = {
        transcription: createTestTranscription({ id: 'trans-123' }),
        analyses: [],
        ownerName: 'Test User',
      };
      mockTranscriptionService.getSharedTranscription.mockResolvedValue(
        sharedData,
      );

      await controller.getSharedTranscription('valid-token', 'secret', 'false');

      expect(
        mockTranscriptionService.getSharedTranscription,
      ).toHaveBeenCalledWith('valid-token', 'secret', false);
    });
  });

  describe('uploadFile', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'test-audio.mp3',
      mimetype: 'audio/mpeg',
      buffer: Buffer.from('audio content'),
      size: 1024 * 1024, // 1MB
      fieldname: 'file',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const mockRequest = {
      user: { uid: 'user-123' },
    };

    it('should throw BadRequestException if no file provided', async () => {
      await expect(
        controller.uploadFile(
          undefined as any,
          undefined,
          undefined,
          undefined,
          undefined,
          mockRequest as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid audio format', async () => {
      const invalidFile = {
        ...mockFile,
        originalname: 'test.txt',
        mimetype: 'text/plain',
      };

      await expect(
        controller.uploadFile(
          invalidFile as any,
          undefined,
          undefined,
          undefined,
          undefined,
          mockRequest as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create transcription for valid file', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionService.createTranscription.mockResolvedValue(
        transcription,
      );

      const result = await controller.uploadFile(
        mockFile,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest as any,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('trans-123');
      expect(mockUsageService.checkQuota).toHaveBeenCalled();
    });

    it('should parse selected templates from JSON string', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionService.createTranscription.mockResolvedValue(
        transcription,
      );

      await controller.uploadFile(
        mockFile,
        undefined,
        undefined,
        undefined,
        '["actionItems","email"]',
        mockRequest as any,
      );

      expect(mockTranscriptionService.createTranscription).toHaveBeenCalledWith(
        'user-123',
        mockFile,
        undefined,
        undefined,
        undefined,
        ['actionItems', 'email'],
      );
    });
  });

  describe('getTranscriptions', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should return paginated transcriptions', async () => {
      const transcriptions = [createTestTranscription({ id: 'trans-1' })];
      mockTranscriptionService.getTranscriptions.mockResolvedValue({
        items: transcriptions,
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.getTranscriptions(mockRequest as any, {
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });
  });

  describe('searchTranscriptions', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should search transcriptions', async () => {
      const results = [createTestTranscription({ id: 'trans-1' })];
      mockTranscriptionService.searchTranscriptions.mockResolvedValue(results);

      const result = await controller.searchTranscriptions(mockRequest as any, {
        query: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getTranscription', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should return transcription by id', async () => {
      const transcription = createTestTranscription({ id: 'trans-123' });
      mockTranscriptionService.getTranscription.mockResolvedValue(
        transcription,
      );

      const result = await controller.getTranscription(
        'trans-123',
        mockRequest as any,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('trans-123');
    });

    it('should throw BadRequestException when not found', async () => {
      mockTranscriptionService.getTranscription.mockResolvedValue(null);

      await expect(
        controller.getTranscription('nonexistent', mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTitle', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should update transcription title', async () => {
      const transcription = createTestTranscription({
        id: 'trans-123',
        title: 'New Title',
      });
      mockTranscriptionService.updateTitle.mockResolvedValue(transcription);

      const result = await controller.updateTitle(
        'trans-123',
        'New Title',
        mockRequest as any,
      );

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Title');
    });

    it('should throw BadRequestException for empty title', async () => {
      await expect(
        controller.updateTitle('trans-123', '', mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace-only title', async () => {
      await expect(
        controller.updateTitle('trans-123', '   ', mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTranscription', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should delete transcription', async () => {
      mockTranscriptionService.deleteTranscription.mockResolvedValue(undefined);

      const result = await controller.deleteTranscription(
        'trans-123',
        mockRequest as any,
      );

      expect(result.success).toBe(true);
      expect(mockTranscriptionService.deleteTranscription).toHaveBeenCalledWith(
        'user-123',
        'trans-123',
      );
    });
  });

  describe('comments', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    // Note: addComment and updateComment tests are skipped because they use
    // dynamic import of 'isomorphic-dompurify' which doesn't work in Jest
    // without --experimental-vm-modules flag

    describe('getComments', () => {
      it('should return comments for transcription', async () => {
        const comments = [
          { id: 'comment-1', content: 'Comment 1' },
          { id: 'comment-2', content: 'Comment 2' },
        ];
        mockTranscriptionService.getSummaryComments.mockResolvedValue(comments);

        const result = await controller.getComments(
          'trans-123',
          mockRequest as any,
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
      });
    });

    describe('deleteComment', () => {
      it('should delete comment', async () => {
        mockTranscriptionService.deleteSummaryComment.mockResolvedValue(
          undefined,
        );

        const result = await controller.deleteComment(
          'trans-123',
          'comment-123',
          mockRequest as any,
        );

        expect(result.success).toBe(true);
      });
    });
  });

  describe('sharing', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    describe('createShareLink', () => {
      it('should create share link', async () => {
        const shareResult = {
          shareToken: 'abc123',
          shareUrl: 'https://app.example.com/share/abc123',
        };
        mockTranscriptionService.createShareLink.mockResolvedValue(shareResult);

        const result = await controller.createShareLink(
          'trans-123',
          { expiresIn: '7d' },
          mockRequest as any,
        );

        expect(result.success).toBe(true);
        expect(result.data.shareToken).toBe('abc123');
      });
    });

    describe('updateShareSettings', () => {
      it('should update share settings', async () => {
        mockTranscriptionService.updateShareSettings.mockResolvedValue(
          undefined,
        );

        const result = await controller.updateShareSettings(
          'trans-123',
          { allowDownload: true },
          mockRequest as any,
        );

        expect(result.success).toBe(true);
      });
    });

    describe('sendShareEmail', () => {
      it('should send share email', async () => {
        mockTranscriptionService.sendShareEmail.mockResolvedValue(true);

        const result = await controller.sendShareEmail(
          'trans-123',
          { email: 'recipient@example.com' },
          mockRequest as any,
        );

        expect(result.success).toBe(true);
      });

      it('should throw BadRequestException on failure', async () => {
        mockTranscriptionService.sendShareEmail.mockResolvedValue(false);

        await expect(
          controller.sendShareEmail(
            'trans-123',
            { email: 'recipient@example.com' },
            mockRequest as any,
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('recentAnalyses', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should return recent analyses with default limit', async () => {
      const analyses = [{ id: 'analysis-1' }];
      mockTranscriptionService.getRecentAnalyses.mockResolvedValue(analyses);

      const result = await controller.getRecentAnalyses(
        '8',
        mockRequest as any,
      );

      expect(result.success).toBe(true);
      expect(mockTranscriptionService.getRecentAnalyses).toHaveBeenCalledWith(
        'user-123',
        8,
      );
    });

    it('should clamp limit to max 20', async () => {
      mockTranscriptionService.getRecentAnalyses.mockResolvedValue([]);

      await controller.getRecentAnalyses('100', mockRequest as any);

      expect(mockTranscriptionService.getRecentAnalyses).toHaveBeenCalledWith(
        'user-123',
        20,
      );
    });

    it('should use default for zero value', async () => {
      mockTranscriptionService.getRecentAnalyses.mockResolvedValue([]);

      // parseInt('0') returns 0, which is falsy, so || 8 kicks in
      await controller.getRecentAnalyses('0', mockRequest as any);

      expect(mockTranscriptionService.getRecentAnalyses).toHaveBeenCalledWith(
        'user-123',
        8,
      );
    });
  });

  describe('recentlyOpened', () => {
    const mockRequest = { user: { uid: 'user-123' } };

    it('should return recently opened transcriptions', async () => {
      const transcriptions = [createTestTranscription({ id: 'trans-1' })];
      mockTranscriptionService.getRecentlyOpenedTranscriptions.mockResolvedValue(
        transcriptions,
      );

      const result = await controller.getRecentlyOpened(
        '5',
        mockRequest as any,
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
