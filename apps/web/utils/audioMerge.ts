/**
 * Audio Merge Utility
 * Properly merges multiple audio blobs by decoding and re-encoding
 * Used for continuing recordings from recovered audio
 *
 * The problem: Simply concatenating WebM chunks from different MediaRecorder sessions
 * creates a malformed file (multiple headers). While HTML5 audio elements may play it,
 * the Web Audio API's decodeAudioData fails to decode beyond the first segment.
 *
 * The solution: Decode each segment to PCM, concatenate the PCM data, then re-encode
 * using MediaRecorder API to produce compressed WebM/Opus output (same as original).
 */

import fixWebmDuration from 'webm-duration-fix';

export interface MergeAudioResult {
  blob: Blob;
  duration: number;
}

/**
 * Merge multiple audio blobs into a single properly-encoded audio file
 * Uses MediaRecorder to re-encode to compressed WebM format (efficient for long recordings)
 * @param blobs - Array of audio blobs to merge (in order)
 * @param mimeType - Target MIME type (e.g., 'audio/webm;codecs=opus')
 * @returns A single merged audio blob and its duration
 */
export async function mergeAudioBlobs(
  blobs: Blob[],
  mimeType: string = 'audio/webm;codecs=opus'
): Promise<MergeAudioResult> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs provided');
  }

  if (blobs.length === 1) {
    // Single blob - just return it (no merge needed)
    const audioContext = createAudioContext();
    try {
      const arrayBuffer = await blobs[0].arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return {
        blob: blobs[0],
        duration: audioBuffer.duration,
      };
    } finally {
      audioContext.close().catch(() => {});
    }
  }

  const audioContext = createAudioContext();

  try {
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Decode all blobs to AudioBuffers
    const audioBuffers: AudioBuffer[] = [];
    for (const blob of blobs) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push(audioBuffer);
      } catch (err) {
        console.warn('[audioMerge] Failed to decode blob, skipping:', err);
        // Skip invalid blobs rather than failing entirely
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error('No valid audio data could be decoded');
    }

    // Calculate total duration and sample rate
    const sampleRate = audioBuffers[0].sampleRate;
    const numberOfChannels = audioBuffers[0].numberOfChannels;
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const totalDuration = audioBuffers.reduce((sum, buf) => sum + buf.duration, 0);

    console.log(
      `[audioMerge] Merging ${audioBuffers.length} buffers, total duration: ${totalDuration.toFixed(2)}s`
    );

    // Create merged audio buffer
    const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

    // Copy data from each buffer
    let offset = 0;
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const destChannel = mergedBuffer.getChannelData(channel);
        const srcChannel = buffer.getChannelData(
          Math.min(channel, buffer.numberOfChannels - 1)
        );
        destChannel.set(srcChannel, offset);
      }
      offset += buffer.length;
    }

    // Re-encode to compressed WebM using MediaRecorder
    const webmBlob = await encodeToWebM(mergedBuffer, audioContext, mimeType);

    return {
      blob: webmBlob,
      duration: totalDuration,
    };
  } finally {
    audioContext.close().catch(() => {});
  }
}

/**
 * Merge recovered chunks (old recording) with new chunks (current recording)
 * into a single properly-encoded audio file
 */
export async function mergeRecoveredWithNew(
  recoveredChunks: Blob[],
  newChunks: Blob[],
  mimeType: string
): Promise<MergeAudioResult> {
  // Create blobs from chunks
  const recoveredBlob = new Blob(recoveredChunks, { type: mimeType });
  const newBlob = new Blob(newChunks, { type: mimeType });

  return mergeAudioBlobs([recoveredBlob, newBlob], mimeType);
}

/**
 * Create an AudioContext with webkit fallback
 */
function createAudioContext(): AudioContext {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio API not supported');
  }

  return new AudioContextClass();
}

/**
 * Encode an AudioBuffer to compressed WebM format using MediaRecorder
 * This produces the same efficient output as a live recording (~10KB/sec for speech)
 */
async function encodeToWebM(
  audioBuffer: AudioBuffer,
  _audioContext: AudioContext, // Passed for potential future use, currently unused
  mimeType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create an offline context to render the audio
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create a buffer source and connect it
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start(0);

      // Render the audio
      offlineContext.startRendering().then(async (renderedBuffer) => {
        // Create a new online AudioContext to create a MediaStream
        const streamContext = createAudioContext();

        try {
          // Create a MediaStreamDestination
          const destination = streamContext.createMediaStreamDestination();

          // Create a buffer source in the stream context
          const streamSource = streamContext.createBufferSource();
          streamSource.buffer = renderedBuffer;
          streamSource.connect(destination);

          // Set up MediaRecorder to capture the stream
          const chunks: Blob[] = [];
          const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: MediaRecorder.isTypeSupported(mimeType)
              ? mimeType
              : 'audio/webm;codecs=opus',
          });

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            streamContext.close().catch(() => {});

            const rawBlob = new Blob(chunks, { type: mediaRecorder.mimeType });

            // Fix WebM duration metadata
            try {
              const fixedBlob = await fixWebmDuration(rawBlob);
              resolve(
                fixedBlob.type === mediaRecorder.mimeType
                  ? fixedBlob
                  : new Blob([fixedBlob], { type: mediaRecorder.mimeType })
              );
            } catch {
              resolve(rawBlob);
            }
          };

          mediaRecorder.onerror = () => {
            streamContext.close().catch(() => {});
            reject(new Error('MediaRecorder error during encoding'));
          };

          // Start recording and play the audio
          mediaRecorder.start();
          streamSource.start(0);

          // Stop recording when the audio finishes
          streamSource.onended = () => {
            // Small delay to ensure all data is captured
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 100);
          };
        } catch (err) {
          streamContext.close().catch(() => {});
          reject(err);
        }
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}
