import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FolderRepository } from '../firebase/repositories/folder.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { VectorService } from '../vector/vector.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import {
  createMockFolderRepository,
  createMockTranscriptionRepository,
} from '../../test/mocks';
import { createTestTranscription } from '../../test/factories';

describe('FolderController', () => {
  let controller: FolderController;
  let mockFolderRepository: ReturnType<typeof createMockFolderRepository>;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;
  let mockVectorService: any;

  const mockRequest = (uid: string = 'user-123') => ({
    user: { uid },
  });

  beforeEach(async () => {
    mockFolderRepository = createMockFolderRepository();
    mockTranscriptionRepository = createMockTranscriptionRepository();
    mockVectorService = {
      isAvailable: jest.fn().mockReturnValue(true),
      askFolder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [
        { provide: FolderRepository, useValue: mockFolderRepository },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        { provide: VectorService, useValue: mockVectorService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FolderController>(FolderController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create a folder', async () => {
      const folder = { id: 'folder-123', name: 'Work', color: '#FF0000' };
      mockFolderRepository.createFolder.mockResolvedValue('folder-123');
      mockFolderRepository.getFolder.mockResolvedValue(folder);

      const result = await controller.createFolder(mockRequest() as any, {
        name: 'Work',
        color: '#FF0000',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(folder);
      expect(mockFolderRepository.createFolder).toHaveBeenCalledWith(
        'user-123',
        {
          name: 'Work',
          color: '#FF0000',
        },
      );
    });

    it('should trim folder name', async () => {
      mockFolderRepository.createFolder.mockResolvedValue('folder-123');
      mockFolderRepository.getFolder.mockResolvedValue({
        id: 'folder-123',
        name: 'Work',
      });

      await controller.createFolder(mockRequest() as any, { name: '  Work  ' });

      expect(mockFolderRepository.createFolder).toHaveBeenCalledWith(
        'user-123',
        {
          name: 'Work',
          color: undefined,
        },
      );
    });

    it('should throw when name is empty', async () => {
      await expect(
        controller.createFolder(mockRequest() as any, { name: '   ' }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw when name is missing', async () => {
      await expect(
        controller.createFolder(mockRequest() as any, { name: '' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getFolders', () => {
    it('should return user folders', async () => {
      const folders = [
        { id: 'folder-1', name: 'Work' },
        { id: 'folder-2', name: 'Personal' },
      ];
      mockFolderRepository.getUserFolders.mockResolvedValue(folders);

      const result = await controller.getFolders(mockRequest() as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(folders);
      expect(mockFolderRepository.getUserFolders).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('getFolder', () => {
    it('should return folder by id', async () => {
      const folder = { id: 'folder-123', name: 'Work' };
      mockFolderRepository.getFolder.mockResolvedValue(folder);

      const result = await controller.getFolder(
        mockRequest() as any,
        'folder-123',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(folder);
    });

    it('should throw when folder not found', async () => {
      mockFolderRepository.getFolder.mockResolvedValue(null);

      await expect(
        controller.getFolder(mockRequest() as any, 'nonexistent'),
      ).rejects.toThrow(
        new HttpException('Folder not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getFolderTranscriptions', () => {
    it('should return transcriptions in folder', async () => {
      const folder = { id: 'folder-123', name: 'Work' };
      const transcriptions = [
        createTestTranscription({ id: 'trans-1' }),
        createTestTranscription({ id: 'trans-2' }),
      ];
      mockFolderRepository.getFolder.mockResolvedValue(folder);
      mockTranscriptionRepository.getTranscriptionsByFolder.mockResolvedValue(
        transcriptions,
      );

      const result = await controller.getFolderTranscriptions(
        mockRequest() as any,
        'folder-123',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(transcriptions);
    });

    it('should throw when folder not found', async () => {
      mockFolderRepository.getFolder.mockResolvedValue(null);

      await expect(
        controller.getFolderTranscriptions(mockRequest() as any, 'nonexistent'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateFolder', () => {
    it('should update folder', async () => {
      const updatedFolder = {
        id: 'folder-123',
        name: 'Updated Work',
        color: '#00FF00',
      };
      mockFolderRepository.updateFolder.mockResolvedValue(undefined);
      mockFolderRepository.getFolder.mockResolvedValue(updatedFolder);

      const result = await controller.updateFolder(
        mockRequest() as any,
        'folder-123',
        { name: 'Updated Work', color: '#00FF00' },
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedFolder);
    });

    it('should throw when name is empty string', async () => {
      await expect(
        controller.updateFolder(mockRequest() as any, 'folder-123', {
          name: '   ',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw when folder not found', async () => {
      mockFolderRepository.updateFolder.mockRejectedValue(
        new Error('Folder not found or access denied'),
      );

      await expect(
        controller.updateFolder(mockRequest() as any, 'nonexistent', {
          name: 'Test',
        }),
      ).rejects.toThrow(
        new HttpException('Folder not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should rethrow other errors', async () => {
      mockFolderRepository.updateFolder.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.updateFolder(mockRequest() as any, 'folder-123', {
          name: 'Test',
        }),
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder and move contents', async () => {
      mockFolderRepository.deleteFolder.mockResolvedValue({
        deletedConversations: 0,
      });

      const result = await controller.deleteFolder(
        mockRequest() as any,
        'folder-123',
      );

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('moved to unfiled');
      expect(mockFolderRepository.deleteFolder).toHaveBeenCalledWith(
        'user-123',
        'folder-123',
        false,
      );
    });

    it('should delete folder with contents when confirmed', async () => {
      mockFolderRepository.deleteFolder.mockResolvedValue({
        deletedConversations: 5,
      });

      const result = await controller.deleteFolder(
        mockRequest() as any,
        'folder-123',
        'true',
        'true',
      );

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('5 conversations deleted');
      expect(result.data.deletedConversations).toBe(5);
      expect(mockFolderRepository.deleteFolder).toHaveBeenCalledWith(
        'user-123',
        'folder-123',
        true,
      );
    });

    it('should require confirmation when deleting contents', async () => {
      await expect(
        controller.deleteFolder(
          mockRequest() as any,
          'folder-123',
          'true',
          'false',
        ),
      ).rejects.toThrow(HttpException);
    });

    it('should throw when folder not found', async () => {
      mockFolderRepository.deleteFolder.mockRejectedValue(
        new Error('Folder not found or access denied'),
      );

      await expect(
        controller.deleteFolder(mockRequest() as any, 'nonexistent'),
      ).rejects.toThrow(
        new HttpException('Folder not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('askFolderQuestion', () => {
    it('should answer question about folder contents', async () => {
      const folder = { id: 'folder-123', name: 'Work' };
      const askResponse = {
        answer: 'The project is on track.',
        citations: [],
        searchScope: 'folder',
      };
      mockFolderRepository.getFolder.mockResolvedValue(folder);
      mockVectorService.askFolder.mockResolvedValue(askResponse);

      const result = await controller.askFolderQuestion(
        mockRequest() as any,
        'folder-123',
        { question: 'What is the project status?' },
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(askResponse);
      expect(mockVectorService.askFolder).toHaveBeenCalledWith(
        'user-123',
        'folder-123',
        'What is the project status?',
        undefined,
        undefined,
      );
    });

    it('should throw when folder not found', async () => {
      mockFolderRepository.getFolder.mockResolvedValue(null);

      await expect(
        controller.askFolderQuestion(mockRequest() as any, 'nonexistent', {
          question: 'Question',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw when vector service unavailable', async () => {
      mockFolderRepository.getFolder.mockResolvedValue({ id: 'folder-123' });
      mockVectorService.isAvailable.mockReturnValue(false);

      await expect(
        controller.askFolderQuestion(mockRequest() as any, 'folder-123', {
          question: 'Question',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Q&A feature is not available',
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );
    });

    it('should pass maxResults and history to vector service', async () => {
      mockFolderRepository.getFolder.mockResolvedValue({ id: 'folder-123' });
      mockVectorService.askFolder.mockResolvedValue({
        answer: 'Answer',
        citations: [],
      });

      const history = [{ question: 'Previous Q', answer: 'Previous A' }];
      await controller.askFolderQuestion(mockRequest() as any, 'folder-123', {
        question: 'New question',
        maxResults: 5,
        history,
      });

      expect(mockVectorService.askFolder).toHaveBeenCalledWith(
        'user-123',
        'folder-123',
        'New question',
        5,
        history,
      );
    });
  });
});
