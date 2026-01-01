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

      // Get time domain data - this should ALWAYS work and show waveform
      const timeDomainData = new Uint8Array(bufferLength);
      analyzer.getByteTimeDomainData(timeDomainData);

      // Get frequency data
      analyzer.getByteFrequencyData(dataArray);

      // Calculate time domain amplitude (deviation from 128 which is silence)
      // Time domain data is centered at 128 for silence
      let timeDomainMax = 0;
      for (let i = 0; i < bufferLength; i++) {
        const deviation = Math.abs(timeDomainData[i] - 128);
        timeDomainMax = Math.max(timeDomainMax, deviation);
      }

      // Focus on voice frequency range (human voice is typically 300-3400 Hz)
      const voiceStartBin = Math.floor(bufferLength * 0.02);
      const voiceEndBin = Math.floor(bufferLength * 0.15);

      // Calculate average level in voice frequency range
      let freqSum = 0;
      for (let i = voiceStartBin; i < voiceEndBin; i++) {
        freqSum += dataArray[i];
      }
      const freqAverage = freqSum / (voiceEndBin - voiceStartBin);

      // Use time domain data primarily - it's more reliable
      // Time domain deviation: 0 = silence, 128 = max amplitude
      // In practice, voice rarely exceeds 20-30 deviation, so we need significant boost
      const effectiveLevel = timeDomainMax > 0 ? timeDomainMax : freqAverage;

      // Normalize with aggressive boost for voice levels
      // Voice typically produces timeDomainMax of 5-30, so we scale accordingly
      // Using a power curve to make quiet sounds more visible while still showing loud peaks
      const scaledLevel = Math.pow(effectiveLevel / 50, 0.7) * 100; // 50 is "normal talking" level
      const normalized = Math.min(100, Math.max(0, scaledLevel));

      setAudioLevel(normalized);

      // Always use time domain data for visualization - it's more reliable
      setFrequencyData(timeDomainData);

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
      // Note: We no longer clone the stream. The original concern about MediaRecorder conflicts
      // is not valid for modern browsers, and cloning creates additional resource pressure.
      // This hook is now only used for mic preview (not during recording).
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

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      sourceRef.current = source;
      gainNodeRef.current = gainNode;

      // Resume AudioContext if suspended (modern browsers start in suspended state for autoplay policy)
      const startAnalysis = () => {
        setIsAnalyzing(true);
        analyze();
      };

      if (audioContext.state === 'suspended') {
        audioContext.resume().then(startAnalysis).catch(() => {
          // Failed to resume - visualization won't work but recording continues
        });
      } else {
        startAnalysis();
      }
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
