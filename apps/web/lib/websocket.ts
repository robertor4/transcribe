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
  private maxReconnectAttempts = 5; // Increased from 3 to handle flaky mobile connections
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private connectionHealthy = false;
  private lastEventTime: Map<string, number> = new Map(); // Track last event time per transcription
  private subscribedTranscriptions: Set<string> = new Set(); // Track subscribed transcription IDs
  private pendingResubscriptions: Set<string> = new Set(); // Track subscriptions to restore after reconnect

  async connect() {
    if (this.socket?.connected) return;

    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Use cached token - Firebase handles expiry automatically
    const token = await user.getIdToken();
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

      // Restore any pending subscriptions after reconnect
      if (this.pendingResubscriptions.size > 0) {
        console.log('[WebSocket] Restoring subscriptions after reconnect:', Array.from(this.pendingResubscriptions));
        this.pendingResubscriptions.forEach(transcriptionId => {
          this.socket?.emit(WEBSOCKET_EVENTS.SUBSCRIBE_TRANSCRIPTION, transcriptionId);
          this.subscribedTranscriptions.add(transcriptionId);
        });
        this.pendingResubscriptions.clear();
      }

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
      // If token expired, try to refresh and reconnect silently
      // This commonly happens when mobile browsers are backgrounded
      if (error.code === ERROR_CODES.AUTH_TOKEN_EXPIRED) {
        console.debug('[WebSocket] Token expired, refreshing...');
        await this.handleTokenExpired();
      } else {
        // Only log as error for unexpected auth failures
        console.warn('[WebSocket] Auth error:', error.code, error.message);
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
    await this.reconnectWithFreshToken();
  }

  /**
   * Reconnect WebSocket with a fresh auth token.
   * Called proactively by AuthContext before token expires,
   * or reactively when token expiration is detected.
   */
  async reconnectWithFreshToken(): Promise<void> {
    if (this.isReconnecting) {
      console.debug('[WebSocket] Already reconnecting, skipping duplicate request');
      return;
    }

    this.isReconnecting = true;
    console.log('[WebSocket] Reconnecting with fresh token...');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Force refresh the token
      await user.getIdToken(true);

      // Save current subscriptions to restore after reconnect
      this.pendingResubscriptions = new Set(this.subscribedTranscriptions);

      // Disconnect old socket (but don't clear subscriptions - we'll restore them)
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.socket?.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
      this.connectionHealthy = false;
      // Don't clear subscribedTranscriptions - pendingResubscriptions has them

      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reconnect with fresh token
      await this.connect();

      console.log('[WebSocket] Successfully reconnected with fresh token');
    } catch (error) {
      console.error('[WebSocket] Failed to refresh token and reconnect:', error);
      // Don't show error notification for proactive refreshes - the connection may still work
      // Only show if this was triggered by an actual token expiration error
      this.isReconnecting = false;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      // Emit a softer event instead of showing error notification immediately
      // This allows the UI to handle it gracefully (e.g., show reconnecting state)
      this.emit('connection_max_retries', {
        attempts: this.reconnectAttempts,
        message: 'Connection issues. Will keep trying in background.',
      });
      // Don't give up completely - reset and try again after a longer delay
      this.reconnectAttempts = 0;
      this.reconnectTimeout = setTimeout(() => {
        this.handleReconnect();
      }, 30000); // Try again in 30 seconds
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Save subscriptions before disconnect
    if (this.subscribedTranscriptions.size > 0) {
      this.pendingResubscriptions = new Set(this.subscribedTranscriptions);
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 32s (capped)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 32000);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        // Try to refresh token before reconnecting (may have expired while disconnected)
        const user = auth.currentUser;
        if (user) {
          try {
            await user.getIdToken(true);
          } catch {
            // Token refresh failed, but still try to connect with cached token
            console.debug('[WebSocket] Token refresh failed, trying with cached token');
          }
        }
        await this.connect();
      } catch (error) {
        console.error('[WebSocket] Reconnection failed:', error);
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