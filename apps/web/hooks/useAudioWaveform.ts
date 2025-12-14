'use client';

import { useState, useEffect, useRef } from 'react';

interface UseAudioWaveformResult {
  waveformBars: number[];
  isAnalyzing: boolean;
  error: string | null;
}

/**
 * Hook to generate a real waveform visualization from an audio Blob
 *
 * Uses Web Audio API to decode the audio and sample amplitude at intervals.
 * Returns normalized bar heights (0-100) representing actual audio levels.
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
        // Create AudioContext (reuse if exists)
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextClass) {
            throw new Error('Web Audio API not supported');
          }
          audioContextRef.current = new AudioContextClass();
        }

        const audioContext = audioContextRef.current;

        // Resume if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Decode the audio blob
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
        const bars: number[] = [];

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

        if (isCancelled) return;

        // Normalize to 0-100 scale
        const maxRms = Math.max(...bars);
        const minHeight = 15; // Minimum bar height for visual appeal
        const maxHeight = 100;

        const normalized = bars.map((rms) => {
          if (maxRms === 0) return minHeight;
          const normalized = (rms / maxRms) * (maxHeight - minHeight) + minHeight;
          return Math.round(normalized);
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

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors
        });
      }
    };
  }, []);

  return { waveformBars, isAnalyzing, error };
}
