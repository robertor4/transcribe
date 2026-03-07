# Neural Summary Companion App - Implementation Plan

> **Status**: Planning
> **Date**: 2026-03-07
> **Goal**: Build a thin companion app (iOS + Android) for reliable audio recording and upload to Neural Summary

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Decision](#2-tech-stack-decision)
3. [Risk Register](#3-risk-register)
4. [Architecture](#4-architecture)
5. [Backend Changes Required](#5-backend-changes-required)
6. [App Structure & Screens](#6-app-structure--screens)
7. [Monorepo Integration](#7-monorepo-integration)
8. [Implementation Phases](#8-implementation-phases)
9. [App Store Strategy](#9-app-store-strategy)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

A companion mobile app that does **one thing well**: capture audio on the phone and get it into Neural Summary for processing. The web app remains the primary workspace for viewing transcripts and generating AI assets.

**Core value**: Eliminate the friction of "record elsewhere → find file → open browser → upload". Replace with: "tap record → done".

**Scope**: Recording, upload, status tracking, push notifications. No dashboard recreation.

---

## 2. Tech Stack Decision

### Chosen: React Native with Expo (SDK 55)

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| Framework | Expo SDK 55 | Latest stable (Feb 2026) | React Native 0.83, React 19.2, New Architecture only (legacy dropped) |
| Audio | `expo-audio` | v55.x | Only option — `expo-av` was removed in SDK 55. Stable since SDK 53. |
| Firebase | `@react-native-firebase/*` | v22+ | Native SDK access for large file uploads, FCM, Auth |
| Navigation | `expo-router` | v7 | File-based routing, consistent with Next.js mental model |
| State | `zustand` | v5+ | Lightweight, no boilerplate, works well with RN |
| Build | EAS Build + Submit | Latest | Cloud builds, OTA updates, store submission, no Mac needed for iOS |
| Widgets | `expo-widgets` | New in SDK 55 | iOS Home Screen Widgets and Live Activities (recording status) |

**Platform requirements**: iOS 15.1+, Android 7+ (API 24). Apple requires Xcode 16+ for App Store submissions.

### Why not alternatives?

| Option | Rejected because |
|--------|------------------|
| Flutter | Dart language — can't share TS types from `packages/shared`, team learning curve |
| Native (Swift/Kotlin) | 2x maintenance cost, 2x codebases, requires native expertise |
| PWA | No background recording, no push notifications on iOS, no App Store presence |
| Capacitor/Ionic | WebView-based — poor audio recording quality, limited background capabilities |
| Firebase JS SDK | Can't do native `putFile()` for large uploads, no FCM, no Crashlytics |

### Key constraint: No Expo Go

Using `@react-native-firebase` requires **development builds** (not Expo Go). This means:
- Local development uses `npx expo run:ios` / `npx expo run:android` or EAS development builds
- First build takes longer (~10 min via EAS)
- Subsequent builds use cache and are faster
- OTA updates still work for JS-only changes (75% smaller in SDK 55 via Hermes bytecode diffing)

This is acceptable — the recording functionality needs native code anyway.

### SDK 55 specific notes
- **Legacy Architecture dropped** — New Architecture is the only option. All libraries must be compatible.
- **expo-av removed** — not just deprecated. `expo-audio` is the sole audio recording library.
- **expo-file-system legacy `uploadAsync` deprecated** as of SDK 54. New class-based `File`/`Directory` API available, but we use `@react-native-firebase/storage` `putFile()` instead.
- **expo-widgets** enables iOS Home Screen Widgets natively — useful for a "tap to record" widget.
- **Swift 6 adoption** and ArrayBuffer support for improved binary data handling.

---

## 3. Risk Register

### CRITICAL RISKS

#### Risk 1: Android background recording
- **Status**: Open issue (expo/expo#40945, filed Nov 2025). Additional issue: recording becomes **muted after ~1 minute** in background ([#25977](https://github.com/expo/expo/issues/25977)). General Android expo-audio bugs also reported ([#39926](https://github.com/expo/expo/issues/39926)).
- **Impact**: Without a foreground service, recording pauses when the app is backgrounded on Android. iOS 18+ and Android 15 have introduced aggressive battery optimization.
- **Update (de-risked)**: `expo-audio` has a **built-in `enableBackgroundRecording` config plugin option** that automatically configures:
  - iOS: `UIBackgroundModes: ["audio"]` in Info.plist
  - Android: Foreground service with `microphone` type + persistent notification
  - This is the official Expo solution — no custom native modules needed.
- **Remaining concerns**:
  - Android 14+ requires `FOREGROUND_SERVICE_MICROPHONE` permission
  - Play Store review requires declaring foreground service permissions + video demonstrating usage
  - iOS watchdog can silently kill recordings if CPU/memory usage is too high while backgrounded
  - Audio session conflicts with other apps (phone calls, Siri) will interrupt recording
- **Mitigation options**:
  1. **Use `enableBackgroundRecording` plugin** (recommended) — Built into expo-audio, handles both platforms
  2. **Use `@siteed/expo-audio-studio`** — Third-party library with more advanced background support + waveform visualization in Android notifications
  3. **Use `react-native-audio-api`** (Software Mansion) — Has its own Expo plugin with foreground service support. More powerful but overkill for simple recording.
- **Recommendation**: Use option 1 (`enableBackgroundRecording`) from the start. It's built-in and requires no extra dependencies. Test on physical devices early — background recording does NOT work in Expo Go or simulators.

#### Risk 2: Background upload reliability
- **Status**: iOS limits background execution to ~30 seconds after app exit. Research confirmed `expo-file-system uploadAsync` is **unreliable** for large files ([expo/expo#16453](https://github.com/expo/expo/issues/16453), [#26750](https://github.com/expo/expo/issues/26750)). `react-native-background-upload` has maintenance concerns and uploads may pause when backgrounded ([#332](https://github.com/Vydia/react-native-background-upload/issues/332)).
- **Impact**: Large file uploads (>100MB) may not complete if user leaves the app. If user force-quits on iOS, **all background tasks stop immediately** — no workaround exists.
- **Mitigation**:
  1. Use `@react-native-firebase/storage` `putFile()` — Uses native NSURLSession on iOS, which the OS manages in a separate `nsurlsessiond` daemon process. This is the only reliable background transfer on iOS.
  2. **Chunked upload during recording** — Upload 5MB chunks as they're recorded (the codebase already has `ChunkUploader` for this pattern). Each chunk completes in seconds, so even if the app exits, at most one small chunk is lost.
  3. **Resumable uploads on restart** — On app relaunch, detect incomplete uploads and resume from last successful chunk. Firebase Storage `putFile()` supports pause/resume natively.
  4. Show "stay in app" prompt for very large post-recording uploads (>500MB)
- **Recommendation**: Chunked upload during recording (option 2) is the safest approach. It mirrors the existing web architecture and sidesteps the iOS background execution problem entirely.
- **What we explicitly avoid**: `expo-file-system uploadAsync` (unreliable), tus protocol (adds server complexity), custom NSURLSession native module (over-engineering for v1).

#### Risk 3: App Store rejection
- **Status**: Apple rejects "thin" apps or WebView wrappers
- **Impact**: Delayed launch, wasted effort
- **Mitigation**: The app has a clear native-only capability (audio recording with background support, offline recording queue). This is a legitimate native feature that browsers cannot replicate. Include a recording widget for the home screen.
- **Risk level**: Low — recording apps are a well-established App Store category.

### MODERATE RISKS

#### Risk 4: expo-audio API gaps vs deprecated expo-av
- Some expo-av features (initialStatus, explicit buffering) may not have equivalents in expo-audio
- **Mitigation**: We only need recording (not complex playback). The recording API is stable and well-documented.

#### Risk 5: Firebase project sharing between web and mobile
- Different SDKs (JS SDK for web, native SDK for mobile) initialize differently
- **Mitigation**: Both connect to the same Firebase project. Auth tokens are interchangeable. Security rules apply equally. Shared types from `packages/shared` work in both. Already validated in research.

#### Risk 6: Monorepo complexity
- Adding a React Native app to a Turborepo with Next.js and NestJS
- **Mitigation**: Expo projects are self-contained. The app only depends on `packages/shared` for types. No shared UI components (different rendering targets). Turborepo handles this well.

#### Risk 6.5: expo-file-system uploadAsync is unreliable
- Research confirmed multiple open issues with `expo-file-system` background uploads: silent failures on large files, `NSURLErrorDomain Code=-999` errors on iOS (SDK 50+), and extremely slow background speeds.
- **Mitigation**: Do NOT use `expo-file-system uploadAsync` for uploads. Use `@react-native-firebase/storage` `putFile()` exclusively, which bypasses these issues entirely by using the native Firebase SDK.

### LOW RISKS

#### Risk 7: WebSocket connectivity on mobile
- Mobile networks are less stable than desktop
- **Mitigation**: The codebase already has automatic polling fallback (10s intervals) when WebSocket fails. Socket.io has built-in reconnection with exponential backoff.

#### Risk 8: Audio format compatibility
- Mobile recordings need to work with AssemblyAI/Whisper transcription
- **Mitigation**: Record in **M4A (AAC) at 128 kbps**. This is the native recording format on both iOS and Android — no transcoding needed. Both AssemblyAI and OpenAI Whisper accept it directly. File size is ~1MB per minute (reasonable for mobile upload). The existing backend already accepts M4A.
- **Alternatives considered**: WAV (lossless, ~600MB/hr — too large for mobile), FLAC (lossless, ~250MB/hr — not natively recorded on mobile), WebM/Opus (web format, not native mobile recorder output).

---

## 4. Architecture

### System Architecture

```
┌──────────────────────────────────────────────────┐
│                  Mobile App                       │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Recording   │  │  Upload      │  │  Status  │ │
│  │  Service     │──│  Queue       │──│  Screen  │ │
│  │  (expo-audio)│  │  (zustand)   │  │          │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬─────┘ │
│         │                │               │        │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌────▼─────┐ │
│  │  Local File  │  │  Firebase    │  │  Socket  │ │
│  │  System      │  │  Storage     │  │  .io     │ │
│  └─────────────┘  │  (putFile)   │  │  Client  │ │
│                   └──────┬───────┘  └────┬─────┘ │
└──────────────────────────┼───────────────┼───────┘
                           │               │
                    ┌──────▼───────────────▼───────┐
                    │      Existing Backend         │
                    │      (NestJS API)             │
                    │                               │
                    │  POST /transcriptions/        │
                    │       process-from-storage    │
                    │                               │
                    │  WebSocket: progress events   │
                    │                               │
                    │  FCM: push notifications      │
                    │       (NEW - only addition)   │
                    └───────────────────────────────┘
```

### Upload Flow (Two strategies)

**Strategy A: Direct upload after recording stops** (for files < 100MB)
1. Recording completes → save to local filesystem
2. Upload file to Firebase Storage via `@react-native-firebase/storage` `putFile()`
3. Call `POST /transcriptions/process-from-storage` with the storage path
4. Subscribe to WebSocket for progress
5. Show push notification on completion

**Strategy B: Chunked upload during recording** (for long recordings)
1. Recording starts → chunks saved every ~10 seconds
2. Every ~5MB of accumulated chunks → upload to Firebase Storage
3. When recording stops → call `POST /transcriptions/process-session`
4. Backend merges chunks with FFmpeg, processes as normal
5. This mirrors the existing `ChunkUploader` pattern in the web app

### Data Flow

```
Record → Local file → Firebase Storage → Backend processes → Firestore result
                                              ↓
                                     WebSocket progress → App UI
                                              ↓
                                     FCM push notification → System notification
```

---

## 5. Backend Changes Required

### Minimal — only push notifications are new

#### 5.1 New: FCM Push Notification Module

```
apps/api/src/notifications/
  ├── notifications.module.ts      # NestJS module
  ├── notifications.service.ts     # FCM sending logic
  └── notifications.controller.ts  # Device token registration endpoint
```

**Endpoints**:
```
POST /notifications/register-device
Body: { token: string, platform: 'ios' | 'android' }
→ Stores FCM device token in Firestore (users/{uid}/devices)

DELETE /notifications/unregister-device
Body: { token: string }
→ Removes device token on logout
```

**Integration point**: Add FCM notification emission alongside existing WebSocket events in `transcription.processor.ts`:
```typescript
// Existing: WebSocket event
this.websocketGateway.emitTranscriptionCompleted(transcriptionId);

// New: FCM push notification
this.notificationsService.sendTranscriptionCompleted(userId, transcriptionId, title);
```

**Firestore schema addition**:
```
users/{uid}/devices/{tokenHash}
  ├── token: string (FCM token)
  ├── platform: 'ios' | 'android'
  ├── createdAt: Timestamp
  └── lastUsed: Timestamp
```

#### 5.2 No other backend changes needed

The mobile app uses the **exact same endpoints** as the web app:
- `POST /transcriptions/process-from-storage` — already exists
- `POST /transcriptions/process-session` — already exists
- `GET /transcriptions/summaries` — already exists
- WebSocket `subscribe_transcription` — already exists
- Firebase Auth token validation — already works (token is token, regardless of client)

---

## 6. App Structure & Screens

### Navigation Structure

```
(auth)
  ├── login.tsx          # Firebase Auth (email/password + Google)
  └── register.tsx       # Account creation

(tabs)
  ├── record.tsx         # Main recording screen (default tab)
  ├── recordings.tsx     # List of recordings with status
  └── settings.tsx       # Account, notifications, about

(stack)
  ├── confirm-upload.tsx  # Post-recording: optional context field + upload button
  └── recording/[id].tsx  # Recording detail (transcript preview + "View full details" → web)
```

### Screen Specs

#### 1. Record Screen (Main — default tab)
- Large, prominent record button (center of screen)
- Timer display during recording
- Audio level visualization — two options:
  - **`@simform_solutions/react-native-audio-waveform`** — ready-made, native waveform for live recording and playback
  - **DIY with expo-audio metering** — set `isMeteringEnabled: true`, get dB levels per update, render with `react-native-svg` or `react-native-skia` (lighter dependency)
- Pause/resume button
- Stop button → triggers upload
- Optional: context input field ("What is this recording about?")
- Optional: folder picker (select destination folder)

#### 2. Recordings List
- List of all recordings, sorted by date (newest first)
- Each item shows: title/filename, date, duration, status badge
- Status badges: Recording, Uploading (with %), Processing, Ready, Failed
- Tap → opens in web app (deep link) or shows basic transcript preview
- Pull-to-refresh

#### 3. Recording Detail (Basic)
- Title (editable)
- Recording metadata (date, duration, file size)
- Status with progress indicator
- Basic transcript text (read-only, if completed)
- "View full details" button → deep link to web app
- Share button (existing share API)

#### 4. Settings
- Account info (name, email, subscription tier)
- Notification preferences (on/off, which events)
- Audio quality settings (high/medium/low → maps to bitrate)
- Default recording format
- Storage usage
- Sign out
- App version, links to privacy policy / terms

#### 5. Login
- Email/password form
- Google Sign-In button
- "Sign up" link
- Consistent with web app auth flow (same Firebase project)

### Widget (iOS)
- Simple "tap to record" widget for home screen
- Shows last recording status
- Launches app directly into recording mode

---

## 7. Monorepo Integration

### Directory Structure

```
transcribe/
  ├── apps/
  │   ├── api/              # Existing NestJS backend
  │   ├── web/              # Existing Next.js frontend
  │   └── mobile/           # NEW: React Native (Expo) app
  │       ├── app/           # Expo Router screens
  │       │   ├── (auth)/
  │       │   ├── (tabs)/
  │       │   └── _layout.tsx
  │       ├── components/    # Mobile-specific components
  │       ├── hooks/         # Custom hooks (useRecording, useUpload)
  │       ├── services/      # Firebase, API, upload services
  │       ├── stores/        # Zustand stores
  │       ├── app.json       # Expo config
  │       ├── eas.json       # EAS Build config
  │       ├── package.json
  │       └── tsconfig.json
  ├── packages/
  │   └── shared/            # Shared TypeScript types (already exists)
  └── turbo.json             # Add mobile tasks
```

### Turborepo Config Addition

```json
// turbo.json — add to pipeline
{
  "dev:mobile": {
    "dependsOn": ["^build"],
    "cache": false,
    "persistent": true
  },
  "build:mobile": {
    "dependsOn": ["^build"],
    "outputs": ["dist/**"]
  }
}
```

### Shared Code from `packages/shared`

The mobile app imports these types directly:
- `TranscriptionStatus` enum
- `AnalysisType` enum
- `TranscriptionProgress` interface
- `SpeakerSegment` interface
- `SummaryV2` interface
- WebSocket event constants

No new shared code needed — the existing types are sufficient.

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: App skeleton with auth working

- [ ] Initialize Expo project in `apps/mobile/`
- [ ] Configure `@react-native-firebase/app` with config plugin
- [ ] Set up `@react-native-firebase/auth` (email + Google Sign-In)
- [ ] Verify auth token works with existing NestJS API
- [ ] Set up Expo Router with tab navigation
- [ ] Configure EAS Build for development builds (iOS + Android)
- [ ] Import types from `packages/shared`
- [ ] Set up zustand store for auth state

**De-risking checkpoint**: Can we authenticate and call the API from the mobile app?

### Phase 2: Recording (Week 3-4)

**Goal**: Record audio reliably on both platforms

- [ ] Implement recording screen with `expo-audio`
- [ ] Audio permissions flow (microphone)
- [ ] Recording controls (start, pause, resume, stop)
- [ ] Timer and audio level display
- [ ] Save recordings to local filesystem
- [ ] Test recording quality (M4A format, 128kbps bitrate)
- [ ] Test iOS background recording (UIBackgroundModes: audio)
- [ ] Enable `enableBackgroundRecording` config plugin (iOS + Android)
- [ ] Test Android foreground service notification during recording
- [ ] Implement audio level visualization

**De-risking checkpoint**: Does a recording on the phone produce a file that AssemblyAI/Whisper can transcribe accurately?

### Phase 3: Upload & Progress (Week 5-6)

**Goal**: Upload recordings and track processing status

- [ ] Post-recording confirmation screen (optional context field + upload button)
- [ ] Implement `@react-native-firebase/storage` upload with `putFile()`
- [ ] Upload progress tracking (bytes transferred / total)
- [ ] Implement upload queue (zustand store persisted with MMKV)
- [ ] Socket.io client for real-time progress
- [ ] Polling fallback when WebSocket fails
- [ ] Recordings list screen with status badges
- [ ] Basic transcript preview (read-only)
- [ ] Error handling and retry logic
- [ ] Test with large files (100MB+)

**De-risking checkpoint**: Does the full record → upload → process → result flow work end-to-end?

### Phase 4: Push Notifications (Week 7)

**Goal**: Notify users when transcription is ready

- [ ] Backend: Create notifications module (FCM)
- [ ] Backend: Device token registration endpoint
- [ ] Backend: Emit FCM on transcription_completed
- [ ] Mobile: Register for push notifications
- [ ] Mobile: Handle notification taps (deep link to recording)
- [ ] Test on physical devices (notifications don't work on simulators)

### Phase 5: Polish & Ship (Week 8-9)

**Goal**: Production-ready app

- [ ] Settings screen
- [ ] Error states and empty states
- [ ] Offline recording queue (record now, upload later)
- [ ] App icon and splash screen (Neural Summary branding)
- [ ] Localization: all 5 languages (en, nl, de, fr, es) using expo-localization + i18n-js
- [ ] Deep links to web app for full details ("View full details" button)
- [ ] Haptic feedback on record actions
- [ ] Dark mode support
- [ ] Accessibility audit (VoiceOver, TalkBack)
- [ ] EAS Submit configuration for App Store + Play Store
- [ ] App Store screenshots and descriptions
- [ ] TestFlight beta + Google Play internal testing
- [ ] Privacy policy updates (microphone permission justification)

### Phase 6: Post-Launch (Week 10+)

- [ ] iOS home screen widget ("tap to record")
- [ ] Chunked upload during recording (for very long recordings)
- [ ] Folder selection before recording
- [ ] Siri Shortcuts / Android Quick Tile integration
- [ ] Analytics (recording frequency, upload success rate)

---

## 9. App Store Strategy

### App Store (iOS)

**Name**: Neural Summary - Voice Recorder
**Subtitle**: Record. Upload. Get Documents.
**Category**: Productivity
**Keywords**: voice recorder, transcription, meeting notes, audio to text, AI summary

**Privacy labels required**:
- Microphone usage: "Record audio for transcription"
- Data collected: Email (account), audio files (transcription)
- Data linked to user: Yes (Firebase Auth)

**Review considerations**:
- App has clear native functionality (audio recording)
- Not a WebView wrapper
- Has offline capability (record without internet)
- Must include account deletion feature (Apple requirement since 2022)

### Google Play (Android)

**Name**: Neural Summary - Voice Recorder
**Category**: Productivity
**Content rating**: Everyone

**Permissions**:
- `RECORD_AUDIO` — core functionality
- `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MICROPHONE` — background recording (v1)
- `POST_NOTIFICATIONS` — push notifications
- `INTERNET` — upload and API

### Pricing
- Free download (matches web app model)
- Recording/upload requires Neural Summary account
- Feature limits match web subscription tier (free/pro/enterprise)

---

## 10. Decisions (Resolved)

| # | Question | Decision |
|---|----------|----------|
| 1 | **App name** | "Neural Summary - Voice Recorder" — brand first, descriptor after dash |
| 2 | **Recording quality** | 128kbps AAC in M4A container (~1MB/min) |
| 3 | **Offline behavior** | Unlimited offline recordings. Check quotas only at upload time. Never block recording. |
| 4 | **Deep link strategy** | Both — show basic in-app transcript preview + "View full details" button that opens web app |
| 5 | **Android background recording** | Enable from v1 using expo-audio's `enableBackgroundRecording` plugin. Handle Play Store foreground service declaration. |
| 6 | **Context field** | Yes — optional post-recording. Show on confirmation screen after recording stops, before upload. Non-blocking. |
| 7 | **iOS widget** | Defer to v1.1 |
| 8 | **Localization** | All 5 languages from day one (en, nl, de, fr, es) |
| 9 | **Analytics** | Defer — decide during implementation |

---

## References

### Research Sources

- [Expo SDK 53 Checklist (LogRocket)](https://blog.logrocket.com/expo-sdk-53-checklist/)
- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [expo-av Deprecation Notice](https://docs.expo.dev/versions/latest/sdk/av/)
- [Android Background Recording Issue (expo/expo#40945)](https://github.com/expo/expo/issues/40945)
- [expo-audio vs expo-av Migration Gaps (expo/expo#38061)](https://github.com/expo/expo/issues/38061)
- [React Native Firebase Official Docs](https://rnfirebase.io/)
- [Expo Firebase Integration Guide](https://docs.expo.dev/guides/using-firebase/)
- [@siteed/expo-audio-studio (Alternative)](https://www.npmjs.com/package/@siteed/expo-audio-studio)
- [react-native-background-upload (Vydia)](https://github.com/Vydia/react-native-background-upload)
- [@kesha-antonov/react-native-background-downloader](https://github.com/kesha-antonov/react-native-background-downloader)

### Existing Codebase Integration Points

- **Upload endpoint**: `apps/api/src/transcription/transcription.controller.ts` — `POST /transcriptions/process-from-storage`
- **Chunked upload**: `apps/web/utils/chunkUploader.ts` — pattern to replicate for mobile
- **Direct upload**: `apps/web/utils/directUpload.ts` — Firebase Storage upload flow
- **WebSocket gateway**: `apps/api/src/websocket/websocket.gateway.ts` — progress events
- **Auth guard**: `apps/api/src/auth/firebase-auth.guard.ts` — token validation
- **Shared types**: `packages/shared/src/types.ts` — reuse in mobile app
- **WebSocket constants**: `packages/shared/src/constants.ts` — event names
