import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ReplicateService } from './replicate.service';

// Mock Replicate
const mockReplicateClient = {
  run: jest.fn(),
};

jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => mockReplicateClient);
});

describe('ReplicateService', () => {
  describe('when configured', () => {
    let service: ReplicateService;

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'REPLICATE_API_TOKEN') return 'test-api-token';
        return null;
      }),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReplicateService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<ReplicateService>(ReplicateService);
    });

    describe('isAvailable', () => {
      it('should return true when client is initialized', () => {
        expect(service.isAvailable()).toBe(true);
      });
    });

    describe('generateImage', () => {
      it('should generate image with default options', async () => {
        mockReplicateClient.run.mockResolvedValue([
          'https://example.com/image.webp',
        ]);

        const result = await service.generateImage({
          prompt: 'A beautiful sunset',
        });

        expect(result).not.toBeNull();
        expect(result!.url).toBe('https://example.com/image.webp');
        expect(result!.prompt).toBe('A beautiful sunset');
        expect(result!.model).toBe('flux-schnell');
        expect(result!.generationTimeMs).toBeGreaterThanOrEqual(0);
        expect(mockReplicateClient.run).toHaveBeenCalledWith(
          'black-forest-labs/flux-schnell',
          expect.objectContaining({
            input: expect.objectContaining({
              prompt: 'A beautiful sunset',
              aspect_ratio: '4:5',
              output_format: 'webp',
            }),
          }),
        );
      });

      it('should generate image with custom options', async () => {
        mockReplicateClient.run.mockResolvedValue([
          'https://example.com/image.png',
        ]);

        const result = await service.generateImage({
          prompt: 'A beautiful mountain',
          aspectRatio: '16:9',
          outputFormat: 'png',
          model: 'flux-dev',
        });

        expect(result).not.toBeNull();
        expect(result!.model).toBe('flux-dev');
        expect(mockReplicateClient.run).toHaveBeenCalledWith(
          'black-forest-labs/flux-dev',
          expect.objectContaining({
            input: expect.objectContaining({
              prompt: 'A beautiful mountain',
              aspect_ratio: '16:9',
              output_format: 'png',
            }),
          }),
        );
      });

      it('should use flux-pro model ID', async () => {
        mockReplicateClient.run.mockResolvedValue([
          'https://example.com/image.jpg',
        ]);

        await service.generateImage({
          prompt: 'Professional photo',
          model: 'flux-pro',
        });

        expect(mockReplicateClient.run).toHaveBeenCalledWith(
          'black-forest-labs/flux-1.1-pro',
          expect.any(Object),
        );
      });

      it('should handle FileOutput objects with toString method', async () => {
        const fileOutput = {
          toString: () => 'https://replicate.delivery/image.webp',
        };
        mockReplicateClient.run.mockResolvedValue([fileOutput]);

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).not.toBeNull();
        expect(result!.url).toBe('https://replicate.delivery/image.webp');
      });

      it('should handle FileOutput objects with url method', async () => {
        const fileOutput = {
          toString: () => '[object Object]', // Non-URL string
          url: () => ({ href: 'https://replicate.delivery/via-url.webp' }),
        };
        mockReplicateClient.run.mockResolvedValue([fileOutput]);

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).not.toBeNull();
        expect(result!.url).toBe('https://replicate.delivery/via-url.webp');
      });

      it('should handle non-array output', async () => {
        mockReplicateClient.run.mockResolvedValue(
          'https://example.com/single.webp',
        );

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).not.toBeNull();
        expect(result!.url).toBe('https://example.com/single.webp');
      });

      it('should return null on API error', async () => {
        mockReplicateClient.run.mockRejectedValue(new Error('API error'));

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).toBeNull();
      });

      it('should return null when cannot extract URL from array', async () => {
        mockReplicateClient.run.mockResolvedValue([{ invalid: 'object' }]);

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).toBeNull();
      });

      it('should return null when cannot extract URL from non-array', async () => {
        mockReplicateClient.run.mockResolvedValue({ invalid: 'object' });

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).toBeNull();
      });

      it('should handle href property directly', async () => {
        const output = { href: 'https://example.com/direct-href.webp' };
        mockReplicateClient.run.mockResolvedValue([output]);

        const result = await service.generateImage({
          prompt: 'Test prompt',
        });

        expect(result).not.toBeNull();
        expect(result!.url).toBe('https://example.com/direct-href.webp');
      });
    });

    describe('downloadImage', () => {
      beforeEach(() => {
        global.fetch = jest.fn();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should download image and return buffer', async () => {
        const mockArrayBuffer = new ArrayBuffer(8);
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        });

        const result = await service.downloadImage(
          'https://example.com/image.webp',
        );

        expect(result).toBeInstanceOf(Buffer);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://example.com/image.webp',
        );
      });

      it('should return null on non-ok response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
        });

        const result = await service.downloadImage(
          'https://example.com/notfound.webp',
        );

        expect(result).toBeNull();
      });

      it('should return null on fetch error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(
          new Error('Network error'),
        );

        const result = await service.downloadImage(
          'https://example.com/error.webp',
        );

        expect(result).toBeNull();
      });
    });
  });

  describe('when not configured', () => {
    let service: ReplicateService;

    const mockConfigService = {
      get: jest.fn().mockReturnValue(null),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReplicateService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<ReplicateService>(ReplicateService);
    });

    it('should return false for isAvailable', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('should return null when generating image', async () => {
      const result = await service.generateImage({
        prompt: 'Test prompt',
      });

      expect(result).toBeNull();
    });
  });
});
