/**
 * Reusable Firebase mock creators for unit testing
 */

export interface MockDocSnapshot {
  exists: boolean;
  data: () => Record<string, unknown> | undefined;
  id: string;
  ref?: { update: jest.Mock; delete: jest.Mock };
}

export interface MockDoc {
  get: jest.Mock;
  set: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  collection: jest.Mock;
}

export interface MockCollection {
  doc: jest.Mock;
  add: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  get: jest.Mock;
  startAfter: jest.Mock;
}

export interface MockBatch {
  set: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  commit: jest.Mock;
}

export interface MockFirestore {
  collection: jest.Mock;
  batch: jest.Mock;
  runTransaction: jest.Mock;
}

/**
 * Creates a mock Firestore document with chainable methods
 */
export function createMockDoc(data: Record<string, unknown> = {}): MockDoc {
  const mockDoc: MockDoc = {
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => data,
      id: data.id || 'mock-doc-id',
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn(),
  };
  return mockDoc;
}

/**
 * Creates a mock Firestore collection with chainable query methods
 */
export function createMockCollection(
  docs: MockDocSnapshot[] = [],
): MockCollection {
  const mockCollection: MockCollection = {
    doc: jest.fn().mockReturnValue(createMockDoc()),
    add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      empty: docs.length === 0,
      docs: docs,
      size: docs.length,
      forEach: (cb: (doc: MockDocSnapshot) => void) => docs.forEach(cb),
    }),
  };
  return mockCollection;
}

/**
 * Creates a mock Firestore batch for atomic operations
 */
export function createMockBatch(): MockBatch {
  return {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a complete mock Firestore instance
 */
export function createMockFirestore(): MockFirestore {
  const mockBatch = createMockBatch();
  return {
    collection: jest.fn().mockReturnValue(createMockCollection()),
    batch: jest.fn().mockReturnValue(mockBatch),
    runTransaction: jest.fn().mockImplementation(async (fn) => {
      const transaction = {
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };
      return fn(transaction);
    }),
  };
}

/**
 * Creates a mock Firebase Auth instance
 */
export function createMockAuth() {
  return {
    getUser: jest.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    }),
    createUser: jest.fn().mockResolvedValue({ uid: 'new-user-123' }),
    updateUser: jest.fn().mockResolvedValue(undefined),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user-123' }),
  };
}

/**
 * Creates a mock Firebase Storage file
 */
export function createMockStorageFile() {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue([true]),
    getSignedUrl: jest
      .fn()
      .mockResolvedValue(['https://signed-url.example.com/file']),
    download: jest.fn().mockResolvedValue([Buffer.from('file content')]),
    delete: jest.fn().mockResolvedValue(undefined),
    getMetadata: jest.fn().mockResolvedValue([{ contentType: 'audio/mpeg' }]),
  };
}

/**
 * Creates a mock Firebase Storage bucket
 */
export function createMockStorageBucket() {
  const mockFile = createMockStorageFile();
  return {
    file: jest.fn().mockReturnValue(mockFile),
    getFiles: jest.fn().mockResolvedValue([[mockFile]]),
    upload: jest.fn().mockResolvedValue([mockFile]),
  };
}

/**
 * Creates a complete mock FirebaseService
 */
export function createMockFirebaseService(
  overrides: Record<string, unknown> = {},
) {
  return {
    firestore: createMockFirestore(),
    auth: createMockAuth(),
    bucket: createMockStorageBucket(),
    downloadFile: jest.fn().mockResolvedValue(Buffer.from('file content')),
    getPublicUrl: jest
      .fn()
      .mockResolvedValue('https://storage.example.com/file'),
    // Top-level methods used by guards and services
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@example.com',
      email_verified: true,
    }),
    getUser: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

/**
 * Helper to create a mock document snapshot
 */
export function createMockDocSnapshot(
  id: string,
  data: Record<string, unknown>,
  exists = true,
): MockDocSnapshot {
  return {
    exists,
    data: () => (exists ? data : undefined),
    id,
    ref: {
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    },
  };
}

/**
 * Helper to mock Firestore timestamp fields
 */
export function createMockTimestamp(date: Date = new Date()) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  };
}
