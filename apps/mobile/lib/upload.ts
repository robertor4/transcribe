import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import api from './api';
import type { RecordingResult } from './useRecorder';

export interface UploadOptions {
  context?: string;
  selectedTemplates?: string[];
  onStorageProgress?: (progress: number) => void;
}

export interface UploadResult {
  jobId: string;
  transcriptionId: string;
}

/**
 * Upload a recording to Firebase Storage then notify the API to process it.
 *
 * Flow:
 * 1. putFile() → Firebase Storage at uploads/{userId}/{fileName}
 * 2. POST /transcriptions/process-from-storage → creates queue job
 * 3. Returns jobId + transcriptionId for WebSocket progress tracking
 */
export async function uploadRecording(
  recording: RecordingResult,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  const storagePath = `uploads/${user.uid}/${recording.fileName}`;
  const storageRef = storage().ref(storagePath);

  // 1. Upload file to Firebase Storage
  const task = storageRef.putFile(recording.uri, {
    contentType: recording.mimeType,
    customMetadata: {
      userId: user.uid,
      originalFileName: recording.fileName,
      source: 'mobile-app',
    },
  });

  // Track upload progress (0-50% of total progress)
  task.on('state_changed', (snapshot) => {
    const progress = snapshot.bytesTransferred / snapshot.totalBytes;
    options.onStorageProgress?.(progress);
  });

  const snapshot = await task;
  const fileSize = snapshot.totalBytes;

  // 2. Notify API to process the uploaded file
  const response = await api.post('/transcriptions/process-from-storage', {
    storagePath,
    fileName: recording.fileName,
    fileSize,
    contentType: recording.mimeType,
    ...(options.context && { context: options.context }),
    ...(options.selectedTemplates?.length && {
      selectedTemplates: options.selectedTemplates,
    }),
  });

  // api.ts interceptor returns response.data already
  const data = (response as unknown as { data: UploadResult }).data ?? response;

  return {
    jobId: (data as UploadResult).jobId,
    transcriptionId: (data as UploadResult).transcriptionId,
  };
}
