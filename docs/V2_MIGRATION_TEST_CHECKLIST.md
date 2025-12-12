# V2 Migration Test Checklist

This checklist covers manual testing for the V1 to V2 UI migration.

## Prerequisites

- [ ] Backend API is running (`npm run dev` in `apps/api`)
- [ ] Frontend is running (`npm run dev` in `apps/web`)
- [ ] Redis is running (`npm run redis:start`)
- [ ] User is logged in with verified email

---

## 1. Dashboard (`/dashboard`)

### 1.1 Initial Load
- [ ] Dashboard loads without errors
- [ ] Personalized greeting shows (e.g., "Good morning, Roberto")
- [ ] Loading spinner appears while data fetches
- [ ] Folders section displays (if user has folders)
- [ ] Conversations list displays (if user has conversations)
- [ ] Empty state shows for new users with "Create Conversation" CTA

### 1.2 Quick Create Buttons
- [ ] "Record audio" button opens ConversationCreateModal with record mode
- [ ] "Import audio" button opens ConversationCreateModal with file upload mode
- [ ] "Meeting" button opens modal with transcribe-only template
- [ ] "Email" button opens modal with email template
- [ ] "Blog Post" button opens modal with blog template
- [ ] "LinkedIn post" button opens modal with LinkedIn template
- [ ] "Action Items" button opens modal with action items template
- [ ] "More templates" button opens modal on capture step

### 1.3 Folders Section
- [ ] Folders display with correct names and colors
- [ ] Folder count shows number of conversations in each folder
- [ ] Clicking folder navigates to `/folder/[id]`
- [ ] "+ New Folder" button is visible (functionality TBD)

### 1.4 Conversations List
- [ ] Conversations show title, duration, and relative time
- [ ] Status indicators: ✓ for ready, "Processing" badge, "Failed" badge
- [ ] Clicking conversation navigates to `/conversation/[id]`
- [ ] Hover effects work (arrow slides, text highlights)

### 1.5 Floating Action Button
- [ ] FAB visible in bottom-right corner
- [ ] Clicking FAB opens RecordingModal
- [ ] RecordingModal can be cancelled/stopped

---

## 2. Conversation View (`/conversation/[id]`)

### 2.1 Initial Load
- [ ] Page loads with conversation data
- [ ] Loading spinner shows while fetching
- [ ] 404 state shows for invalid conversation ID
- [ ] Access denied shows for conversations user doesn't own

### 2.2 Header Section
- [ ] Conversation title displays correctly
- [ ] Duration and creation date show
- [ ] Back link to folder (if conversation is in a folder)

### 2.3 Section Navigation
- [ ] Sticky nav shows Summary, Generated Outputs, Transcript links
- [ ] Clicking links scrolls to respective sections
- [ ] Hover effects on navigation items

### 2.4 Summary Section
- [ ] Summary text displays
- [ ] Key points display in highlighted box (if available)
- [ ] "Summary is being generated..." shows for pending summaries

### 2.5 Generated Outputs Section
- [ ] Empty state shows with "Generate Output" CTA
- [ ] Output cards display (if outputs exist)
- [ ] "New Output" button opens OutputGeneratorModal

### 2.6 Transcript Section
- [ ] Transcript card shows speaker count and confidence
- [ ] Segment count and duration display
- [ ] Clicking card navigates to `/conversation/[id]/transcript`

### 2.7 Right Panel
- [ ] Conversation metadata displays (duration, created, status)
- [ ] Folder info shows (if applicable)
- [ ] Tags display (if applicable)
- [ ] Generate output options visible

### 2.8 Left Navigation
- [ ] Folders list shows with correct data
- [ ] Recent conversations show (max 5)
- [ ] Dashboard link works
- [ ] New Conversation button works
- [ ] User profile shows at bottom

---

## 3. Transcript View (`/conversation/[id]/transcript`)

### 3.1 Initial Load
- [ ] Page loads with transcript data
- [ ] Loading spinner shows while fetching
- [ ] Error state shows for missing conversations

### 3.2 Header
- [ ] "Transcript" title with FileText icon
- [ ] Speaker count and confidence in subtitle
- [ ] Copy button visible
- [ ] Back navigation works

### 3.3 Transcript Content
- [ ] TranscriptTimeline component renders (if speaker segments exist)
- [ ] Fallback text view shows (if no speaker segments)
- [ ] Speaker segments are clickable/interactive

### 3.4 Copy Functionality
- [ ] Copy button copies formatted transcript
- [ ] Alert confirms copy success

