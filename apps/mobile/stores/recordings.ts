import { create } from 'zustand';
import api from '../lib/api';
import { uploadRecording, UploadResult } from '../lib/upload';
import { wsService, WS_EVENTS, TranscriptionProgress } from '../lib/websocket';
import type { RecordingResult } from '../lib/useRecorder';

export interface Recording {
  id: string;
  fileName: string;
  title?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration?: number;
  createdAt: string;
  progress?: number;
  stage?: string;
}

interface ActiveUpload {
  fileName: string;
  storageProgress: number; // 0-1
  processingProgress: number; // 0-100
  stage: 'uploading' | 'processing' | 'summarizing';
  transcriptionId?: string;
}

interface RecordingsState {
  recordings: Recording[];
  loading: boolean;
  activeUpload: ActiveUpload | null;

  fetchRecordings: () => Promise<void>;
  startUpload: (recording: RecordingResult, context?: string) => Promise<UploadResult>;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
}

export const useRecordingsStore = create<RecordingsState>((set, get) => ({
  recordings: [],
  loading: false,
  activeUpload: null,

  fetchRecordings: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/transcriptions');
      const data = response as unknown as { data: Recording[] };
      const list: Recording[] = (data.data ?? response ?? []) as Recording[];

      set({
        recordings: list.map((t) => ({
          id: t.id,
          fileName: t.fileName,
          title: t.title,
          status: t.status,
          duration: t.duration,
          createdAt: t.createdAt,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      set({ loading: false });
    }
  },

  startUpload: async (recording, context) => {
    set({
      activeUpload: {
        fileName: recording.fileName,
        storageProgress: 0,
        processingProgress: 0,
        stage: 'uploading',
      },
    });

    try {
      const result = await uploadRecording(recording, {
        context,
        onStorageProgress: (progress) => {
          set((s) =>
            s.activeUpload
              ? { activeUpload: { ...s.activeUpload, storageProgress: progress } }
              : {},
          );
        },
      });

      // File uploaded to storage, now processing
      set((s) =>
        s.activeUpload
          ? {
              activeUpload: {
                ...s.activeUpload,
                stage: 'processing',
                storageProgress: 1,
                transcriptionId: result.transcriptionId,
              },
            }
          : {},
      );

      // Subscribe to progress updates
      wsService.subscribe(result.transcriptionId);

      return result;
    } catch (error) {
      set({ activeUpload: null });
      throw error;
    }
  },

  connectWebSocket: async () => {
    await wsService.connect();

    wsService.on(WS_EVENTS.TRANSCRIPTION_PROGRESS, (data) => {
      const progress = data as TranscriptionProgress;
      const { activeUpload, recordings } = get();

      // Update active upload progress
      if (activeUpload?.transcriptionId === progress.transcriptionId) {
        set({
          activeUpload: {
            ...activeUpload,
            processingProgress: progress.progress,
            stage: progress.stage || activeUpload.stage,
          },
        });
      }

      // Update recording in list
      set({
        recordings: recordings.map((r) =>
          r.id === progress.transcriptionId
            ? { ...r, status: progress.status as Recording['status'], progress: progress.progress }
            : r,
        ),
      });
    });

    wsService.on(WS_EVENTS.TRANSCRIPTION_COMPLETED, (data) => {
      const progress = data as TranscriptionProgress;
      const { activeUpload } = get();

      // Clear active upload if this is the one we're tracking
      if (activeUpload?.transcriptionId === progress.transcriptionId) {
        set({ activeUpload: null });
      }

      // Update recording status and refresh list
      set((s) => ({
        recordings: s.recordings.map((r) =>
          r.id === progress.transcriptionId ? { ...r, status: 'completed', progress: 100 } : r,
        ),
      }));

      wsService.unsubscribe(progress.transcriptionId);
    });

    wsService.on(WS_EVENTS.TRANSCRIPTION_FAILED, (data) => {
      const progress = data as TranscriptionProgress;
      const { activeUpload } = get();

      if (activeUpload?.transcriptionId === progress.transcriptionId) {
        set({ activeUpload: null });
      }

      set((s) => ({
        recordings: s.recordings.map((r) =>
          r.id === progress.transcriptionId ? { ...r, status: 'failed' } : r,
        ),
      }));

      wsService.unsubscribe(progress.transcriptionId);
    });
  },

  disconnectWebSocket: () => {
    wsService.disconnect();
  },
}));
