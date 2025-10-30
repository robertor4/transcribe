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
  private connectionHealthy = false;
  private lastEventTime: Map<string, number> = new Map(); // Track last event time per transcription
  private subscribedTranscriptions: Set<string> = new Set(); // Track subscribed transcription IDs

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
      this.connectionHealthy = true;

      // Emit connection health change event
      this.emit('connection_health_changed', { healthy: true, connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connectionHealthy = false;

      // Emit connection health change event
      this.emit('connection_health_changed', { healthy: false, connected: false, reason });

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
    this.connectionHealthy = false;
    this.lastEventTime.clear();
    this.subscribedTranscriptions.clear();
  }

  /**
   * Check if WebSocket is currently connected and healthy
   */
  isConnected(): boolean {
    return this.socket?.connected === true && this.connectionHealthy;
  }

  /**
   * Get detailed connection state
   */
  getConnectionState() {
    return {
      connected: this.socket?.connected === true,
      healthy: this.connectionHealthy,
      reconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  /**
   * Track that we received an event for a specific transcription
   * This helps detect when a transcription has gone stale
   */
  markEventReceived(transcriptionId: string) {
    this.lastEventTime.set(transcriptionId, Date.now());
  }

  /**
   * Get the time of the last event for a transcription
   */
  getLastEventTime(transcriptionId: string): number | null {
    return this.lastEventTime.get(transcriptionId) || null;
  }

  /**
   * Clear event tracking for a transcription (when completed/failed)
   */
  clearEventTracking(transcriptionId: string) {
    this.lastEventTime.delete(transcriptionId);
  }

  subscribeToTranscription(transcriptionId: string) {
    // Avoid duplicate subscriptions
    if (this.subscribedTranscriptions.has(transcriptionId)) {
      console.log('[WebSocket] Already subscribed to transcription:', transcriptionId);
      return;
    }

    this.socket?.emit(WEBSOCKET_EVENTS.SUBSCRIBE_TRANSCRIPTION, transcriptionId);
    this.subscribedTranscriptions.add(transcriptionId);
    console.log('[WebSocket] Subscribed to transcription:', transcriptionId);
  }

  unsubscribeFromTranscription(transcriptionId: string) {
    this.socket?.emit(WEBSOCKET_EVENTS.UNSUBSCRIBE_TRANSCRIPTION, transcriptionId);
    this.subscribedTranscriptions.delete(transcriptionId);
    console.log('[WebSocket] Unsubscribed from transcription:', transcriptionId);
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