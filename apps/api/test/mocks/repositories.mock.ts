/**
 * Reusable repository mock creators for unit testing
 */

/**
 * Creates a mock UserRepository
 */
export function createMockUserRepository(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getUser: jest.fn().mockResolvedValue(null),
    getUserById: jest.fn().mockResolvedValue(null),
    getUserByStripeCustomerId: jest.fn().mockResolvedValue(null),
    getUserByEmail: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue('user-id'),
    updateUser: jest.fn().mockResolvedValue(undefined),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    softDeleteUser: jest.fn().mockResolvedValue(undefined),
    deleteUserTranscriptions: jest.fn().mockResolvedValue(0),
    deleteUserGeneratedAnalyses: jest.fn().mockResolvedValue(0),
    getAllUsers: jest.fn().mockResolvedValue([]),
    getUsersByTier: jest.fn().mockResolvedValue([]),
    getUsersWithUsageAboveThreshold: jest.fn().mockResolvedValue([]),
    batchUpdateUsers: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Creates a mock TranscriptionRepository
 */
export function createMockTranscriptionRepository(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getTranscription: jest.fn().mockResolvedValue(null),
    getTranscriptions: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }),
    getTranscriptionsByFolder: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }),
    createTranscription: jest.fn().mockResolvedValue('transcription-id'),
    updateTranscription: jest.fn().mockResolvedValue(undefined),
    deleteTranscription: jest.fn().mockResolvedValue(undefined),
    softDeleteTranscription: jest.fn().mockResolvedValue(undefined),
    getTranscriptionByShareToken: jest.fn().mockResolvedValue(null),
    clearTranscriptionFileReferences: jest.fn().mockResolvedValue(undefined),
    getTranscriptionsForCleanup: jest.fn().mockResolvedValue([]),
    getZombieTranscriptions: jest.fn().mockResolvedValue([]),
    countUserTranscriptions: jest.fn().mockResolvedValue(0),
    searchTranscriptions: jest.fn().mockResolvedValue([]),
    deleteShareInfo: jest.fn().mockResolvedValue(undefined),
    moveToFolder: jest.fn().mockResolvedValue(undefined),
    clearRecentlyOpened: jest.fn().mockResolvedValue(0),
    recordTranscriptionAccess: jest.fn().mockResolvedValue(undefined),
    getRecentlyOpenedTranscriptions: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

/**
 * Creates a mock AnalysisRepository
 */
export function createMockAnalysisRepository(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getGeneratedAnalyses: jest.fn().mockResolvedValue([]),
    getGeneratedAnalysis: jest.fn().mockResolvedValue(null),
    getGeneratedAnalysisById: jest.fn().mockResolvedValue(null),
    createGeneratedAnalysis: jest.fn().mockResolvedValue('analysis-id'),
    updateGeneratedAnalysis: jest.fn().mockResolvedValue(undefined),
    deleteGeneratedAnalysis: jest.fn().mockResolvedValue(undefined),
    deleteAnalysesByTranscriptionId: jest.fn().mockResolvedValue(undefined),
    findExistingAnalysis: jest.fn().mockResolvedValue(null),
    addAnalysisReference: jest.fn().mockResolvedValue(undefined),
    removeAnalysisReference: jest.fn().mockResolvedValue(undefined),
    getRecentGeneratedAnalyses: jest.fn().mockResolvedValue([]),
    getRecentGeneratedAnalysesByFolder: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

/**
 * Creates a mock CommentRepository
 */
export function createMockCommentRepository(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getComments: jest.fn().mockResolvedValue([]),
    getComment: jest.fn().mockResolvedValue(null),
    getSummaryComment: jest.fn().mockResolvedValue(null),
    getSummaryComments: jest.fn().mockResolvedValue([]),
    createComment: jest.fn().mockResolvedValue('comment-id'),
    addSummaryComment: jest.fn().mockResolvedValue('comment-id'),
    updateComment: jest.fn().mockResolvedValue(undefined),
    updateSummaryComment: jest.fn().mockResolvedValue(undefined),
    deleteComment: jest.fn().mockResolvedValue(undefined),
    deleteSummaryComment: jest.fn().mockResolvedValue(undefined),
    deleteCommentsByTranscriptionId: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Creates a mock FolderRepository
 */
export function createMockFolderRepository(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getFolders: jest.fn().mockResolvedValue([]),
    getUserFolders: jest.fn().mockResolvedValue([]),
    getFolder: jest.fn().mockResolvedValue(null),
    createFolder: jest.fn().mockResolvedValue('folder-id'),
    updateFolder: jest.fn().mockResolvedValue(undefined),
    deleteFolder: jest.fn().mockResolvedValue({ deletedConversations: 0 }),
    reorderFolders: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Creates a mock TranslationRepository
 */
export function createMockTranslationRepository(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getTranslation: jest.fn().mockResolvedValue(null),
    getTranslations: jest.fn().mockResolvedValue([]),
    getTranslationsByConversation: jest.fn().mockResolvedValue([]),
    getTranslationsForLocale: jest.fn().mockResolvedValue([]),
    getTranslationsForSharedConversation: jest.fn().mockResolvedValue([]),
    createTranslation: jest.fn().mockResolvedValue('translation-id'),
    updateTranslation: jest.fn().mockResolvedValue(undefined),
    deleteTranslation: jest.fn().mockResolvedValue(undefined),
    deleteTranslationsByTranscriptionId: jest.fn().mockResolvedValue(undefined),
    deleteTranslationsForLocale: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

/**
 * Creates a mock StorageService
 */
export function createMockStorageService(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://storage.example.com/file',
      path: 'uploads/test-file',
    }),
    uploadText: jest
      .fn()
      .mockResolvedValue('https://storage.example.com/text-file'),
    downloadFile: jest.fn().mockResolvedValue(Buffer.from('file content')),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    deleteFileByPath: jest.fn().mockResolvedValue(undefined),
    deleteUserFiles: jest.fn().mockResolvedValue(0),
    getPublicUrl: jest
      .fn()
      .mockResolvedValue('https://storage.example.com/public-file'),
    getSignedUrl: jest
      .fn()
      .mockResolvedValue('https://storage.example.com/signed-url'),
    fileExists: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}
