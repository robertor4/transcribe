/**
 * Audio Mixer Utility
 * Mixes multiple MediaStreams into a single output stream using Web Audio API
 * Used for combining tab audio with microphone when recording tab audio
 */

export interface AudioMixerResult {
  /** The combined audio stream containing all input sources */
  mixedStream: MediaStream;
  /** Call this to clean up AudioContext and disconnect all nodes */
  cleanup: () => void;
}

/**
 * Mix multiple audio streams into a single output stream
 * @param streams - Array of MediaStream objects to mix together
 * @returns Object containing the mixed stream and a cleanup function
 */
export async function mixAudioStreams(
  streams: MediaStream[]
): Promise<AudioMixerResult> {
  // Get AudioContext with webkit fallback for older browsers
  const AudioContextClass =
    window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();
  console.log('[audioMixer] Created mixer AudioContext, state:', audioContext.state);

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Create a destination node to capture mixed output
  const destination = audioContext.createMediaStreamDestination();

  // Track all source nodes for cleanup
  const sourceNodes: MediaStreamAudioSourceNode[] = [];

  // Connect each stream directly to the destination (no gain nodes - simpler pipeline)
  for (const stream of streams) {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(destination);
      sourceNodes.push(source);
    }
  }

  const cleanup = () => {
    console.log('[audioMixer] cleanup called');
    // Disconnect all source nodes
    sourceNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Node may already be disconnected
      }
    });

    // Close the audio context
    console.log('[audioMixer] Closing mixer AudioContext');
    audioContext.close().catch(() => {
      // Ignore close errors
    });
  };

  return {
    mixedStream: destination.stream,
    cleanup,
  };
}
