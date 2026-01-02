import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptionProcessor } from './transcription.processor';
import { TranscriptionService } from './transcription.service';
import { OnDemandAnalysisService } from './on-demand-analysis.service';
import { StorageService } from '../firebase/services/storage.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { UsageService } from '../usage/usage.service';
import { VectorService } from '../vector/vector.service';
import { TranscriptionStatus } from '@transcribe/shared';
import {
  createMockStorageService,
  createMockTranscriptionRepository,
} from '../../test/mocks';
import { createTestTranscription } from '../../test/factories';
import type { Job } from 'bull';

describe('TranscriptionProcessor', () => {
  let processor: TranscriptionProcessor;
  let mockTranscriptionService: any;
  let mockOnDemandAnalysisService: any;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockWebsocketGateway: any;
  let mockEmailService: any;
  let mockUserService: any;
  let mockUsageService: any;
  let mockVectorService: any;

  const createMockJob = (data: any): Job<any> =>
    ({
      id: 'job-123',
      data,
      progress: jest.fn(),
      log: jest.fn(),
    }) as any;

  beforeEach(async () => {
    mockStorageService = createMockStorageService();
    mockTranscriptionRepository = createMockTranscriptionRepository();

    mockTranscriptionService = {
      transcribeAudioWithProgress: jest.fn().mockResolvedValue({
        text: 'This is the transcript text.',
        language: 'en',
        speakers: ['Speaker 1', 'Speaker 2'],
        speakerSegments: [
          { speaker: 'Speaker 1', start: 0, end: 10, text: 'Hello' },
        ],
        speakerCount: 2,
        durationSeconds: 120,
      }),
      parseTemplateSelection: jest.fn().mockReturnValue({
        generateSummary: true,
        generateActionItems: false,
        generateCommunicationStyles: false,
      }),
      generateSummaryV2Only: jest.fn().mockResolvedValue({
        title: 'Meeting Summary',
        overview: 'A productive meeting',
        keyPoints: ['Point 1', 'Point 2'],
      }),
    };

    mockOnDemandAnalysisService = {
      generateFromTemplate: jest.fn().mockResolvedValue({ id: 'analysis-123' }),
    };

    mockWebsocketGateway = {
      sendTranscriptionProgress: jest.fn(),
      sendTranscriptionComplete: jest.fn(),
      sendTranscriptionFailed: jest.fn(),
    };

    mockEmailService = {
      sendTranscriptionCompleteEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockUserService = {
      getUserProfile: jest.fn().mockResolvedValue({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      }),
    };

    mockUsageService = {
      trackTranscription: jest.fn().mockResolvedValue(undefined),
    };

    mockVectorService = {
      indexTranscription: jest.fn().mockResolvedValue(5),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionProcessor,
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        {
          provide: OnDemandAnalysisService,
          useValue: mockOnDemandAnalysisService,
        },
        { provide: StorageService, useValue: mockStorageService },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: WebSocketGateway, useValue: mockWebsocketGateway },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UserService, useValue: mockUserService },
        { provide: UsageService, useValue: mockUsageService },
        { provide: VectorService, useValue: mockVectorService },
      ],
    }).compile();

    processor = module.get<TranscriptionProcessor>(TranscriptionProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTranscription', () => {
    const baseJobData = {
      transcriptionId: 'trans-123',
      userId: 'user-123',
      fileUrl: 'https://storage.example.com/audio.mp3',
      context: 'Business meeting',
      selectedTemplates: ['summary'],
    };

    it('should process transcription successfully', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('trans-123', {
        status: TranscriptionStatus.PROCESSING,
        updatedAt: expect.any(Date),
      });
      expect(
        mockTranscriptionService.transcribeAudioWithProgress,
      ).toHaveBeenCalledWith(
        baseJobData.fileUrl,
        baseJobData.context,
        expect.any(Function),
      );
    });

    it('should update status to PROCESSING at start', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('trans-123', {
        status: TranscriptionStatus.PROCESSING,
        updatedAt: expect.any(Date),
      });
    });

    it('should send WebSocket progress updates', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(mockWebsocketGateway.sendTranscriptionProgress).toHaveBeenCalled();
      expect(
        mockWebsocketGateway.sendTranscriptionComplete,
      ).toHaveBeenCalledWith('user-123', {
        transcriptionId: 'trans-123',
        status: TranscriptionStatus.COMPLETED,
        progress: 100,
        message: 'Transcription completed successfully!',
      });
    });

    it('should generate summary when requested', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.parseTemplateSelection.mockReturnValue({
        generateSummary: true,
        generateActionItems: false,
        generateCommunicationStyles: false,
      });

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionService.generateSummaryV2Only,
      ).toHaveBeenCalledWith(
        'This is the transcript text.',
        'Business meeting',
        'en',
      );
    });

    it('should skip summary generation when not requested', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.parseTemplateSelection.mockReturnValue({
        generateSummary: false,
        generateActionItems: false,
        generateCommunicationStyles: false,
      });

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionService.generateSummaryV2Only,
      ).not.toHaveBeenCalled();
    });

    it('should generate action items when requested', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.parseTemplateSelection.mockReturnValue({
        generateSummary: false,
        generateActionItems: true,
        generateCommunicationStyles: false,
      });

      await processor.handleTranscription(job);

      expect(
        mockOnDemandAnalysisService.generateFromTemplate,
      ).toHaveBeenCalledWith(
        'trans-123',
        'actionItems',
        'user-123',
        undefined,
        { skipDuplicateCheck: true },
      );
    });

    it('should generate communication styles when requested', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.parseTemplateSelection.mockReturnValue({
        generateSummary: false,
        generateActionItems: false,
        generateCommunicationStyles: true,
      });

      await processor.handleTranscription(job);

      expect(
        mockOnDemandAnalysisService.generateFromTemplate,
      ).toHaveBeenCalledWith(
        'trans-123',
        'communicationAnalysis',
        'user-123',
        undefined,
        { skipDuplicateCheck: true },
      );
    });

    it('should upload transcript text to storage', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(mockStorageService.uploadText).toHaveBeenCalledWith(
        'This is the transcript text.',
        'transcriptions/user-123/trans-123/transcript.txt',
      );
    });

    it('should update transcription with final data', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          status: TranscriptionStatus.COMPLETED,
          transcriptText: 'This is the transcript text.',
          summaryV2: expect.any(Object),
          duration: 120,
          completedAt: expect.any(Date),
          detectedLanguage: 'en',
          speakerCount: 2,
        }),
      );
    });

    it('should track usage for billing', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(mockUsageService.trackTranscription).toHaveBeenCalledWith(
        'user-123',
        'trans-123',
        120, // duration in seconds
      );
    });

    it('should continue if usage tracking fails', async () => {
      const job = createMockJob(baseJobData);
      mockUsageService.trackTranscription.mockRejectedValue(
        new Error('Usage tracking failed'),
      );

      await processor.handleTranscription(job);

      // Should still complete successfully
      expect(mockWebsocketGateway.sendTranscriptionComplete).toHaveBeenCalled();
    });

    it('should index transcription for semantic search', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(mockVectorService.indexTranscription).toHaveBeenCalledWith(
        'user-123',
        'trans-123',
      );
    });

    it('should continue if vector indexing fails', async () => {
      const job = createMockJob(baseJobData);
      mockVectorService.indexTranscription.mockRejectedValue(
        new Error('Indexing failed'),
      );

      await processor.handleTranscription(job);

      expect(mockWebsocketGateway.sendTranscriptionComplete).toHaveBeenCalled();
    });

    it('should send completion email', async () => {
      const job = createMockJob(baseJobData);
      const transcription = createTestTranscription({
        id: 'trans-123',
        title: 'Meeting Transcript',
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );

      await processor.handleTranscription(job);

      expect(
        mockEmailService.sendTranscriptionCompleteEmail,
      ).toHaveBeenCalled();
    });

    it('should continue if email sending fails', async () => {
      const job = createMockJob(baseJobData);
      mockEmailService.sendTranscriptionCompleteEmail.mockRejectedValue(
        new Error('Email failed'),
      );

      await processor.handleTranscription(job);

      expect(mockWebsocketGateway.sendTranscriptionComplete).toHaveBeenCalled();
    });

    it('should include title from summaryV2', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.generateSummaryV2Only.mockResolvedValue({
        title: 'Generated Title',
        overview: 'Overview text',
      });

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          title: 'Generated Title',
        }),
      );
    });

    it('should include speaker diarization data', async () => {
      const job = createMockJob(baseJobData);

      await processor.handleTranscription(job);

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          speakers: ['Speaker 1', 'Speaker 2'],
          speakerSegments: [
            { speaker: 'Speaker 1', start: 0, end: 10, text: 'Hello' },
          ],
          speakerCount: 2,
        }),
      );
    });
  });

  describe('handleTranscription - error handling', () => {
    const baseJobData = {
      transcriptionId: 'trans-123',
      userId: 'user-123',
      fileUrl: 'https://storage.example.com/audio.mp3',
    };

    it('should mark transcription as FAILED on error', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.transcribeAudioWithProgress.mockRejectedValue(
        new Error('Transcription failed'),
      );
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(processor.handleTranscription(job)).rejects.toThrow(
        'Transcription failed',
      );

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('trans-123', {
        status: TranscriptionStatus.FAILED,
        error: 'Transcription failed',
        updatedAt: expect.any(Date),
      });
    });

    it('should send failure WebSocket notification on error', async () => {
      const job = createMockJob(baseJobData);
      mockTranscriptionService.transcribeAudioWithProgress.mockRejectedValue(
        new Error('Processing error'),
      );
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(processor.handleTranscription(job)).rejects.toThrow();

      expect(mockWebsocketGateway.sendTranscriptionFailed).toHaveBeenCalledWith(
        'user-123',
        {
          transcriptionId: 'trans-123',
          status: TranscriptionStatus.FAILED,
          progress: 0,
          error: 'Processing error',
        },
      );
    });

    it('should not mark as failed if already completed', async () => {
      const job = createMockJob(baseJobData);
      const completedTranscription = createTestTranscription({
        id: 'trans-123',
        status: TranscriptionStatus.COMPLETED,
      });

      // First call succeeds, error happens in post-processing
      mockTranscriptionService.transcribeAudioWithProgress.mockResolvedValue({
        text: 'Transcript',
        language: 'en',
        speakers: [],
        speakerSegments: [],
        speakerCount: 0,
        durationSeconds: 60,
      });

      // Simulate error after completion check
      mockUsageService.trackTranscription.mockResolvedValue(undefined);
      mockVectorService.indexTranscription.mockResolvedValue(5);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        completedTranscription,
      );
      mockTranscriptionRepository.updateTranscription
        .mockResolvedValueOnce(undefined) // PROCESSING
        .mockResolvedValueOnce(undefined) // COMPLETED
        .mockRejectedValueOnce(new Error('Post-completion error')); // Cleanup fails

      // The transcription should still complete without throwing
      await processor.handleTranscription(job);

      expect(mockWebsocketGateway.sendTranscriptionComplete).toHaveBeenCalled();
    });

    it('should continue processing action items if one fails', async () => {
      const job = createMockJob({
        ...baseJobData,
        selectedTemplates: ['summary', 'actionItems', 'communicationAnalysis'],
      });
      mockTranscriptionService.parseTemplateSelection.mockReturnValue({
        generateSummary: true,
        generateActionItems: true,
        generateCommunicationStyles: true,
      });
      mockOnDemandAnalysisService.generateFromTemplate
        .mockRejectedValueOnce(new Error('Action items failed'))
        .mockResolvedValueOnce({ id: 'comm-123' });

      await processor.handleTranscription(job);

      // Should still complete successfully
      expect(mockWebsocketGateway.sendTranscriptionComplete).toHaveBeenCalled();
      // Both should be attempted
      expect(
        mockOnDemandAnalysisService.generateFromTemplate,
      ).toHaveBeenCalledTimes(2);
    });

    it('should use fallback error message if none provided', async () => {
      const job = createMockJob(baseJobData);
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';
      mockTranscriptionService.transcribeAudioWithProgress.mockRejectedValue(
        errorWithoutMessage,
      );
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(processor.handleTranscription(job)).rejects.toThrow();

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('trans-123', {
        status: TranscriptionStatus.FAILED,
        error: 'Transcription failed',
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('handleTranscription - progress callbacks', () => {
    it('should forward progress updates to WebSocket', async () => {
      const job = createMockJob({
        transcriptionId: 'trans-123',
        userId: 'user-123',
        fileUrl: 'https://storage.example.com/audio.mp3',
      });

      // Capture the progress callback
      let progressCallback: (progress: number, message: string) => void;
      mockTranscriptionService.transcribeAudioWithProgress.mockImplementation(
        (url, ctx, cb) => {
          progressCallback = cb;
          // Simulate calling the callback
          cb(50, 'Processing chunk 1 of 2');
          return Promise.resolve({
            text: 'Transcript',
            language: 'en',
            speakers: [],
            speakerSegments: [],
            speakerCount: 0,
            durationSeconds: 60,
          });
        },
      );

      await processor.handleTranscription(job);

      expect(
        mockWebsocketGateway.sendTranscriptionProgress,
      ).toHaveBeenCalledWith('user-123', {
        transcriptionId: 'trans-123',
        status: TranscriptionStatus.PROCESSING,
        progress: 50,
        message: 'Processing chunk 1 of 2',
      });
    });
  });
});
