import { io, Socket } from 'socket.io-client';
import { auth } from './firebase';
import { WEBSOCKET_EVENTS, ERROR_CODES } from '@transcribe/shared';
import { getWebSocketUrl } from './config';

interface AuthError {
  code: string;
  message: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  async connect() {
    if (this.socket?.connected) return;

    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Force refresh token if it's older than 55 minutes
    const token = await user.getIdToken(true);
    const socketUrl = getWebSocketUrl();

    // In production, WebSocket connects through the /api proxy
    const isProduction = typeof window !== 'undefined' &&
      (window.location.hostname === 'neuralsummary.com' ||
       window.location.hostname === 'www.neuralsummary.com');

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      path: isProduction ? '/api/socket.io/' : '/socket.io/',
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      // Auto-reconnect on unexpected disconnections
      if (reason === 'io server disconnect' && !this.isReconnecting) {
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle authentication errors
    this.socket.on(WEBSOCKET_EVENTS.AUTH_ERROR, async (error: AuthError) => {
      console.error('WebSocket auth error:', error);

      // If token expired, try to refresh and reconnect
      if (error.code === ERROR_CODES.AUTH_TOKEN_EXPIRED) {
        await this.handleTokenExpired();
      } else {
        // For other auth errors, show notification
        this.showAuthErrorNotification(error);
      }
    });

    // Forward events to listeners
    Object.values(WEBSOCKET_EVENTS).forEach(event => {
      this.socket?.on(event, (data: unknown) => {
        this.emit(event, data);
      });
    });
  }

  private async handleTokenExpired() {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    console.log('Token expired, attempting to refresh and reconnect...');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Force refresh the token
      await user.getIdToken(true);

      // Disconnect old socket
      this.disconnect();

      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reconnect with fresh token
      await this.connect();

      console.log('Successfully reconnected with fresh token');
    } catch (error) {
      console.error('Failed to refresh token and reconnect:', error);
      this.showAuthErrorNotification({
        code: ERROR_CODES.AUTH_TOKEN_EXPIRED,
        message: 'Session expired. Please refresh the page to continue.',
      });
      this.isReconnecting = false;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.showAuthErrorNotification({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Connection lost. Please refresh the page to reconnect.',
      });
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff: 2s, 4s, 8s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 8000);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleReconnect();
      }
    }, delay);
  }

  private showAuthErrorNotification(error: AuthError) {
    // Emit error to listeners so UI can show toast notification
    this.emit('auth_notification', {
      type: 'error',
      title: 'Authentication Error',
      message: error.message,
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.socket?.disconnect();
    this.socket = null;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  subscribeToTranscription(transcriptionId: string) {
    this.socket?.emit(WEBSOCKET_EVENTS.SUBSCRIBE_TRANSCRIPTION, transcriptionId);
  }

  unsubscribeFromTranscription(transcriptionId: string) {
    this.socket?.emit(WEBSOCKET_EVENTS.UNSUBSCRIBE_TRANSCRIPTION, transcriptionId);
  }

  on(event: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const websocketService = new WebSocketService();
export default websocketService;