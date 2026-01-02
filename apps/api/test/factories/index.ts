/**
 * Central export for all test data factories
 *
 * Usage:
 * import { createTestUser, createTestTranscription } from '../../../test/factories';
 */

// User factories
export {
  createTestUser,
  createProfessionalUser,
  createAdminUser,
  createUserWithUsage,
  createOverQuotaProfessionalUser,
  createCancelledUser,
  createPastDueUser,
  createDeletedUser,
} from './user.factory';

// Transcription factories
export {
  createTestTranscription,
  createPendingTranscription,
  createProcessingTranscription,
  createFailedTranscription,
  createTranscriptionWithSummaryV2,
  createTranscriptionWithSpeakers,
  createSharedTranscription,
  createDeletedTranscription,
  createTranscriptionInFolder,
  createLargeTranscription,
  createOldTranscription,
  createZombieTranscription,
  createIndexedTranscription,
} from './transcription.factory';