### 3.5 Right Panel
- [ ] Conversation metadata displays
- [ ] Details show: Speakers, Confidence, Duration, Segments

---

## 4. Folder View (`/folder/[id]`)

### 4.1 Initial Load
- [ ] Page loads with folder data
- [ ] Loading spinner shows while fetching
- [ ] 404 state shows for invalid folder ID

### 4.2 Folder Header
- [ ] Folder name displays with icon
- [ ] Folder color applied to icon
- [ ] Stats: conversation count, total duration

### 4.3 Conversations List
- [ ] Conversations in folder display correctly
- [ ] Empty state shows if folder is empty
- [ ] "+ New Conversation" button visible
- [ ] Clicking conversation navigates to `/conversation/[id]`

### 4.4 Right Panel
- [ ] Folder stats display (conversations, duration, created)

### 4.5 Left Navigation
- [ ] Current folder highlighted in folders list
- [ ] Navigation to other folders works

---

## 5. Left Navigation (Global)

### 5.1 Data Loading
- [ ] Folders load from API (not mock data)
- [ ] Recent conversations load from API (not mock data)
- [ ] Loading spinners show while fetching
- [ ] Empty states show when no data

### 5.2 Navigation Links
- [ ] Logo links to `/dashboard`
- [ ] Dashboard link works
- [ ] New Conversation opens modal
- [ ] Folder links navigate to `/folder/[id]`
- [ ] Conversation links navigate to `/conversation/[id]`

### 5.3 User Profile
- [ ] User email displays
- [ ] User initials or first letter shows in avatar

### 5.4 Sidebar Toggle
- [ ] Collapse button works (when provided)
- [ ] Sidebar remembers state

---

## 6. Backend API Endpoints

### 6.1 Folders API
- [ ] `GET /folders` returns user's folders
- [ ] `GET /folders/:id` returns single folder
- [ ] `GET /folders/:id/transcriptions` returns folder's conversations
- [ ] `POST /folders` creates new folder
- [ ] `PUT /folders/:id` updates folder
- [ ] `DELETE /folders/:id` deletes folder (moves conversations to unfiled)
- [ ] `DELETE /folders/:id?deleteContents=true&confirm=true` soft-deletes contents

### 6.2 Transcriptions API
- [ ] `PATCH /transcriptions/:id/folder` moves conversation to folder
- [ ] Moving to `null` removes from folder (unfiled)

---

## 7. Error Handling

### 7.1 Network Errors
- [ ] Dashboard shows error state on API failure
- [ ] Conversation view shows error state on fetch failure
- [ ] Folder view shows error state on fetch failure

### 7.2 Auth Errors
- [ ] Unauthenticated users redirected to login
- [ ] Expired tokens trigger re-auth

### 7.3 Not Found
- [ ] Invalid conversation ID shows 404 state
- [ ] Invalid folder ID shows 404 state

---

## 8. Responsive Design

### 8.1 Desktop (>1024px)
- [ ] Three-pane layout displays correctly
- [ ] Left sidebar visible
- [ ] Right panel visible

### 8.2 Tablet (768px - 1024px)
- [ ] Layout adapts appropriately
- [ ] Sidebars collapsible

### 8.3 Mobile (<768px)
- [ ] Single column layout
- [ ] FAB accessible
- [ ] Navigation accessible

---

## 9. Dark Mode

- [ ] Dashboard renders correctly in dark mode
- [ ] Conversation view renders correctly in dark mode
- [ ] Folder view renders correctly in dark mode
- [ ] Transcript view renders correctly in dark mode
- [ ] All text readable, sufficient contrast

---

## 10. Performance

- [ ] Dashboard loads in <2 seconds
- [ ] Conversation view loads in <2 seconds
- [ ] No visible layout shifts during load
- [ ] Smooth scrolling and transitions

---

## Post-Migration Verification

### Removed Routes (should 404)
- [ ] `/prototype-dashboard-v2` returns 404
- [ ] `/prototype-conversation-v2/[id]` returns 404
- [ ] `/prototype-folder-v2/[id]` returns 404

### Old Dashboard Replaced
- [ ] `/dashboard` shows V2 UI (not V1 tabs)
- [ ] No V1 components visible (FileUploader tabs, etc.)

---

## Notes

- Test with both new users (empty state) and existing users (with data)
- Test folder operations: create, rename, delete with/without contents
- Test conversation operations: create via upload, create via recording
- Verify WebSocket progress updates work during transcription
