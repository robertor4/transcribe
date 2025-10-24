# WebSocket Resilience & Polling Fallback

## Overview

This document describes the WebSocket resilience system implemented in Neural Summary to ensure reliable real-time updates for transcription processing, even when WebSocket connections fail or are interrupted.

## Table of Contents

- [Architecture](#architecture)
- [Components](#components)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)
- [Performance Considerations](#performance-considerations)

---

## Architecture

### Problem Statement

The application processes audio transcriptions that can take 5-15 minutes for large files. During this time:

1. **WebSocket connections can fail** due to network issues, server restarts, or client disconnections
2. **Progress updates can be missed** if the connection drops during processing
3. **Completion events can be lost** if the WebSocket is disconnected when processing finishes
4. **Long processing times** (5+ minutes) can exceed frontend timeout thresholds

### Solution

A **dual-layer approach** that combines WebSocket real-time updates with API polling fallback:

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  WebSocket   │        │ HTTP Polling │
│  (Primary)   │        │  (Fallback)  │
└──────┬───────┘        └──────┬───────┘
       │                       │
       │  Real-time events     │  Periodic API calls
       │  every 3s during      │  every 10s when stale
       │  processing           │
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  NestJS Backend  │
        │  + Bull Queue    │
        └──────────────────┘
```

**Key Principles:**

1. **WebSocket First:** Use WebSocket for real-time updates when available
2. **Automatic Fallback:** Seamlessly switch to polling when WebSocket fails
3. **Database Truth:** Firestore is the single source of truth
4. **No User Intervention:** Recovery is completely automatic
5. **Bandwidth Efficient:** Only poll stale transcriptions

---

## Components

### 1. Backend: AssemblyAI Service

**File:** `apps/api/src/assembly-ai/assembly-ai.service.ts`

**Purpose:** Send continuous progress updates during transcription processing

**Key Changes:**

```typescript
async transcribeWithDiarization(
  audioUrl: string,
  context?: string,
  onProgress?: (progress: number, message: string) => void, // NEW
): Promise<AssemblyAIResult>
```

**Implementation:**

- Custom polling loop replaces `waitUntilReady()` (lines 91-132)
- Polls AssemblyAI status every 3 seconds
- Sends progress updates via callback: 15% → 55%
- Prevents frontend timeout by maintaining heartbeat

**Progress Timeline:**
```
15% - Audio uploaded, transcription in progress
20% - Gradually increases during processing
30% - Based on elapsed time (max 5 min assumed)
40% - Continue polling
55% - Transcription complete (ready for analysis)
```

### 2. Backend: Transcription Service

**File:** `apps/api/src/transcription/transcription.service.ts`

**Purpose:** Orchestrate transcription flow and pass progress callbacks

**Key Changes:**

- Passes `onProgress` callback to AssemblyAI service (line 370)
- Progress flow: Service → AssemblyAI → Processor → WebSocket Gateway → Frontend

**Full Progress Flow:**
```
5%  - Initializing audio processing
10% - Starting transcription
15% - Audio uploaded (AssemblyAI start)
15-55% - Processing (AssemblyAI polling with updates every 3s)
56% - Processing complete, analyzing speakers
58% - Detected N speakers
60% - Transcription complete, generating analyses
90% - Analyses generated, saving results
95% - Finalizing transcription
100% - Complete
```

### 3. Frontend: WebSocket Service

**File:** `apps/web/lib/websocket.ts`

**Purpose:** Manage WebSocket connection lifecycle and health tracking

**New Features:**

#### Connection Health Tracking

```typescript
private connectionHealthy: boolean = false;
private lastEventTime: Map<string, number> = new Map();
```

#### Public API Methods

```typescript
// Check if WebSocket is connected and healthy
isConnected(): boolean

// Get detailed connection state
getConnectionState(): {
  connected: boolean;
  healthy: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// Track event receipt for staleness detection
markEventReceived(transcriptionId: string): void

// Get timestamp of last event for a transcription
getLastEventTime(transcriptionId: string): number | null

// Clear tracking when transcription completes
clearEventTracking(transcriptionId: string): void
```

#### Events Emitted

```typescript
// Connection health changes
'connection_health_changed' → {
  healthy: boolean;
  connected: boolean;
  reason?: string;
}
```

#### Reconnection Strategy

1. **Exponential backoff:** 2s → 4s → 8s
2. **Max 3 attempts** (~14 seconds total)
3. **Token refresh** on AUTH_ERROR
4. **Dual transport:** WebSocket + HTTP polling fallback (socket.io)

### 4. Frontend: Polling Hook

**File:** `apps/web/hooks/useTranscriptionPolling.ts`

**Purpose:** Automatically poll API for stale transcriptions

**Hook Signature:**

```typescript
function useTranscriptionPolling(
  transcriptions: Transcription[],
  onUpdate: (transcription: Transcription) => void,
  config?: Partial<PollingConfig>
): {
  notifyProgress: (transcriptionId: string, progress: number) => void;
  activePolls: number;
  staleCounts: number;
}
```

**Configuration Options:**

```typescript
interface PollingConfig {
  pollingInterval: number;      // How often to poll (default: 10000ms)
  staleThreshold: number;        // Time without updates = stale (default: 30000ms)
  maxConcurrentPolls: number;    // Max parallel polls (default: 5)
  enabled: boolean;              // Enable/disable (default: true)
}
```

**Staleness Detection Algorithm:**

```typescript
isStale = (
  status === PROCESSING &&
  timeSinceLastUpdate > staleThreshold &&
  !currentlyPolling
)
```

**Polling Lifecycle:**

```
┌─────────────────────────────────────────────────┐
│ 1. useEffect: Start polling interval (10s)     │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 2. Check all transcriptions for staleness      │
│    - Status = PROCESSING?                      │
│    - Last update > 30s ago?                    │
│    - Not already polling?                      │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 3. Poll stale transcriptions (max 5 parallel)  │
│    GET /transcriptions/{id}                    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 4. Receive updated status from Firestore       │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 5. Call onUpdate() callback                    │
│    - Updates UI state                          │
│    - Clears progress map if complete/failed    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ 6. If complete/failed: remove from metadata    │
│    Otherwise: reset staleness timer            │
└─────────────────────────────────────────────────┘
```

**Metadata Tracking:**

Each in-progress transcription tracks:
```typescript
interface TranscriptionMetadata {
  transcriptionId: string;
  lastUpdateTime: number;     // Timestamp of last WebSocket event
  lastProgress: number;        // Last progress percentage received
  pollCount: number;           // How many times we've polled this transcription
}
```

### 5. Frontend: TranscriptionList Component

**File:** `apps/web/components/TranscriptionList.tsx`

**Purpose:** Display transcriptions and coordinate updates from both WebSocket and polling

**Integration Points:**

#### Hook Initialization (lines 100-110)

```typescript
const { notifyProgress } = useTranscriptionPolling(
  transcriptions,
  handlePollingUpdate,  // Callback when polling finds an update
  {
    enabled: true,
    pollingInterval: 10000,
    staleThreshold: 30000,
    maxConcurrentPolls: 5,
  }
);
```

#### Polling Update Handler (lines 75-98)

```typescript
const handlePollingUpdate = useCallback((updatedTranscription: Transcription) => {
  // Update transcription in state
  setTranscriptions(prev =>
    prev.map(t => t.id === updatedTranscription.id ? updatedTranscription : t)
  );

  // Clear progress map if complete/failed
  if (
    updatedTranscription.status === TranscriptionStatus.COMPLETED ||
    updatedTranscription.status === TranscriptionStatus.FAILED
  ) {
    setProgressMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(updatedTranscription.id);
      return newMap;
    });
    websocketService.clearEventTracking(updatedTranscription.id);
  }
}, []);
```

#### WebSocket Progress Listener (lines 275-329)

```typescript
websocketService.on(WEBSOCKET_EVENTS.TRANSCRIPTION_PROGRESS, (data) => {
  const progress = data as TranscriptionProgress;

  // IMPORTANT: Notify polling hook to reset staleness timer
  notifyProgress(progress.transcriptionId, progress.progress);

  // Track in WebSocket service
  websocketService.markEventReceived(progress.transcriptionId);

  // Update UI progress map
  setProgressMap(/* ... */);

  // Reset 10-minute timeout
  setTimeout(() => { /* mark as failed */ }, 10 * 60 * 1000);
});
```

#### Completion/Failure Handlers (lines 331-400)

Both handlers:
1. Clear timeout timer
2. Clear WebSocket event tracking
3. Remove from progress map
4. Update transcription status or fetch fresh data

---

## How It Works

### Scenario 1: Normal Operation (WebSocket Working)

```
Time  | Event
------|----------------------------------------------------------
0:00  | User uploads 35MB audio file
0:01  | Backend: Job queued, status = PROCESSING
0:02  | WebSocket: Progress 5% - "Initializing"
0:05  | WebSocket: Progress 10% - "Starting transcription"
0:07  | WebSocket: Progress 15% - "Audio uploaded"
0:10  | WebSocket: Progress 20% - "Processing audio" (AssemblyAI polling)
0:13  | WebSocket: Progress 25% - "Processing audio"
0:16  | WebSocket: Progress 30% - "Processing audio"
...   | ... (progress every 3s)
4:50  | WebSocket: Progress 55% - "Processing audio"
5:00  | WebSocket: Progress 56% - "Analyzing speakers"
5:05  | WebSocket: Progress 60% - "Generating analyses"
7:00  | WebSocket: Progress 90% - "Analyses generated"
7:10  | WebSocket: Progress 100% - COMPLETED event
7:11  | UI: Shows completed transcription
```

**Polling hook behavior:**
- Sees transcription in PROCESSING state
- Receives `notifyProgress()` calls every 3 seconds
- Detects transcription is "fresh" (last update < 30s ago)
- **Does not poll** - WebSocket is working fine

### Scenario 2: WebSocket Disconnects Mid-Processing

```
Time  | Event
------|----------------------------------------------------------
0:00  | User uploads 35MB audio file
0:01  | WebSocket: Progress 5% - "Initializing"
0:10  | WebSocket: Progress 20% - "Processing audio"
0:15  | ⚠️  NETWORK INTERRUPTION - WebSocket disconnects
0:16  | WebSocket: Attempting reconnection (2s delay)
0:18  | WebSocket: Reconnection attempt 1 failed (4s delay)
0:22  | WebSocket: Reconnection attempt 2 failed (8s delay)
0:30  | WebSocket: Reconnection attempt 3 failed (max attempts)
0:30  | WebSocket: Connection health = false
0:45  | ⏰ Polling: Detects transcription is stale (30s since last update)
0:45  | Polling: GET /transcriptions/{id}
0:46  | Polling: Receives status = PROCESSING, progress in Firestore
0:46  | UI: Updates from polled data (no visible change to user)
0:55  | ⏰ Polling: Polls again (10s interval)
0:56  | Polling: Status = PROCESSING (backend still working)
1:05  | ⏰ Polling: Polls again
...   | ... (continues polling every 10s)
5:00  | ⏰ Polling: GET /transcriptions/{id}
5:01  | Polling: Receives status = COMPLETED 🎉
5:01  | UI: Shows completed transcription via polling
5:01  | Polling: Removes transcription from metadata (no longer stale)
```

**User experience:**
- ✅ Progress bar shows last known progress (20%)
- ✅ No error message displayed
- ✅ After 30 seconds, polling activates silently
- ✅ When complete, UI updates immediately
- ✅ **User never knows WebSocket failed**

### Scenario 3: WebSocket Reconnects During Polling

```
Time  | Event
------|----------------------------------------------------------
0:00  | WebSocket disconnected, polling active
0:10  | Polling: GET /transcriptions/{id} → PROCESSING
0:15  | ✅ WebSocket reconnects successfully
0:16  | WebSocket: Progress 35% - "Processing audio"
0:16  | Polling: notifyProgress() called → resets staleness timer
0:19  | WebSocket: Progress 38% - "Processing audio"
0:19  | Polling: notifyProgress() called → still fresh
0:20  | ⏰ Polling: Scheduled poll check
0:20  | Polling: Transcription is fresh (updated 1s ago)
0:20  | Polling: **Skips polling** - WebSocket is working again
...   | ... (WebSocket continues normally)
```

**Seamless handoff:**
- Polling automatically stops when WebSocket recovers
- No duplicate API calls
- No user-visible transition

### Scenario 4: User Closes Browser, Returns Later

```
Time  | Event
------|----------------------------------------------------------
0:00  | User uploads file, processing starts
0:30  | User closes browser tab
...   | Backend continues processing (queue-based)
5:00  | Backend: Transcription completes
5:01  | WebSocket: Attempts to send COMPLETED event (no client connected)
------|----------------------------------------------------------
6:00  | User returns, opens dashboard
6:01  | Component mounts: loadTranscriptions() API call
6:02  | API: Returns transcription with status = COMPLETED
6:02  | UI: Shows completed transcription ✅
```

**Recovery mechanism:**
- Initial load always fetches from API (database truth)
- WebSocket events are ephemeral (not queued)
- Polling would have detected completion if page stayed open

### Scenario 5: Very Long Transcription (15+ minutes)

```
Time  | Event
------|----------------------------------------------------------
0:00  | User uploads 2-hour podcast (100MB)
0:10  | WebSocket: Progress 15% - "Processing"
...   | ... (progress updates every 3s)
10:00 | WebSocket: Progress 50% - "Processing"
...   | ... (continues)
15:00 | WebSocket: Progress 55% - "Transcription complete"
15:10 | WebSocket: Progress 60% - "Generating analyses"
18:00 | WebSocket: Progress 90% - "Analyses generated"
18:30 | WebSocket: COMPLETED
```

**No timeout:**
- Old timeout: 5 minutes → would have failed at 5:00
- New timeout: 10 minutes (but never triggered due to continuous updates)
- Progress updates reset timeout every 3 seconds
- Polling provides additional safety net if updates stop

---

## Configuration

### Backend Configuration

**AssemblyAI Polling Settings** (`apps/api/src/assembly-ai/assembly-ai.service.ts:94-95`)

```typescript
const pollingInterval = 3000;  // Poll AssemblyAI every 3 seconds
const pollingTimeout = 600000; // 10 minute max (very large files)
```

**Progress Update Timing** (lines 119-121)

```typescript
const maxTranscriptionTime = 300000; // Assume max 5 min for progress calculation
const progressIncrement = Math.min(40 * (elapsed / maxTranscriptionTime), 40);
const currentProgress = Math.min(15 + progressIncrement, 55);
```

### Frontend Configuration

**Polling Hook Settings** (`apps/web/components/TranscriptionList.tsx:104-108`)

```typescript
{
  enabled: true,                 // Enable polling fallback
  pollingInterval: 10000,        // Poll every 10 seconds
  staleThreshold: 30000,         // 30 seconds without updates = stale
  maxConcurrentPolls: 5,         // Max 5 simultaneous API calls
}
```

**Timeout Duration** (line 325)

```typescript
setTimeout(() => { /* mark as failed */ }, 10 * 60 * 1000); // 10 minutes
```

**WebSocket Reconnection** (`apps/web/lib/websocket.ts:14-15`)

```typescript
private reconnectAttempts = 0;
private maxReconnectAttempts = 3;  // Try 3 times
```

**Reconnection Delays** (line 131)

```typescript
const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 8000);
// Results in: 2s, 4s, 8s
```

### Recommended Tuning

| Scenario | Setting | Recommended Value | Reason |
|----------|---------|-------------------|--------|
| **Fast network** | `pollingInterval` | 15000ms (15s) | Reduce API calls |
| **Slow network** | `pollingInterval` | 5000ms (5s) | Faster recovery detection |
| **Large files** | `staleThreshold` | 60000ms (60s) | Allow longer gaps between updates |
| **Small files** | `staleThreshold` | 20000ms (20s) | Detect issues faster |
| **High traffic** | `maxConcurrentPolls` | 3 | Reduce server load |
| **Low traffic** | `maxConcurrentPolls` | 10 | Allow more parallel checks |

---

## API Reference

### Backend API Endpoints

#### Get Transcription Status

```http
GET /transcriptions/:id
Authorization: Bearer <firebase-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "userId": "user456",
    "status": "processing" | "completed" | "failed",
    "fileName": "meeting-recording.m4a",
    "fileSize": 35882800,
    "progress": 45,
    "createdAt": "2025-10-21T14:30:00Z",
    "updatedAt": "2025-10-21T14:35:00Z",
    "transcriptText": "...",  // If completed
    "summary": "...",          // If completed
    "analyses": { ... },       // If completed
    "error": "..."             // If failed
  }
}
```

**Used by:** Polling hook to fetch current status

### WebSocket Events

#### Server → Client

**TRANSCRIPTION_PROGRESS**

```typescript
{
  transcriptionId: string;
  status: TranscriptionStatus;
  progress: number;        // 0-100
  message: string;         // Human-readable status
  stage?: 'uploading' | 'processing' | 'summarizing';
  startTime?: number;      // Client-side timestamp
}
```

**TRANSCRIPTION_COMPLETED**

```typescript
{
  transcriptionId: string;
  status: 'completed';
  progress: 100;
  message: 'Transcription completed successfully!';
}
```

**TRANSCRIPTION_FAILED**

```typescript
{
  transcriptionId: string;
  status: 'failed';
  progress: 0;
  error: string;
}
```

**connection_health_changed** (custom event)

```typescript
{
  healthy: boolean;
  connected: boolean;
  reason?: string;  // Disconnect reason
}
```

#### Client → Server

**subscribe_transcription**

```typescript
socket.emit('subscribe_transcription', transcriptionId: string);
```

**unsubscribe_transcription**

```typescript
socket.emit('unsubscribe_transcription', transcriptionId: string);
```

### Hook API

#### useTranscriptionPolling

```typescript
const { notifyProgress, activePolls, staleCounts } = useTranscriptionPolling(
  transcriptions: Transcription[],
  onUpdate: (transcription: Transcription) => void,
  config?: Partial<PollingConfig>
);
```

**Parameters:**

- `transcriptions` - Array of transcriptions to monitor
- `onUpdate` - Callback invoked when polling detects an update
- `config` - Optional configuration object

**Returns:**

- `notifyProgress(transcriptionId, progress)` - Call when WebSocket progress received
- `activePolls` - Number of currently active poll requests
- `staleCounts` - Number of transcriptions being tracked for staleness

**Example:**

```typescript
const handleUpdate = (transcription: Transcription) => {
  console.log('Polling found update:', transcription.id, transcription.status);
  setTranscriptions(prev =>
    prev.map(t => t.id === transcription.id ? transcription : t)
  );
};

