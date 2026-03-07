import { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRecorder, RecordingResult } from '../../lib/useRecorder';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Temporary global to pass recording result to confirm-upload screen
// In production, use a proper store or route params
let pendingRecording: RecordingResult | null = null;
export function getPendingRecording(): RecordingResult | null {
  const r = pendingRecording;
  pendingRecording = null;
  return r;
}

export default function RecordScreen() {
  const { state, duration, meterLevel, start, pause, resume, stop, cancel } =
    useRecorder();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate pulse ring based on meter level
  const pulseScale = 1 + meterLevel * 0.4;

  const handlePrimaryAction = useCallback(async () => {
    try {
      if (state === 'idle') {
        await start();
      } else if (state === 'recording') {
        await pause();
      } else if (state === 'paused') {
        await resume();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not start recording.';
      Alert.alert('Recording Error', message);
    }
  }, [state, start, pause, resume]);

  const handleStop = useCallback(async () => {
    const result = await stop();
    if (result) {
      pendingRecording = result;
      router.push('/(stack)/confirm-upload');
    }
  }, [stop]);

  const handleCancel = useCallback(() => {
    Alert.alert('Discard Recording', 'Are you sure you want to discard this recording?', [
      { text: 'Keep Recording', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => cancel(),
      },
    ]);
  }, [cancel]);

  const isActive = state !== 'idle';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record</Text>
        <Text style={styles.subtitle}>
          {state === 'idle'
            ? 'Tap to start recording'
            : state === 'recording'
              ? 'Recording...'
              : 'Paused'}
        </Text>
      </View>

      <View style={styles.recordArea}>
        {/* Pulse ring */}
        {state === 'recording' && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseScale }], opacity: 0.3 + meterLevel * 0.4 },
            ]}
          />
        )}

        {/* Main record button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            state === 'recording' && styles.recordButtonActive,
          ]}
          onPress={handlePrimaryAction}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.recordButtonInner,
              state === 'paused' && styles.recordButtonPaused,
              state === 'recording' && styles.recordButtonRecording,
            ]}
          />
        </TouchableOpacity>

        <Text style={styles.timer}>{formatTime(duration)}</Text>

        {isActive ? (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleCancel}>
              <Text style={styles.controlButtonText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={[styles.controlButtonText, styles.stopButtonText]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hint}>
            Recording will be transcribed automatically
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  recordArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#FCA5A5',
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  recordButtonActive: {
    backgroundColor: '#FECACA',
  },
  recordButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
  },
  recordButtonRecording: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordButtonPaused: {
    width: 0,
    height: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 24,
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderLeftColor: '#EF4444',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 6,
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  stopButton: {
    backgroundColor: '#8D6AFA',
    borderColor: '#8D6AFA',
  },
  stopButtonText: {
    color: '#ffffff',
  },
});
