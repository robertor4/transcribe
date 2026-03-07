import Constants from 'expo-constants';

// API URL defaults to localhost for development
// Override with EXPO_PUBLIC_API_URL in .env
export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001';

// WebSocket URL (same as API for Socket.io)
export const WS_URL = API_URL;
