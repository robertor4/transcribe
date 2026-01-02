import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from './websocket.gateway';
import { FirebaseService } from '../firebase/firebase.service';
import { createMockFirebaseService } from '../../test/mocks';
import { TranscriptionStatus } from '@transcribe/shared';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;
  let mockFirebaseService: ReturnType<typeof createMockFirebaseService>;

  const createMockSocket = (overrides: any = {}) => ({
    id: 'socket-123',
    handshake: {
      auth: {
        token: 'valid-token',
      },
    },
    data: {},
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    ...overrides,
  });

  const createMockServer = () => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  });

  beforeEach(async () => {
    mockFirebaseService = createMockFirebaseService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketGateway,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    gateway = module.get<WebSocketGateway>(WebSocketGateway);
    gateway.server = createMockServer() as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate client with valid token', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValue({
        uid: 'user-123',
      });
      const client = createMockSocket();

      await gateway.handleConnection(client);

      expect(mockFirebaseService.verifyIdToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(client.data.userId).toBe('user-123');
      expect(client.emit).toHaveBeenCalledWith('connected', {
        userId: 'user-123',
      });
    });

    it('should disconnect client without token', async () => {
      jest.useFakeTimers();
      const client = createMockSocket({
        handshake: { auth: {} },
      });

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith(
        'auth_error',
        expect.objectContaining({
          message: 'Authentication token is required',
        }),
      );

      jest.advanceTimersByTime(100);
      expect(client.disconnect).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should disconnect client with invalid token', async () => {
      jest.useFakeTimers();
      mockFirebaseService.verifyIdToken.mockRejectedValue(
        new Error('Invalid token'),
      );
      const client = createMockSocket();

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith(
        'auth_error',
        expect.objectContaining({
          message: 'Authentication failed',
        }),
      );

      jest.advanceTimersByTime(100);
      expect(client.disconnect).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should handle expired token error', async () => {
      jest.useFakeTimers();
      const expiredError = {
        errorInfo: {
          code: 'auth/id-token-expired',
          message: 'Token expired',
        },
      };
      mockFirebaseService.verifyIdToken.mockRejectedValue(expiredError);
      const client = createMockSocket();

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith(
        'auth_error',
        expect.objectContaining({
          code: 'AUTH_TOKEN_EXPIRED',
          message: expect.stringContaining('expired'),
        }),
      );
      jest.useRealTimers();
    });

    it('should track multiple sockets for same user', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValue({
        uid: 'user-123',
      });

      const client1 = createMockSocket({ id: 'socket-1' });
      const client2 = createMockSocket({ id: 'socket-2' });

      await gateway.handleConnection(client1);
      await gateway.handleConnection(client2);

      // Both should be tracked
      const userSockets = (gateway as any).userSockets.get('user-123');
      expect(userSockets.size).toBe(2);
      expect(userSockets.has('socket-1')).toBe(true);
      expect(userSockets.has('socket-2')).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from user tracking', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValue({
        uid: 'user-123',
      });
      const client = createMockSocket();

      await gateway.handleConnection(client);
      gateway.handleDisconnect(client);

      const userSockets = (gateway as any).userSockets.get('user-123');
      expect(userSockets).toBeUndefined();
    });

    it('should keep other sockets for same user', async () => {
      mockFirebaseService.verifyIdToken.mockResolvedValue({
        uid: 'user-123',
      });

      const client1 = createMockSocket({ id: 'socket-1' });
      const client2 = createMockSocket({ id: 'socket-2' });

      await gateway.handleConnection(client1);
      await gateway.handleConnection(client2);

      // Simulate client1 storing userId for disconnect
      client1.data.userId = 'user-123';
      gateway.handleDisconnect(client1);

      const userSockets = (gateway as any).userSockets.get('user-123');
      expect(userSockets.size).toBe(1);
      expect(userSockets.has('socket-2')).toBe(true);
    });

    it('should handle disconnect without userId', () => {
      const client = createMockSocket();
      client.data = {};

      // Should not throw
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleSubscribeTranscription', () => {
    it('should join transcription room', () => {
      const client = createMockSocket();

      gateway.handleSubscribeTranscription('trans-123', client);

      expect(client.join).toHaveBeenCalledWith('transcription:trans-123');
    });
  });

  describe('handleUnsubscribeTranscription', () => {
    it('should leave transcription room', () => {
      const client = createMockSocket();

      gateway.handleUnsubscribeTranscription('trans-123', client);

      expect(client.leave).toHaveBeenCalledWith('transcription:trans-123');
    });
  });

  describe('handleSubscribeComments', () => {
    it('should join comments room', () => {
      const client = createMockSocket();

      gateway.handleSubscribeComments('trans-123', client);

      expect(client.join).toHaveBeenCalledWith('comments:trans-123');
    });
  });

  describe('handleUnsubscribeComments', () => {
    it('should leave comments room', () => {
      const client = createMockSocket();

      gateway.handleUnsubscribeComments('trans-123', client);

      expect(client.leave).toHaveBeenCalledWith('comments:trans-123');
    });
  });

  describe('sendTranscriptionProgress', () => {
    it('should emit progress to room', () => {
      const progress = {
        transcriptionId: 'trans-123',
        status: TranscriptionStatus.PROCESSING,
        progress: 50,
        message: 'Processing...',
      };

      gateway.sendTranscriptionProgress('user-123', progress);

      // Should emit to transcription room
      expect(gateway.server.to).toHaveBeenCalledWith('transcription:trans-123');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'transcription_progress',
        progress,
      );
    });

    it('should not throw if user has no sockets', () => {
      const progress = {
        transcriptionId: 'trans-123',
        status: TranscriptionStatus.PROCESSING,
        progress: 50,
        message: 'Processing...',
      };

      expect(() =>
        gateway.sendTranscriptionProgress('unknown-user', progress),
      ).not.toThrow();
    });
  });

  describe('sendTranscriptionComplete', () => {
    it('should emit completion to room', () => {
      const completion = {
        transcriptionId: 'trans-123',
        status: TranscriptionStatus.COMPLETED,
        progress: 100,
        message: 'Complete!',
      };

      gateway.sendTranscriptionComplete('user-123', completion);

      expect(gateway.server.to).toHaveBeenCalledWith('transcription:trans-123');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'transcription_completed',
        completion,
      );
    });
  });

  describe('sendTranscriptionFailed', () => {
    it('should emit failure to room', () => {
      const failure = {
        transcriptionId: 'trans-123',
        status: TranscriptionStatus.FAILED,
        progress: 0,
        error: 'Something went wrong',
      };

      gateway.sendTranscriptionFailed('user-123', failure);

      expect(gateway.server.to).toHaveBeenCalledWith('transcription:trans-123');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'transcription_failed',
        failure,
      );
    });
  });

  describe('notifyCommentAdded', () => {
    it('should emit to comments room', () => {
      const comment = {
        id: 'comment-123',
        transcriptionId: 'trans-123',
        content: 'Great point!',
        createdAt: new Date(),
      };

      gateway.notifyCommentAdded('trans-123', comment as any);

      expect(gateway.server.to).toHaveBeenCalledWith('comments:trans-123');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'comment_added',
        comment,
      );
    });
  });
});