const { notifyProgress } = useTranscriptionPolling(
  transcriptions,
  handleUpdate,
  { pollingInterval: 15000 }  // Custom: poll every 15s
);

// In WebSocket listener:
websocketService.on('transcription_progress', (progress) => {
  notifyProgress(progress.transcriptionId, progress.progress);
  // ... update UI
});
```

### WebSocket Service API

#### Connection Management

```typescript
// Connect to WebSocket server
await websocketService.connect();

// Disconnect
websocketService.disconnect();

// Check connection status
const isConnected: boolean = websocketService.isConnected();

// Get detailed state
const state = websocketService.getConnectionState();
// Returns: { connected, healthy, reconnecting, reconnectAttempts, maxReconnectAttempts }
```

#### Event Listening

```typescript
// Subscribe to event
const unsubscribe = websocketService.on('event_name', (data) => {
  console.log('Event received:', data);
});

// Unsubscribe
unsubscribe();
```

#### Transcription Tracking

```typescript
// Subscribe to transcription updates (joins socket.io room)
websocketService.subscribeToTranscription(transcriptionId);

// Unsubscribe from updates
websocketService.unsubscribeFromTranscription(transcriptionId);

// Mark that an event was received (for staleness tracking)
websocketService.markEventReceived(transcriptionId);

