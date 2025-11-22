# 🎨 Three-Pane UI Implementation Guide

**Status:** Phase 1 Complete ✅
**Date:** January 2025
**Branch:** UI-redesign

---

## Overview

We've implemented a modern three-pane layout following 2025 best practices from Linear, Notion, Height, and other leading productivity tools. This guide explains the new architecture and how to use it.

---

## What's New

### 1. **ChatGPT/Claude-Style Header Modernization**
- **Removed top header entirely** - no more separate header bar
- **Logo moved to left sidebar** - positioned at the top for branding
- **User profile moved to left sidebar** - positioned at bottom for easy access
- **Subscription status removed** - cleaner, less cluttered interface
- **Result**: More screen space for content, familiar modern UI pattern

### 2. **Three-Pane Architecture**

```
┌────────────────────────────────────────────────────────────┐
│ [Left Sidebar]    │  [Main Content]   │  [Right Panel]     │
│   240px → 0px     │   flex-grow       │   360px → 0px      │
│   Navigation      │   Primary Focus   │   Context/Actions  │
└────────────────────────────────────────────────────────────┘
```

**Left Sidebar (240px, collapsible):**
- Logo and branding at top
- Search conversations
- "New Conversation" button (brand pink)
- Folders with conversation counts
- Recent conversations with status indicators
- User profile at bottom
- Collapses to 0px when toggle button clicked

**Main Content (flex-grow):**
- Dashboard view: Folders + conversations grid
- Conversation view: Vertical sections (no tabs!)
- Full-width focus area

**Right Panel (360px, collapsible):**
- Contextual based on selection
- Details tab: Metadata, file info, tags
- Actions tab: Generate outputs, Export, Share
- Quick actions without scrolling

---

## New Components

### Core Layout Components

#### `ThreePaneLayout`
- **Location:** `apps/web/components/ThreePaneLayout.tsx`
- **Purpose:** Main layout shell with collapsible sidebars
- **Features:**
  - State persistence via localStorage
  - Smooth 300ms animations
  - Responsive behavior
  - Optional right panel

**Usage:**
```tsx
<ThreePaneLayout
  leftSidebar={<LeftNavigation />}
  mainContent={<YourContent />}
  rightPanel={<RightContextPanel />}
  showRightPanel={true}
/>
```

#### `CollapsibleSidebar`
- **Location:** `apps/web/components/CollapsibleSidebar.tsx`
- **Purpose:** Reusable sidebar with collapse/expand functionality
- **Features:**
  - Toggle button with icon
  - Smooth width transition
  - Configurable width values
  - Works for both left and right sides

#### `useCollapsibleSidebar` Hook
- **Location:** `apps/web/hooks/useCollapsibleSidebar.ts`
- **Purpose:** Manage sidebar state with localStorage persistence
- **Returns:** `{ isCollapsed, toggle, collapse, expand, isHydrated }`

---

### Navigation Components

#### `LeftNavigation`
- **Location:** `apps/web/components/LeftNavigation.tsx`
- **Features:**
  - Logo at top (Neural Summary branding)
  - Search bar (future: Cmd+F shortcut)
  - Folders list with counts
  - Recent conversations with status
  - User profile at bottom
  - Sticky top/bottom sections
  - Hover states

#### `RightContextPanel`
- **Location:** `apps/web/components/RightContextPanel.tsx`
- **Features:**
  - Two tabs: Details & Actions
  - Contextual content based on conversation
  - Empty state when nothing selected
  - Sticky bottom actions
  - Uses standardized Button component

#### `Button`
- **Location:** `apps/web/components/Button.tsx`
- **Purpose:** Standardized button component based on landing page design patterns
- **Features:**
  - 5 variants: primary, secondary, brand, ghost, danger
  - 3 sizes: sm, md, lg
  - Optional icon support
  - Full-width option
  - Disabled state handling
  - Consistent hover animations (scale-105)
  - Pill-shaped (`rounded-full`) for primary CTAs
  - Can render as button or Link

