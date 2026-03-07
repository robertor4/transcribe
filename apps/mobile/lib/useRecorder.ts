import { useRef, useState, useCallback, useEffect } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  AudioRecorder,
} from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';

export type RecordingState = 'idle' | 'recording' | 'paused';

interface UseRecorderReturn {
  state: RecordingState;
  duration: number;
  meterLevel: number;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<RecordingResult | null>;
  cancel: () => Promise<void>;
}

export interface RecordingResult {
  uri: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  fileName: string;
}

export function useRecorder(): UseRecorderReturn {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [meterLevel, setMeterLevel] = useState(0);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const recorderState = useAudioRecorderState(recorder, 100);

  // Update meter level from recorder state
  useEffect(() => {
    if (recorderState.isRecording && recorderState.metering !== undefined) {
      const normalized = Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));
      setMeterLevel(normalized);
    }
  }, [recorderState.metering, recorderState.isRecording]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = accumulatedTimeRef.current + (Date.now() - startTimeRef.current);
      setDuration(Math.floor(elapsed / 1000));
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    accumulatedTimeRef.current += Date.now() - startTimeRef.current;
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    accumulatedTimeRef.current = 0;
    startTimeRef.current = 0;
    setDuration(0);
  }, []);

  const start = useCallback(async () => {
    // Request permissions
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission is required to record audio.');
    }

    // Configure audio session for recording
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    recorder.record();

    resetTimer();
    startTimer();
    setState('recording');
  }, [recorder, startTimer, resetTimer]);

  const pause = useCallback(() => {
    if (state !== 'recording') return;
    recorder.pause();
    stopTimer();
    setMeterLevel(0);
    setState('paused');
  }, [recorder, state, stopTimer]);

  const resume = useCallback(() => {
    if (state !== 'paused') return;
    recorder.record();
    startTimer();
    setState('recording');
  }, [recorder, state, startTimer]);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    try {
      stopTimer();
      setMeterLevel(0);

      await recorder.stop();

      // Reset audio mode
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: false,
      });

      const uri = recorder.uri;
      if (!uri) return null;

      const finalDuration = recorder.currentTime
        ? Math.round(recorder.currentTime)
        : duration;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording_${timestamp}.m4a`;

      const result: RecordingResult = {
        uri,
        duration: finalDuration,
        fileSize: 0, // Determined during upload
        mimeType: 'audio/mp4',
        fileName,
      };

      setState('idle');
      resetTimer();

      return result;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState('idle');
      resetTimer();
      return null;
    }
  }, [recorder, duration, stopTimer, resetTimer]);

  const cancel = useCallback(async () => {
    try {
      stopTimer();
      setMeterLevel(0);
      await recorder.stop();

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: false,
      });
    } catch {
      // Ignore errors during cancel
    } finally {
      setState('idle');
      resetTimer();
    }
  }, [recorder, stopTimer, resetTimer]);

  return { state, duration, meterLevel, start, pause, resume, stop, cancel };
}