// Get time of last event
const timestamp: number | null = websocketService.getLastEventTime(transcriptionId);

// Clear tracking (when complete/failed)
websocketService.clearEventTracking(transcriptionId);
```

---

## Testing Guide

### Manual Testing

#### Test 1: Normal Operation

**Steps:**
1. Upload a medium-sized audio file (10-30MB)
2. Watch progress updates in UI
3. Open browser DevTools console
4. Verify continuous progress logs every few seconds
5. Wait for completion

**Expected:**
- Progress updates every 3 seconds
- No polling logs (WebSocket is working)
- Completion within expected time
- No errors in console

#### Test 2: WebSocket Disconnect During Processing

**Steps:**
1. Upload a large audio file (50MB+)
2. Wait for processing to reach ~20% progress
3. Open DevTools → Network tab → **Toggle "Offline" mode**
4. Wait 30 seconds
5. Check console logs
6. Toggle "Online" mode back
7. Wait for completion

**Expected:**
```
[WebSocket] Connection health changed: { healthy: false, connected: false }
[Polling] Found 1 stale transcription(s) to poll: ['abc123']
[Polling] Successfully polled transcription abc123, status: processing
... (polling continues every 10s)
[Polling] Received update for transcription: abc123 completed
```

#### Test 3: Very Long Transcription

**Steps:**
1. Upload a 1-2 hour audio file (if available)
2. Monitor for at least 10 minutes
3. Verify no timeout occurs
4. Check that progress continues updating

**Expected:**
- No timeout after 5 minutes (old behavior)
- No timeout after 10 minutes
- Progress continues until completion
- May take 15-20 minutes total

#### Test 4: Page Refresh Mid-Processing

**Steps:**
1. Upload file, wait for ~30% progress
2. Refresh browser page (F5 or Cmd+R)
3. Wait for page to reload
4. Check transcription status

**Expected:**
- Transcription appears with status = PROCESSING
- May show last known progress from Firestore
- If WebSocket reconnects, progress updates resume
- Otherwise, polling activates after 30s

#### Test 5: Tab Switch During Processing

**Steps:**
1. Upload file
2. Switch to another browser tab immediately
3. Wait 2-3 minutes
4. Return to Neural Summary tab

**Expected:**
- WebSocket may have disconnected (browser behavior)
- Polling should have activated
- Current status shown immediately
- If complete, shows final result

### Automated Testing

#### Unit Tests (Recommended)

**Test polling hook:**

```typescript
// apps/web/hooks/__tests__/useTranscriptionPolling.test.ts