**Usage:**
```tsx
<Button variant="brand" size="md" onClick={handleClick}>
  Generate Output
</Button>

<Button variant="secondary" href="/dashboard" fullWidth>
  Back to Dashboard
</Button>

<Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>
  Delete
</Button>
```

---

## Prototype Pages (V2)

### Dashboard V2
**URL:** `/en/prototype-dashboard-v2`

**Features:**
- Three-pane layout (no right panel on dashboard)
- No top header (logo in left sidebar)
- Left sidebar with navigation
- Main content: Quick create, folders, recent conversations
- Collapsible left sidebar (toggle button)
- Standardized Button components

### Conversation V2
**URL:** `/en/prototype-conversation-v2/[id]`

**Features:**
- Full three-pane experience
- No top header (logo in left sidebar)
- Left sidebar: Navigation
- Main content: Vertical sections (Summary → Outputs → Transcript)
- Right panel: Details & Actions tabs
- Standardized Button components with loading states

**Key Improvement:** No horizontal tabs! Scroll through sections instead.

### Folder V2
**URL:** `/en/prototype-folder-v2/[id]`

**Features:**
- Three-pane layout (no right panel on folder view)
- No top header (logo in left sidebar)
- Left sidebar: Navigation
- Main content: Folder info, members, conversations list
- Maintains UI consistency with dashboard and conversation pages
- Standardized Button components

---

## Keyboard Shortcuts (Future Phase 2)

Planned shortcuts for next phase:

- `Cmd+\` (Mac) / `Ctrl+\` (Win): Toggle left sidebar
- `Cmd+.` (Mac) / `Ctrl+.` (Win): Toggle right panel
- `Cmd+K`: Command palette (search + actions)
- `j/k`: Navigate conversations up/down
- `Enter`: Open selected conversation
- `?`: Show shortcuts help

---

## State Persistence

Sidebar states are saved to localStorage:

```typescript
localStorage.setItem('neural-summary:left-sidebar-collapsed', 'true');
localStorage.setItem('neural-summary:right-panel-collapsed', 'false');
```

This means users' preferences persist across sessions.

---

## Design Patterns Followed

### From Linear
✅ Collapsible sidebars with toggle buttons
✅ Properties panel on right side
✅ Clean, minimal design
✅ Hover states for actions

### From Notion
✅ Nested navigation (folders)
✅ Contextual right panel
✅ Smooth animations

### From Height/Superhuman
✅ Keyboard-first approach (planned)
✅ Minimal scrolling needed
✅ Quick actions always visible

### From ChatGPT/Claude
✅ No top header (logo in sidebar)
✅ User profile at bottom of sidebar
✅ Maximized content area
✅ Familiar, modern interface

---

## Button Design System

All V2 prototype pages use the standardized `Button` component based on landing page design patterns.

### Button Variants

1. **Primary** - Dark background for main actions
   - Background: `#2c2c2c` (warm dark gray)
   - Hover: `#3a3a3a`
   - Use: Primary CTAs, important actions

2. **Secondary** - Outlined with hover fill
   - Border: 2px gray-900
   - Background: Transparent → gray-900 on hover
   - Use: Secondary actions, cancel buttons

3. **Brand** - Bold brand pink for key features
   - Background: `#cc3399` (brand pink)
   - Hover: `#b82d89` (darker pink)
   - Use: "New Conversation", "Generate", feature highlights

4. **Ghost** - Minimal style for tertiary actions
   - Background: Transparent
   - Hover: gray-100
   - Use: Subtle actions, utility buttons

5. **Danger** - Red for destructive actions
   - Background: red-50
   - Text: red-600
   - Use: Delete, remove, destructive actions

### Button Sizes
- **sm**: `px-4 py-2 text-sm` - Compact buttons
- **md**: `px-6 py-2.5 text-sm` - Default size
- **lg**: `px-10 py-4 text-lg` - Hero CTAs

### Design Principles
- **Pill-shaped**: All buttons use `rounded-full` for friendly, modern feel
- **Hover animation**: `hover:scale-105` for tactile feedback
- **Icons**: Optional icon support for visual context
- **Loading states**: Built-in disabled state styling

