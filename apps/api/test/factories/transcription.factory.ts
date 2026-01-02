/**
 * Test data factories for Transcription entities
 */
import {
  Transcription,
  TranscriptionStatus,
  SummaryV2,
  Speaker,
  SpeakerSegment,
  ShareSettings,
} from '@transcribe/shared';

/**
 * Creates a test transcription with default values
 */
export function createTestTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  const now = new Date();
  return {
    id: 'trans-123',
    userId: 'test-user-123',
    fileName: 'test-audio.mp3',
    title: 'Test Audio',
    fileSize: 1024000, // 1MB
    mimeType: 'audio/mpeg',
    status: TranscriptionStatus.COMPLETED,
    transcriptText: 'This is a test transcript with some sample content.',
    duration: 300, // 5 minutes
    detectedLanguage: 'english',
    createdAt: now,
    updatedAt: now,
    completedAt: now,
    ...overrides,
  };
}

/**
 * Creates a pending transcription (not yet processed)
 */
export function createPendingTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    status: TranscriptionStatus.PENDING,
    transcriptText: undefined,
    duration: undefined,
    completedAt: undefined,
    ...overrides,
  });
}

/**
 * Creates a processing transcription (currently being transcribed)
 */
export function createProcessingTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    status: TranscriptionStatus.PROCESSING,
    transcriptText: undefined,
    duration: undefined,
    completedAt: undefined,
    ...overrides,
  });
}

/**
 * Creates a failed transcription
 */
export function createFailedTranscription(
  error = 'Transcription failed due to an error',
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    status: TranscriptionStatus.FAILED,
    error,
    transcriptText: undefined,
    duration: undefined,
    completedAt: undefined,
    ...overrides,
  });
}

/**
 * Creates a transcription with V2 structured summary
 */
export function createTranscriptionWithSummaryV2(
  overrides: Partial<Transcription> = {},
): Transcription {
  const summaryV2: SummaryV2 = {
    title: 'Test Meeting Summary',
    tldr: 'This is a brief summary of the meeting content.',
    context: {
      type: 'meeting',
      participants: 2,
      duration: '5 minutes',
      date: new Date().toISOString(),
    },
    keyTopics: [
      {
        topic: 'Project Updates',
        summary: 'Discussed current project status',
        importance: 'high',
      },
    ],
    decisions: [
      {
        decision: 'Move forward with the new design',
        rationale: 'Team consensus',
        owner: 'John',
      },
    ],
    insights: [
      {
        insight: 'Team morale is high',
        evidence: 'Positive feedback during meeting',
        actionable: false,
      },
    ],
  };

  return createTestTranscription({
    summaryV2,
    ...overrides,
  });
}

/**
 * Creates a transcription with speaker diarization
 */
export function createTranscriptionWithSpeakers(
  speakerCount = 2,
  overrides: Partial<Transcription> = {},
): Transcription {
  const speakers: Speaker[] = Array.from({ length: speakerCount }, (_, i) => ({
    speakerId: i,
    speakerTag: `Speaker ${i + 1}`,
    totalSpeakingTime: 150,
    wordCount: 100,
    firstAppearance: i * 30,
  }));

  const speakerSegments: SpeakerSegment[] = [
    {
      speakerTag: 'Speaker 1',
      startTime: 0,
      endTime: 30,
      text: 'Hello, welcome to the meeting.',
      confidence: 0.95,
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 30,
      endTime: 60,
      text: 'Thank you for having me.',
      confidence: 0.92,
    },
  ];

  return createTestTranscription({
    speakerCount,
    speakers,
    speakerSegments,
    diarizationConfidence: 0.93,
    ...overrides,
  });
}

/**
 * Creates a shared transcription with share token and settings
 */
export function createSharedTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  const shareSettings: ShareSettings = {
    isPublic: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    contentOptions: {
      includeTranscript: true,
      includeSummary: true,
      includeCommunicationStyles: false,
      includeActionItems: true,
      includeSpeakerInfo: true,
      includeOnDemandAnalyses: false,
    },
  };

  return createTestTranscription({
    shareToken: 'share-token-123',
    shareSettings,
    sharedAt: new Date(),
    ...overrides,
  });
}

/**
 * Creates a soft-deleted transcription
 */
export function createDeletedTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    deletedAt: new Date(),
    ...overrides,
  });
}

/**
 * Creates a transcription in a folder
 */
export function createTranscriptionInFolder(
  folderId: string,
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    folderId,
    ...overrides,
  });
}

/**
 * Creates a large transcription (for testing chunking)
 */
export function createLargeTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    fileSize: 100 * 1024 * 1024, // 100MB
    duration: 7200, // 2 hours
    ...overrides,
  });
}

/**
 * Creates an old transcription (for cleanup testing)
 */
export function createOldTranscription(
  daysOld: number,
  overrides: Partial<Transcription> = {},
): Transcription {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - daysOld);

  return createTestTranscription({
    createdAt: oldDate,
    updatedAt: oldDate,
    completedAt: oldDate,
    ...overrides,
  });
}

/**
 * Creates a zombie transcription (stuck in processing)
 */
export function createZombieTranscription(
  hoursOld = 25,
  overrides: Partial<Transcription> = {},
): Transcription {
  const oldDate = new Date();
  oldDate.setHours(oldDate.getHours() - hoursOld);

  return createTestTranscription({
    status: TranscriptionStatus.PROCESSING,
    createdAt: oldDate,
    updatedAt: oldDate,
    transcriptText: undefined,
    completedAt: undefined,
    ...overrides,
  });
}

/**
 * Creates a transcription with vector indexing metadata
 */
export function createIndexedTranscription(
  chunkCount = 10,
  overrides: Partial<Transcription> = {},
): Transcription {
  return createTestTranscription({
    vectorIndexedAt: new Date(),
    vectorChunkCount: chunkCount,
    vectorIndexVersion: 1,
    ...overrides,
  });
}
