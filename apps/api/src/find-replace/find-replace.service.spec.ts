import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindReplaceService } from './find-replace.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import {
  createMockTranscriptionRepository,
  createMockAnalysisRepository,
} from '../../test/mocks';

describe('FindReplaceService', () => {
  let service: FindReplaceService;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockAnalysisRepository: ReturnType<typeof createMockAnalysisRepository>;

  const createTestTranscription = (overrides: any = {}) => ({
    id: 'trans-123',
    userId: 'user-123',
    title: 'Test Meeting',
    status: 'completed',
    speakerSegments: [
      { speaker: 'Speaker A', text: 'Hello world, this is a test.' },
      { speaker: 'Speaker B', text: 'Testing the find feature.' },
    ],
    summaryV2: {
      title: 'Test Meeting Summary',
      intro: 'This is an introduction to the meeting.',
      keyPoints: [
        { topic: 'First Topic', description: 'Description of first topic' },
        { topic: 'Second Topic', description: 'Description of second topic' },
      ],
      detailedSections: [
        { topic: 'Section One', content: 'Content of section one' },
      ],
      decisions: ['Decision one', 'Decision two'],
      nextSteps: ['Step one', 'Step two'],
    },
    ...overrides,
  });

  const createTestAnalysis = (overrides: any = {}) => ({
    id: 'analysis-123',
    transcriptionId: 'trans-123',
    userId: 'user-123',
    templateId: 'action-items',
    templateName: 'Action Items',
    contentType: 'markdown',
    content: 'This is the action items content with test text.',
    generatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockTranscriptionRepository = createMockTranscriptionRepository();
    mockAnalysisRepository = createMockAnalysisRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindReplaceService,
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: AnalysisRepository, useValue: mockAnalysisRepository },
      ],
    }).compile();

    service = module.get<FindReplaceService>(FindReplaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatches', () => {
    it('should throw NotFoundException when transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.findMatches('user-123', 'trans-123', 'test', {
          caseSensitive: false,
          wholeWord: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should find matches in transcript segments', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'test',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.transcriptionId).toBe('trans-123');
      expect(result.transcript.length).toBeGreaterThan(0);
      expect(result.transcript[0].location.type).toBe('transcript');
    });

    it('should find matches in summary title', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Meeting',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      const titleMatches = result.summary.filter(
        (m) => m.location.summaryField === 'title',
      );
      expect(titleMatches.length).toBeGreaterThan(0);
    });

    it('should find matches in summary intro', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'introduction',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      const introMatches = result.summary.filter(
        (m) => m.location.summaryField === 'intro',
      );
      expect(introMatches.length).toBeGreaterThan(0);
    });

    it('should find matches in summary keyPoints', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Topic',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      const keyPointMatches = result.summary.filter(
        (m) => m.location.summaryField === 'keyPoint',
      );
      expect(keyPointMatches.length).toBeGreaterThan(0);
    });

    it('should find matches in AI assets with markdown content', async () => {
      const transcription = createTestTranscription();
      const analysis = createTestAnalysis();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([analysis]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'action',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.aiAssets.length).toBeGreaterThan(0);
      expect(result.aiAssets[0].analysisId).toBe('analysis-123');
    });

    it('should find matches in AI assets with structured content', async () => {
      const transcription = createTestTranscription();
      const analysis = createTestAnalysis({
        contentType: 'structured',
        content: {
          type: 'action-items',
          items: ['Action item one', 'Action item two'],
          summary: 'Summary of action items',
        },
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([analysis]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Action',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.aiAssets.length).toBeGreaterThan(0);
    });

    it('should respect case sensitive option', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      // Case insensitive should find matches
      const insensitiveResult = await service.findMatches(
        'user-123',
        'trans-123',
        'MEETING',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );
      expect(insensitiveResult.totalMatches).toBeGreaterThan(0);

      // Case sensitive should not find "MEETING" when only "Meeting" exists
      const sensitiveResult = await service.findMatches(
        'user-123',
        'trans-123',
        'MEETING',
        {
          caseSensitive: true,
          wholeWord: false,
        },
      );
      expect(sensitiveResult.totalMatches).toBe(0);
    });

    it('should respect whole word option', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      // Partial match should work without wholeWord
      const partialResult = await service.findMatches(
        'user-123',
        'trans-123',
        'Meet',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );
      expect(partialResult.totalMatches).toBeGreaterThan(0);

      // wholeWord should not match partial
      const wholeWordResult = await service.findMatches(
        'user-123',
        'trans-123',
        'Meet',
        {
          caseSensitive: false,
          wholeWord: true,
        },
      );
      expect(wholeWordResult.totalMatches).toBe(0);
    });

    it('should return correct total matches count', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Topic',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      const expectedTotal =
        result.summary.length +
        result.transcript.length +
        result.aiAssets.reduce((sum, a) => sum + a.matches.length, 0);
      expect(result.totalMatches).toBe(expectedTotal);
    });

    it('should find matches in decisions and nextSteps', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Decision',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      const decisionMatches = result.summary.filter(
        (m) => m.location.summaryField === 'decision',
      );
      expect(decisionMatches.length).toBeGreaterThan(0);
    });
  });

  describe('replaceMatches', () => {
    it('should throw NotFoundException when transcription not found', async () => {
      mockTranscriptionRepository.getTranscription.mockResolvedValue(null);

      await expect(
        service.replaceMatches('user-123', 'trans-123', {
          findText: 'test',
          replaceText: 'replaced',
          caseSensitive: false,
          wholeWord: false,
          replaceAll: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return zero count when no matches found', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.replaceMatches('user-123', 'trans-123', {
        findText: 'nonexistent',
        replaceText: 'replaced',
        caseSensitive: false,
        wholeWord: false,
        replaceAll: true,
      });

      expect(result.replacedCount).toBe(0);
    });

    it('should replace all matches when replaceAll is true', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const result = await service.replaceMatches('user-123', 'trans-123', {
        findText: 'test',
        replaceText: 'replaced',
        caseSensitive: false,
        wholeWord: false,
        replaceAll: true,
      });

      expect(result.replacedCount).toBeGreaterThan(0);
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalled();
    });

    it('should replace only summary matches when category is summary', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const result = await service.replaceMatches('user-123', 'trans-123', {
        findText: 'Meeting',
        replaceText: 'Conference',
        caseSensitive: false,
        wholeWord: false,
        replaceCategories: ['summary'],
      });

      expect(result.replacedLocations.summary).toBeGreaterThan(0);
      expect(result.replacedLocations.transcript).toBe(0);
    });

    it('should replace only transcript matches when category is transcript', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      const result = await service.replaceMatches('user-123', 'trans-123', {
        findText: 'Hello',
        replaceText: 'Hi',
        caseSensitive: false,
        wholeWord: false,
        replaceCategories: ['transcript'],
      });

      expect(result.replacedLocations.transcript).toBeGreaterThan(0);
    });

    it('should replace specific matches by matchIds', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      // First find matches to get their IDs
      const findResult = await service.findMatches(
        'user-123',
        'trans-123',
        'test',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      const matchToReplace = findResult.transcript[0];
      expect(matchToReplace).toBeDefined();

      const result = await service.replaceMatches('user-123', 'trans-123', {
        findText: 'test',
        replaceText: 'replaced',
        caseSensitive: false,
        wholeWord: false,
        matchIds: [matchToReplace.id],
      });

      expect(result.replacedCount).toBe(1);
    });

    it('should replace in AI assets', async () => {
      const transcription = createTestTranscription();
      const analysis = createTestAnalysis();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([analysis]);
      mockAnalysisRepository.getGeneratedAnalysisById.mockResolvedValue(
        analysis,
      );
      mockAnalysisRepository.updateGeneratedAnalysis.mockResolvedValue(
        undefined,
      );

      const result = await service.replaceMatches('user-123', 'trans-123', {
        findText: 'action',
        replaceText: 'task',
        caseSensitive: false,
        wholeWord: false,
        replaceCategories: ['aiAssets'],
      });

      expect(result.replacedLocations.aiAssets.length).toBeGreaterThan(0);
      expect(mockAnalysisRepository.updateGeneratedAnalysis).toHaveBeenCalled();
    });

    it('should update transcription title when summary title is replaced', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);
      mockTranscriptionRepository.updateTranscription.mockResolvedValue(
        undefined,
      );

      await service.replaceMatches('user-123', 'trans-123', {
        findText: 'Test Meeting Summary',
        replaceText: 'Updated Summary',
        caseSensitive: false,
        wholeWord: false,
        replaceCategories: ['summary'],
      });

      // Check that updateTranscription was called with both summaryV2 and title
      const updateCall =
        mockTranscriptionRepository.updateTranscription.mock.calls[0];
      expect(updateCall[1]).toHaveProperty('summaryV2');
      expect(updateCall[1]).toHaveProperty('title');
    });
  });

  describe('helper methods', () => {
    it('should generate deterministic match IDs', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      // Call findMatches twice - IDs should be the same
      const result1 = await service.findMatches(
        'user-123',
        'trans-123',
        'test',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );
      const result2 = await service.findMatches(
        'user-123',
        'trans-123',
        'test',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result1.transcript[0].id).toBe(result2.transcript[0].id);
    });

    it('should include context in match results', async () => {
      const transcription = createTestTranscription();
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Hello',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.transcript[0].context).toContain('Hello');
      expect(result.transcript[0].matchedText).toBe('Hello');
    });

    it('should handle transcription without summaryV2', async () => {
      const transcription = createTestTranscription({ summaryV2: undefined });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'test',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.summary).toHaveLength(0);
      expect(result.transcript.length).toBeGreaterThan(0);
    });

    it('should handle transcription without speakerSegments', async () => {
      const transcription = createTestTranscription({ speakerSegments: [] });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      const result = await service.findMatches(
        'user-123',
        'trans-123',
        'Meeting',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.transcript).toHaveLength(0);
    });

    it('should escape regex special characters in search text', async () => {
      const transcription = createTestTranscription({
        speakerSegments: [
          { speaker: 'A', text: 'Price is $100.00 (negotiable)' },
        ],
      });
      mockTranscriptionRepository.getTranscription.mockResolvedValue(
        transcription,
      );
      mockAnalysisRepository.getGeneratedAnalyses.mockResolvedValue([]);

      // Should not throw and should find literal $100.00
      const result = await service.findMatches(
        'user-123',
        'trans-123',
        '$100.00',
        {
          caseSensitive: false,
          wholeWord: false,
        },
      );

      expect(result.transcript.length).toBeGreaterThan(0);
      expect(result.transcript[0].matchedText).toBe('$100.00');
    });
  });
});
