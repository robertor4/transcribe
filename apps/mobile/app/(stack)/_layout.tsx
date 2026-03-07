import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#8D6AFA',
        headerTitleStyle: { color: '#111827', fontWeight: '600' },
        headerStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen
        name="confirm-upload"
        options={{ title: 'Upload Recording', presentation: 'modal' }}
      />
      <Stack.Screen
        name="recording/[id]"
        options={{ title: 'Recording' }}
      />
    </Stack>
  );
}
