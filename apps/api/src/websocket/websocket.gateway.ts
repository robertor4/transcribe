import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  WEBSOCKET_EVENTS,
  ERROR_CODES,
  TranscriptionProgress,
  SummaryComment,
  SummaryRegenerationProgress,
} from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';

@WSGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL || 'https://neuralsummary.com',
            process.env.APP_URL || 'https://app.neuralsummary.com',
          ]
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private firebaseService: FirebaseService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        this.logger.warn(`Client ${client.id} missing auth token`);
        client.emit(WEBSOCKET_EVENTS.AUTH_ERROR, {
          code: ERROR_CODES.AUTH_TOKEN_MISSING,
          message: 'Authentication token is required',
        });
        // Give client time to receive error before disconnecting
        setTimeout(() => client.disconnect(), 100);
        return;
      }

      const decodedToken = await this.firebaseService.verifyIdToken(token);
      client.data.userId = decodedToken.uid;

      // Add to user sockets map
      if (!this.userSockets.has(decodedToken.uid)) {
        this.userSockets.set(decodedToken.uid, new Set());
      }
      this.userSockets.get(decodedToken.uid)?.add(client.id);

      client.emit('connected', { userId: decodedToken.uid });
    } catch (error) {
      // Determine error code based on Firebase error
      let errorCode: (typeof ERROR_CODES)[keyof typeof ERROR_CODES] =
        ERROR_CODES.AUTH_TOKEN_INVALID;
      let errorMessage = 'Authentication failed';

      const firebaseErrorCode = error?.errorInfo?.code || error?.code;
      const isTokenExpired = firebaseErrorCode === 'auth/id-token-expired';

      if (isTokenExpired) {
        errorCode = ERROR_CODES.AUTH_TOKEN_EXPIRED;
        errorMessage =
          'Authentication token has expired. Please refresh and try again.';
        // Token expiry is common when mobile browsers are backgrounded - log as debug
        this.logger.debug(
          `Client ${client.id} reconnected with expired token (expected on mobile resume)`,
        );
      } else {
        // Only log as error for unexpected auth failures
        const errorDetails =
          error?.errorInfo?.message || error?.message || 'Unknown error';
        this.logger.warn(
          `WebSocket auth failed for client ${client.id}: ${errorDetails}`,
        );
        if (firebaseErrorCode) {
          errorMessage = error.errorInfo?.message || errorMessage;
        }
      }

      // Send error to client before disconnecting
      client.emit(WEBSOCKET_EVENTS.AUTH_ERROR, {
        code: errorCode,
        message: errorMessage,
      });

      // Give client time to receive error before disconnecting
      setTimeout(() => client.disconnect(), 100);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = client.data?.userId as string | undefined;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.SUBSCRIBE_TRANSCRIPTION)
  handleSubscribeTranscription(
    @MessageBody() transcriptionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`transcription:${transcriptionId}`);
    this.logger.log(
      `Client ${client.id} subscribed to transcription ${transcriptionId}`,
    );
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.UNSUBSCRIBE_TRANSCRIPTION)
  handleUnsubscribeTranscription(
    @MessageBody() transcriptionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.leave(`transcription:${transcriptionId}`);
    this.logger.log(
      `Client ${client.id} unsubscribed from transcription ${transcriptionId}`,
    );
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.SUBSCRIBE_COMMENTS)
  handleSubscribeComments(
    @MessageBody() transcriptionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`comments:${transcriptionId}`);
    this.logger.log(
      `Client ${client.id} subscribed to comments for transcription ${transcriptionId}`,
    );
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.UNSUBSCRIBE_COMMENTS)
  handleUnsubscribeComments(
    @MessageBody() transcriptionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.leave(`comments:${transcriptionId}`);
    this.logger.log(
      `Client ${client.id} unsubscribed from comments for transcription ${transcriptionId}`,
    );
  }

  sendTranscriptionProgress(userId: string, progress: TranscriptionProgress) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS, progress);
      });
    }

    // Also send to room subscribers
    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS, progress);
  }

  sendTranscriptionComplete(userId: string, progress: TranscriptionProgress) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED, progress);
      });
    }

    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED, progress);
  }

  sendTranscriptionFailed(userId: string, progress: TranscriptionProgress) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED, progress);
      });
    }

    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED, progress);
  }

  // Comment notification methods
  notifyCommentAdded(transcriptionId: string, comment: SummaryComment) {
    this.server
      .to(`comments:${transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.COMMENT_ADDED, comment);
  }

  notifyCommentUpdated(transcriptionId: string, comment: SummaryComment) {
    this.server
      .to(`comments:${transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.COMMENT_UPDATED, comment);
  }

  notifyCommentDeleted(transcriptionId: string, commentId: string) {
    this.server
      .to(`comments:${transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.COMMENT_DELETED, { commentId, transcriptionId });
  }

  // Summary regeneration notification methods
  sendSummaryRegenerationProgress(
    userId: string,
    progress: SummaryRegenerationProgress,
  ) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(WEBSOCKET_EVENTS.SUMMARY_REGENERATION_PROGRESS, progress);
      });
    }

    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.SUMMARY_REGENERATION_PROGRESS, progress);
  }

  sendSummaryRegenerationComplete(
    userId: string,
    progress: SummaryRegenerationProgress,
  ) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(WEBSOCKET_EVENTS.SUMMARY_REGENERATION_COMPLETED, progress);
      });
    }

    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.SUMMARY_REGENERATION_COMPLETED, progress);
  }

  sendSummaryRegenerationFailed(
    userId: string,
    progress: SummaryRegenerationProgress,
  ) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(WEBSOCKET_EVENTS.SUMMARY_REGENERATION_FAILED, progress);
      });
    }

    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.SUMMARY_REGENERATION_FAILED, progress);
  }
}