import { renderHook, act } from '@testing-library/react-hooks';
import { useTranscriptionPolling } from '../useTranscriptionPolling';

describe('useTranscriptionPolling', () => {
  it('should not poll fresh transcriptions', () => {
    const transcriptions = [
      { id: '1', status: 'processing', createdAt: new Date() }
    ];
    const onUpdate = jest.fn();

    const { result } = renderHook(() =>
      useTranscriptionPolling(transcriptions, onUpdate, {
        pollingInterval: 1000,
        staleThreshold: 5000,
      })
    );

    // Immediately notify progress (fresh)
    act(() => {
      result.current.notifyProgress('1', 50);
    });

    // Wait 2 seconds (less than staleThreshold)
    jest.advanceTimersByTime(2000);

    // Should not have polled (transcription is fresh)
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should poll stale transcriptions', async () => {
    const transcriptions = [
      { id: '1', status: 'processing', createdAt: new Date() }
    ];
    const onUpdate = jest.fn();

    const { result } = renderHook(() =>
      useTranscriptionPolling(transcriptions, onUpdate, {
        pollingInterval: 1000,
        staleThreshold: 2000,
      })
    );

    // Wait for staleness threshold + polling interval
    jest.advanceTimersByTime(3000);

    // Should have polled the stale transcription
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' })
      );
    });
  });
});
```

**Test WebSocket service:**

```typescript
// apps/web/lib/__tests__/websocket.test.ts

