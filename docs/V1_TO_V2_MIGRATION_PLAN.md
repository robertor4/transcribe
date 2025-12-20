# V1 to V2 UI Migration Plan

> **Created**: 2025-11-29
> **Status**: Ready for implementation

## Overview

Replace the current V1 dashboard with the V2 three-pane UI design, connecting to real backend data instead of mock data.

### Key Decisions
- **Folders**: Backend-first (Firestore + API)
- **Terminology**: "Conversation" in UI, "Transcription" in backend
- **Output Generation**: Auto-generate defaults + on-demand option
- **Rollout**: Hard cutover for all users
- **Data Migration**: Additive-only schema changes (safe for single production environment)

---

## Phase 1: Backend - Folder Support

### 1.1 Add Folder Types to Shared Package

**File**: `packages/shared/src/types/index.ts`

```typescript
export interface Folder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Add optional `folderId` to existing Transcription interface:
```typescript
// Add to Transcription interface
folderId?: string | null;
```

### 1.2 Add Folder Methods to FirebaseService

**File**: `apps/api/src/firebase/firebase.service.ts`

Add methods:
- `createFolder(userId, data)` → Creates folder document
- `getUserFolders(userId)` → Lists user's folders
- `getFolder(userId, folderId)` → Get single folder
- `updateFolder(userId, folderId, data)` → Update folder
- `deleteFolder(userId, folderId)` → Delete folder

### 1.3 Extend Transcription Methods

**File**: `apps/api/src/firebase/firebase.service.ts`

Add/modify:
- `getTranscriptionsByFolder(userId, folderId)` → Filter by folder
- `moveToFolder(userId, transcriptionId, folderId)` → Update folderId field

### 1.4 Create Folder Controller & Module

**New file**: `apps/api/src/folder/folder.controller.ts`

Endpoints:
- `POST /folders` - Create folder
- `GET /folders` - List user folders
- `GET /folders/:id` - Get folder
- `PUT /folders/:id` - Update folder
- `DELETE /folders/:id` - Delete folder

**New file**: `apps/api/src/folder/folder.module.ts`

### 1.5 Add Transcription Folder Endpoint

**File**: `apps/api/src/transcription/transcription.controller.ts`

Add endpoint:
- `PATCH /transcriptions/:id/folder` - Move to folder (body: `{ folderId: string | null }`)

### 1.6 Create Firestore Index

Create composite index for folder queries:
- Collection: `transcriptions`
- Fields: `userId` (Asc), `folderId` (Asc), `createdAt` (Desc)

---

## Phase 2: Frontend - Data Layer

### 2.1 Create Conversation Type Adapter

**New file**: `apps/web/lib/types/conversation.ts`

Maps backend `Transcription` to frontend `Conversation`:
- Adapts field names (transcriptText → source.transcript.text)
- Maps status enum values
- Provides `transcriptionToConversation()` adapter function

### 2.2 Create Services Layer

**New file**: `apps/web/lib/services/conversationService.ts`

Wraps `transcriptionApi` with Conversation terminology:
- `list()` → Returns `Conversation[]`
- `get(id)` → Returns `Conversation`
- `upload()` → Creates new conversation
- `delete()`, `updateTitle()`, share methods

**New file**: `apps/web/lib/services/folderService.ts`

New folder API client:
- `list()`, `get()`, `create()`, `update()`, `delete()`
- `moveConversation(conversationId, folderId)`

### 2.3 Create Data Fetching Hooks

**New file**: `apps/web/hooks/useConversations.ts`

- Fetches conversation list with pagination
- Integrates WebSocket for real-time progress (extract pattern from `TranscriptionList.tsx:289-454`)
- Provides `progressMap` for in-progress items
- Methods: `loadMore()`, `refresh()`

**New file**: `apps/web/hooks/useConversation.ts`

- Fetches single conversation by ID
- Methods: `refresh()`

**New file**: `apps/web/hooks/useFolders.ts`

- Fetches user's folders
- Methods: `createFolder()`, `deleteFolder()`, `moveToFolder()`

### 2.4 Extract Utility Functions

**New file**: `apps/web/lib/formatters.ts`

Move from `mockData.ts`:
- `formatDuration(seconds)` → "3h 45m"
- `formatRelativeTime(date)` → "2 hours ago"

---

## Phase 3: Frontend - Route Migration

### 3.1 Create New Route Structure

```
apps/web/app/[locale]/
├── conversation/
│   └── [id]/
│       ├── page.tsx              # Copy from prototype-conversation-v2
│       ├── ConversationClient.tsx
│       ├── transcript/page.tsx
│       └── outputs/[outputId]/page.tsx
├── folder/
│   └── [id]/
│       ├── page.tsx              # Copy from prototype-folder-v2
│       └── FolderClient.tsx
```

### 3.2 Update Dashboard

**File**: `apps/web/app/[locale]/dashboard/page.tsx`

Replace V1 content with V2 dashboard:
1. Copy structure from `prototype-dashboard-v2/page.tsx`
2. Replace mock data imports with hooks (`useConversations`, `useFolders`)
3. Keep V2 components: `ThreePaneLayout`, `LeftNavigation`, quick action buttons, etc.

### 3.3 Update Internal Links

Update all navigation links in:
- `LeftNavigation.tsx` - folder/conversation links
- `ConversationClient.tsx` - back links, output links
- `FolderClient.tsx` - conversation links

Link changes:
- `/prototype-dashboard-v2` → `/dashboard`
- `/prototype-conversation-v2/[id]` → `/conversation/[id]`
- `/prototype-folder-v2/[id]` → `/folder/[id]`

---

## Phase 4: Connect Components to Real Data

### 4.1 Update LeftNavigation

**File**: `apps/web/components/LeftNavigation.tsx`

Replace:
```typescript
// Before
import { mockFolders, getRecentConversations } from '@/lib/mockData';

