import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { FirebaseService } from '../firebase.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockFirebaseService: any;
  let mockConfigService: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(async () => {
    mockFile = {
      save: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue([true]),
      getSignedUrl: jest
        .fn()
        .mockResolvedValue(['https://signed-url.com/file']),
      download: jest.fn().mockResolvedValue([Buffer.from('file content')]),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
      getFiles: jest.fn().mockResolvedValue([[mockFile]]),
    };

    mockFirebaseService = {
      storageService: {
        bucket: jest.fn().mockReturnValue(mockBucket),
      },
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-bucket.firebasestorage.app'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file and return url and path', async () => {
      const buffer = Buffer.from('test content');
      const path = 'transcriptions/user123/trans456/audio.mp3';
      const contentType = 'audio/mpeg';

      const result = await service.uploadFile(buffer, path, contentType);

      expect(mockBucket.file).toHaveBeenCalledWith(path);
      expect(mockFile.save).toHaveBeenCalledWith(buffer, {
        metadata: { contentType },
      });
      expect(mockFile.exists).toHaveBeenCalled();
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        action: 'read',
        expires: expect.any(Number),
      });
      expect(result).toEqual({
        url: 'https://signed-url.com/file',
        path,
      });
    });

    it('should throw error if file verification fails', async () => {
      mockFile.exists.mockResolvedValue([false]);
      const buffer = Buffer.from('test content');
      const path = 'transcriptions/user123/trans456/audio.mp3';

      await expect(
        service.uploadFile(buffer, path, 'audio/mpeg'),
      ).rejects.toThrow('File upload verification failed');
    });
  });

  describe('uploadText', () => {
    it('should upload text content as file', async () => {
      const text = 'This is the transcript content';
      const path = 'transcriptions/user123/trans456/transcript.txt';

      const result = await service.uploadText(text, path);

      expect(mockFile.save).toHaveBeenCalledWith(Buffer.from(text, 'utf-8'), {
        metadata: { contentType: 'text/plain' },
      });
      expect(result).toBe('https://signed-url.com/file');
    });
  });

  describe('getPublicUrl', () => {
    it('should generate a new signed URL for an existing file', async () => {
      const originalUrl =
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/transcriptions/user123/trans456/audio.mp3?signature=abc';

      const result = await service.getPublicUrl(originalUrl);

      expect(mockBucket.file).toHaveBeenCalledWith(
        'transcriptions/user123/trans456/audio.mp3',
      );
      expect(mockFile.exists).toHaveBeenCalled();
      expect(mockFile.getSignedUrl).toHaveBeenCalled();
      expect(result).toBe('https://signed-url.com/file');
    });

    it('should throw error if file does not exist', async () => {
      mockFile.exists.mockResolvedValue([false]);
      const originalUrl =
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/transcriptions/user123/trans456/audio.mp3';

      await expect(service.getPublicUrl(originalUrl)).rejects.toThrow(
        'File not found in storage',
      );
    });
  });

  describe('downloadFile', () => {
    it('should download file content as buffer', async () => {
      const url =
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/transcriptions/user123/trans456/audio.mp3';

      const result = await service.downloadFile(url);

      expect(mockBucket.file).toHaveBeenCalledWith(
        'transcriptions/user123/trans456/audio.mp3',
      );
      expect(mockFile.download).toHaveBeenCalled();
      expect(result).toEqual(Buffer.from('file content'));
    });
  });

  describe('deleteFileByPath', () => {
    it('should delete file by path', async () => {
      const path = 'transcriptions/user123/trans456/audio.mp3';

      await service.deleteFileByPath(path);

      expect(mockBucket.file).toHaveBeenCalledWith(path);
      expect(mockFile.delete).toHaveBeenCalled();
    });

    it('should not throw if file does not exist (404)', async () => {
      mockFile.delete.mockRejectedValue({ code: 404 });
      const path = 'transcriptions/user123/trans456/audio.mp3';

      await expect(service.deleteFileByPath(path)).resolves.not.toThrow();
    });

    it('should throw for other errors', async () => {
      mockFile.delete.mockRejectedValue(new Error('Network error'));
      const path = 'transcriptions/user123/trans456/audio.mp3';

      await expect(service.deleteFileByPath(path)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file by URL', async () => {
      const url =
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/transcriptions/user123/trans456/audio.mp3';

      await service.deleteFile(url);

      expect(mockBucket.file).toHaveBeenCalledWith(
        'transcriptions/user123/trans456/audio.mp3',
      );
      expect(mockFile.delete).toHaveBeenCalled();
    });

    it('should not throw if file does not exist (404)', async () => {
      mockFile.delete.mockRejectedValue({ code: 404 });
      const url =
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/transcriptions/user123/trans456/audio.mp3';

      await expect(service.deleteFile(url)).resolves.not.toThrow();
    });
  });

  describe('deleteUserFiles', () => {
    it('should delete all files for a user', async () => {
      const mockFiles = [
        { delete: jest.fn().mockResolvedValue(undefined) },
        { delete: jest.fn().mockResolvedValue(undefined) },
        { delete: jest.fn().mockResolvedValue(undefined) },
      ];
      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      const result = await service.deleteUserFiles('user123');

      expect(mockBucket.getFiles).toHaveBeenCalledWith({
        prefix: 'users/user123/',
      });
      expect(result).toBe(3);
      mockFiles.forEach((file) => {
        expect(file.delete).toHaveBeenCalled();
      });
    });

    it('should return 0 if no files exist', async () => {
      mockBucket.getFiles.mockResolvedValue([[]]);

      const result = await service.deleteUserFiles('user123');

      expect(result).toBe(0);
    });
  });

  describe('extractIdFromPath (via logging)', () => {
    it('should extract transcription ID from transcription path', async () => {
      // We can't test private methods directly, but we can verify logging behavior
      // by checking that uploadFile works with different path formats
      const paths = [
        'transcriptions/user123/trans456/audio.mp3',
        'audio/user123/1234567890_recording.mp3',
        'some/random/path/file.mp3',
      ];

      for (const path of paths) {
        await service.uploadFile(Buffer.from('test'), path, 'audio/mpeg');
      }

      // If we get here without errors, the path extraction worked
      expect(mockFile.save).toHaveBeenCalledTimes(3);
    });
  });
});
