import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRecordingsStore, Recording } from '../../stores/recordings';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Queued' },
  processing: { bg: '#DBEAFE', text: '#1E40AF', label: 'Processing' },
  completed: { bg: '#D1FAE5', text: '#065F46', label: 'Done' },
  failed: { bg: '#FEE2E2', text: '#991B1B', label: 'Failed' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function RecordingRow({ item }: { item: Recording }) {
  const status = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
  const isProcessing = item.status === 'processing' || item.status === 'pending';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        if (item.status === 'completed') {
          router.push(`/(stack)/recording/${item.id}`);
        }
      }}
      disabled={isProcessing}
      activeOpacity={0.6}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title || item.fileName}
        </Text>
        <View style={styles.rowMeta}>
          {item.duration != null && (
            <Text style={styles.rowDuration}>{formatDuration(item.duration)}</Text>
          )}
          <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        {isProcessing && item.progress != null && item.progress > 0 && (
          <Text style={[styles.statusText, { color: status.text }]}>
            {' '}{Math.round(item.progress)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function RecordingsScreen() {
  const { recordings, loading, activeUpload, fetchRecordings, connectWebSocket } =
    useRecordingsStore();

  useEffect(() => {
    fetchRecordings();
    connectWebSocket();
  }, [fetchRecordings, connectWebSocket]);

  const onRefresh = useCallback(async () => {
    await fetchRecordings();
  }, [fetchRecordings]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recordings</Text>
      </View>

      {/* Active upload banner */}
      {activeUpload && (
        <View style={styles.uploadBanner}>
          <View style={styles.uploadInfo}>
            <Text style={styles.uploadFileName} numberOfLines={1}>
              {activeUpload.fileName}
            </Text>
            <Text style={styles.uploadStage}>
              {activeUpload.stage === 'uploading'
                ? `Uploading... ${Math.round(activeUpload.storageProgress * 100)}%`
                : activeUpload.stage === 'processing'
                  ? `Processing... ${activeUpload.processingProgress}%`
                  : `Summarizing... ${activeUpload.processingProgress}%`}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    activeUpload.stage === 'uploading'
                      ? `${activeUpload.storageProgress * 50}%`
                      : `${50 + activeUpload.processingProgress * 0.5}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RecordingRow item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#8D6AFA" />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No recordings yet</Text>
              <Text style={styles.emptyText}>
                Tap the Record tab to create your first recording.
              </Text>
            </View>
          ) : null
        }
      />
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  uploadBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
  },
  uploadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  uploadStage: {
    fontSize: 13,
    color: '#8D6AFA',
    fontWeight: '500',
    marginLeft: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8D6AFA',
    borderRadius: 2,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  rowMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  rowDuration: {
    fontSize: 13,
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },
  rowDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 48,
    lineHeight: 22,
  },
});
