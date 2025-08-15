import { io, Socket } from 'socket.io-client';
import { auth } from './firebase';
import { WEBSOCKET_EVENTS, TranscriptionProgress } from '@transcribe/shared';
import { getWebSocketUrl } from './config';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async connect() {
    if (this.socket?.connected) return;

    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    const token = await user.getIdToken();
    const socketUrl = getWebSocketUrl();

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      path: '/socket.io/',
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Forward events to listeners
    Object.values(WEBSOCKET_EVENTS).forEach(event => {
      this.socket?.on(event, (data: any) => {
        this.emit(event, data);
      });
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeToTranscription(transcriptionId: string) {
    this.socket?.emit(WEBSOCKET_EVENTS.SUBSCRIBE_TRANSCRIPTION, transcriptionId);
  }

  unsubscribeFromTranscription(transcriptionId: string) {
    this.socket?.emit(WEBSOCKET_EVENTS.UNSUBSCRIBE_TRANSCRIPTION, transcriptionId);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const websocketService = new WebSocketService();
export default websocketService;