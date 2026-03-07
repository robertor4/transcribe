import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleViewFullDetails = () => {
    // Open web app with deep link to this recording
    const webUrl = `https://neuralsummary.com/en/conversation/${id}`;
    Linking.openURL(webUrl);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Transcript Preview</Text>
          <Text style={styles.placeholderText}>
            Transcript content will appear here once the recording is processed.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.detailsButton} onPress={handleViewFullDetails}>
          <Text style={styles.detailsButtonText}>View full details</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
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
