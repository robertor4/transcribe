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
 * @param options - Optional configuration for mixing
 * @returns Object containing the mixed stream and a cleanup function
 */
export async function mixAudioStreams(
  streams: MediaStream[],
  options?: {
    /** Gain multipliers for each stream (default: 1.0 for all) */
    gains?: number[];
  }
): Promise<AudioMixerResult> {
  // Get AudioContext with webkit fallback for older browsers
  const AudioContextClass =
    window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  console.log('[audioMixer] AudioContext created, state:', audioContext.state, 'sampleRate:', audioContext.sampleRate);

  // Create a destination node to capture mixed output
  const destination = audioContext.createMediaStreamDestination();

  // Track all nodes for cleanup
  const sourceNodes: MediaStreamAudioSourceNode[] = [];
  const gainNodes: GainNode[] = [];

  // Connect each stream to the destination through a gain node
  streams.forEach((stream, index) => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const track = audioTracks[0];
      console.log(`[audioMixer] Stream ${index}: label="${track.label}", enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);

      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();

      // Apply gain (default 1.0, but can boost microphone if needed)
      const gain = options?.gains?.[index] ?? 1.0;
      gainNode.gain.value = gain;
      console.log(`[audioMixer] Stream ${index} gain set to ${gain}`);

      // Connect: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(destination);

      sourceNodes.push(source);
      gainNodes.push(gainNode);
    } else {
      console.warn(`[audioMixer] Stream ${index} has no audio tracks`);
    }
  });

  console.log(`[audioMixer] Mixed ${sourceNodes.length} streams into destination`);

  const cleanup = () => {
    // Disconnect all nodes
    sourceNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Node may already be disconnected
      }
    });
    gainNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Node may already be disconnected
      }
    });

    // Close the audio context
    audioContext.close().catch((err) => {
      console.warn('[audioMixer] Failed to close AudioContext:', err);
    });
  };

  return {
    mixedStream: destination.stream,
    cleanup,
  };
}
