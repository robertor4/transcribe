# V2 Prototype Components (2025 UI Patterns)

The V2 prototype implements modern productivity app patterns focusing on speed, personalization, and visual consistency following 2025 best practices from Linear, Notion, Height, ChatGPT, and Claude.

**Core Philosophy:**
- **Quick Recording Access:** 1-click start via Floating Action Button (FAB)
- **Personalization:** Time-aware greetings, milestone celebrations, user-specific data
- **Visual Consistency:** Monochrome (white/gray/black) + magenta `#cc3399` accent
- **No Complexity:** Simple, clean MVP without keyboard shortcuts or heavy features

## Key Components

### FloatingRecordButton
**Location:** `/apps/web/components/FloatingRecordButton.tsx`
- **Purpose:** Quick access to recording from anywhere in the app
- **Pattern:** Floating Action Button (FAB) positioned bottom-right corner
- **Visual States:**
  - Default: Magenta `#cc3399` background with mic icon
  - Recording: Red `bg-red-500` with square icon + pulse animation
- **Behavior:** Always visible, hover scale-110, focus ring
- **Usage:**
  ```tsx
  <FloatingRecordButton onClick={handleStartRecording} isRecording={isRecording} />
  ```

### RecordingModal
**Location:** `/apps/web/components/RecordingModal.tsx`
- **Purpose:** Full-screen recording interface triggered by FAB
- **Features:**
  - Pulsing red dot + "Recording..." header
  - Elapsed time counter (MM:SS format)
  - Animated waveform visualization (40 bars, random heights)
  - Large "Stop & Transcribe" button (brand variant)
  - Cancel option below
- **Design:** Modal overlay with semi-transparent dark background
- **Usage:**
  ```tsx
  <RecordingModal isOpen={isRecording} onStop={handleStop} onCancel={handleCancel} />
  ```

### MilestoneToast
**Location:** `/apps/web/components/MilestoneToast.tsx`
- **Purpose:** Celebrate conversation milestones without gamification
- **Milestones:** 1st, 10th, 50th, 100th, 250th, 500th, 1000th conversation
- **Position:** Bottom-left corner, auto-dismiss after 5 seconds
- **Design:** Gray background + magenta left border (NOT blue)
- **Animation:** Slide-in from left, smooth exit
- **Usage:**
  ```tsx
  <MilestoneToast message="Your first conversation! 🎉" isVisible={showMilestone} onDismiss={() => setShow(false)} />
  ```

### EmptyState
**Location:** `/apps/web/components/EmptyState.tsx`
- **Purpose:** Friendly, helpful empty states across dashboard, folders, search
- **Pattern:** Large emoji (text-7xl) + title + description + optional CTA
- **Props:** icon, title, description, actionLabel, onAction, actionVariant, actionIcon
- **Usage:**
  ```tsx
  <EmptyState
    icon="🎙️"
    title="Welcome to Neural Summary"
    description="Start by recording or uploading your first conversation."
    actionLabel="Start Recording"
    onAction={handleStart}
    actionIcon={<Mic className="w-5 h-5" />}
  />
  ```

## Helper Functions

**Location:** `/apps/web/lib/userHelpers.ts`

Core personalization utilities:
- `getGreeting(emailOrName)`: Returns "Good morning/afternoon/evening, FirstName"
- `getTimeOfDay()`: Returns 'morning' | 'afternoon' | 'evening' based on hour
- `getFirstName(emailOrName)`: Extracts first name from email (john.doe@example.com → John) or display name
- `getMilestoneMessage(count)`: Returns milestone message for specific counts (1, 10, 50, 100, etc.) or null
- `formatTotalDuration(seconds)`: "3.5 hours" or "45 minutes" formatting
- `getDayName(date)`: Returns day name like "Monday"

## V2 Pages Implementation

**Dashboard V2** (`/prototype-dashboard-v2`)
- ✅ Personalized greeting with time-of-day awareness
- ✅ Conversation count display
- ✅ Milestone toast detection on mount
- ✅ Floating Action Button (FAB)
- ✅ Recording modal integration
- ✅ Empty state when no conversations
- ✅ Gray + magenta prototype notice (NOT blue)

**Conversation V2** (`/prototype-conversation-v2/[id]`)
- ✅ FAB for quick recording access
- ✅ Recording modal
- ✅ Gray + magenta prototype notice
- ✅ Vertical sections (no horizontal tabs)

**Folder V2** (`/prototype-folder-v2/[id]`)
- ✅ FAB integration
- ✅ Recording modal
- ✅ Gray + magenta prototype notice
- ✅ Improved empty states for empty folders

## Color System Updates (V2 Consistency)

**Prototype Notices:**
- ❌ OLD: `bg-blue-50 border-blue-200` (inconsistent with brand)
- ✅ NEW: `bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399]`

**Status Badges:**
- ✅ Ready: `bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400`
- ✅ Processing: `bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400`
- ✅ Failed: `bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400`
- ✅ Pending: `bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400`

**Search Bar Enhancements:**
- Border: `border-2 border-gray-200` (default) → `border-[#cc3399]` (focus)
- Focus ring: `ring-2 ring-[#cc3399]/30`
- Hover: `border-gray-300` for better feedback

## Personalization Patterns

**Principles:**
- Subtle, helpful, respectful (NOT pushy or gamified)
- Data-driven suggestions based on usage
- Contextual welcome messages
- Remember user preferences

**What to AVOID:**
- ❌ Gamification badges/points/achievements
- ❌ Intrusive "tips" and tutorials
- ❌ Heavy onboarding flows
- ❌ "Achievement unlocked" popups

**What to DO:**
- ✅ Time-aware greetings ("Good morning, Roberto")
- ✅ Milestone celebrations (subtle toasts)
- ✅ Smart defaults (remember last settings)
- ✅ Usage insights (conversation count, activity summaries)

## V1 vs V2

**V1 Prototype (DELETED):**
- `/prototype-dashboard` - Removed
- `/prototype-conversation/[id]` - Removed
- `/prototype-folder/[id]` - Removed

**V2 Prototype (Current):**
- `/prototype-dashboard-v2` - Active
- `/prototype-conversation-v2/[id]` - Active
- `/prototype-folder-v2/[id]` - Active

All links and navigation now point exclusively to V2 versions.

## Implementation Checklist

When creating new V2 pages or features:
- [ ] Add FloatingRecordButton to all main pages
- [ ] Integrate RecordingModal with FAB state
- [ ] Use personalized greeting on dashboard-style pages
- [ ] Check for milestone messages on conversation count changes
- [ ] Replace blue cards/notices with gray + magenta border
- [ ] Use EmptyState component instead of custom empty messages
- [ ] Ensure all status badges use semantic colors (green/yellow/red/gray)
- [ ] Add proper empty states for all list views
- [ ] Test FAB doesn't block important content (z-50, bottom-8 right-8)
