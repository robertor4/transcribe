/**
 * useAudioVisualization hook
 * Provides real-time audio level visualization using Web Audio API
 * Optimized for low CPU usage on mobile devices
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAudioVisualizationOptions {
  fftSize?: number; // Must be power of 2 between 32-32768
  smoothingTimeConstant?: number; // 0-1, higher = smoother
  minDecibels?: number;
  maxDecibels?: number;
}

export interface UseAudioVisualizationReturn {
  audioLevel: number; // 0-100 normalized audio level
  frequencyData: Uint8Array | null; // Raw frequency data (if needed)
  isAnalyzing: boolean;
}

export function useAudioVisualization(
  audioStream: MediaStream | null,
  options: UseAudioVisualizationOptions = {}
): UseAudioVisualizationReturn {
  const {
    fftSize = 256, // Smaller = better performance
    smoothingTimeConstant = 0.8,
    minDecibels = -100, // Lower threshold for better sensitivity
    maxDecibels = -20, // Higher threshold for better dynamic range
  } = options;

  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Analyze audio levels
  const analyze = useCallback(() => {
    if (!analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyzer) return;

      // Get frequency data
      analyzer.getByteFrequencyData(dataArray);

      // Focus on voice frequency range (human voice is typically 300-3400 Hz)
      // For fftSize=256, we get 128 frequency bins (0-24kHz at 48kHz sample rate)
      // Voice range bins: approximately bins 2-18 (assuming 48kHz sample rate)
      const voiceStartBin = Math.floor(bufferLength * 0.02); // ~300 Hz
      const voiceEndBin = Math.floor(bufferLength * 0.15); // ~3600 Hz

      // Calculate average level in voice frequency range
      let sum = 0;
      for (let i = voiceStartBin; i < voiceEndBin; i++) {
        sum += dataArray[i];
      }
      const average = sum / (voiceEndBin - voiceStartBin);

      // Simple normalization: average is 0-255, map to 0-100
      // With moderate boost for visibility while maintaining dynamic range
      const normalized = Math.min(100, Math.max(0, (average / 255) * 100 * 1.5));

      setAudioLevel(normalized);
      setFrequencyData(new Uint8Array(dataArray));

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  // Setup audio analysis
  useEffect(() => {
    if (!audioStream) {
      // Cleanup if no stream
      setIsAnalyzing(false);
      setAudioLevel(0);
      setFrequencyData(null);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }

      if (analyzerRef.current) {
        analyzerRef.current.disconnect();
        analyzerRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      return;
    }

    // Create audio context and analyzer
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();

      analyzer.fftSize = fftSize;
      analyzer.smoothingTimeConstant = smoothingTimeConstant;
      analyzer.minDecibels = minDecibels;
      analyzer.maxDecibels = maxDecibels;

      const source = audioContext.createMediaStreamSource(audioStream);

      // Create a gain node set to 0 to mute output (prevents audio feedback)
      // but allows the analyzer to receive data
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Mute the output

      // Connect: source → analyzer → gainNode → destination
      // This creates a complete audio graph required by many browsers
      source.connect(analyzer);
      analyzer.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // CRITICAL: Resume AudioContext if suspended
      // Modern browsers start AudioContext in suspended state for autoplay policy
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch((err) => {
          console.error('[Audio Visualization] Failed to resume AudioContext:', err);
        });
      }

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      sourceRef.current = source;
      gainNodeRef.current = gainNode;

      setIsAnalyzing(true);
      analyze();
    } catch (error) {
      console.error('Failed to create audio analyzer:', error);
      setIsAnalyzing(false);
    }

    // Cleanup on unmount or stream change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }

      if (analyzerRef.current) {
        analyzerRef.current.disconnect();
        analyzerRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsAnalyzing(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioStream, fftSize, smoothingTimeConstant, minDecibels, maxDecibels]);

  return {
    audioLevel,
    frequencyData,
    isAnalyzing,
  };
}
