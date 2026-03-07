import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuthStore } from '../../stores/auth';
import api from '../../lib/api';

interface UserProfile {
  displayName?: string;
  email?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  usageStats?: {
    totalTranscriptions?: number;
    totalDuration?: number;
    monthlyTranscriptions?: number;
    monthlyDuration?: number;
  };
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  professional: 'Professional',
  business: 'Business',
  enterprise: 'Enterprise',
};

function formatMinutes(seconds?: number): string {
  if (!seconds) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/user/profile');
      const data = (response as unknown as { data: UserProfile }).data ?? response;
      setProfile(data as UserProfile);
    } catch {
      // Profile fetch is non-critical
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleOpenWeb = () => {
    Linking.openURL('https://neuralsummary.com/en/dashboard');
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const tier = profile?.subscriptionTier || 'free';
  const tierLabel = TIER_LABELS[tier] || tier;
  const usage = profile?.usageStats;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8D6AFA" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.cardGroup}>
            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value} numberOfLines={1}>
                {user?.email || 'Not set'}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>
                {user?.displayName || profile?.displayName || 'Not set'}
              </Text>
            </View>
            <View style={[styles.card, styles.cardLast]}>
              <Text style={styles.label}>Plan</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{tierLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Usage */}
        {usage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {usage.monthlyTranscriptions ?? 0}
                </Text>
                <Text style={styles.statLabel}>Conversations</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {formatMinutes(usage.monthlyDuration)}
                </Text>
                <Text style={styles.statLabel}>Recorded</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.card}
              onPress={handleOpenWeb}
              activeOpacity={0.6}
            >
              <Text style={styles.label}>Open Web Dashboard</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.card, styles.cardLast]}
              onPress={() =>
                Linking.openURL('https://neuralsummary.com/en/settings')
              }
              activeOpacity={0.6}
            >
              <Text style={styles.label}>Manage Subscription</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.cardGroup}>
            <View style={styles.card}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>{appVersion}</Text>
            </View>
            <View style={[styles.card, styles.cardLast]}>
              <Text style={styles.label}>Build</Text>
              <Text style={styles.value}>
                {Constants.expoConfig?.ios?.buildNumber ||
                  Constants.expoConfig?.android?.versionCode ||
                  '1'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#9CA3AF',
    maxWidth: '60%',
    textAlign: 'right',
  },
  chevron: {
    fontSize: 22,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  tierBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8D6AFA',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  logoutButton: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
