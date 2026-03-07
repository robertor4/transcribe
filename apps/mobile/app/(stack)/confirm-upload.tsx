import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getPendingRecording } from '../(tabs)/record';
import { useRecordingsStore } from '../../stores/recordings';
import type { RecordingResult } from '../../lib/useRecorder';

export default function ConfirmUploadScreen() {
  const [context, setContext] = useState('');
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const startUpload = useRecordingsStore((s) => s.startUpload);

  useEffect(() => {
    const pending = getPendingRecording();
    if (pending) {
      setRecording(pending);
    } else {
      // No recording to upload, go back
      router.back();
    }
  }, []);

  const handleUpload = async (withContext: boolean) => {
    if (!recording || uploading) return;

    setUploading(true);
    try {
      await startUpload(recording, withContext ? context.trim() || undefined : undefined);
      // Navigate to recordings tab to see progress
      router.replace('/(tabs)/recordings');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Upload failed. Please try again.';
      Alert.alert('Upload Failed', message);
      setUploading(false);
    }
  };

  const durationStr = recording
    ? `${Math.floor((recording.duration || 0) / 60)}:${((recording.duration || 0) % 60).toString().padStart(2, '0')}`
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add context</Text>
        <Text style={styles.subtitle}>
          Describe what this recording is about to improve AI output quality.
        </Text>

        {recording && (
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingName}>{recording.fileName}</Text>
            <Text style={styles.recordingDuration}>{durationStr}</Text>
          </View>
        )}

        <TextInput
          style={styles.textArea}
          placeholder="e.g., Product roadmap brainstorm with the team..."
          placeholderTextColor="#9CA3AF"
          value={context}
          onChangeText={setContext}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!uploading}
        />

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.buttonDisabled]}
          onPress={() => handleUpload(true)}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload with Context</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => handleUpload(false)}
          disabled={uploading}
        >
          <Text style={[styles.skipButtonText, uploading && { opacity: 0.5 }]}>
            Skip and Upload
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  recordingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  recordingName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  recordingDuration: {
    fontSize: 14,
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    marginBottom: 24,
  },
  uploadButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8D6AFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
