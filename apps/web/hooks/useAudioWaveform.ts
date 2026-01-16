'use client';

import { useState, useEffect, useRef } from 'react';

interface UseAudioWaveformResult {
  waveformBars: number[];
  isAnalyzing: boolean;
  error: string | null;
}

// Shared AudioContext instance - created once and reused
let sharedAudioContext: AudioContext | null = null;

// Threshold for switching to sparse sampling (10MB)
// Files larger than this will be sampled sparsely to avoid memory exhaustion
const SPARSE_SAMPLING_THRESHOLD = 10 * 1024 * 1024;

// Number of sparse samples to take from large files
const SPARSE_SAMPLE_COUNT = 20;

// Size of each sparse sample chunk (500KB)
// This is small enough to decode quickly but large enough to get meaningful audio data
const SPARSE_SAMPLE_SIZE = 500 * 1024;

/**
 * Analyze a large audio blob using sparse sampling.
 * Instead of decoding the entire file (which can exhaust memory on iOS Safari),
 * we take small samples distributed throughout the file and analyze those.
 *
 * This keeps memory usage bounded to ~10MB regardless of file size,
 * while still providing a representative waveform visualization.
 *
 * @param blob - The audio blob to analyze
 * @param audioContext - The AudioContext to use for decoding
 * @param barCount - Number of waveform bars to generate
 * @param isCancelled - Function that returns true if analysis should stop
 * @returns Array of RMS values (not normalized) for each bar
 */
async function analyzeSparseSamples(
  blob: Blob,
  audioContext: AudioContext,
  barCount: number,
  isCancelled: () => boolean
): Promise<number[]> {
  const blobSize = blob.size;

  // Calculate how many samples we need and where to take them from
  // We want SPARSE_SAMPLE_COUNT samples distributed evenly across the file
  const sampleCount = Math.min(SPARSE_SAMPLE_COUNT, barCount);
  const barsPerSample = Math.ceil(barCount / sampleCount);

  // Calculate the spacing between sample start positions
  // Leave room at the end so the last sample doesn't go past the file
  const effectiveSize = blobSize - SPARSE_SAMPLE_SIZE;
  const spacing = effectiveSize / (sampleCount - 1 || 1);

  const allBars: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    if (isCancelled()) {
      throw new Error('Analysis cancelled');
    }

    // Calculate where to slice this sample from
    const startOffset = Math.floor(i * spacing);
    const endOffset = Math.min(startOffset + SPARSE_SAMPLE_SIZE, blobSize);

    // Slice out a chunk of the blob
    const chunk = blob.slice(startOffset, endOffset);

    try {
      // Convert chunk to ArrayBuffer and decode
      const arrayBuffer = await chunk.arrayBuffer();

      // decodeAudioData may fail on partial chunks (missing headers, etc.)
      // We use a try-catch and generate placeholder bars on failure
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      } catch {
        // This chunk couldn't be decoded (likely missing audio headers)
        // Generate placeholder bars for this segment
        console.warn(`[useAudioWaveform] Sparse sample ${i + 1}/${sampleCount} decode failed, using placeholder`);
        for (let j = 0; j < barsPerSample && allBars.length < barCount; j++) {
          // Use a moderate value that won't skew the normalization
          allBars.push(0.1);
        }
        continue;
      }

      // Get PCM samples from the decoded chunk
      const channelData = audioBuffer.getChannelData(0);
      const samplesPerBar = Math.floor(channelData.length / barsPerSample);

      // Calculate RMS for each bar in this chunk
      for (let j = 0; j < barsPerSample && allBars.length < barCount; j++) {
        const startSample = j * samplesPerBar;
        const endSample = Math.min(startSample + samplesPerBar, channelData.length);

        let sumSquares = 0;
        for (let k = startSample; k < endSample; k++) {
          sumSquares += channelData[k] * channelData[k];
        }
        const rms = Math.sqrt(sumSquares / (endSample - startSample || 1));
        allBars.push(rms);
      }
    } catch (err) {
      // If slicing or buffer conversion fails, add placeholder bars
      console.warn(`[useAudioWaveform] Sparse sample ${i + 1}/${sampleCount} failed:`, err);
      for (let j = 0; j < barsPerSample && allBars.length < barCount; j++) {
        allBars.push(0.1);
      }
    }
  }

  // If we got fewer bars than requested (due to failures), pad with the average
  while (allBars.length < barCount) {
    const avg = allBars.reduce((a, b) => a + b, 0) / (allBars.length || 1);
    allBars.push(avg || 0.1);
  }

  // Trim to exact barCount if we somehow got more
  return allBars.slice(0, barCount);
}

/**
 * Pre-warm the AudioContext on user gesture.
 * Call this directly in a click/tap handler before triggering async operations.
 * This ensures the AudioContext can be resumed on mobile browsers.
 */
export async function ensureAudioContextReady(): Promise<void> {
  if (!sharedAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        sharedAudioContext = new AudioContextClass();
      } catch {
        // Creation failed - will fall back to fake waveform
        return;
      }
    }
  }

  if (sharedAudioContext?.state === 'suspended') {
    try {
      await sharedAudioContext.resume();
    } catch {
      // Resume failed - will fall back to fake waveform
    }
  }
}

