# Neural Summary Mobile Companion App Plan

> **Status**: Planning
> **Created**: 2025-12-26
> **Framework**: React Native with Expo
> **Location**: `apps/mobile/` (monorepo)

## Overview

A companion mobile app for iOS and Android that enables users to record audio on-the-go and have it transformed into structured documents via Neural Summary's AI pipeline. The app embodies the core brand promise: **"You speak. It creates."**

## Why React Native with Expo?

After evaluating React Native, Flutter, and Capacitor, **React Native with Expo** is the recommended choice:

| Factor | Why React Native Wins |
|--------|----------------------|
| **Type sharing** | Import directly from `packages/shared` |
| **Team skills** | Already React/TypeScript experts |
| **Socket.io** | Same client library as web |
| **Firebase** | `@react-native-firebase` is production-ready |
| **Audio** | `expo-av` handles recording well |
| **Time to market** | Fastest for React teams |

### Alternatives Considered

**Flutter**:
- Pro: Excellent performance, single codebase for iOS/Android/Web
- Con: Dart is a new language for the team, can't share `packages/shared` types

**Capacitor (Ionic)**:
- Pro: Web technologies, could share some Next.js components
- Con: WebView-based (less native feel), audio recording plugins less mature

## Why Monorepo (Not Separate Repo)?

The mobile app will live in the existing Neural Summary monorepo at `apps/mobile/`.

### Monorepo Benefits

| Benefit | Why It Matters |
|---------|---------------|
| **Shared types** | Import directly from `packages/shared` - `Transcription`, `Analysis`, `AnalysisTemplate` types stay in sync |
| **Single source of truth** | API contracts, constants, validation utils shared automatically |
| **Atomic changes** | Update API + mobile in one PR when changing interfaces |
| **Consistent tooling** | Same ESLint, Prettier, TypeScript config |
| **Easier onboarding** | One repo to clone, one README |
| **Turborepo benefits** | Cached builds, dependency graph already set up |

### Monorepo Trade-offs

| Drawback | Mitigation |
|----------|------------|
| Repo size grows (~500MB+) | Acceptable for team size |
| CI complexity | Separate mobile CI pipeline |
| Expo EAS builds | Configure `eas.json` for monorepo |

### When to Reconsider

Split to separate repo if:
- Dedicated mobile team wants autonomy
- CI times exceed 20 minutes
- Mobile release cadence becomes completely independent

## Project Structure

```
neural-summary/
├── apps/
│   ├── api/                 # NestJS backend (existing)
│   ├── web/                 # Next.js frontend (existing)
│   └── mobile/              # New Expo app
│       ├── app/             # Expo Router screens
│       │   ├── (tabs)/
│       │   │   ├── index.tsx        # Home/Dashboard
│       │   │   ├── record.tsx       # Recording screen
│       │   │   ├── conversations.tsx
│       │   │   └── settings.tsx
│       │   ├── conversation/
│       │   │   └── [id].tsx         # Conversation detail
│       │   ├── _layout.tsx
│       │   └── sign-in.tsx
│       ├── components/
│       │   ├── RecordingWaveform.tsx
│       │   ├── ProgressIndicator.tsx
│       │   ├── AIAssetCard.tsx
│       │   ├── ConversationCard.tsx
│       │   └── Button.tsx
│       ├── services/
│       │   ├── api.ts               # REST client
│       │   ├── socket.ts            # Socket.io client
│       │   ├── auth.ts              # Firebase Auth
│       │   └── storage.ts           # Firebase Storage uploads
│       ├── hooks/
│       │   ├── useRecording.ts
│       │   ├── useTranscriptionProgress.ts
│       │   ├── useAuth.ts
│       │   └── useOfflineQueue.ts
│       ├── i18n/                    # Translations (share keys with web)
│       ├── constants/
│       │   └── theme.ts             # Brand colors, typography
│       ├── metro.config.js          # Configured for monorepo
│       ├── app.json                 # Expo config
│       ├── eas.json                 # EAS Build config
│       └── package.json
├── packages/
│   └── shared/              # Types shared by all three apps
├── turbo.json               # Add mobile to pipeline
└── package.json
```

## Technical Integration

### Monorepo Configuration

**metro.config.js** (resolve packages/shared):
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

**turbo.json** additions:
```json
{
  "pipeline": {
    "mobile#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "mobile#start": {
      "dependsOn": ["shared#build"]
    }
  }
}
```

### Audio Recording

```typescript
// Using expo-av for recording
import { Audio } from 'expo-av';

// Record in M4A format (matches API supported formats)
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
});

const recording = new Audio.Recording();
await recording.prepareToRecordAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);
await recording.startAsync();
```

### Firebase Auth

- Use `@react-native-firebase/auth` for native auth
- Share token with API via `FirebaseAuthGuard`
- Support Google OAuth with `@react-native-google-signin/google-signin`

```typescript
import auth from '@react-native-firebase/auth';

// Get token for API requests
const token = await auth().currentUser?.getIdToken();

// Include in API calls
fetch(`${API_URL}/transcription`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Real-time Progress (Socket.io)

Reuse the same event protocol as web:

```typescript
import { io } from 'socket.io-client';