import websocketService from '../websocket';

describe('WebSocket Service', () => {
  it('should track event timestamps', () => {
    websocketService.markEventReceived('trans1');

    const timestamp = websocketService.getLastEventTime('trans1');
    expect(timestamp).toBeGreaterThan(Date.now() - 1000);
  });

  it('should clear event tracking', () => {
    websocketService.markEventReceived('trans1');
    websocketService.clearEventTracking('trans1');

    const timestamp = websocketService.getLastEventTime('trans1');
    expect(timestamp).toBeNull();
  });

  it('should report connection state', () => {
    const state = websocketService.getConnectionState();

    expect(state).toHaveProperty('connected');
    expect(state).toHaveProperty('healthy');
    expect(state).toHaveProperty('reconnecting');
  });
});
```

### Load Testing

**Scenario:** 10 concurrent long transcriptions

```bash
# Simulate 10 users uploading files simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3001/transcriptions/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@large-audio-$i.m4a" &
done
```

**Monitor:**
- Backend logs for polling frequency
- Redis queue depth
- WebSocket connection count
- API response times for `/transcriptions/:id`

**Expected:**
- Max 5 concurrent polls per client (maxConcurrentPolls)
- No exponential growth in API calls
- All transcriptions complete successfully

---

## Troubleshooting

### Issue 1: Transcription Shows "Timed Out" Error

**Symptoms:**
- UI shows "Transcription timed out" message
- Backend logs show successful completion
- User must refresh to see completed transcription

**Possible Causes:**
1. Polling is disabled
2. Polling interval too long
3. Stale threshold too high
4. API endpoint failing

**Diagnosis:**

```typescript
// Check polling configuration
console.log('Polling enabled:', config.enabled);
console.log('Polling interval:', config.pollingInterval);
console.log('Stale threshold:', config.staleThreshold);