### Migration from Landing Page
The Button component was extracted from the landing page's `CTAButton` patterns to ensure visual consistency across the entire application.

---

## Testing the Implementation

### 1. Test Dashboard V2
```bash
# Visit the V2 dashboard
http://localhost:3000/en/prototype-dashboard-v2
```

**What to test:**
- [ ] No top header visible (logo moved to left sidebar)
- [ ] Logo appears at top of left sidebar
- [ ] User profile appears at bottom of left sidebar
- [ ] Left sidebar shows folders and recent conversations
- [ ] Toggle button collapses/expands left sidebar smoothly
- [ ] Search bar is visible in left sidebar
- [ ] "New Conversation" button is prominent (brand pink)
- [ ] Clicking folder goes to folder-v2 page (not v1)
- [ ] Clicking conversation goes to conversation-v2 page (not v1)
- [ ] State persists after page refresh (sidebar collapsed/expanded)
- [ ] All buttons use standardized Button component styling

### 2. Test Conversation V2
```bash
# Click any conversation from dashboard
http://localhost:3000/en/prototype-conversation-v2/conv-1
```

**What to test:**
- [ ] No top header visible (logo in left sidebar)
- [ ] Left sidebar: Same navigation as dashboard (logo, user profile)
- [ ] Right panel: Shows conversation details
- [ ] Right panel tabs: Details vs Actions work
- [ ] Main content: Vertical sections (Summary, Outputs, Transcript)
- [ ] No horizontal tabs visible
- [ ] Scroll through sections smoothly
- [ ] Toggle buttons work for both sidebars
- [ ] Generate output buttons use standardized Button component
- [ ] Generate buttons show loading state (spinner + "Generating...")
- [ ] Action buttons in right panel use standardized styles
- [ ] Delete button uses danger variant (red background)
- [ ] State persists after navigation

### 3. Test Folder V2
```bash
# Click any folder from dashboard or sidebar
http://localhost:3000/en/prototype-folder-v2/folder-1
```

**What to test:**
- [ ] No top header visible (logo in left sidebar)
- [ ] Left sidebar: Same navigation as dashboard
- [ ] No right panel on folder view (intentional)
- [ ] Folder header shows icon, name, stats
- [ ] Members section displays correctly
- [ ] Conversations list shows all folder conversations
- [ ] Clicking conversation navigates to conversation-v2 (not v1)
- [ ] Back navigation works correctly
- [ ] All buttons use standardized Button component styling
- [ ] UI feels consistent with dashboard-v2 and conversation-v2

### 4. Test Responsive Behavior
```bash
# Resize browser window to test breakpoints
```

**What to test:**
- [ ] Desktop (>1280px): All three panes visible
- [ ] Laptop (1024-1280px): Works well
- [ ] Tablet (768-1024px): Should still function (may need polish)
- [ ] Mobile (<768px): Will need overlay pattern (future work)

---

## Current Limitations (To Be Addressed)

### Phase 1 (Current) - ✅ Complete
- [x] Core three-pane layout
- [x] Collapsible sidebars
- [x] Left navigation with logo and user profile
- [x] Right context panel
- [x] Vertical sections (no tabs)
- [x] State persistence
- [x] Header modernization (ChatGPT/Claude style)
- [x] Standardized Button component
- [x] Folder V2 page with three-pane layout
- [x] All V2 pages link to other V2 pages

### Phase 2 (Next) - Planned
- [ ] Keyboard shortcuts (Cmd+K, Cmd+\, Cmd+., j/k)
- [ ] Command palette (global search + actions)
- [ ] Hover actions on conversation cards
- [ ] Floating action button (FAB)
- [ ] Better mobile responsiveness (overlays)

### Phase 3 (Later) - Planned
- [ ] Virtual scrolling for long lists (100+ conversations)
- [ ] Skeleton loaders during fetch
- [ ] Optimistic updates
- [ ] Jump-to navigation (mini-map)
- [ ] Context menus (right-click)

