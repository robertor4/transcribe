import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ImagePromptService } from './image-prompt.service';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('ImagePromptService', () => {
  let service: ImagePromptService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-api-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagePromptService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ImagePromptService>(ImagePromptService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateImagePrompt', () => {
    it('should generate image prompt from GPT response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                prompt:
                  'Abstract geometric composition with flowing purple gradients',
                alt: 'Abstract illustration for marketing blog post',
              }),
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateImagePrompt({
        headline: 'Top Marketing Mistakes',
        subheading: 'Avoid these common pitfalls',
        hook: 'In today digital age...',
      });

      expect(result.prompt).toContain('Abstract geometric');
      expect(result.alt).toContain('Abstract illustration');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.any(Array),
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should generate image prompt without optional fields', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                prompt: 'Minimalist abstract design',
                alt: 'Abstract illustration',
              }),
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateImagePrompt({
        headline: 'Simple Title',
      });

      expect(result.prompt).toBe('Minimalist abstract design');
      expect(result.alt).toBe('Abstract illustration');
    });

    it('should return fallback prompt when GPT returns no content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateImagePrompt({
        headline: 'Test Blog Post',
      });

      expect(result.prompt).toContain('Abstract editorial illustration');
      expect(result.alt).toContain('Test Blog Post');
    });

    it('should return fallback prompt when GPT response is invalid JSON', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'not valid json',
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateImagePrompt({
        headline: 'Test Blog Post',
      });

      expect(result.prompt).toContain('Abstract editorial illustration');
    });

    it('should return fallback prompt when GPT response is missing required fields', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                prompt: 'Only prompt, no alt',
              }),
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateImagePrompt({
        headline: 'Test Blog Post',
      });

      expect(result.prompt).toContain('Abstract editorial illustration');
    });

    it('should return fallback prompt on API error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded'),
      );

      const result = await service.generateImagePrompt({
        headline: 'Test Blog Post',
      });

      expect(result.prompt).toContain('Abstract editorial illustration');
      expect(result.alt).toContain('Test Blog Post');
    });

    it('should truncate long headlines in fallback alt text', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.generateImagePrompt({
        headline:
          'This is a very long headline that should be truncated in the alt text',
      });

      expect(result.alt.length).toBeLessThan(100);
      expect(result.alt).toContain('This is a very long headline');
    });

    it('should handle empty choices array', async () => {
      const mockResponse = {
        choices: [],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.generateImagePrompt({
        headline: 'Test Blog Post',
      });

      expect(result.prompt).toContain('Abstract editorial illustration');
    });
  });

  describe('getFallbackPrompt (private)', () => {
    it('should include brand colors in fallback prompt', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.generateImagePrompt({
        headline: 'Test',
      });

      expect(result.prompt).toContain('#23194B');
      expect(result.prompt).toContain('#14D0DC');
    });

    it('should specify 4:5 ratio in fallback prompt', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error'),
      );

      const result = await service.generateImagePrompt({
        headline: 'Test',
      });

      expect(result.prompt).toContain('4:5');
    });
  });
});