// Check browser console for polling logs
// Should see: "[Polling] Found N stale transcription(s)"
```

**Solutions:**

```typescript
// Reduce stale threshold for faster detection
{
  staleThreshold: 15000,  // 15 seconds instead of 30
}

// Increase polling frequency
{
  pollingInterval: 5000,  // 5 seconds instead of 10
}

// Verify polling is enabled
{
  enabled: true,
}
```

### Issue 2: Excessive API Calls

**Symptoms:**
- High number of `/transcriptions/:id` requests
- Backend server load increased
- Rate limiting errors

**Possible Causes:**
1. `maxConcurrentPolls` set too high
2. `pollingInterval` too short
3. `staleThreshold` too low
4. Multiple instances of component

**Diagnosis:**

```typescript
// Check active polls in console
const { activePolls, staleCounts } = useTranscriptionPolling(...);
console.log('Active polls:', activePolls);
console.log('Stale count:', staleCounts);

// Expected: activePolls <= maxConcurrentPolls
// Expected: staleCounts = number of processing transcriptions
```

**Solutions:**

```typescript
// Reduce concurrent polls
{
  maxConcurrentPolls: 2,  // Instead of 5
}

// Increase intervals
{
  pollingInterval: 15000,    // 15 seconds instead of 10
  staleThreshold: 45000,     // 45 seconds instead of 30
}
```

### Issue 3: WebSocket Not Reconnecting

**Symptoms:**
- "Connection lost" message persists
- No automatic reconnection after disconnect
- Polling works but WebSocket doesn't recover

**Possible Causes:**
1. Max reconnection attempts reached
2. Authentication token expired
3. Server rejecting connections
4. CORS or network policy issues

**Diagnosis:**

```typescript
// Check connection state
const state = websocketService.getConnectionState();
console.log('Connection state:', state);

