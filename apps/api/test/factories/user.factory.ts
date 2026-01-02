/**
 * Test data factories for User entities
 */
import { User, UserRole } from '@transcribe/shared';

/**
 * Creates a test user with default values
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    role: UserRole.USER,
    subscriptionTier: 'free',
    usageThisMonth: {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: now,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a professional tier user with Stripe subscription
 */
export function createProfessionalUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return createTestUser({
    subscriptionTier: 'professional',
    stripeCustomerId: 'cus_professional123',
    stripeSubscriptionId: 'sub_professional123',
    subscriptionStatus: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: thirtyDaysFromNow,
    usageThisMonth: {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: now,
    },
    ...overrides,
  });
}

/**
 * Creates an admin user
 */
export function createAdminUser(overrides: Partial<User> = {}): User {
  return createTestUser({
    uid: 'admin-user-123',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: UserRole.ADMIN,
    ...overrides,
  });
}

/**
 * Creates a user who has used some of their quota
 */
export function createUserWithUsage(
  hours: number,
  transcriptions: number,
  overrides: Partial<User> = {},
): User {
  const now = new Date();
  return createTestUser({
    usageThisMonth: {
      hours,
      transcriptions,
      onDemandAnalyses: 0,
      lastResetAt: now,
    },
    ...overrides,
  });
}

/**
 * Creates a professional user who has exceeded their quota
 */
export function createOverQuotaProfessionalUser(
  hours = 65,
  overrides: Partial<User> = {},
): User {
  return createProfessionalUser({
    usageThisMonth: {
      hours,
      transcriptions: 100,
      onDemandAnalyses: 50,
      lastResetAt: new Date(),
    },
    ...overrides,
  });
}

/**
 * Creates a user with a cancelled subscription
 */
export function createCancelledUser(overrides: Partial<User> = {}): User {
  return createProfessionalUser({
    subscriptionStatus: 'cancelled',
    cancelAtPeriodEnd: true,
    ...overrides,
  });
}

/**
 * Creates a user with a past due subscription
 */
export function createPastDueUser(overrides: Partial<User> = {}): User {
  return createProfessionalUser({
    subscriptionStatus: 'past_due',
    ...overrides,
  });
}

/**
 * Creates a deleted (soft-deleted) user
 */
export function createDeletedUser(overrides: Partial<User> = {}): User {
  return createTestUser({
    isDeleted: true,
    deletedAt: new Date(),
    ...overrides,
  });
}
