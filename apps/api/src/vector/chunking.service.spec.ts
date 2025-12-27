import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkingService],
    }).compile();

    service = module.get<ChunkingService>(ChunkingService);
  });

  describe('chunkSegments', () => {
    it('should chunk segments into TranscriptChunk array', () => {
      const segments = [
        {
          speakerTag: 'Speaker A',
          text: 'Hello, how are you?',
          startTime: 0,
          endTime: 5,
        },
        {
          speakerTag: 'Speaker B',
          text: 'I am fine, thank you.',
          startTime: 5,
          endTime: 10,
        },
      ];

      const result = service.chunkSegments(segments);

      expect(result).toHaveLength(2);
      expect(result[0].speaker).toBe('Speaker A');
      expect(result[0].text).toBe('Hello, how are you?');
      expect(result[0].segmentIndex).toBe(0);
      expect(result[0].chunkIndex).toBe(0);
      expect(result[0].totalChunks).toBe(1);
      expect(result[1].speaker).toBe('Speaker B');
    });

    it('should split long segments into multiple chunks', () => {
      // Create a very long text that exceeds 500 tokens (500 * 4 = 2000 chars)
      const longText = 'This is a test sentence. '.repeat(100);
      const segments = [
        { speakerTag: 'Speaker A', text: longText, startTime: 0, endTime: 60 },
      ];

      const result = service.chunkSegments(segments);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].totalChunks).toBeGreaterThan(1);
      expect(result.every((c) => c.speaker === 'Speaker A')).toBe(true);
      expect(result.every((c) => c.segmentIndex === 0)).toBe(true);
    });

    it('should calculate proportional timestamps for split segments', () => {
      const longText = 'This is a test sentence. '.repeat(100);
      const segments = [
        { speakerTag: 'Speaker A', text: longText, startTime: 0, endTime: 100 },
      ];

      const result = service.chunkSegments(segments);

      // First chunk should start at 0
      expect(result[0].startTime).toBe(0);
      // Last chunk should end at 100
      expect(result[result.length - 1].endTime).toBe(100);
      // Chunks should have increasing timestamps
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startTime).toBeGreaterThan(result[i - 1].startTime);
      }
    });

    it('should handle empty segments array', () => {
      const result = service.chunkSegments([]);

      expect(result).toHaveLength(0);
    });

    it('should handle custom config', () => {
      const segments = [
        { speakerTag: 'A', text: 'Short text.', startTime: 0, endTime: 5 },
      ];

      const result = service.chunkSegments(segments, {
        maxTokens: 1000,
        overlapTokens: 100,
        minChunkSize: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Short text.');
    });

    it('should preserve chunk indices within segment', () => {
      const longText = 'This is a test sentence. '.repeat(100);
      const segments = [
        { speakerTag: 'A', text: longText, startTime: 0, endTime: 60 },
      ];

      const result = service.chunkSegments(segments);

      for (let i = 0; i < result.length; i++) {
        expect(result[i].chunkIndex).toBe(i);
      }
    });
  });

  describe('formatTimestamp', () => {
    it('should format seconds as MM:SS', () => {
      expect(service.formatTimestamp(0)).toBe('0:00');
      expect(service.formatTimestamp(30)).toBe('0:30');
      expect(service.formatTimestamp(60)).toBe('1:00');
      expect(service.formatTimestamp(90)).toBe('1:30');
      expect(service.formatTimestamp(125)).toBe('2:05');
    });

    it('should format hours as HH:MM:SS', () => {
      expect(service.formatTimestamp(3600)).toBe('1:00:00');
      expect(service.formatTimestamp(3661)).toBe('1:01:01');
      expect(service.formatTimestamp(7325)).toBe('2:02:05');
    });

    it('should pad minutes and seconds with zeros', () => {
      expect(service.formatTimestamp(61)).toBe('1:01');
      expect(service.formatTimestamp(3601)).toBe('1:00:01');
      expect(service.formatTimestamp(3660)).toBe('1:01:00');
    });

    it('should handle decimal seconds by flooring', () => {
      expect(service.formatTimestamp(30.5)).toBe('0:30');
      expect(service.formatTimestamp(59.9)).toBe('0:59');
    });
  });
});