---

## File Structure

```
apps/web/
├── components/
│   ├── ThreePaneLayout.tsx          # Main layout shell
│   ├── CollapsibleSidebar.tsx       # Reusable sidebar
│   ├── LeftNavigation.tsx           # Left nav with logo + profile
│   ├── RightContextPanel.tsx        # Right panel component
│   ├── Button.tsx                   # Standardized button component
│   ├── FloatingRecordButton.tsx     # FAB for quick recording (NEW)
│   ├── RecordingModal.tsx           # Full-screen recording UI (NEW)
│   ├── MilestoneToast.tsx           # Celebration notifications (NEW)
│   └── EmptyState.tsx               # Reusable empty state (NEW)
├── hooks/
│   └── useCollapsibleSidebar.ts     # Sidebar state hook
├── lib/
│   └── userHelpers.ts               # Personalization utilities (NEW)
└── app/[locale]/
    ├── prototype-dashboard-v2/
    │   └── page.tsx                 # Dashboard with FAB, greeting, milestones
    ├── prototype-conversation-v2/[id]/
    │   └── page.tsx                 # Conversation with FAB
    └── prototype-folder-v2/[id]/
        └── page.tsx                 # Folder with FAB
```

---

## Differences: V1 vs V2 Prototypes

### V1 (Original Prototype)
- Top header with logo and user menu
- Simple header + content layout
- Horizontal tabs (Summary, Transcript, Outputs)
- No sidebars
- Requires navigation via back buttons
- All actions require opening conversation
- Custom button styles per page

### V2 (Three-Pane Layout)
- **No top header** - ChatGPT/Claude style
- Logo in left sidebar (top)
- User profile in left sidebar (bottom)
- Three-pane architecture
- Vertical sections (no tabs!)
- Left sidebar: Always-visible navigation
- Right panel: Contextual actions/details
- Collapsible panels for focus mode
- Quick actions accessible from right panel
- State persistence
- Standardized Button component across all pages

---

## Migration Path

### Original Pages (Keep for now)
- `/prototype-dashboard` → Original design
- `/prototype-conversation/[id]` → Original design
- `/prototype-folder/[id]` → Original design

### V2 Pages (New modernized versions)
- `/prototype-dashboard-v2` → Three-pane version ✅
- `/prototype-conversation-v2/[id]` → Three-pane version ✅
- `/prototype-folder-v2/[id]` → Three-pane version ✅

**Why keep both?**
- Easy comparison for stakeholder review
- Can A/B test with users
- Safe rollback if needed
- Gradual migration

**Navigation Consistency:**
All V2 pages now link exclusively to other V2 pages. No more accidental navigation to V1 versions.

---

## Next Steps

1. **Review & Test:**
   - Test all V2 pages
   - Get feedback on navigation flow
   - Validate sidebar UX

2. **Phase 2 Implementation:**
   - Add keyboard shortcuts
   - Implement command palette (Cmd+K)
   - Add hover actions on cards

3. **Polish:**
   - Smooth animations everywhere
   - Skeleton loaders
   - Empty states
   - Error states

4. **Migrate:**
   - Once validated, replace V1 with V2
   - Update all internal links
   - Remove old prototypes

---

## Questions & Feedback

When reviewing the three-pane layout, consider:

1. **Navigation:** Is left sidebar intuitive? Too much/too little info?
2. **Right Panel:** Is contextual panel helpful? Should it default collapsed?
3. **Vertical Sections:** Better than tabs? Any section missing?
4. **Collapsibility:** Do toggle buttons make sense? Should there be keyboard shortcuts?
5. **Mobile:** How should this work on phone? Bottom nav + overlays?

---

---

## V2 Enhancements (Latest Updates)

Following 2025 UX/UI best practices from Linear, Notion, Height, ChatGPT, and Claude, we've added key improvements to make Neural Summary faster, more personal, and visually consistent.

### New Components

