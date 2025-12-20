/**
 * useAutoGain hook
 * Applies automatic gain normalization to a MediaStream
 * Boosts quiet microphones and reduces loud inputs while capping gain to avoid distortion
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAutoGainOptions {
  /** Target normalized level (0-100, default: 55) */
  targetLevel?: number;
  /** Maximum gain multiplier (default: 1.5 = 150%) */
  maxGain?: number;
  /** Minimum gain multiplier (default: 0.5 = 50%) */
  minGain?: number;
  /** Time constant for gain increase in seconds (default: 0.5) */
  attackTime?: number;
  /** Time constant for gain decrease in seconds (default: 0.1) */
  releaseTime?: number;
  /** Interval for level analysis in ms (default: 50) */
  analysisInterval?: number;
}

export interface UseAutoGainReturn {
  /** The gain-adjusted stream for MediaRecorder */
  processedStream: MediaStream | null;
  /** Current applied gain multiplier (0.5 to 1.5) */
  currentGain: number;
  /** Pre-gain input level (0-100) */
  inputLevel: number;
  /** Post-gain output level (0-100) */
  outputLevel: number;
  /** Connect a source stream for processing */
  connectStream: (stream: MediaStream) => Promise<void>;
  /** Disconnect and cleanup all resources */
  disconnect: () => void;
  /** Whether the gain processor is connected */
  isConnected: boolean;
}

/**
 * Calculate RMS (Root Mean Square) level from audio samples
 * Returns a normalized value from 0-100
 */
function calculateRMS(analyser: AnalyserNode): number {
  const dataArray = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(dataArray);

  // Calculate RMS
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i] * dataArray[i];
  }
  const rms = Math.sqrt(sum / dataArray.length);

  // Convert to 0-100 scale
  // RMS of typical speech is around 0.1-0.3, scale accordingly
  // Using a multiplier of 300 to map typical speech to ~30-90 range
  return Math.min(100, rms * 300);
}

/**
 * Calculate the target gain to reach desired level
 * Returns clamped gain within min/max bounds
 */
function calculateTargetGain(
  inputLevel: number,
  targetLevel: number,
  currentGain: number,
  maxGain: number,
  minGain: number
): number {
  // Don't adjust gain for very quiet signals (likely silence)
  // This prevents the gain from ramping up during pauses
  if (inputLevel < 3) {
    return currentGain;
  }

  // Calculate ideal gain to reach target level
  const idealGain = targetLevel / inputLevel;

  // Apply smoothing - don't jump to ideal gain immediately
  // Move 20% toward the ideal gain each analysis cycle
  const smoothingFactor = 0.2;
  const smoothedGain = currentGain + (idealGain - currentGain) * smoothingFactor;

  // Clamp to allowed range
  return Math.max(minGain, Math.min(maxGain, smoothedGain));
}

export function useAutoGain(options: UseAutoGainOptions = {}): UseAutoGainReturn {
  const {
    targetLevel = 55,
    maxGain = 1.5,
    minGain = 0.5,
    attackTime = 0.5,
    releaseTime = 0.1,
    analysisInterval = 50,
  } = options;

  // State
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [currentGain, setCurrentGain] = useState(1.0);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for Web Audio nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null);

  // Refs for analysis loop
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentGainRef = useRef(1.0); // Track gain in ref for analysis loop

  // Cleanup function
  const disconnect = useCallback(() => {
    // Stop analysis loop
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    // Disconnect nodes
    try {
      sourceNodeRef.current?.disconnect();
      analyserNodeRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
    } catch {
      // Nodes may already be disconnected
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {
        // Ignore close errors
      });
    }

    // Clear refs
    audioContextRef.current = null;
    sourceNodeRef.current = null;
    analyserNodeRef.current = null;
    gainNodeRef.current = null;
    destinationRef.current = null;
    originalStreamRef.current = null;

    // Reset state
    setProcessedStream(null);
    setCurrentGain(1.0);
    setInputLevel(0);
    setOutputLevel(0);
    setIsConnected(false);
    currentGainRef.current = 1.0;
  }, []);

  // Connect and process a stream
  const connectStream = useCallback(
    async (stream: MediaStream) => {
      // Cleanup any existing connection
      disconnect();

      try {
        // Create AudioContext
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        const ctx = new AudioContextClass();

        // Resume if suspended (browsers require user interaction)
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Create nodes
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        const gainNode = ctx.createGain();
        const destination = ctx.createMediaStreamDestination();

        // Configure analyser for efficient RMS calculation
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;

        // Set initial gain
        gainNode.gain.value = 1.0;

        // Connect the audio graph:
        // source → analyser → gainNode → destination
        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(destination);

        // Store refs
        audioContextRef.current = ctx;
        sourceNodeRef.current = source;
        analyserNodeRef.current = analyser;
        gainNodeRef.current = gainNode;
        destinationRef.current = destination;
        originalStreamRef.current = stream;

        // Update state
        setProcessedStream(destination.stream);
        setIsConnected(true);

        // Start analysis loop
        analysisIntervalRef.current = setInterval(() => {
          if (!analyserNodeRef.current || !gainNodeRef.current || !audioContextRef.current) {
            return;
          }

          // Calculate current input level (pre-gain)
          const rawLevel = calculateRMS(analyserNodeRef.current);
          setInputLevel(rawLevel);

          // Calculate target gain
          const targetGain = calculateTargetGain(
            rawLevel,
            targetLevel,
            currentGainRef.current,
            maxGain,
            minGain
          );

          // Apply gain with smooth ramping
          if (Math.abs(targetGain - currentGainRef.current) > 0.01) {
            const isIncreasing = targetGain > currentGainRef.current;
            const timeConstant = isIncreasing ? attackTime : releaseTime;

            gainNodeRef.current.gain.setTargetAtTime(
              targetGain,
              audioContextRef.current.currentTime,
              timeConstant
            );

            currentGainRef.current = targetGain;
            setCurrentGain(targetGain);
          }

          // Calculate output level (post-gain)
          const outputLevelValue = Math.min(100, rawLevel * currentGainRef.current);
          setOutputLevel(outputLevelValue);
        }, analysisInterval);

        console.log('[useAutoGain] Connected with auto-gain processing');
      } catch (error) {
        console.error('[useAutoGain] Failed to connect stream:', error);
        disconnect();
        throw error;
      }
    },
    [disconnect, targetLevel, maxGain, minGain, attackTime, releaseTime, analysisInterval]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    processedStream,
    currentGain,
    inputLevel,
    outputLevel,
    connectStream,
    disconnect,
    isConnected,
  };
}
