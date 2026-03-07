import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../stores/auth';
import { useRecordingsStore } from '../stores/recordings';
import { ErrorBoundary } from '../components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, initialized, user } = useAuthStore();
  const { connectWebSocket, disconnectWebSocket } = useRecordingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Connect WebSocket when user is authenticated
  useEffect(() => {
    if (user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    return () => disconnectWebSocket();
  }, [user, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(stack)" />
      </Stack>
    </ErrorBoundary>
  );
}
