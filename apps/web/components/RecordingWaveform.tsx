'use client';

import { useRef, useEffect, useCallback } from 'react';

interface RecordingWaveformProps {
  /** Whether audio is currently being recorded */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused?: boolean;
  /** Audio level from 0-100, used to modulate wave amplitude (for microphone recording) */
  audioLevel?: number;
  /** Chunk count - when provided, uses chunk-based visualization instead of audio level (for tab audio) */
  chunkCount?: number;
  /** Color variant - auto-detects dark mode if not specified */
  variant?: 'light' | 'dark';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Flowing Wave Lines Recording Visualization
 *
 * Renders 3 animated SVG sine waves that respond to audio input.
 * The waves have different frequencies, amplitudes, and phases for
 * a layered, organic feel that matches the Neural Summary brand.
 *
 * NOTE: This component uses direct DOM manipulation instead of React state
 * for the animation paths to avoid ~60 state updates per second, which was
 * causing Chrome to crash after ~10 minutes of recording.
 */
export function RecordingWaveform({
  isRecording,
  isPaused = false,
  audioLevel = 0,
  chunkCount,
  variant,
  className = '',
}: RecordingWaveformProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([null, null, null]);
  const timeRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Smooth the audio level to prevent jittery animations
  const smoothedLevelRef = useRef(0);

  // Track previous chunk count for pulse effect
  const prevChunkCountRef = useRef(0);
  const chunkPulseRef = useRef(0);

  // Determine if we're in chunk-based mode (tab audio) vs audio level mode (microphone)
  const isChunkBasedMode = chunkCount !== undefined;

  const generateWavePaths = useCallback((time: number, level: number, currentChunkCount?: number) => {
    const width = 400;
    const height = 80;
    const baseY = height / 2;

    // Handle chunk-based mode (tab audio) vs audio level mode (microphone)
    let effectiveLevel = level;
    if (isChunkBasedMode && currentChunkCount !== undefined) {
      // Detect new chunks and create pulse effect
      if (currentChunkCount > prevChunkCountRef.current) {
        chunkPulseRef.current = 80; // Start pulse at high level
        prevChunkCountRef.current = currentChunkCount;
      }
      // Decay the pulse over time
      chunkPulseRef.current = Math.max(30, chunkPulseRef.current * 0.92);
      effectiveLevel = chunkPulseRef.current;
    }

    // Smooth the level with exponential smoothing
    smoothedLevelRef.current += (effectiveLevel - smoothedLevelRef.current) * 0.15;
    const smoothedLevel = smoothedLevelRef.current;

    // Base amplitude when idle, scales up with audio level
    const minAmplitude = 5;
    const maxAmplitude = 30;

    // Calculate amplitude based on recording state and audio level
    let amplitudeMultiplier = 0.2; // Very subtle when not recording
    if (isRecording && !isPaused) {
      // Scale from 0.3 (silence) to 1.0 (loud) based on audio level
      amplitudeMultiplier = 0.3 + (smoothedLevel / 100) * 0.7;
    } else if (isPaused) {
      amplitudeMultiplier = 0.15; // Minimal movement when paused
    }

    const newPaths: string[] = [];

    // Wave configuration: [baseAmplitude, frequency, speed, phase, strokeWidth, opacity]
    const waveConfigs = [
      { baseAmp: maxAmplitude, freq: 0.06, speed: 4, phase: 0, opacity: 0.9 },
      { baseAmp: maxAmplitude * 0.75, freq: 0.052, speed: 4.5, phase: 1.2, opacity: 0.65 },
      { baseAmp: maxAmplitude * 0.5, freq: 0.044, speed: 5, phase: 2.4, opacity: 0.4 },
    ];

    waveConfigs.forEach((config) => {
      const points: string[] = [];
      const amplitude = Math.max(minAmplitude, config.baseAmp * amplitudeMultiplier);

      // Add subtle "breathing" effect - waves gently pulse even at low audio levels
      const breathingFactor = 1 + Math.sin(time * 2 + config.phase) * 0.15;
      const finalAmplitude = amplitude * breathingFactor;

      for (let x = 0; x <= width; x += 3) {
        const y = baseY + Math.sin(x * config.freq + time * config.speed + config.phase) * finalAmplitude;
        points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(2)}`);
      }

      newPaths.push(points.join(' '));
    });

    return newPaths;
  }, [isRecording, isPaused, isChunkBasedMode]);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Only advance time if recording and not paused
      if (isRecording && !isPaused) {
        timeRef.current += deltaTime;
      } else {
        // Slow time progression when paused/idle for subtle movement
        timeRef.current += deltaTime * 0.2;
      }

      const newPaths = generateWavePaths(timeRef.current, audioLevel, chunkCount);

      // Direct DOM manipulation instead of React state to avoid ~60 state updates/sec
      // This prevents Chrome from crashing after ~10 minutes of recording
      newPaths.forEach((pathD, index) => {
        const pathEl = pathRefs.current[index];
        if (pathEl) {
          pathEl.setAttribute('d', pathD);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPaused, audioLevel, chunkCount, generateWavePaths]);

  // Determine stroke color based on variant or dark mode
  const strokeColor = variant === 'dark' ? '#A78BFA' : '#8B5CF6';
  const strokeColorDark = '#A78BFA';

  // Wave opacities and stroke widths
  const waveStyles = [
    { strokeWidth: 2.5, opacity: 0.9 },
    { strokeWidth: 2.0, opacity: 0.65 },
    { strokeWidth: 1.5, opacity: 0.4 },
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-center h-20">
        <svg
          ref={svgRef}
          viewBox="0 0 400 80"
          className="w-full h-20"
          preserveAspectRatio="none"
        >
          {waveStyles.map((style, index) => (
            <path
              key={index}
              ref={(el) => { pathRefs.current[index] = el; }}
              d=""
              fill="none"
              stroke={variant === 'dark' ? strokeColorDark : strokeColor}
              className={variant ? '' : `stroke-[#8B5CF6] dark:stroke-[#A78BFA]`}
              strokeWidth={style.strokeWidth}
              strokeLinecap="round"
              opacity={style.opacity}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export default RecordingWaveform;
