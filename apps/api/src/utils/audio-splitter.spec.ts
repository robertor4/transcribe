import { AudioSplitter } from './audio-splitter';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  promises: {
    stat: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    rmdir: jest.fn(),
  },
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    callback(null, { stdout: '/usr/bin/ffmpeg', stderr: '' });
  }),
}));

// Mock fluent-ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn().mockReturnValue({
    setFfmpegPath: jest.fn(),
  });
  mockFfmpeg.setFfmpegPath = jest.fn();
  mockFfmpeg.ffprobe = jest.fn();
  return mockFfmpeg;
});

describe('AudioSplitter', () => {
  let splitter: AudioSplitter;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    splitter = new AudioSplitter();
    mockFs = fs as jest.Mocked<typeof fs>;
  });

  describe('sanitizePath', () => {
    it('should accept valid paths in /tmp', () => {
      const result = (splitter as any).sanitizePath('/tmp/test-file.mp3');
      expect(result).toBe('/tmp/test-file.mp3');
    });

    it('should accept paths in /tmp subdirectories', () => {
      const result = (splitter as any).sanitizePath(
        '/tmp/uploads/audio-123.mp3',
      );
      expect(result).toBe('/tmp/uploads/audio-123.mp3');
    });

    it('should reject paths with shell metacharacters', () => {
      expect(() => {
        (splitter as any).sanitizePath('/tmp/test;rm -rf /.mp3');
      }).toThrow('contains shell metacharacters');

      expect(() => {
        (splitter as any).sanitizePath('/tmp/test`whoami`.mp3');
      }).toThrow('contains shell metacharacters');

      expect(() => {
        (splitter as any).sanitizePath('/tmp/test$(pwd).mp3');
      }).toThrow('contains shell metacharacters');

      expect(() => {
        (splitter as any).sanitizePath('/tmp/test|cat /etc/passwd.mp3');
      }).toThrow('contains shell metacharacters');
    });

    it('should handle paths that normalize correctly', () => {
      // After normalization, /tmp/../etc becomes /etc which is allowed
      // The sanitizePath only rejects if normalized path still contains ..
      // This test verifies the path is normalized
      const result = (splitter as any).sanitizePath('/tmp/test/../audio.mp3');
      expect(result).toBe('/tmp/audio.mp3');
    });

    it('should normalize paths', () => {
      const result = (splitter as any).sanitizePath(
        '/tmp/./uploads/./file.mp3',
      );
      expect(result).toBe('/tmp/uploads/file.mp3');
    });

    it('should allow paths outside /tmp with warning', () => {
      // This should not throw but logs a warning
      const result = (splitter as any).sanitizePath('/var/audio/file.mp3');
      expect(result).toBe('/var/audio/file.mp3');
    });
  });

  describe('checkFfmpegAvailable', () => {
    it('should return true if ffmpeg was found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const result = await splitter.checkFfmpegAvailable();
      expect(result).toBe(true);
    });

    it('should return false if ffmpeg is not found', async () => {
      // Reset the splitter to not have ffmpegPath
      (splitter as any).ffmpegPath = undefined;
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Mock exec to fail
      const childProcess = require('child_process');
      childProcess.exec.mockImplementation(
        (cmd: string, callback: (err: Error | null) => void) => {
          callback(new Error('not found'));
        },
      );

      const result = await splitter.checkFfmpegAvailable();
      expect(result).toBe(false);
    });
  });

  describe('getFileSize', () => {
    it('should return file size in bytes', async () => {
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: 1024 * 1024 });
      const result = await splitter.getFileSize('/tmp/test.mp3');
      expect(result).toBe(1024 * 1024);
    });
  });

  describe('shouldSplitFile', () => {
    it('should return true for files larger than 24MB', async () => {
      const largeFileSize = 25 * 1024 * 1024; // 25MB
      (fs.promises.stat as jest.Mock).mockResolvedValue({
        size: largeFileSize,
      });

      const result = await splitter.shouldSplitFile('/tmp/large-file.mp3');
      expect(result).toBe(true);
    });

    it('should return false for files smaller than 24MB', async () => {
      const smallFileSize = 10 * 1024 * 1024; // 10MB
      (fs.promises.stat as jest.Mock).mockResolvedValue({
        size: smallFileSize,
      });

      const result = await splitter.shouldSplitFile('/tmp/small-file.mp3');
      expect(result).toBe(false);
    });

    it('should return false for files exactly 24MB', async () => {
      const exactSize = 24 * 1024 * 1024; // 24MB
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: exactSize });

      const result = await splitter.shouldSplitFile('/tmp/exact-file.mp3');
      expect(result).toBe(false);
    });
  });

  describe('splitAudioFile', () => {
    beforeEach(() => {
      (splitter as any).ffmpegPath = '/usr/bin/ffmpeg';
    });

    it('should return original file if under size limit', async () => {
      const smallSize = 10 * 1024 * 1024; // 10MB
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: smallSize });

      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation(
        (path: string, callback: (err: Error | null, data: any) => void) => {
          callback(null, { format: { duration: 300 } }); // 5 minutes
        },
      );

      const result = await splitter.splitAudioFile('/tmp/small.mp3');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/tmp/small.mp3');
      expect(result[0].duration).toBe(300);
      expect(result[0].index).toBe(0);
    });

    it('should throw if ffmpeg is not available', async () => {
      (splitter as any).ffmpegPath = undefined;
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const childProcess = require('child_process');
      childProcess.exec.mockImplementation(
        (cmd: string, callback: (err: Error | null) => void) => {
          callback(new Error('not found'));
        },
      );

      await expect(splitter.splitAudioFile('/tmp/test.mp3')).rejects.toThrow(
        'FFmpeg is not available',
      );
    });
  });

  describe('getAudioDuration', () => {
    it('should return duration from ffprobe', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation(
        (path: string, callback: (err: Error | null, data: any) => void) => {
          callback(null, { format: { duration: 600 } }); // 10 minutes
        },
      );

      const result = await splitter.getAudioDuration('/tmp/test.mp3');
      expect(result).toBe(600);
    });

    it('should throw error on ffprobe failure', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation(
        (path: string, callback: (err: Error) => void) => {
          callback(new Error('ffprobe failed'));
        },
      );

      await expect(splitter.getAudioDuration('/tmp/test.mp3')).rejects.toThrow(
        'Failed to get audio duration',
      );
    });

    it('should return 0 if duration is undefined', async () => {
      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation(
        (path: string, callback: (err: Error | null, data: any) => void) => {
          callback(null, { format: {} }); // No duration
        },
      );

      const result = await splitter.getAudioDuration('/tmp/test.mp3');
      expect(result).toBe(0);
    });
  });

  describe('chunk calculation', () => {
    it('should estimate correct number of chunks for large files', async () => {
      (splitter as any).ffmpegPath = '/usr/bin/ffmpeg';

      // 50MB file, 10 minute duration
      const fileSize = 50 * 1024 * 1024;
      (fs.promises.stat as jest.Mock).mockResolvedValue({ size: fileSize });

      const ffmpeg = require('fluent-ffmpeg');
      ffmpeg.ffprobe.mockImplementation(
        (path: string, callback: (err: Error | null, data: any) => void) => {
          callback(null, { format: { duration: 600 } }); // 10 minutes
        },
      );

      // Mock extractChunk to return quickly
      (splitter as any).extractChunk = jest
        .fn()
        .mockImplementation(
          async (
            input: string,
            output: string,
            start: number,
            duration: number,
            index: number,
          ) => ({
            path: output,
            startTime: start,
            endTime: start + duration,
            duration,
            index,
          }),
        );

      const result = await splitter.splitAudioFile('/tmp/large.mp3');

      // Should create multiple chunks
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('cleanupChunks', () => {
    it('should delete all chunk files', async () => {
      const chunks = [
        {
          path: '/tmp/chunk_1.mp3',
          startTime: 0,
          endTime: 300,
          duration: 300,
          index: 0,
        },
        {
          path: '/tmp/chunk_2.mp3',
          startTime: 300,
          endTime: 600,
          duration: 300,
          index: 1,
        },
      ];
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      await splitter.cleanupChunks(chunks);

      expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
      expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/chunk_1.mp3');
      expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/chunk_2.mp3');
    });

    it('should handle deletion errors gracefully', async () => {
      const chunks = [
        {
          path: '/tmp/chunk_1.mp3',
          startTime: 0,
          endTime: 300,
          duration: 300,
          index: 0,
        },
      ];
      (fs.promises.unlink as jest.Mock).mockRejectedValue(
        new Error('File not found'),
      );

      // Should not throw
      await expect(splitter.cleanupChunks(chunks)).resolves.toBeUndefined();
    });
  });

  describe('mergeTranscriptions', () => {
    it('should merge transcriptions in order', () => {
      const transcriptions = [
        {
          text: 'Third chunk text',
          chunk: {
            path: '/tmp/c3.mp3',
            startTime: 600,
            endTime: 900,
            duration: 300,
            index: 2,
          },
        },
        {
          text: 'First chunk text',
          chunk: {
            path: '/tmp/c1.mp3',
            startTime: 0,
            endTime: 300,
            duration: 300,
            index: 0,
          },
        },
        {
          text: 'Second chunk text',
          chunk: {
            path: '/tmp/c2.mp3',
            startTime: 300,
            endTime: 600,
            duration: 300,
            index: 1,
          },
        },
      ];

      const result = splitter.mergeTranscriptions(transcriptions);

      expect(result).toBe(
        'First chunk text Second chunk text Third chunk text',
      );
    });

    it('should filter empty texts', () => {
      const transcriptions = [
        {
          text: 'First chunk',
          chunk: {
            path: '/tmp/c1.mp3',
            startTime: 0,
            endTime: 300,
            duration: 300,
            index: 0,
          },
        },
        {
          text: '   ',
          chunk: {
            path: '/tmp/c2.mp3',
            startTime: 300,
            endTime: 600,
            duration: 300,
            index: 1,
          },
        },
        {
          text: 'Third chunk',
          chunk: {
            path: '/tmp/c3.mp3',
            startTime: 600,
            endTime: 900,
            duration: 300,
            index: 2,
          },
        },
      ];

      const result = splitter.mergeTranscriptions(transcriptions);

      expect(result).toBe('First chunk Third chunk');
    });
  });

  describe('formatTimeForContext', () => {
    it('should format seconds only', () => {
      expect(splitter.formatTimeForContext(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(splitter.formatTimeForContext(125)).toBe('2m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(splitter.formatTimeForContext(3725)).toBe('1h 2m 5s');
    });

    it('should handle zero', () => {
      expect(splitter.formatTimeForContext(0)).toBe('0s');
    });
  });

  describe('createChunkContext', () => {
    it('should create chunk context without original context', () => {
      const chunk = {
        path: '/tmp/chunk_1.mp3',
        startTime: 0,
        endTime: 300,
        duration: 300,
        index: 0,
      };

      const result = splitter.createChunkContext(chunk, 3);

      expect(result).toBe('[Audio chunk 1 of 3, time 0s - 5m 0s]');
    });

    it('should create chunk context with original context', () => {
      const chunk = {
        path: '/tmp/chunk_2.mp3',
        startTime: 600,
        endTime: 900,
        duration: 300,
        index: 1,
      };

      const result = splitter.createChunkContext(chunk, 3, 'Meeting recording');

      expect(result).toBe(
        '[Audio chunk 2 of 3, time 10m 0s - 15m 0s] Meeting recording',
      );
    });
  });

  describe('mergeAudioFiles', () => {
    it('should throw if ffmpeg is not available', async () => {
      (splitter as any).ffmpegPath = undefined;
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const childProcess = require('child_process');
      childProcess.exec.mockImplementation(
        (cmd: string, callback: (err: Error | null) => void) => {
          callback(new Error('not found'));
        },
      );

      await expect(
        splitter.mergeAudioFiles(['/tmp/chunk_1.mp3'], '/tmp/merged.mp3'),
      ).rejects.toThrow('FFmpeg is not available');
    });

    it('should throw if no input files provided', async () => {
      (splitter as any).ffmpegPath = '/usr/bin/ffmpeg';

      await expect(
        splitter.mergeAudioFiles([], '/tmp/merged.mp3'),
      ).rejects.toThrow('No input files provided for merging');
    });
  });
});