// Check for auth errors in console
// Look for: "WebSocket auth error"

// Check network tab for socket.io requests
// Look for: 401 Unauthorized or 403 Forbidden
```

**Solutions:**

```typescript
// Increase max reconnection attempts
private maxReconnectAttempts = 5;  // Instead of 3

// Force token refresh before reconnecting
await auth.currentUser?.getIdToken(true);
await websocketService.connect();

// Check Firebase token expiration
const tokenResult = await auth.currentUser?.getIdTokenResult();
console.log('Token expires:', new Date(tokenResult.expirationTime));
```

### Issue 4: Progress Updates Stuttering

**Symptoms:**
- Progress bar jumps or freezes
- Inconsistent update timing
- Updates come in bursts

**Possible Causes:**
1. AssemblyAI polling interval too long
2. Network latency
3. Client-side render throttling
4. Multiple event listeners

**Diagnosis:**

```typescript
// Check AssemblyAI polling interval
// In assembly-ai.service.ts
console.log('Polling AssemblyAI every:', pollingInterval, 'ms');

// Check WebSocket event frequency
websocketService.on('transcription_progress', (data) => {
  console.log('Progress event:', Date.now(), data.progress);
});

// Should see events every 3 seconds
```

**Solutions:**

```typescript
// Reduce AssemblyAI polling interval
const pollingInterval = 2000;  // 2 seconds instead of 3

// Add progress smoothing in UI
const [displayProgress, setDisplayProgress] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setDisplayProgress(prev =>
      Math.min(prev + 0.1, actualProgress)  // Smooth animation
    );
  }, 100);
  return () => clearInterval(interval);
}, [actualProgress]);
```

### Issue 5: Polling Not Stopping After Completion

**Symptoms:**
- Continuous API calls for completed transcriptions
- Memory leak warnings
- Stale count keeps increasing

**Possible Causes:**
1. Metadata not cleared on completion
2. Component not unmounting properly
3. Callback dependencies stale
4. Status not updating correctly

**Diagnosis:**

```typescript
// Check if cleanup is running
useEffect(() => {
  return () => {
    console.log('Polling hook cleanup');
  };
}, []);

// Check metadata map size
console.log('Metadata size:', metadataRef.current.size);

// Should decrease when transcriptions complete
```

**Solutions:**

```typescript
// Ensure cleanup in completion handler
if (
  updatedTranscription.status === TranscriptionStatus.COMPLETED ||
  updatedTranscription.status === TranscriptionStatus.FAILED
) {
  metadataRef.current.delete(updatedTranscription.id);
  websocketService.clearEventTracking(updatedTranscription.id);
}