/**
 * Hook to generate a real waveform visualization from an audio Blob
 *
 * Uses Web Audio API to decode the audio and sample amplitude at intervals.
 * Returns normalized bar heights (0-100) representing actual audio levels.
 *
 * For large files (>10MB), uses sparse sampling to avoid memory exhaustion:
 * - Takes 20 small samples (500KB each) distributed throughout the file
 * - Keeps peak memory usage bounded to ~10MB regardless of file size
 * - Critical for iOS Safari which has strict memory limits (~1-2GB per tab)
 *
 * @param audioBlob - The audio Blob to analyze
 * @param barCount - Number of bars to generate (default: 40)
 * @returns { waveformBars, isAnalyzing, error }
 */
export function useAudioWaveform(
  audioBlob: Blob | null,
  barCount: number = 40
): UseAudioWaveformResult {
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioBlob) {
      setWaveformBars([]);
      return;
    }

    let isCancelled = false;

    const analyzeAudio = async () => {
      setIsAnalyzing(true);
      setError(null);

      try {
        // Use the shared AudioContext if available (pre-warmed by ensureAudioContextReady)
        // Otherwise create a new one (may fail on mobile without user gesture)
        if (!audioContextRef.current) {
          if (sharedAudioContext) {
            audioContextRef.current = sharedAudioContext;
          } else {
            const AudioContextClass =
              window.AudioContext ||
              (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) {
              throw new Error('Web Audio API not supported');
            }
            try {
              audioContextRef.current = new AudioContextClass();
            } catch (contextError) {
              // On iOS/mobile, AudioContext creation can fail without user gesture
              // Fall back to fake waveform
              console.warn('AudioContext creation failed (likely mobile without user gesture):', contextError);
              throw new Error('AudioContext not available');
            }
          }
        }

        const audioContext = audioContextRef.current;

        // Check if AudioContext is properly initialized
        if (!audioContext.destination) {
          throw new Error('AudioDestinationNode not initialized');
        }

        // Resume if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
          try {
            await audioContext.resume();
          } catch (resumeError) {
            console.warn('AudioContext resume failed:', resumeError);
            throw new Error('AudioContext could not be resumed');
          }
        }

        let bars: number[];

        // For large files, use sparse sampling to avoid memory exhaustion
        // This is critical for iOS Safari which has strict memory limits
        if (audioBlob.size > SPARSE_SAMPLING_THRESHOLD) {
          console.log(`[useAudioWaveform] Large file detected (${(audioBlob.size / 1024 / 1024).toFixed(1)}MB), using sparse sampling`);
          bars = await analyzeSparseSamples(audioBlob, audioContext, barCount, () => isCancelled);
        } else {
          // Small file - decode entirely (original behavior)
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          if (isCancelled) return;

          // Get PCM samples from first channel (mono or left channel)
          const channelData = audioBuffer.getChannelData(0);
          const totalSamples = channelData.length;

          // Calculate samples per bar
          const samplesPerBar = Math.floor(totalSamples / barCount);

          if (samplesPerBar < 1) {
            // Audio too short - generate minimal bars
            setWaveformBars(Array(barCount).fill(20));
            setIsAnalyzing(false);
            return;
          }

          // Calculate RMS (Root Mean Square) amplitude for each bar
          bars = [];

          for (let i = 0; i < barCount; i++) {
            const startSample = i * samplesPerBar;
            const endSample = Math.min(startSample + samplesPerBar, totalSamples);

            // Calculate RMS for this chunk
            let sumSquares = 0;
            for (let j = startSample; j < endSample; j++) {
              sumSquares += channelData[j] * channelData[j];
            }
            const rms = Math.sqrt(sumSquares / (endSample - startSample));
            bars.push(rms);
          }
        }

        if (isCancelled) return;

        // Normalize to 0-100 scale
        const maxRms = Math.max(...bars);
        const minHeight = 15; // Minimum bar height for visual appeal
        const maxHeight = 100;

        const normalized = bars.map((rms) => {
          if (maxRms === 0) return minHeight;
          const normalizedValue = (rms / maxRms) * (maxHeight - minHeight) + minHeight;
          return Math.round(normalizedValue);
        });

        setWaveformBars(normalized);
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to analyze audio waveform:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze audio');
        // Fallback to fake waveform on error
        setWaveformBars(
          Array.from({ length: barCount }, (_, i) => {
            const height = 30 + Math.sin(i * 0.5) * 20 + Math.cos(i * 0.3) * 15;
            return Math.max(20, Math.min(100, Math.round(height)));
          })
        );
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false);
        }
      }
    };

    analyzeAudio();

    return () => {
      isCancelled = true;
    };
  }, [audioBlob, barCount]);

  // Cleanup AudioContext on unmount (but don't close the shared one)
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current !== sharedAudioContext) {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors
        });
      }
    };
  }, []);

  return { waveformBars, isAnalyzing, error };
}
