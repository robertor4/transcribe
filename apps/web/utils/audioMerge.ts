/**
 * Audio Merge Utility
 * Merges multiple audio blobs using the backend FFmpeg service
 * Used for continuing recordings from recovered audio
 *
 * This sends the audio files to the backend where FFmpeg handles the merge,
 * which is much faster and more reliable than client-side Web Audio API processing.
 */

import { getApiUrl } from '@/lib/config';
import { auth } from '@/lib/firebase';

export interface MergeAudioResult {
  blob: Blob;
  duration: number;
}

/**
 * Merge recovered chunks (old recording) with new chunks (current recording)
 * into a single properly-encoded audio file using the backend FFmpeg service
 */
/**
 * Refresh a Blob by converting to ArrayBuffer and back.
 * This fixes iOS Safari's stale Blob reference issue where Blobs
 * retrieved from IndexedDB become empty after some time.
 */
async function refreshBlob(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  return new Blob([buffer], { type: blob.type });
}

/**
 * Refresh an array of Blobs
 */
async function refreshBlobs(blobs: Blob[]): Promise<Blob[]> {
  return Promise.all(blobs.map(refreshBlob));
}

export async function mergeRecoveredWithNew(
  recoveredChunks: Blob[],
  newChunks: Blob[],
  mimeType: string
): Promise<MergeAudioResult> {
  const recoveredTotalSize = recoveredChunks.reduce((s, c) => s + c.size, 0);
  const newTotalSize = newChunks.reduce((s, c) => s + c.size, 0);

  console.log(`[audioMerge] mergeRecoveredWithNew called:`);
  console.log(`  - recoveredChunks: ${recoveredChunks.length} chunks, total size: ${recoveredTotalSize} bytes`);
  console.log(`  - newChunks: ${newChunks.length} chunks, total size: ${newTotalSize} bytes`);
  console.log(`  - mimeType: ${mimeType}`);

  // Refresh blobs to fix iOS Safari stale reference issue
  // On iOS Safari, Blobs from IndexedDB can become empty after being stored in React state
  console.log(`[audioMerge] Refreshing blobs to fix potential stale references...`);
  const refreshedRecoveredChunks = await refreshBlobs(recoveredChunks);
  const refreshedNewChunks = await refreshBlobs(newChunks);

  const refreshedRecoveredSize = refreshedRecoveredChunks.reduce((s, c) => s + c.size, 0);
  const refreshedNewSize = refreshedNewChunks.reduce((s, c) => s + c.size, 0);
  console.log(`  - After refresh: recovered=${refreshedRecoveredSize} bytes, new=${refreshedNewSize} bytes`);

  // Create blobs from refreshed chunks
  const recoveredBlob = new Blob(refreshedRecoveredChunks, { type: mimeType });
  const newBlob = new Blob(refreshedNewChunks, { type: mimeType });

  console.log(`  - recoveredBlob: ${recoveredBlob.size} bytes, type: ${recoveredBlob.type}`);
  console.log(`  - newBlob: ${newBlob.size} bytes, type: ${newBlob.type}`);

  // Validate that both blobs have data
  if (recoveredBlob.size === 0) {
    throw new Error(
      `Recovered recording is empty (0 bytes). ` +
        `This may indicate an issue with IndexedDB storage on this device. ` +
        `Chunks: ${recoveredChunks.length}, individual sizes: [${recoveredChunks.map((c) => c.size).join(', ')}]`
    );
  }
  if (newBlob.size === 0) {
    throw new Error(
      `New recording is empty (0 bytes). ` +
        `Chunks: ${newChunks.length}, individual sizes: [${newChunks.map((c) => c.size).join(', ')}]`
    );
  }

  // Get auth token
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to merge audio');
  }
  const token = await user.getIdToken();

  // Create FormData with both blobs
  const formData = new FormData();

  // Add files in order - recovered first, then new
  const ext = getExtensionFromMimeType(mimeType);
  formData.append('files', recoveredBlob, `recovered.${ext}`);
  formData.append('files', newBlob, `new.${ext}`);

  console.log(`[audioMerge] Sending merge request to backend...`);
  const startTime = Date.now();

  // Send to backend for merging
  const response = await fetch(`${getApiUrl()}/transcriptions/merge-audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[audioMerge] Backend merge failed:`, errorText);
    throw new Error(`Failed to merge audio: ${errorText}`);
  }

  const result = await response.json();
  const elapsedMs = Date.now() - startTime;

  console.log(`[audioMerge] Backend merge complete in ${elapsedMs}ms`);
  console.log(`  - duration: ${result.data.duration.toFixed(2)}s`);
  console.log(`  - size: ${result.data.size} bytes`);

  // Convert base64 back to Blob
  const binaryString = atob(result.data.base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const mergedBlob = new Blob([bytes], { type: result.data.mimeType });

  return {
    blob: mergedBlob,
    duration: result.data.duration,
  };
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };
  return mimeToExt[mimeType] || 'webm';
}
