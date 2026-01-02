import { Test, TestingModule } from '@nestjs/testing';
import { CommentRepository } from './comment.repository';
import { FirebaseService } from '../firebase.service';

describe('CommentRepository', () => {
  let repository: CommentRepository;
  let mockFirebaseService: any;
  let mockDb: any;
  let mockTranscriptionDoc: any;
  let mockCommentsCollection: any;
  let mockCommentDoc: any;

  const mockCommentData = {
    transcriptionId: 'trans123',
    userId: 'user123',
    position: { section: 'summary', paragraphIndex: 0 },
    content: 'This is a test comment',
    resolved: false,
    createdAt: { toDate: () => new Date('2024-01-15') },
    updatedAt: { toDate: () => new Date('2024-01-15') },
  };

  beforeEach(async () => {
    mockCommentDoc = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockCommentData,
        id: 'comment123',
      }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockCommentsCollection = {
      doc: jest.fn().mockReturnValue(mockCommentDoc),
      add: jest.fn().mockResolvedValue({ id: 'newComment123' }),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'comment123',
            data: () => mockCommentData,
          },
        ],
      }),
    };

    mockTranscriptionDoc = {
      collection: jest.fn().mockReturnValue(mockCommentsCollection),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue(mockTranscriptionDoc),
      }),
    };

    mockFirebaseService = {
      firestore: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentRepository,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    repository = module.get<CommentRepository>(CommentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addSummaryComment', () => {
    it('should add comment and return ID', async () => {
      const comment = {
        transcriptionId: 'trans123',
        userId: 'user123',
        position: { section: 'summary' },
        content: 'New comment',
      };

      const result = await repository.addSummaryComment('trans123', comment);

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockTranscriptionDoc.collection).toHaveBeenCalledWith('comments');
      expect(mockCommentsCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          transcriptionId: 'trans123',
          userId: 'user123',
          content: 'New comment',
        }),
      );
      expect(result).toBe('newComment123');
    });
  });

  describe('getSummaryComments', () => {
    it('should return all comments for a transcription ordered by createdAt', async () => {
      const result = await repository.getSummaryComments('trans123');

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockTranscriptionDoc.collection).toHaveBeenCalledWith('comments');
      expect(mockCommentsCollection.orderBy).toHaveBeenCalledWith(
        'createdAt',
        'asc',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment123');
      expect(result[0].content).toBe('This is a test comment');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array when no comments exist', async () => {
      mockCommentsCollection.get.mockResolvedValue({ docs: [] });

      const result = await repository.getSummaryComments('trans123');

      expect(result).toEqual([]);
    });
  });

  describe('getSummaryComment', () => {
    it('should return comment by ID', async () => {
      const result = await repository.getSummaryComment(
        'trans123',
        'comment123',
      );

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockCommentsCollection.doc).toHaveBeenCalledWith('comment123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('comment123');
      expect(result?.content).toBe('This is a test comment');
    });

    it('should return null if comment does not exist', async () => {
      mockCommentDoc.get.mockResolvedValue({ exists: false });

      const result = await repository.getSummaryComment(
        'trans123',
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateSummaryComment', () => {
    it('should update comment document', async () => {
      await repository.updateSummaryComment('trans123', 'comment123', {
        content: 'Updated content',
        resolved: true,
      });

      expect(mockCommentDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Updated content',
          resolved: true,
        }),
      );
    });
  });

  describe('deleteSummaryComment', () => {
    it('should delete comment document', async () => {
      await repository.deleteSummaryComment('trans123', 'comment123');

      expect(mockCommentsCollection.doc).toHaveBeenCalledWith('comment123');
      expect(mockCommentDoc.delete).toHaveBeenCalled();
    });
  });
});
