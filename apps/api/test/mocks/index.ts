/**
 * Central export for all test mocks
 *
 * Usage:
 * import { createMockFirebaseService, createMockStripeClient } from '../../../test/mocks';
 */

// Firebase mocks
export {
  createMockDoc,
  createMockCollection,
  createMockBatch,
  createMockFirestore,
  createMockAuth,
  createMockStorageFile,
  createMockStorageBucket,
  createMockFirebaseService,
  createMockDocSnapshot,
  createMockTimestamp,
} from './firebase.mock';

export type {
  MockDoc,
  MockCollection,
  MockBatch,
  MockFirestore,
  MockDocSnapshot,
} from './firebase.mock';

// Stripe mocks
export {
  createMockStripeCustomer,
  createMockStripeSubscription,
  createMockStripeCheckoutSession,
  createMockStripeInvoice,
  createMockStripeEvent,
  createMockStripeClient,
  createPaygCheckoutMetadata,
  createSubscriptionCheckoutMetadata,
} from './stripe.mock';

// Repository mocks
export {
  createMockUserRepository,
  createMockTranscriptionRepository,
  createMockAnalysisRepository,
  createMockCommentRepository,
  createMockFolderRepository,
  createMockTranslationRepository,
  createMockStorageService,
} from './repositories.mock';