const socket = io(API_URL, {
  auth: { token },
  transports: ['websocket', 'polling'], // Fallback support
});

// Subscribe to transcription updates
socket.emit('subscribe_transcription', { jobId, token });

// Listen for progress
socket.on('transcription_progress', ({ jobId, progress, stage }) => {
  // Update UI
});

socket.on('transcription_completed', ({ jobId, transcriptionId }) => {
  // Navigate to result
});
```

### Offline Support

Queue recordings locally when offline:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRecording {
  id: string;
  uri: string;
  createdAt: string;
  metadata: { title?: string };
}

// Save to queue when offline
const queueRecording = async (recording: QueuedRecording) => {
  const queue = await AsyncStorage.getItem('recordingQueue');
  const items = queue ? JSON.parse(queue) : [];
  items.push(recording);
  await AsyncStorage.setItem('recordingQueue', JSON.stringify(items));
};

// Sync on reconnection
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncQueuedRecordings();
  }
});
```

## Brand Consistency

### Colors (from CLAUDE.md)

```typescript
// constants/theme.ts
export const colors = {
  primary: '#8D6AFA',        // Brand purple
  primaryHover: '#7A5AE0',   // Darker purple
  secondary: '#14D0DC',      // Cyan for emphasis
  secondaryAlt: '#3F38A0',   // Deep purple
  accent: '#23194B',         // Dark backgrounds
  textPrimary: '#111827',    // gray-900
  textSecondary: '#374151',  // gray-700
  textHint: '#4B5563',       // gray-600
};
```

### Typography

```typescript
// Load Montserrat via expo-font
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
```

### UI Guidelines

- **Minimal text**: Few words, clarity over explanation
- **Generous spacing**: Breathing room between elements
- **Rounded buttons**: Primary CTAs use pill shape (rounded-full equivalent)
- **No clutter**: Remove unnecessary elements

## Feature Roadmap

### Phase 1: Core Recording (MVP)

| Feature | Description |
|---------|-------------|
| Sign in | Email/Password + Google OAuth |
| Record audio | Waveform visualization, pause/resume |
| Upload | Progress indicator, background upload |
| Conversations list | View all conversations |
| Real-time progress | Socket.io updates during processing |

### Phase 2: Full Experience

| Feature | Description |
|---------|-------------|
| Conversation detail | View transcript + AI assets |
| Folder organization | Browse and organize by folder |
| Push notifications | Notify when transcription completes |
| Offline queue | Record offline, sync later |
| Share | Share AI assets via native share sheet |

### Phase 3: Advanced

| Feature | Description |
|---------|-------------|
| AI Interview | Voice-guided interview feature |
| Quick actions | Widget for instant recording |
| Apple Watch | Companion app for recording |
| Siri integration | "Hey Siri, start Neural Summary recording" |

## Key Dependencies

```json
{
  "dependencies": {
    "expo": "~50.x",
    "expo-av": "~13.x",
    "expo-router": "~3.x",
    "expo-font": "~11.x",
    "@react-native-firebase/app": "^18.x",
    "@react-native-firebase/auth": "^18.x",
    "@react-native-firebase/storage": "^18.x",
    "@react-native-google-signin/google-signin": "^11.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "@react-native-community/netinfo": "^11.x",
    "socket.io-client": "^4.x",
    "@neural-summary/shared": "workspace:*"
  }
}
```

## Development Commands

```bash
# Install dependencies
cd apps/mobile && npm install

# Start Expo dev server
npm run start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for production (EAS)
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Environment Variables

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://api.neuralsummary.com
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```

## App Store Requirements

### iOS (App Store)

- [ ] Apple Developer Account ($99/year)
- [ ] App icons (1024x1024 + sizes)
- [ ] Screenshots for all device sizes
- [ ] Privacy policy URL
- [ ] App Store description and keywords
- [ ] Sign in with Apple (required if offering Google Sign-In)

### Android (Play Store)

- [ ] Google Play Developer Account ($25 one-time)
- [ ] App icons and feature graphic
- [ ] Screenshots for phone and tablet
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Data safety form

## Success Metrics

| Metric | Target |
|--------|--------|
| App Store rating | 4.5+ stars |
| Crash-free sessions | 99.5%+ |
| Recording success rate | 99%+ |
| Upload completion rate | 98%+ |
| Time to first recording | < 30 seconds after install |

## Open Questions

1. **Minimum iOS/Android versions**: iOS 14+? Android 10+?
2. **Background recording**: Allow recording with screen off?
3. **Maximum recording length**: Match web limits or different for mobile?
4. **Subscription handling**: Use RevenueCat or native StoreKit/Play Billing?
5. **Analytics**: Firebase Analytics, Mixpanel, or Amplitude?

---

## Next Steps

When ready to implement:

1. Scaffold Expo project in `apps/mobile/`
2. Configure monorepo integration (metro.config.js, turbo.json)
3. Set up Firebase for mobile (new app in Firebase Console)
4. Implement auth flow
5. Build recording screen with waveform
6. Integrate with existing API endpoints
7. Test Socket.io real-time updates
8. Configure EAS Build for CI/CD
