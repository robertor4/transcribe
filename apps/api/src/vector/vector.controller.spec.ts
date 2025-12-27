import { Test, TestingModule } from '@nestjs/testing';
import { VectorController } from './vector.controller';
import { VectorService } from './vector.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

describe('VectorController', () => {
  let controller: VectorController;
  let mockVectorService: any;

  const mockRequest = (
    uid: string = 'user-123',
    email: string = 'test@example.com',
  ) => ({
    user: { uid, email },
  });

  beforeEach(async () => {
    mockVectorService = {
      askGlobal: jest.fn(),
      findConversations: jest.fn(),
      isAvailable: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VectorController],
      providers: [{ provide: VectorService, useValue: mockVectorService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VectorController>(VectorController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('askGlobal', () => {
    it('should ask question across conversations', async () => {
      const askResponse = {
        answer: 'The project is about building a web app.',
        sources: [
          {
            conversationId: 'conv-1',
            title: 'Project Meeting',
            snippet: 'Discussing the web app...',
          },
          {
            conversationId: 'conv-2',
            title: 'Sprint Planning',
            snippet: 'Web app features...',
          },
        ],
        confidence: 0.85,
      };
      mockVectorService.askGlobal.mockResolvedValue(askResponse);

      const result = await controller.askGlobal(
        { question: 'What is the project about?' },
        mockRequest() as any,
      );

      expect(result).toEqual(askResponse);
      expect(mockVectorService.askGlobal).toHaveBeenCalledWith(
        'user-123',
        'What is the project about?',
        undefined,
      );
    });

    it('should pass maxResults parameter', async () => {
      const askResponse = {
        answer: 'Summary of results.',
        sources: [],
        confidence: 0.9,
      };
      mockVectorService.askGlobal.mockResolvedValue(askResponse);

      await controller.askGlobal(
        { question: 'Test question', maxResults: 5 },
        mockRequest() as any,
      );

      expect(mockVectorService.askGlobal).toHaveBeenCalledWith(
        'user-123',
        'Test question',
        5,
      );
    });
  });

  describe('findConversations', () => {
    it('should find conversations matching query', async () => {
      const findResponse = {
        conversations: [
          { id: 'conv-1', title: 'Meeting Notes', relevance: 0.95 },
          { id: 'conv-2', title: 'Interview', relevance: 0.8 },
        ],
        totalCount: 2,
      };
      mockVectorService.findConversations.mockResolvedValue(findResponse);

      const result = await controller.findConversations(
        { query: 'meeting notes' },
        mockRequest() as any,
      );

      expect(result).toEqual(findResponse);
      expect(mockVectorService.findConversations).toHaveBeenCalledWith(
        'user-123',
        'meeting notes',
        undefined,
        undefined,
      );
    });

    it('should pass folderId filter', async () => {
      const findResponse = {
        conversations: [],
        totalCount: 0,
      };
      mockVectorService.findConversations.mockResolvedValue(findResponse);

      await controller.findConversations(
        { query: 'project', folderId: 'folder-123' },
        mockRequest() as any,
      );

      expect(mockVectorService.findConversations).toHaveBeenCalledWith(
        'user-123',
        'project',
        'folder-123',
        undefined,
      );
    });

    it('should pass maxResults parameter', async () => {
      const findResponse = {
        conversations: [],
        totalCount: 0,
      };
      mockVectorService.findConversations.mockResolvedValue(findResponse);

      await controller.findConversations(
        { query: 'test', maxResults: 10 },
        mockRequest() as any,
      );

      expect(mockVectorService.findConversations).toHaveBeenCalledWith(
        'user-123',
        'test',
        undefined,
        10,
      );
    });
  });

  describe('health', () => {
    it('should return available true when service is ready', () => {
      mockVectorService.isAvailable.mockReturnValue(true);

      const result = controller.health();

      expect(result).toEqual({ available: true });
      expect(mockVectorService.isAvailable).toHaveBeenCalled();
    });

    it('should return available false when service is not ready', () => {
      mockVectorService.isAvailable.mockReturnValue(false);

      const result = controller.health();

      expect(result).toEqual({ available: false });
    });
  });
});
