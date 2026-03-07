import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record</Text>
        <Text style={styles.subtitle}>Tap to start recording</Text>
      </View>

      <View style={styles.recordArea}>
        <TouchableOpacity style={styles.recordButton} activeOpacity={0.7}>
          <View style={styles.recordButtonInner} />
        </TouchableOpacity>
        <Text style={styles.timer}>00:00</Text>
        <Text style={styles.hint}>Recording will be transcribed automatically</Text>
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
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
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
});
