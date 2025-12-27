import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OnDemandAnalysisService } from './on-demand-analysis.service';
import { StorageService } from '../firebase/services/storage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { TranscriptionService } from './transcription.service';
import { AnalysisTemplateService } from './analysis-template.service';
import { ImagePromptService } from './image-prompt.service';
import { ReplicateService } from '../replicate/replicate.service';
import { EmailService } from '../email/email.service';
import { TranslationService } from '../translation/translation.service';
import {
  createMockStorageService,
  createMockUserRepository,
  createMockAnalysisRepository,
  createMockTranscriptionRepository,
} from '../../test/mocks';
import { createTestTranscription, createTestUser } from '../../test/factories';

describe('OnDemandAnalysisService', () => {
  let service: OnDemandAnalysisService;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockAnalysisRepository: ReturnType<typeof createMockAnalysisRepository>;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockTranscriptionService: any;
  let mockTemplateService: any;
  let mockImagePromptService: any;
  let mockReplicateService: any;
  let mockEmailService: any;
  let mockTranslationService: any;

  const mockTemplate = {
    id: 'actionItems',
    name: 'Action Items',
    version: '1.0',
    modelPreference: 'gpt-5',
    systemPrompt: 'Generate action items',
    userPrompt: 'Extract action items from transcript',
    outputFormat: 'structured',
  };

  beforeEach(async () => {
    mockStorageService = createMockStorageService();
    mockUserRepository = createMockUserRepository();
    mockAnalysisRepository = createMockAnalysisRepository();
    mockTranscriptionRepository = createMockTranscriptionRepository();

    mockTranscriptionService = {
      generateSummaryWithModel: jest.fn().mockResolvedValue(
        JSON.stringify({
          type: 'actionItems',
          immediateActions: [{ action: 'Test action', assignee: 'John' }],
          shortTermActions: [],
          longTermActions: [],
        }),
      ),
    };

    mockTemplateService = {
      getTemplateById: jest.fn().mockReturnValue(mockTemplate),
    };

    mockImagePromptService = {
      generateImagePrompt: jest.fn().mockResolvedValue({
        prompt: 'A professional business image',
        alt: 'Business meeting illustration',
      }),
    };

    mockReplicateService = {
      isAvailable: jest.fn().mockReturnValue(true),
      generateImage: jest.fn().mockResolvedValue({
        url: 'https://replicate.com/image.webp',
        generationTimeMs: 5000,
      }),
      downloadImage: jest.fn().mockResolvedValue(Buffer.from('image data')),
    };

    mockEmailService = {
      sendEmailDraftToSelf: jest.fn().mockResolvedValue(true),
    };

    mockTranslationService = {
      translateNewAsset: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnDemandAnalysisService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AnalysisRepository, useValue: mockAnalysisRepository },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: TranscriptionService, useValue: mockTranscriptionService },
        { provide: AnalysisTemplateService, useValue: mockTemplateService },
        { provide: ImagePromptService, useValue: mockImagePromptService },
        { provide: ReplicateService, useValue: mockReplicateService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compile();

    service = module.get<OnDemandAnalysisService>(OnDemandAnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFromTemplate', () => {
    const transcription = createTestTranscription({
      id: 'trans-123',
      userId: 'user-123',
      transcriptText: 'This is the transcript text.',
      context: 'Business meeting',
    });

    it('should generate analysis from template', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );

      const result = await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
      );

      expect(result.id).toBe('analysis-123');
      expect(result.templateId).toBe('actionItems');
      expect(result.templateName).toBe('Action Items');
      expect(
        mockTranscriptionService.generateSummaryWithModel,
      ).toHaveBeenCalled();
    });

    it('should throw if template not found', async () => {
      mockTemplateService.getTemplateById.mockReturnValue(null);

      await expect(
        service.generateFromTemplate('trans-123', 'invalid', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.generateFromTemplate('trans-123', 'actionItems', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return cached analysis if duplicate exists', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      const existingAnalysis = {
        id: 'existing-123',
        templateId: 'actionItems',
        customInstructions: '',
      };
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        existingAnalysis,
      ]);

      const result = await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
      );

      expect(result.id).toBe('existing-123');
      expect(
        mockTranscriptionService.generateSummaryWithModel,
      ).not.toHaveBeenCalled();
    });

    it('should regenerate if custom instructions differ', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      const existingAnalysis = {
        id: 'existing-123',
        templateId: 'actionItems',
        customInstructions: 'old instructions',
      };
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([
        existingAnalysis,
      ]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'new-123',
      );

      const result = await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
        'new instructions',
      );

      expect(result.id).toBe('new-123');
      expect(
        mockTranscriptionService.generateSummaryWithModel,
      ).toHaveBeenCalled();
    });

    it('should skip duplicate check when skipDuplicateCheck is true', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );

      await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
        undefined,
        { skipDuplicateCheck: true },
      );

      expect(
        mockAnalysisRepository.getGeneratedAnalyses,
      ).not.toHaveBeenCalled();
    });

    it('should throw if AI returns empty content', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue('');

      await expect(
        service.generateFromTemplate('trans-123', 'actionItems', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if no transcript available', async () => {
      const noTranscriptTranscription = {
        ...transcription,
        transcriptText: null,
        analyses: null,
      };
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        noTranscriptTranscription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      await expect(
        service.generateFromTemplate('trans-123', 'actionItems', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should trigger auto-translation after generation', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );

      await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
      );

      expect(mockTranslationService.translateNewAsset).toHaveBeenCalled();
    });
  });

  describe('getUserAnalyses', () => {
    it('should return user analyses from repository', async () => {
      const analyses = [
        { id: 'analysis-1', templateId: 'actionItems' },
        { id: 'analysis-2', templateId: 'blogPost' },
      ];
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue(analyses);

      const result = await service.getUserAnalyses('trans-123', 'user-123');

      expect(result).toEqual(analyses);
      expect(mockAnalysisRepository.getGeneratedAnalyses).toHaveBeenCalledWith(
        'trans-123',
        'user-123',
      );
    });
  });

  describe('getAnalysisById', () => {
    it('should return analysis by ID', async () => {
      const analysis = {
        id: 'analysis-123',
        userId: 'user-123',
        templateId: 'actionItems',
      };
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        analysis,
      );

      const result = await service.getAnalysisById('analysis-123', 'user-123');

      expect(result).toEqual(analysis);
    });

    it('should throw if analysis not found', async () => {
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(null);

      await expect(
        service.getAnalysisById('analysis-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user does not own analysis', async () => {
      const analysis = {
        id: 'analysis-123',
        userId: 'other-user',
        templateId: 'actionItems',
      };
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        analysis,
      );

      await expect(
        service.getAnalysisById('analysis-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete analysis owned by user', async () => {
      const analysis = {
        id: 'analysis-123',
        userId: 'user-123',
        transcriptionId: 'trans-123',
      };
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        analysis,
      );

      await service.deleteAnalysis('analysis-123', 'user-123');

      expect(
        mockAnalysisRepository.removeAnalysisReference,
      ).toHaveBeenCalledWith('trans-123', 'analysis-123');
      expect(
        mockAnalysisRepository.deleteGeneratedAnalysis,
      ).toHaveBeenCalledWith('analysis-123');
    });

    it('should throw if analysis not found or not owned', async () => {
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(null);

      await expect(
        service.deleteAnalysis('analysis-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if owned by different user', async () => {
      const analysis = {
        id: 'analysis-123',
        userId: 'other-user',
        transcriptionId: 'trans-123',
      };
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        analysis,
      );

      await expect(
        service.deleteAnalysis('analysis-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateImageForBlogPost', () => {
    const blogAnalysis = {
      id: 'blog-123',
      userId: 'user-123',
      templateId: 'blogPost',
      content: {
        headline: 'Test Blog Post',
        subheading: 'A test blog',
        hook: 'This is a hook',
      },
    };

    it('should generate hero image for blog post', async () => {
      const user = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'professional',
      });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        blogAnalysis,
      );
      mockStorageService.uploadFile.mockResolvedValue({
        url: 'https://storage.example.com/image.webp',
      });

      const result = await service.generateImageForBlogPost(
        'blog-123',
        'user-123',
      );

      expect(result.url).toBe('https://storage.example.com/image.webp');
      expect(result.alt).toBe('Business meeting illustration');
      expect(mockReplicateService.generateImage).toHaveBeenCalled();
    });

    it('should throw if Replicate is not available', async () => {
      mockReplicateService.isAvailable.mockReturnValue(false);

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for free tier users', async () => {
      const freeUser = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'free',
      });
      mockUserRepository.getUser.mockResolvedValue(freeUser);

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin users regardless of tier', async () => {
      const adminUser = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'free',
        role: 'admin',
      });
      mockUserRepository.getUser.mockResolvedValue(adminUser);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        blogAnalysis,
      );
      mockStorageService.uploadFile.mockResolvedValue({
        url: 'https://storage.example.com/image.webp',
      });

      const result = await service.generateImageForBlogPost(
        'blog-123',
        'user-123',
      );

      expect(result.url).toBe('https://storage.example.com/image.webp');
    });

    it('should throw if analysis is not a blog post', async () => {
      const user = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'professional',
      });
      const nonBlogAnalysis = { ...blogAnalysis, templateId: 'actionItems' };
      mockUserRepository.getUser.mockResolvedValue(user);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        nonBlogAnalysis,
      );

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendEmailToSelf', () => {
    const emailAnalysis = {
      id: 'email-123',
      userId: 'user-123',
      templateId: 'followUpEmail',
      content: {
        subject: 'Follow-up email',
        body: ['Thank you for your time.'],
      },
    };

    it('should send email to user', async () => {
      const user = createTestUser({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        emailAnalysis,
      );
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.sendEmailToSelf('email-123', 'user-123');

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmailDraftToSelf).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(Object),
      );
    });

    it('should throw if analysis not found', async () => {
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(null);

      await expect(
        service.sendEmailToSelf('email-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if not an email template', async () => {
      const nonEmailAnalysis = { ...emailAnalysis, templateId: 'blogPost' };
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        nonEmailAnalysis,
      );

      await expect(
        service.sendEmailToSelf('email-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if email sending fails', async () => {
      const user = createTestUser({
        uid: 'user-123',
        email: 'test@example.com',
      });
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        emailAnalysis,
      );
      mockUserRepository.getUser.mockResolvedValue(user);
      mockEmailService.sendEmailDraftToSelf.mockResolvedValue(false);

      await expect(
        service.sendEmailToSelf('email-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user does not own analysis', async () => {
      const otherUserAnalysis = { ...emailAnalysis, userId: 'other-user' };
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        otherUserAnalysis,
      );

      await expect(
        service.sendEmailToSelf('email-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user has no email', async () => {
      const userNoEmail = createTestUser({
        uid: 'user-123',
        email: null as any,
      });
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        emailAnalysis,
      );
      mockUserRepository.getUser.mockResolvedValue(userNoEmail);

      await expect(
        service.sendEmailToSelf('email-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use email username when displayName is not set', async () => {
      const user = createTestUser({
        uid: 'user-123',
        email: 'john.doe@example.com',
        displayName: null as any,
      });
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        emailAnalysis,
      );
      mockUserRepository.getUser.mockResolvedValue(user);

      await service.sendEmailToSelf('email-123', 'user-123');

      expect(mockEmailService.sendEmailDraftToSelf).toHaveBeenCalledWith(
        'john.doe@example.com',
        'john.doe',
        expect.any(Object),
      );
    });
  });

  describe('generateImageForBlogPost edge cases', () => {
    const blogAnalysis = {
      id: 'blog-123',
      userId: 'user-123',
      templateId: 'blogPost',
      content: {
        headline: 'Test Blog Post',
        subheading: 'A test blog',
        hook: 'This is a hook',
      },
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.getUser.mockResolvedValue(null);

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not own analysis', async () => {
      const user = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'professional',
      });
      const otherUserAnalysis = { ...blogAnalysis, userId: 'other-user' };
      mockUserRepository.getUser.mockResolvedValue(user);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        otherUserAnalysis,
      );

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if blog content is invalid (no headline)', async () => {
      const user = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'professional',
      });
      const invalidBlogAnalysis = {
        ...blogAnalysis,
        content: { subheading: 'No headline' },
      };
      mockUserRepository.getUser.mockResolvedValue(user);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        invalidBlogAnalysis,
      );

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if image generation fails', async () => {
      const user = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'professional',
      });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        blogAnalysis,
      );
      mockReplicateService.generateImage.mockResolvedValue(null);

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if image download fails', async () => {
      const user = createTestUser({
        uid: 'user-123',
        subscriptionTier: 'professional',
      });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        blogAnalysis,
      );
      mockReplicateService.downloadImage.mockResolvedValue(null);

      await expect(
        service.generateImageForBlogPost('blog-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateFromTemplate edge cases', () => {
    const transcription = createTestTranscription({
      id: 'trans-123',
      userId: 'user-123',
      transcriptText: 'This is the transcript text.',
      context: null, // No context
    });

    it('should use custom instructions as context when no context exists', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );

      await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
        'Custom instructions only',
      );

      expect(
        mockTranscriptionService.generateSummaryWithModel,
      ).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        'Custom instructions only', // Should be just custom instructions
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should use legacy analyses.transcript as fallback', async () => {
      const legacyTranscription = createTestTranscription({
        id: 'trans-123',
        userId: 'user-123',
        transcriptText: null,
        analyses: { transcript: 'Legacy transcript text' },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        legacyTranscription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );

      await service.generateFromTemplate(
        'trans-123',
        'actionItems',
        'user-123',
      );

      // Verify the first argument is the legacy transcript
      expect(
        mockTranscriptionService.generateSummaryWithModel,
      ).toHaveBeenCalled();
      const callArgs =
        mockTranscriptionService.generateSummaryWithModel.mock.calls[0];
      expect(callArgs[0]).toBe('Legacy transcript text');
    });

    it('should generate blog image when replicateService is available', async () => {
      const blogTemplate = {
        id: 'blogPost',
        name: 'Blog Post',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate blog post',
        userPrompt: 'Create a blog post',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(blogTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'blogPost',
          headline: 'Test Blog',
          subheading: 'Subtitle',
          hook: 'Hook text',
          sections: [],
        }),
      );
      mockStorageService.uploadFile.mockResolvedValue({
        url: 'https://storage.example.com/image.webp',
      });

      await service.generateFromTemplate('trans-123', 'blogPost', 'user-123');

      expect(mockReplicateService.generateImage).toHaveBeenCalled();
    });

    it('should continue without image if image generation fails during blog generation', async () => {
      const blogTemplate = {
        id: 'blogPost',
        name: 'Blog Post',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate blog post',
        userPrompt: 'Create a blog post',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(blogTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'blogPost',
          headline: 'Test Blog',
          subheading: 'Subtitle',
          hook: 'Hook text',
          sections: [],
        }),
      );
      mockReplicateService.generateImage.mockResolvedValue(null);

      // Should not throw, just continue without image
      const result = await service.generateFromTemplate(
        'trans-123',
        'blogPost',
        'user-123',
      );

      expect(result.id).toBe('analysis-123');
    });

    it('should throw if structured output parse fails', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue({
        ...transcription,
        context: 'Some context',
      });
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        'Not valid JSON',
      );

      await expect(
        service.generateFromTemplate('trans-123', 'actionItems', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateStructuredOutput', () => {
    it('should validate email template with string body', async () => {
      const emailTemplate = {
        id: 'email',
        name: 'Email',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate email',
        userPrompt: 'Create an email',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(emailTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        createTestTranscription({
          id: 'trans-123',
          userId: 'user-123',
          transcriptText: 'Transcript text.',
        }),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'email',
          subject: 'Test Subject',
          body: 'Single string body',
        }),
      );

      const result = await service.generateFromTemplate(
        'trans-123',
        'email',
        'user-123',
      );

      expect(result.content).toHaveProperty('body');
      expect(Array.isArray((result.content as any).body)).toBe(true);
    });

    it('should validate linkedin template', async () => {
      const linkedinTemplate = {
        id: 'linkedin',
        name: 'LinkedIn',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate LinkedIn post',
        userPrompt: 'Create a LinkedIn post',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(linkedinTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        createTestTranscription({
          id: 'trans-123',
          userId: 'user-123',
          transcriptText: 'Transcript text.',
        }),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'linkedin',
          hook: 'Attention grabbing hook',
          content: 'Main content here',
        }),
      );

      const result = await service.generateFromTemplate(
        'trans-123',
        'linkedin',
        'user-123',
      );

      expect(result.content).toHaveProperty('hook');
      expect(result.content).toHaveProperty('content');
    });

    it('should validate communicationAnalysis template', async () => {
      const commTemplate = {
        id: 'communicationAnalysis',
        name: 'Communication Analysis',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Analyze communication',
        userPrompt: 'Analyze the communication style',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(commTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        createTestTranscription({
          id: 'trans-123',
          userId: 'user-123',
          transcriptText: 'Transcript text.',
        }),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockAnalysisRepository.createGeneratedAnalysis.mockResolvedValue(
        'analysis-123',
      );
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'communicationAnalysis',
          overallScore: 85,
        }),
      );

      const result = await service.generateFromTemplate(
        'trans-123',
        'communicationAnalysis',
        'user-123',
      );

      expect((result.content as any).overallScore).toBe(85);
    });

    it('should throw for email template missing subject', async () => {
      const emailTemplate = {
        id: 'email',
        name: 'Email',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate email',
        userPrompt: 'Create an email',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(emailTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        createTestTranscription({
          id: 'trans-123',
          userId: 'user-123',
          transcriptText: 'Transcript text.',
        }),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'email',
          body: ['Body text'],
        }),
      );

      await expect(
        service.generateFromTemplate('trans-123', 'email', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for blogPost template missing headline', async () => {
      const blogTemplate = {
        id: 'blogPost',
        name: 'Blog Post',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate blog',
        userPrompt: 'Create a blog',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(blogTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        createTestTranscription({
          id: 'trans-123',
          userId: 'user-123',
          transcriptText: 'Transcript text.',
        }),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'blogPost',
          hook: 'Hook text',
        }),
      );

      await expect(
        service.generateFromTemplate('trans-123', 'blogPost', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for linkedin template missing hook', async () => {
      const linkedinTemplate = {
        id: 'linkedin',
        name: 'LinkedIn',
        version: '1.0',
        modelPreference: 'gpt-5',
        systemPrompt: 'Generate LinkedIn',
        userPrompt: 'Create LinkedIn post',
        outputFormat: 'structured',
      };
      mockTemplateService.getTemplateById.mockReturnValue(linkedinTemplate);
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        createTestTranscription({
          id: 'trans-123',
          userId: 'user-123',
          transcriptText: 'Transcript text.',
        }),
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionService.generateSummaryWithModel.mockResolvedValue(
        JSON.stringify({
          type: 'linkedin',
          content: 'Content only',
        }),
      );

      await expect(
        service.generateFromTemplate('trans-123', 'linkedin', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
