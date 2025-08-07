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
  TranscriptionProgress 
} from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';

@WSGateway({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private firebaseService: FirebaseService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
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
      this.logger.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const userId = client.data.userId;
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
    client.join(`transcription:${transcriptionId}`);
    this.logger.log(`Client ${client.id} subscribed to transcription ${transcriptionId}`);
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.UNSUBSCRIBE_TRANSCRIPTION)
  handleUnsubscribeTranscription(
    @MessageBody() transcriptionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`transcription:${transcriptionId}`);
    this.logger.log(`Client ${client.id} unsubscribed from transcription ${transcriptionId}`);
  }

  sendTranscriptionProgress(userId: string, progress: TranscriptionProgress) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.server.to(socketId).emit(WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS, progress);
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
      userSocketIds.forEach(socketId => {
        this.server.to(socketId).emit(WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED, progress);
      });
    }
    
    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_COMPLETED, progress);
  }

  sendTranscriptionFailed(userId: string, progress: TranscriptionProgress) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.server.to(socketId).emit(WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED, progress);
      });
    }
    
    this.server
      .to(`transcription:${progress.transcriptionId}`)
      .emit(WEBSOCKET_EVENTS.TRANSCRIPTION_FAILED, progress);
  }
}