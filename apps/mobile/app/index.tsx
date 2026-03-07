import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth';

export default function Index() {
  const { user, initialized } = useAuthStore();

  if (!initialized) return null;

  if (user) {
    return <Redirect href="/(tabs)/record" />;
  }

  return <Redirect href="/(auth)/login" />;
}
