import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../lib/api';

interface TranscriptionDetail {
  id: string;
  fileName: string;
  title?: string;
  status: string;
  duration?: number;
  transcriptText?: string;
  summary?: string;
  summaryV2?: {
    title?: string;
    overview?: string;
    keyPoints?: string[];
    sections?: Array<{ heading: string; content: string }>;
  };
  detectedLanguage?: string;
  speakerCount?: number;
  createdAt: string;
  completedAt?: string;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transcription, setTranscription] = useState<TranscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/transcriptions/${id}`);
      const data = (response as unknown as { data: TranscriptionDetail }).data ?? response;
      setTranscription(data as TranscriptionDetail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load recording';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleViewFullDetails = () => {
    const webUrl = `https://neuralsummary.com/en/conversation/${id}`;
    Linking.openURL(webUrl);
  };

  const displayTitle =
    transcription?.title || transcription?.fileName || 'Recording';

  const summaryText =
    transcription?.summaryV2?.overview || transcription?.summary || null;

  const keyPoints = transcription?.summaryV2?.keyPoints;

  const transcript = transcription?.transcriptText;
  const transcriptPreview =
    transcript && transcript.length > 500 && !showFullTranscript
      ? transcript.slice(0, 500) + '...'
      : transcript;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerTintColor: '#8D6AFA',
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8D6AFA" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDetail}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchDetail}
                tintColor="#8D6AFA"
              />
            }
          >
            {/* Header */}
            <Text style={styles.title}>{displayTitle}</Text>
            <View style={styles.metaRow}>
              {transcription?.duration != null && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>
                    {formatDuration(transcription.duration)}
                  </Text>
                </View>
              )}
              {transcription?.detectedLanguage && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>
                    {transcription.detectedLanguage}
                  </Text>
                </View>
              )}
              {transcription?.speakerCount != null && transcription.speakerCount > 1 && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>
                    {transcription.speakerCount} speakers
                  </Text>
                </View>
              )}
            </View>

            {/* Summary */}
            {summaryText && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Text style={styles.sectionBody}>{summaryText}</Text>
              </View>
            )}

            {/* Key Points */}
            {keyPoints && keyPoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Points</Text>
                {keyPoints.map((point, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Transcript */}
            {transcript && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transcript</Text>
                <Text style={styles.transcriptText}>{transcriptPreview}</Text>
                {transcript.length > 500 && (
                  <TouchableOpacity
                    onPress={() => setShowFullTranscript(!showFullTranscript)}
                  >
                    <Text style={styles.toggleText}>
                      {showFullTranscript ? 'Show less' : 'Show full transcript'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Sections from summaryV2 */}
            {transcription?.summaryV2?.sections?.map((section, i) => (
              <View key={i} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.heading}</Text>
                <Text style={styles.sectionBody}>{section.content}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewFullDetails}
            >
              <Text style={styles.detailsButtonText}>View full details on web</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 15,
    color: '#8D6AFA',
    marginRight: 8,
    lineHeight: 24,
  },
  bulletText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    flex: 1,
  },
  transcriptText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8D6AFA',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8D6AFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
