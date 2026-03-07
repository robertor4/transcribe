import { io, Socket } from 'socket.io-client';
import auth from '@react-native-firebase/auth';
import { WS_URL } from './config';

// Inline event names to avoid shared package import issues in React Native
const EVENTS = {
  SUBSCRIBE_TRANSCRIPTION: 'subscribe_transcription',
  UNSUBSCRIBE_TRANSCRIPTION: 'unsubscribe_transcription',
  TRANSCRIPTION_PROGRESS: 'transcription_progress',
  TRANSCRIPTION_COMPLETED: 'transcription_completed',
  TRANSCRIPTION_FAILED: 'transcription_failed',
  AUTH_ERROR: 'auth_error',
} as const;

export interface TranscriptionProgress {
  transcriptionId: string;
  status: string;
  progress: number;
  message?: string;
  error?: string;
  stage?: 'uploading' | 'processing' | 'summarizing';
}

type Listener = (data: unknown) => void;

class MobileWebSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private subscribedIds = new Set<string>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting = false;

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const user = auth().currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      reconnectionAttempts: 3,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.isReconnecting = false;

      // Restore subscriptions after reconnect
      this.subscribedIds.forEach((id) => {
        this.socket?.emit(EVENTS.SUBSCRIBE_TRANSCRIPTION, id);
      });
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' && !this.isReconnecting) {
        this.handleReconnect();
      }
    });

    this.socket.on(EVENTS.AUTH_ERROR, async () => {
      await this.reconnectWithFreshToken();
    });

    // Forward transcription events to listeners
    const forwardEvents = [
      EVENTS.TRANSCRIPTION_PROGRESS,
      EVENTS.TRANSCRIPTION_COMPLETED,
      EVENTS.TRANSCRIPTION_FAILED,
    ];
    forwardEvents.forEach((event) => {
      this.socket?.on(event, (data: unknown) => {
        this.emit(event, data);
      });
    });
  }

  private async reconnectWithFreshToken(): Promise<void> {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    try {
      const user = auth().currentUser;
      if (!user) return;
      await user.getIdToken(true);

      this.socket?.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;

      await new Promise((r) => setTimeout(r, 500));
      await this.connect();
    } catch {
      this.isReconnecting = false;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.reconnectAttempts = 0;
      this.reconnectTimeout = setTimeout(() => this.handleReconnect(), 30000);
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 32000);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        this.handleReconnect();
      }
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.socket?.disconnect();
    this.socket = null;
    this.subscribedIds.clear();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  subscribe(transcriptionId: string): void {
    if (this.subscribedIds.has(transcriptionId)) return;
    this.socket?.emit(EVENTS.SUBSCRIBE_TRANSCRIPTION, transcriptionId);
    this.subscribedIds.add(transcriptionId);
  }

  unsubscribe(transcriptionId: string): void {
    this.socket?.emit(EVENTS.UNSUBSCRIBE_TRANSCRIPTION, transcriptionId);
    this.subscribedIds.delete(transcriptionId);
  }

  on(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

export const wsService = new MobileWebSocketService();

export { EVENTS as WS_EVENTS };
