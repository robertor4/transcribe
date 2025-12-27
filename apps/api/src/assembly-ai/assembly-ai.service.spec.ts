import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssemblyAIService } from './assembly-ai.service';

// Mock AssemblyAI client functions
const mockTranscriptsCreate = jest.fn();
const mockTranscriptsGet = jest.fn();
const mockFilesUpload = jest.fn();

// Mock the AssemblyAI client
jest.mock('assemblyai', () => {
  return {
    AssemblyAI: jest.fn().mockImplementation(() => ({
      transcripts: {
        create: mockTranscriptsCreate,
        get: mockTranscriptsGet,
      },
      files: {
        upload: mockFilesUpload,
      },
    })),
  };
});

describe('AssemblyAIService', () => {
  let service: AssemblyAIService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyAIService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AssemblyAIService>(AssemblyAIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Duration Extraction', () => {
    it('should extract duration from AssemblyAI audio_duration field', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Hello world',
        language_code: 'en',
        language_confidence: 0.95,
        confidence: 0.92,
        audio_duration: 45.5, // Duration in seconds
        utterances: [
          {
            speaker: 'A',
            text: 'Hello world',
            start: 0,
            end: 2000,
            confidence: 0.92,
            words: [{ text: 'Hello' }, { text: 'world' }],
          },
        ],
      };

      // Access private method through any type
      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      expect(result.durationSeconds).toBe(45.5);
    });

    it('should calculate duration from utterances when audio_duration is undefined', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Hello world. How are you?',
        language_code: 'en',
        language_confidence: 0.95,
        confidence: 0.92,
        audio_duration: undefined, // No duration from AssemblyAI
        utterances: [
          {
            speaker: 'A',
            text: 'Hello world.',
            start: 0,
            end: 2500, // 2.5 seconds in ms
            confidence: 0.92,
            words: [],
          },
          {
            speaker: 'B',
            text: 'How are you?',
            start: 3000,
            end: 5000, // 5 seconds in ms - this is the last utterance
            confidence: 0.9,
            words: [],
          },
        ],
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      // Should calculate from last utterance end time: 5000ms = 5 seconds
      expect(result.durationSeconds).toBe(5);
    });

    it('should calculate duration from utterances when audio_duration is 0', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Test audio',
        language_code: 'en',
        audio_duration: 0, // Zero duration
        utterances: [
          {
            speaker: 'A',
            text: 'Test audio',
            start: 0,
            end: 10500, // 10.5 seconds in ms
            confidence: 0.95,
            words: [],
          },
        ],
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      expect(result.durationSeconds).toBe(10.5);
    });

    it('should return undefined duration when no audio_duration and no utterances', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Test',
        language_code: 'en',
        audio_duration: undefined,
        utterances: [], // Empty utterances
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      expect(result.durationSeconds).toBeUndefined();
    });

    it('should return undefined duration when no audio_duration and utterances is undefined', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Test',
        language_code: 'en',
        audio_duration: undefined,
        utterances: undefined,
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      expect(result.durationSeconds).toBeUndefined();
    });

    it('should prefer audio_duration over calculated duration from utterances', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Hello',
        language_code: 'en',
        audio_duration: 30, // Explicit duration
        utterances: [
          {
            speaker: 'A',
            text: 'Hello',
            start: 0,
            end: 25000, // Last utterance at 25s, but audio_duration says 30s
            confidence: 0.95,
            words: [],
          },
        ],
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      // Should use audio_duration (30) not utterance end time (25)
      expect(result.durationSeconds).toBe(30);
    });
  });

  describe('Speaker Processing', () => {
    it('should correctly count speakers from utterances', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Hello. Hi there. Nice to meet you.',
        language_code: 'en',
        audio_duration: 10,
        utterances: [
          {
            speaker: 'A',
            text: 'Hello.',
            start: 0,
            end: 1000,
            confidence: 0.9,
            words: [],
          },
          {
            speaker: 'B',
            text: 'Hi there.',
            start: 1500,
            end: 3000,
            confidence: 0.9,
            words: [],
          },
          {
            speaker: 'A',
            text: 'Nice to meet you.',
            start: 3500,
            end: 5000,
            confidence: 0.9,
            words: [],
          },
        ],
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      expect(result.speakerCount).toBe(2);
      expect(result.speakers).toHaveLength(2);
    });

    it('should build transcript with speakers correctly', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Hello. Hi.',
        language_code: 'en',
        audio_duration: 5,
        utterances: [
          {
            speaker: 'A',
            text: 'Hello.',
            start: 0,
            end: 1000,
            confidence: 0.9,
            words: [],
          },
          {
            speaker: 'B',
            text: 'Hi.',
            start: 1500,
            end: 2500,
            confidence: 0.9,
            words: [],
          },
        ],
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );

      expect(result.transcriptWithSpeakers).toContain('Speaker A: Hello.');
      expect(result.transcriptWithSpeakers).toContain('Speaker B: Hi.');
    });
  });

  describe('Language Mapping', () => {
    it('should map language codes correctly', () => {
      const testCases = [
        { input: 'en', expected: 'en-us' },
        { input: 'nl', expected: 'nl-nl' },
        { input: 'de', expected: 'de-de' },
        { input: 'fr', expected: 'fr-fr' },
        { input: 'es', expected: 'es-es' },
      ];

      for (const { input, expected } of testCases) {
        const mockTranscript = {
          id: 'test-id',
          status: 'completed' as const,
          text: 'Test',
          language_code: input,
          audio_duration: 1,
          utterances: [],
        };

        const result = (service as any).processTranscriptionResponse(
          mockTranscript,
        );
        expect(result.language).toBe(expected);
      }
    });

    it('should pass through unknown language codes', () => {
      const mockTranscript = {
        id: 'test-id',
        status: 'completed' as const,
        text: 'Test',
        language_code: 'ja', // Japanese - not in our mapping
        audio_duration: 1,
        utterances: [],
      };

      const result = (service as any).processTranscriptionResponse(
        mockTranscript,
      );
      expect(result.language).toBe('ja');
    });
  });

  describe('transcribeWithDiarization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should transcribe audio URL and return result', async () => {
      const mockCreateResult = {
        id: 'transcript-123',
        status: 'completed',
      };
      mockTranscriptsCreate.mockResolvedValue(mockCreateResult);
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'completed',
        text: 'Hello world',
        language_code: 'en',
        audio_duration: 10,
        utterances: [
          {
            speaker: 'A',
            text: 'Hello world',
            start: 0,
            end: 2000,
            confidence: 0.95,
          },
        ],
      });

      const result = await service.transcribeWithDiarization(
        'https://example.com/audio.mp3',
        'Meeting notes',
      );

      expect(result.text).toBe('Hello world');
      expect(result.durationSeconds).toBe(10);
      expect(mockTranscriptsCreate).toHaveBeenCalled();
    });

    it('should handle transcription error status', async () => {
      mockTranscriptsCreate.mockResolvedValue({
        id: 'transcript-123',
      });
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'error',
        error: 'Audio file could not be processed',
      });

      await expect(
        service.transcribeWithDiarization('https://example.com/audio.mp3'),
      ).rejects.toThrow('Audio file could not be processed');
    });

    it('should send progress updates', async () => {
      mockTranscriptsCreate.mockResolvedValue({
        id: 'transcript-123',
      });
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'completed',
        text: 'Test',
        audio_duration: 5,
        utterances: [],
      });

      const progressCallback = jest.fn();
      await service.transcribeWithDiarization(
        'https://example.com/audio.mp3',
        undefined,
        progressCallback,
      );

      expect(progressCallback).toHaveBeenCalledWith(
        15,
        'Audio uploaded, transcription in progress...',
      );
    });

    it('should extract transcription ID from URL', async () => {
      mockTranscriptsCreate.mockResolvedValue({
        id: 'transcript-123',
      });
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'completed',
        text: 'Test',
        audio_duration: 5,
        utterances: [],
      });

      await service.transcribeWithDiarization(
        'https://storage.googleapis.com/bucket/transcriptions%2Fabc123/audio.mp3',
      );

      expect(mockTranscriptsCreate).toHaveBeenCalled();
    });

    it('should apply word boost from context', async () => {
      mockTranscriptsCreate.mockResolvedValue({
        id: 'transcript-123',
      });
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'completed',
        text: 'Test',
        audio_duration: 5,
        utterances: [],
      });

      await service.transcribeWithDiarization(
        'https://example.com/audio.mp3',
        'Important meeting about project Alpha and Beta',
      );

      expect(mockTranscriptsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          word_boost: expect.any(Array),
          boost_param: 'high',
        }),
      );
    });
  });

  describe('transcribeFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should upload file and transcribe', async () => {
      mockFilesUpload.mockResolvedValue('https://assemblyai.com/upload/abc123');
      mockTranscriptsCreate.mockResolvedValue({
        id: 'transcript-123',
      });
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'completed',
        text: 'Hello',
        audio_duration: 5,
        utterances: [],
      });

      const buffer = Buffer.from('audio data');
      const result = await service.transcribeFile(
        buffer,
        'user123_1234567890.mp3',
      );

      expect(mockFilesUpload).toHaveBeenCalledWith(buffer);
      expect(result.text).toBe('Hello');
    });

    it('should handle upload errors', async () => {
      mockFilesUpload.mockRejectedValue(new Error('Upload failed'));

      const buffer = Buffer.from('audio data');
      await expect(service.transcribeFile(buffer, 'test.mp3')).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('getTranscriptionStatus', () => {
    it('should return transcription status', async () => {
      mockTranscriptsGet.mockResolvedValue({
        id: 'transcript-123',
        status: 'completed',
      });

      const status = await service.getTranscriptionStatus('transcript-123');

      expect(status).toBe('completed');
      expect(mockTranscriptsGet).toHaveBeenCalledWith('transcript-123');
    });

    it('should return error on exception', async () => {
      mockTranscriptsGet.mockRejectedValue(new Error('Network error'));

      const status = await service.getTranscriptionStatus('transcript-123');

      expect(status).toBe('error');
    });
  });
});
