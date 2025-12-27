// Mock fs module - must be at top before imports
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 1024 * 1024 }),
  createReadStream: jest.fn().mockReturnValue({}),
  unlinkSync: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { TranscriptionService } from './transcription.service';
import { FirebaseService } from '../firebase/firebase.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { AssemblyAIService } from '../assembly-ai/assembly-ai.service';
import { EmailService } from '../email/email.service';
import { UsageService } from '../usage/usage.service';
import { QUEUE_NAMES } from '@transcribe/shared';
import * as fs from 'fs';

// Get the mocked fs
const mockedFs = jest.mocked(fs);

/**
 * Unit tests for duration extraction in transcription service
 *
 * Tests cover:
 * 1. Whisper API duration extraction from verbose_json response
 * 2. Duration accumulation for chunked transcriptions
 * 3. Fallback behavior when AssemblyAI fails
 */
describe('TranscriptionService - Duration Extraction', () => {
  let service: TranscriptionService;
  let mockOpenAI: any;

  const mockFirebaseService = {
    downloadFile: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  const mockWebSocketGateway = {
    sendTranscriptionProgress: jest.fn(),
  };

  const mockAssemblyAIService = {
    transcribeWithDiarization: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    // Reset fs mocks with default small file size
    mockedFs.writeFileSync.mockClear();
    (mockedFs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 1024 }); // 1MB default
    (mockedFs.createReadStream as jest.Mock).mockReturnValue({});
    mockedFs.unlinkSync.mockClear();

    // Create mock OpenAI instance
    mockOpenAI = {
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: WebSocketGateway, useValue: mockWebSocketGateway },
        { provide: AssemblyAIService, useValue: mockAssemblyAIService },
        { provide: EmailService, useValue: {} },
        { provide: UsageService, useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.TRANSCRIPTION),
          useValue: mockQueue,
        },
        { provide: getQueueToken(QUEUE_NAMES.SUMMARY), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);

    // Replace OpenAI instance with our mock (after service is created)
    (service as any).openai = mockOpenAI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Whisper Duration Extraction', () => {
    it('should extract duration from Whisper verbose_json response', async () => {
      // Mock file download
      const mockBuffer = Buffer.from('fake audio data');
      mockFirebaseService.downloadFile.mockResolvedValue(mockBuffer);

      // Mock Whisper response with duration
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'Hello world, this is a test.',
        language: 'en',
        duration: 15.5, // Duration in seconds from verbose_json
      });

      const result = await service.transcribeAudio(
        'https://storage.example.com/audio.mp3',
        'Test context',
      );

      expect(result.durationSeconds).toBe(15.5);
      expect(result.text).toBe('Hello world, this is a test.');
      expect(result.language).toBe('en');
    });

    it('should return undefined duration when Whisper does not provide duration', async () => {
      const mockBuffer = Buffer.from('fake audio data');
      mockFirebaseService.downloadFile.mockResolvedValue(mockBuffer);

      // Mock Whisper response without duration
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'Hello world',
        language: 'en',
        // No duration field - simulates older or non-verbose response
      });

      const result = await service.transcribeAudio(
        'https://storage.example.com/audio.mp3',
      );

      expect(result.durationSeconds).toBeUndefined();
      expect(result.text).toBe('Hello world');
    });

    it('should handle zero duration gracefully', async () => {
      const mockBuffer = Buffer.from('fake audio data');
      mockFirebaseService.downloadFile.mockResolvedValue(mockBuffer);

      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'Very short audio',
        language: 'en',
        duration: 0,
      });

      const result = await service.transcribeAudio(
        'https://storage.example.com/audio.mp3',
      );

      // Zero is a valid duration
      expect(result.durationSeconds).toBe(0);
    });
  });

  describe('Whisper Chunked Transcription Duration', () => {
    it('should accumulate duration from multiple chunks for large files', async () => {
      const mockBuffer = Buffer.from('fake large audio data');
      mockFirebaseService.downloadFile.mockResolvedValue(mockBuffer);

      // Set file size to trigger chunking (30MB - over 25MB limit)
      (mockedFs.statSync as jest.Mock).mockReturnValue({
        size: 30 * 1024 * 1024,
      });

      // Mock audio splitter to return 3 chunks
      const mockChunks = [
        { path: '/tmp/chunk1.mp3', startTime: 0, endTime: 600, index: 0 },
        { path: '/tmp/chunk2.mp3', startTime: 600, endTime: 1200, index: 1 },
        { path: '/tmp/chunk3.mp3', startTime: 1200, endTime: 1800, index: 2 },
      ];

      // Access private audioSplitter and mock it
      const audioSplitter = (service as any).audioSplitter;
      jest.spyOn(audioSplitter, 'splitAudioFile').mockResolvedValue(mockChunks);

      // Mock Whisper responses for each chunk with durations
      mockOpenAI.audio.transcriptions.create
        .mockResolvedValueOnce({
          text: 'Chunk 1 text',
          language: 'en',
          duration: 600,
        })
        .mockResolvedValueOnce({
          text: 'Chunk 2 text',
          language: 'en',
          duration: 600,
        })
        .mockResolvedValueOnce({
          text: 'Chunk 3 text',
          language: 'en',
          duration: 600,
        });

      const result = await service.transcribeAudio(
        'https://storage.example.com/large-audio.mp3',
      );

      // Total duration should be sum of all chunks: 600 + 600 + 600 = 1800
      expect(result.durationSeconds).toBe(1800);
      expect(result.text).toContain('Chunk 1 text');
      expect(result.text).toContain('Chunk 2 text');
      expect(result.text).toContain('Chunk 3 text');
    });

    it('should handle partial duration data in chunked transcription', async () => {
      const mockBuffer = Buffer.from('fake large audio data');
      mockFirebaseService.downloadFile.mockResolvedValue(mockBuffer);

      // Set file size to trigger chunking
      (mockedFs.statSync as jest.Mock).mockReturnValue({
        size: 30 * 1024 * 1024,
      });

      const mockChunks = [
        { path: '/tmp/chunk1.mp3', startTime: 0, endTime: 600, index: 0 },
        { path: '/tmp/chunk2.mp3', startTime: 600, endTime: 1200, index: 1 },
      ];

      const audioSplitter = (service as any).audioSplitter;
      jest.spyOn(audioSplitter, 'splitAudioFile').mockResolvedValue(mockChunks);

      // First chunk has duration, second doesn't
      mockOpenAI.audio.transcriptions.create
        .mockResolvedValueOnce({
          text: 'Chunk 1',
          language: 'en',
          duration: 600,
        })
        .mockResolvedValueOnce({ text: 'Chunk 2', language: 'en' }); // No duration

      const result = await service.transcribeAudio(
        'https://storage.example.com/audio.mp3',
      );

      // Should have accumulated duration from first chunk only
      expect(result.durationSeconds).toBe(600);
    });
  });

  describe('AssemblyAI to Whisper Fallback', () => {
    it('should pass through duration from Whisper when AssemblyAI fails', async () => {
      // Mock AssemblyAI to fail (e.g., language detection failure)
      mockAssemblyAIService.transcribeWithDiarization.mockRejectedValue(
        new Error('Language detection failed'),
      );

      // Mock Firebase
      const mockBuffer = Buffer.from('fake audio data');
      mockFirebaseService.downloadFile.mockResolvedValue(mockBuffer);
      mockFirebaseService.getPublicUrl.mockResolvedValue(
        'https://public.url/audio.mp3',
      );

      // Mock Whisper fallback response with duration
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'Fallback transcription',
        language: 'en',
        duration: 25.0,
      });

      const result = await service.transcribeAudioWithProgress(
        'https://storage.example.com/audio.mp3',
        'Test context',
      );

      expect(result.durationSeconds).toBe(25.0);
      expect(result.text).toBe('Fallback transcription');
      // Whisper fallback should not have speaker data
      expect(result.speakers).toBeUndefined();
      expect(result.speakerSegments).toBeUndefined();
    });
  });
});