**1. FloatingRecordButton (FAB)**
- **File**: `components/FloatingRecordButton.tsx`
- **Purpose**: 1-click recording access from anywhere
- **Position**: Bottom-right corner (fixed, z-50)
- **Visual**: Magenta background → Red + pulse when recording
- **Always visible** across all V2 pages

**2. RecordingModal**
- **File**: `components/RecordingModal.tsx`
- **Trigger**: Click FAB to open
- **Features**:
  - Pulsing red dot + "Recording..." header
  - Elapsed time counter (MM:SS)
  - Animated waveform visualization
  - Large "Stop & Transcribe" button
  - Cancel option

**3. MilestoneToast**
- **File**: `components/MilestoneToast.tsx`
- **Purpose**: Celebrate milestones (1st, 10th, 50th, 100th+ conversations)
- **Position**: Bottom-left, auto-dismiss after 5s
- **Design**: Gray background + magenta left border
- **Non-intrusive**: Slide-in animation, no gamification

**4. EmptyState**
- **File**: `components/EmptyState.tsx`
- **Purpose**: Friendly empty states for dashboard, folders, search
- **Pattern**: Large emoji + title + description + CTA button
- **Reusable** across all list views

**5. User Helpers**
- **File**: `lib/userHelpers.ts`
- **Functions**:
  - `getGreeting(email)` - "Good morning/afternoon/evening, FirstName"
  - `getTimeOfDay()` - Returns time period
  - `getFirstName(email)` - Extracts first name
  - `getMilestoneMessage(count)` - Returns milestone or null
  - `formatTotalDuration(seconds)` - "3.5 hours" or "45 minutes"

### Page Updates

**Dashboard V2** now includes:
- ✅ Personalized greeting ("Good morning, Roberto")
- ✅ Conversation count display
- ✅ Milestone toast detection
- ✅ FAB integration
- ✅ Recording modal
- ✅ Empty state when no conversations
- ✅ Gray + magenta colors (no blue)

**Conversation V2** now includes:
- ✅ FAB for quick recording
- ✅ Recording modal integration
- ✅ Gray + magenta prototype notice

**Folder V2** now includes:
- ✅ FAB integration
- ✅ Recording modal
- ✅ Gray + magenta colors

### Color Consistency Fixes

**Before**:
- ❌ Blue info cards (`bg-blue-50`, `border-blue-200`)
- ❌ Inconsistent status colors

**After**:
- ✅ Gray info cards with magenta border (`bg-gray-50`, `border-[#cc3399]`)
- ✅ Standardized status colors:
  - Green: Ready
  - Yellow: Processing
  - Red: Failed
  - Gray: Pending

### Search Bar Enhancements

**Before**: Thin border, basic styling
**After**:
- Thicker border (`border-2`) for better visibility
- Magenta focus ring (`ring-[#cc3399]/30`)
- Hover feedback (`border-gray-300`)
- Improved accessibility

### V1 Cleanup

**Deleted**:
- `/prototype-dashboard` (V1)
- `/prototype-conversation/[id]` (V1)
- `/prototype-folder/[id]` (V1)

**Result**: All navigation now uses V2 pages exclusively

### Testing Checklist (V2 Features)

**Dashboard V2**:
- [ ] Greeting shows correct time of day
- [ ] First name extracted correctly from email
- [ ] Conversation count displays
- [ ] Milestone toast appears for milestone counts
- [ ] FAB visible and clickable
- [ ] Recording modal opens on FAB click
- [ ] Empty state shows when no conversations
- [ ] Prototype notice uses gray + magenta (not blue)

**Conversation V2 & Folder V2**:
- [ ] FAB present on all pages
- [ ] Recording modal works
- [ ] Prototype notices use gray + magenta
- [ ] No blue elements visible

**Cross-Page**:
- [ ] FAB doesn't block important content
- [ ] Recording modal closes properly
- [ ] Milestone toast auto-dismisses after 5s
- [ ] All status badges use semantic colors

---

**Built:** January 2025
**Branch:** UI-redesign
**Status:** Phase 1 Complete + V2 Enhancements ✅