// After
import { useConversations } from '@/hooks/useConversations';
import { useFolders } from '@/hooks/useFolders';
```

### 4.2 Update ConversationClient

**File**: `apps/web/app/[locale]/conversation/[id]/ConversationClient.tsx`

Replace mock data with `useConversation(id)` hook.

### 4.3 Update FolderClient

**File**: `apps/web/app/[locale]/folder/[id]/FolderClient.tsx`

Replace mock data with `useFolders()` and filtered `useConversations()`.

### 4.4 Update ConversationCreateModal

**File**: `apps/web/components/ConversationCreateModal.tsx`

Connect to real upload flow:
- Use `conversationService.upload()`
- Handle WebSocket progress events
- Navigate to `/conversation/[id]` on completion

---

## Phase 5: Cleanup

### 5.1 Remove Prototype Routes

Delete after migration is verified:
- `apps/web/app/[locale]/prototype-dashboard-v2/`
- `apps/web/app/[locale]/prototype-conversation-v2/`
- `apps/web/app/[locale]/prototype-folder-v2/`

### 5.2 Remove Mock Data

Delete:
- `apps/web/lib/mockData.ts`

### 5.3 Archive V1 Dashboard (Optional)

Move to `apps/web/_archived/v1-dashboard/` for reference, or delete if not needed.

---

## Critical Files

### Backend
| File | Action |
|------|--------|
| `packages/shared/src/types/index.ts` | Add Folder interface, folderId to Transcription |
| `apps/api/src/firebase/firebase.service.ts` | Add folder CRUD + transcription folder methods |
| `apps/api/src/folder/folder.controller.ts` | **New** - Folder API endpoints |
| `apps/api/src/folder/folder.module.ts` | **New** - Folder module |
| `apps/api/src/transcription/transcription.controller.ts` | Add PATCH folder endpoint |
| `apps/api/src/app.module.ts` | Import FolderModule |

### Frontend - New Files
| File | Purpose |
|------|---------|
| `apps/web/lib/types/conversation.ts` | Transcription → Conversation adapter |
| `apps/web/lib/services/conversationService.ts` | Conversation API wrapper |
| `apps/web/lib/services/folderService.ts` | Folder API client |
| `apps/web/lib/formatters.ts` | Date/duration formatting utilities |
| `apps/web/hooks/useConversations.ts` | Conversation list hook with WebSocket |
| `apps/web/hooks/useConversation.ts` | Single conversation hook |
| `apps/web/hooks/useFolders.ts` | Folders hook |

### Frontend - Modifications
| File | Action |
|------|--------|
| `apps/web/app/[locale]/dashboard/page.tsx` | Replace V1 with V2 dashboard |
| `apps/web/app/[locale]/conversation/[id]/*` | **New** - Conversation routes |
| `apps/web/app/[locale]/folder/[id]/*` | **New** - Folder routes |
| `apps/web/components/LeftNavigation.tsx` | Replace mock data with hooks |
| `apps/web/components/ConversationCreateModal.tsx` | Connect to real upload API |
| `apps/web/lib/api.ts` | Add folder API methods |

### Frontend - Deletions
| File | Reason |
|------|--------|
| `apps/web/lib/mockData.ts` | No longer needed |
| `apps/web/app/[locale]/prototype-*` | Promoted to production routes |

---

## Safe Migration Strategy

### Additive-Only Database Changes
- Never delete/rename existing Firestore fields
- Only add new optional fields (`folderId`)
- Existing transcriptions work without folderId (treated as "unfiled")

### Deployment Order
1. Deploy backend changes first (backward compatible)
2. Create Firestore composite index
3. Verify new API endpoints work
4. Deploy frontend (hard cutover)

### Rollback Plan
- Revert frontend to V1 (instant)
- Backend rollback usually not needed (changes are additive)
- All user data remains intact

---

## Implementation Order

1. **Backend: Folder Support** (Phase 1)
   - Shared types → Firebase methods → Controller → Module

2. **Frontend: Data Layer** (Phase 2)
   - Types → Services → Hooks → Formatters

3. **Frontend: Routes** (Phase 3)
   - Create new route structure
   - Copy prototype pages to production routes

4. **Frontend: Integration** (Phase 4)
   - Connect all components to real data
   - Update all internal links

5. **Cleanup** (Phase 5)
   - Remove prototype routes
   - Delete mock data
   - Archive V1 code