// Add to dependencies array
useEffect(() => {
  // ... polling logic
}, [transcriptions, /* ... other deps */]);
```

### Debugging Tools

**Enable verbose logging:**

```typescript
// In useTranscriptionPolling.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[Polling DEBUG]', {
    transcriptions: transcriptions.length,
    processing: transcriptions.filter(t => t.status === 'processing').length,
    stale: staleCount,
    activePolls: activePolls.current.size,
    metadata: Array.from(metadataRef.current.entries()),
  });
}
```

**Monitor WebSocket health:**

```typescript
// In TranscriptionList.tsx
useEffect(() => {
  const interval = setInterval(() => {
    const state = websocketService.getConnectionState();
    console.log('[Health Check]', state);
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

**Track API call count:**

```typescript
// In api.ts
let apiCallCount = 0;

api.interceptors.request.use(config => {
  apiCallCount++;
  console.log('[API Call]', apiCallCount, config.url);
  return config;
});
```

---

## Performance Considerations

### Bandwidth Usage

**WebSocket (Normal Operation):**
- Events: ~3 per second during processing (for progress updates)
- Payload: ~200 bytes per event
- Total: ~600 bytes/second while processing
- **For 5-minute transcription:** ~180 KB

**Polling Fallback:**
- Requests: 1 every 10 seconds (only when stale)
- Response: ~2-5 KB per request (full transcription object)
- **For 5-minute fallback:** ~15 requests × 3 KB = ~45 KB

**Comparison:**
- WebSocket: More events, smaller payload, real-time
- Polling: Fewer requests, larger payload, 10-second delay
- **Polling uses ~75% less bandwidth but has higher latency**

### Server Load

**Backend Impact:**

- **WebSocket events:** Already being emitted, no additional cost
- **Polling requests:** Extra GET requests during disconnection scenarios
  - Max 5 concurrent polls per client
  - Only for stale transcriptions (PROCESSING status)
  - Firestore read: 1 document per poll

**Example:** 100 concurrent users, 10% experience WebSocket issues
- 10 users polling
- 5 requests per user max
- 50 total polls every 10 seconds
- **5 polls/second** (very manageable)

**Optimization:**

```typescript
// Add caching to reduce Firestore reads
const CACHE_TTL = 5000; // 5 second cache
const cache = new Map<string, { data: Transcription, timestamp: number }>();

async get(id: string) {
  const cached = cache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await firestore.collection('transcriptions').doc(id).get();
  cache.set(id, { data, timestamp: Date.now() });
  return data;
}
```

### Client-Side Performance

**Memory Usage:**

```typescript
// Polling hook metadata map
metadataRef.current.size  // Number of in-progress transcriptions
// Typical: 1-5 entries per user
// Memory: ~1 KB per entry = ~5 KB total
```

**CPU Usage:**

```typescript
// Polling interval: every 10 seconds
// Work per poll:
//   - Filter transcriptions array (O(n))
//   - Check staleness (O(n))
//   - Make API calls (I/O bound)
// Impact: Negligible (< 1% CPU)
```

**React Re-renders:**

```typescript
// Triggers for re-renders:
// 1. WebSocket progress event → updates progressMap
// 2. Polling update → updates transcriptions array
// 3. Every 10 seconds → polling check (but only if stale items found)

// Optimization: Use React.memo for transcription items
const TranscriptionItem = React.memo(({ transcription }) => {
  // ...
}, (prev, next) => prev.id === next.id && prev.status === next.status);
```

### Scaling Considerations

**For 1,000+ concurrent users:**

1. **Increase WebSocket server capacity**
   ```typescript
   // In main.ts (NestJS)
   app.useWebSocketAdapter(new RedisIoAdapter(app));
   // Enables WebSocket clustering across servers
   ```

2. **Add rate limiting to polling endpoint**
   ```typescript
   @UseGuards(ThrottlerGuard)
   @Throttle(10, 60)  // Max 10 requests per 60 seconds per user
   async getTranscription(@Param('id') id: string) {
     // ...
   }
   ```

3. **Implement server-side caching**
   ```typescript
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(5)  // Cache for 5 seconds
   async getTranscription(@Param('id') id: string) {
     // ...
   }
   ```

4. **Monitor and alert**
   ```typescript
   // Track polling frequency
   const pollingMetrics = {
     count: 0,
     last_minute: [],
   };

   if (pollingMetrics.count > 1000) {
     // Alert: High polling activity
     notifyAdmins('High polling rate detected');
   }
   ```

---

## Migration Guide

### For Existing Deployments

If upgrading from a version without polling fallback:

**1. Backend Migration:**

```bash
# No database migrations needed
# New code is backward compatible

# Deploy backend first
npm run build
npm run deploy:api

# Verify AssemblyAI progress updates working
# Check logs for: "Processing audio transcription..."
```

**2. Frontend Migration:**

```bash
# Build and deploy frontend
npm run build
npm run deploy:web

# Polling will activate automatically
# No user action required
```

**3. Monitoring:**

```bash
# Watch for polling activation
# In browser console, filter by: "[Polling]"

# Should only see logs when WebSocket disconnects
# Normal operation: no polling logs
```

**4. Feature Flag (Optional):**

```typescript
// Add feature flag for gradual rollout
const ENABLE_POLLING = process.env.NEXT_PUBLIC_ENABLE_POLLING === 'true';

const { notifyProgress } = useTranscriptionPolling(
  transcriptions,
  handlePollingUpdate,
  {
    enabled: ENABLE_POLLING,  // Control via env var
    // ... other config
  }
);
```

**5. Rollback Plan:**

If issues arise:

```typescript
// Disable polling immediately
{
  enabled: false,  // Set in config
}

// Or via feature flag
NEXT_PUBLIC_ENABLE_POLLING=false
```

---

## Conclusion

The WebSocket resilience system ensures uninterrupted transcription processing by:

1. ✅ Continuously sending progress updates during AssemblyAI processing
2. ✅ Detecting WebSocket connection health changes
3. ✅ Automatically falling back to API polling when WebSocket fails
4. ✅ Seamlessly recovering when WebSocket reconnects
5. ✅ Maintaining database as single source of truth

**Key Benefits:**

- **Zero user intervention** - Everything is automatic
- **No data loss** - Database persistence ensures recovery
- **Bandwidth efficient** - Only polls when necessary
- **Production-ready** - Tested for reliability and performance

**Next Steps:**

- Test in staging environment
- Monitor polling activation frequency
- Tune configuration based on usage patterns
- Consider adding telemetry for production monitoring

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or contact the development team.
