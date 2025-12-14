import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { TranscriptCorrectionRouterService } from './transcript-correction-router.service';
import { FirebaseService } from '../firebase/firebase.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { AssemblyAIService } from '../assembly-ai/assembly-ai.service';
import { EmailService } from '../email/email.service';
import { UsageService } from '../usage/usage.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { QUEUE_NAMES } from '@transcribe/shared';

describe('TranscriptionService - Transcript Correction', () => {
  let service: TranscriptionService;
  let firebaseService: FirebaseService;
  let mockOpenAI: any;

  const mockTranscription = {
    id: 'test-transcript-id',
    userId: 'test-user-id',
    fileName: 'test.mp3',
    status: 'completed',
    transcriptText: 'Speaker 1: Hello John. Speaker 2: Hi John.',
    transcriptWithSpeakers: 'Speaker 1: Hello John.\n\nSpeaker 2: Hi John.',
    speakerSegments: [
      {
        speakerTag: 'Speaker 1',
        startTime: 0,
        endTime: 2,
        text: 'Hello John.',
        confidence: 0.95,
      },
      {
        speakerTag: 'Speaker 2',
        startTime: 2,
        endTime: 4,
        text: 'Hi John.',
        confidence: 0.92,
      },
    ],
    translations: {
      es: { language: 'es', languageName: 'Spanish', transcriptText: '...' },
      fr: { language: 'fr', languageName: 'French', transcriptText: '...' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCorrectedTranscript = 'Speaker 1: Hello Jon.\n\nSpeaker 2: Hi Jon.';

  beforeEach(async () => {
    // Mock OpenAI
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: mockCorrectedTranscript,
                },
              },
            ],
          }),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        {
          provide: FirebaseService,
          useValue: {
            getTranscription: jest.fn(),
            updateTranscription: jest.fn(),
            deleteGeneratedAnalysesByTranscription: jest
              .fn()
              .mockResolvedValue(['analysis-1', 'analysis-2']),
          },
        },
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
          useValue: { add: jest.fn() },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.SUMMARY),
          useValue: { add: jest.fn() },
        },
        {
          provide: WebSocketGateway,
          useValue: { sendProgress: jest.fn() },
        },
        {
          provide: AssemblyAIService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {},
        },
        {
          provide: UsageService,
          useValue: {},
        },
        {
          provide: TranscriptCorrectionRouterService,
          useValue: {
            analyzeAndRoute: jest.fn().mockResolvedValue({
              simpleReplacements: [
                {
                  find: 'John',
                  replace: 'Jon',
                  caseSensitive: false,
                  estimatedMatches: 2,
                  confidence: 'high',
                },
              ],
              complexCorrections: [],
              estimatedTime: { regex: '< 1s', ai: '0s', total: '< 1s' },
              summary: {
                totalCorrections: 1,
                simpleCount: 1,
                complexCount: 0,
                totalSegmentsAffected: 2,
                totalSegments: 2,
                percentageAffected: '100%',
              },
            }),
            applySimpleReplacements: jest
              .fn()
              .mockImplementation((segments) => ({
                correctedSegments: segments.map((s: { text: string }) => ({
                  ...s,
                  text: s.text.replace(/John/gi, 'Jon'),
                })),
                affectedCount: 2,
              })),
            mergeResults: jest
              .fn()
              .mockImplementation((original, regex) => regex),
          },
        },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);
    firebaseService = module.get<FirebaseService>(FirebaseService);

    // Replace OpenAI instance with mock
    (service as any).openai = mockOpenAI;
  });

  describe('correctTranscriptWithAI', () => {
    describe('Validation', () => {
      it('should throw BadRequestException if transcription not found', async () => {
        jest.spyOn(firebaseService, 'getTranscription').mockResolvedValue(null);

        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'non-existent-id',
            'Change John to Jon',
            true,
          ),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'non-existent-id',
            'Change John to Jon',
            true,
          ),
        ).rejects.toThrow('Transcription not found or access denied');
      });

      it('should throw BadRequestException if transcript text is missing', async () => {
        const incompleteTrans = {
          ...mockTranscription,
          transcriptText: undefined,
        };
        jest
          .spyOn(firebaseService, 'getTranscription')
          .mockResolvedValue(incompleteTrans as any);

        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'test-transcript-id',
            'Change John to Jon',
            true,
          ),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'test-transcript-id',
            'Change John to Jon',
            true,
          ),
        ).rejects.toThrow('Transcription must be completed before correction');
      });

      it('should throw BadRequestException if status is not completed', async () => {
        const pendingTrans = { ...mockTranscription, status: 'processing' };
        jest
          .spyOn(firebaseService, 'getTranscription')
          .mockResolvedValue(pendingTrans as any);

        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'test-transcript-id',
            'Change John to Jon',
            true,
          ),
        ).rejects.toThrow('Transcription must be completed before correction');
      });
    });

    describe('Preview Mode', () => {
      beforeEach(() => {
        jest
          .spyOn(firebaseService, 'getTranscription')
          .mockResolvedValue(mockTranscription as any);
      });

      it('should return preview with diff without saving', async () => {
        const result = await service.correctTranscriptWithAI(
          'test-user-id',
          'test-transcript-id',
          'Change John to Jon',
          true, // preview mode
        );

        // Should return preview with diff (via CorrectionRouterService)
        expect(result).toHaveProperty('original');
        expect(result).toHaveProperty('corrected');
        expect(result).toHaveProperty('diff');
        expect(result).toHaveProperty('summary');

        // Diff should show 2 changes (both segments)
        expect(result.diff).toHaveLength(2);
        expect(result.summary.totalChanges).toBe(2);
        expect(result.summary.affectedSegments).toBe(2);

        // Should NOT save to Firestore in preview mode
        expect(firebaseService.updateTranscription).not.toHaveBeenCalled();
        expect(
          firebaseService.deleteGeneratedAnalysesByTranscription,
        ).not.toHaveBeenCalled();
      });

      it('should generate correct diff entries', async () => {
        const result = await service.correctTranscriptWithAI(
          'test-user-id',
          'test-transcript-id',
          'Change John to Jon',
          true,
        );

        const firstDiff = result.diff[0];
        expect(firstDiff).toEqual({
          segmentIndex: 0,
          speakerTag: 'Speaker 1',
          timestamp: '0:00',
          oldText: 'Hello John.',
          newText: 'Hello Jon.',
        });

        const secondDiff = result.diff[1];
        expect(secondDiff).toEqual({
          segmentIndex: 1,
          speakerTag: 'Speaker 2',
          timestamp: '0:02',
          oldText: 'Hi John.',
          newText: 'Hi Jon.',
        });
      });

      it('should throw BadRequestException for transcripts without speaker segments', async () => {
        const noSpeakerTrans = {
          ...mockTranscription,
          speakerSegments: [],
          transcriptWithSpeakers: null,
        };
        jest
          .spyOn(firebaseService, 'getTranscription')
          .mockResolvedValue(noSpeakerTrans as any);

        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'test-transcript-id',
            'Fix typos',
            true,
          ),
        ).rejects.toThrow('No speaker segments available for correction');
      });
    });

    describe('Apply Mode', () => {
      beforeEach(() => {
        jest
          .spyOn(firebaseService, 'getTranscription')
          .mockResolvedValueOnce(mockTranscription as any) // First call for validation
          .mockResolvedValueOnce({
            ...mockTranscription,
            translations: {},
            generatedAnalysisIds: [],
          } as any); // Second call after update
      });

      it('should save corrections and clear translations/analyses', async () => {
        const result = await service.correctTranscriptWithAI(
          'test-user-id',
          'test-transcript-id',
          'Change John to Jon',
          false, // apply mode
        );

        // Should update Firestore with corrected text
        expect(firebaseService.updateTranscription).toHaveBeenCalledWith(
          'test-transcript-id',
          expect.objectContaining({
            transcriptText: mockCorrectedTranscript,
            transcriptWithSpeakers: mockCorrectedTranscript,
            translations: {}, // Cleared
            generatedAnalysisIds: [], // Cleared
            updatedAt: expect.any(Date),
          }),
        );

        // Should delete custom analyses
        expect(
          firebaseService.deleteGeneratedAnalysesByTranscription,
        ).toHaveBeenCalledWith('test-transcript-id', 'test-user-id');

        // Should return success response
        expect(result).toEqual({
          success: true,
          transcription: expect.any(Object),
          deletedAnalysisIds: ['analysis-1', 'analysis-2'],
          clearedTranslations: ['es', 'fr'],
        });
      });

      it('should update speaker segments with corrected text', async () => {
        await service.correctTranscriptWithAI(
          'test-user-id',
          'test-transcript-id',
          'Change John to Jon',
          false,
        );

        const updateCall = (firebaseService.updateTranscription as jest.Mock)
          .mock.calls[0][1];
        expect(updateCall.speakerSegments).toBeDefined();
        expect(updateCall.speakerSegments).toHaveLength(2);

        // First segment should have corrected text
        expect(updateCall.speakerSegments[0]).toEqual({
          speakerTag: 'Speaker 1',
          startTime: 0,
          endTime: 2,
          text: 'Hello Jon.',
          confidence: 0.95,
        });

        // Second segment should have corrected text
        expect(updateCall.speakerSegments[1]).toEqual({
          speakerTag: 'Speaker 2',
          startTime: 2,
          endTime: 4,
          text: 'Hi Jon.',
          confidence: 0.92,
        });
      });
    });

    describe('Correction Router Integration', () => {
      let correctionRouterService: TranscriptCorrectionRouterService;

      beforeEach(() => {
        jest
          .spyOn(firebaseService, 'getTranscription')
          .mockResolvedValue(mockTranscription as any);
        correctionRouterService = (service as any).correctionRouter;
      });

      it('should call the correction router for analysis', async () => {
        await service.correctTranscriptWithAI(
          'test-user-id',
          'test-transcript-id',
          'Change John to Jon',
          true,
        );

        expect(correctionRouterService.analyzeAndRoute).toHaveBeenCalledWith(
          expect.any(Array),
          'Change John to Jon',
          expect.any(String),
          undefined, // duration is optional
        );
      });

      it('should apply simple replacements via the router', async () => {
        await service.correctTranscriptWithAI(
          'test-user-id',
          'test-transcript-id',
          'Change John to Jon',
          true,
        );

        expect(
          correctionRouterService.applySimpleReplacements,
        ).toHaveBeenCalled();
      });

      it('should throw if router analysis fails', async () => {
        (
          correctionRouterService.analyzeAndRoute as jest.Mock
        ).mockRejectedValue(new Error('Analysis failed'));

        await expect(
          service.correctTranscriptWithAI(
            'test-user-id',
            'test-transcript-id',
            'Fix typos',
            true,
          ),
        ).rejects.toThrow('Analysis failed');
      });
    });
  });

  describe('Helper Methods', () => {
    describe('applyCorrectionsToSegments', () => {
      it('should preserve timestamps and metadata while updating text', () => {
        const originalSegments = mockTranscription.speakerSegments;
        const correctedText = 'Speaker 1: Hello Jon.\n\nSpeaker 2: Hi Jon.';

        const result = (service as any).applyCorrectionsToSegments(
          originalSegments,
          correctedText,
        );

        expect(result).toHaveLength(2);
        expect(result[0].startTime).toBe(0);
        expect(result[0].endTime).toBe(2);
        expect(result[0].confidence).toBe(0.95);
        expect(result[0].text).toBe('Hello Jon.');
      });

      it('should handle speaker tag case insensitivity', () => {
        const originalSegments = mockTranscription.speakerSegments;
        const correctedText = 'speaker 1: Hello Jon.\n\nspeaker 2: Hi Jon.'; // lowercase

        const result = (service as any).applyCorrectionsToSegments(
          originalSegments,
          correctedText,
        );

        expect(result).toHaveLength(2);
        expect(result[0].text).toBe('Hello Jon.');
      });
    });

    describe('generateDiff', () => {
      it('should only include changed segments', () => {
        const originalSegments = [
          {
            speakerTag: 'Speaker 1',
            startTime: 0,
            text: 'Hello John.',
            confidence: 0.9,
          },
          {
            speakerTag: 'Speaker 2',
            startTime: 2,
            text: 'Unchanged text.',
            confidence: 0.9,
          },
          {
            speakerTag: 'Speaker 3',
            startTime: 4,
            text: 'Another change here.',
            confidence: 0.9,
          },
        ];

        const correctedSegments = [
          {
            speakerTag: 'Speaker 1',
            startTime: 0,
            text: 'Hello Jon.',
            confidence: 0.9,
          },
          {
            speakerTag: 'Speaker 2',
            startTime: 2,
            text: 'Unchanged text.',
            confidence: 0.9,
          },
          {
            speakerTag: 'Speaker 3',
            startTime: 4,
            text: 'Another modification here.',
            confidence: 0.9,
          },
        ];

        const diff = (service as any).generateDiff(
          originalSegments,
          correctedSegments,
        );

        expect(diff).toHaveLength(2); // Only segments 0 and 2 changed
        expect(diff[0].segmentIndex).toBe(0);
        expect(diff[1].segmentIndex).toBe(2);
      });

      it('should return empty array if no changes', () => {
        const segments = mockTranscription.speakerSegments;
        const diff = (service as any).generateDiff(segments, segments);

        expect(diff).toHaveLength(0);
      });
    });

    describe('formatTime', () => {
      it('should format seconds to MM:SS', () => {
        expect((service as any).formatTime(0)).toBe('0:00');
        expect((service as any).formatTime(5)).toBe('0:05');
        expect((service as any).formatTime(60)).toBe('1:00');
        expect((service as any).formatTime(125)).toBe('2:05');
        expect((service as any).formatTime(3661)).toBe('61:01');
      });
    });
  });
});
