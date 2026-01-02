# Comment UI Implementation Plan

**Date**: 2025-12-26
**Status**: Draft - Pending UI design review

## Overview

Add a text-selection-based commenting system to the conversation detail page. Users highlight text in summaries, add comments via a popover, and see comments displayed inline below referenced text with real-time WebSocket sync.

## User Requirements (Gathered)

- **Add method**: Text selection → popover → add comment
- **Display**: Inline under referenced content (expand/collapse)
- **Real-time**: WebSocket sync for instant updates

## Backend Status

The backend is **fully implemented** and ready:

- **API endpoints**: POST/GET/PUT/DELETE at `/transcriptions/:id/comments`
- **Repository**: `apps/api/src/firebase/repositories/comment.repository.ts`
- **Controller**: `apps/api/src/transcription/transcription.controller.ts` (lines 514-609)
- **WebSocket**: `apps/api/src/websocket/websocket.gateway.ts` (lines 129-212)
- **API client**: `apps/web/lib/api.ts` (lines 217-231)

### Data Types

```typescript
// packages/shared/src/types.ts

interface SummaryComment {
  id: string;
  transcriptionId: string;
  userId: string;
  position: CommentPosition;
  content: string;
  resolved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentPosition {
  section: string; // e.g., 'intro', 'keyPoints', 'decisions'
  paragraphIndex?: number;
  characterOffset?: number;
  selectedText?: string;
}
```

### WebSocket Events

Defined in `packages/shared/src/constants.ts`:
- `SUBSCRIBE_COMMENTS` / `UNSUBSCRIBE_COMMENTS`
- `COMMENT_ADDED`, `COMMENT_UPDATED`, `COMMENT_DELETED`

---

## Proposed Files to Create (8 new files)

### 1. `apps/web/contexts/CommentsContext.tsx`
Global state + WebSocket integration for comments.
- Fetches comments on mount via `transcriptionApi.getComments()`
- Subscribes to WebSocket room for real-time updates
- Provides `addComment`, `updateComment`, `deleteComment`, `resolveComment` methods
- Groups comments by section for efficient lookup

### 2. `apps/web/hooks/useTextSelection.ts`
Captures text selection within summary content.
- Listens for `mouseup` events
- Calculates section from `data-section` attribute
- Returns `selectedText`, `selectionRect`, `section`, `clearSelection()`

### 3. `apps/web/components/comments/SelectionPopover.tsx`
Floating "Add Comment" button near text selection.
- Portal-based rendering (like `DropdownMenu.tsx`)
- Positions above/below selection based on viewport
- Dismisses on click outside or Escape key

### 4. `apps/web/components/comments/CommentInputModal.tsx`
Lightweight modal for entering comment text.
- Shows selected text as context
- Textarea with 5000 char max
- Submit on button click or Cmd+Enter

### 5. `apps/web/components/comments/InlineComment.tsx`
Single comment display with expand/collapse.
- Collapsed: comment icon + count badge
- Expanded: full comment, author, timestamp, actions
- Edit/resolve/delete actions for owner only
- Inline delete confirmation pattern

### 6. `apps/web/components/comments/InlineCommentGroup.tsx`
Groups multiple comments for a section/paragraph.
- Renders list of `InlineComment` components
- Shows "N comments" summary when collapsed

### 7. `apps/web/components/comments/CommentHighlight.tsx`
Wraps commented text with visual indicator.
- Purple dotted underline + subtle background
- Clickable to expand related comments

### 8. `apps/web/components/comments/index.ts`
Barrel export for all comment components.

---

## Proposed Files to Modify (7 files)

### 1. `apps/web/lib/websocket.ts`
Add comment subscription methods:
```typescript
subscribeToComments(transcriptionId: string)
unsubscribeFromComments(transcriptionId: string)
```

### 2. `apps/web/components/SummaryRenderer.tsx`
Add `data-section` attributes to each section for selection detection:
- `data-section="intro"` on intro paragraph
- `data-section="keyPoints"` + `data-paragraph-index={idx}` on key points
- `data-section="detailedSections"` + `data-paragraph-index={idx}` on detailed sections
- `data-section="decisions"` + `data-paragraph-index={idx}` on decisions
- `data-section="nextSteps"` + `data-paragraph-index={idx}` on next steps

### 3. `apps/web/components/SummaryV1Renderer.tsx`
Same data-attribute additions for V1 markdown content.

### 4. `apps/web/app/[locale]/conversation/[id]/ConversationClient.tsx`
- Wrap summary content with `<CommentsProvider transcriptionId={id}>`
- Pass `onTextSelect` callback to enable selection-based commenting

### 5. `apps/web/app/globals.css`
Add comment-specific styles:
```css
.comment-highlight {
  background-color: rgba(141, 106, 250, 0.15);
  border-bottom: 2px dotted #8D6AFA;
  cursor: pointer;
}
.dark .comment-highlight {
  background-color: rgba(141, 106, 250, 0.25);
}
```

### 6. `apps/web/messages/*.json` (all 5 locales)
Add translation keys for comments UI.

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create `CommentsContext.tsx` with API integration
2. Create `useTextSelection.ts` hook
3. Extend `websocket.ts` with comment subscription methods

### Phase 2: UI Components
4. Create `SelectionPopover.tsx`
5. Create `CommentInputModal.tsx`
6. Create `InlineComment.tsx` and `InlineCommentGroup.tsx`

### Phase 3: Integration
7. Add data attributes to SummaryRenderer components
8. Integrate `CommentsProvider` in `ConversationClient.tsx`
9. Wire up selection → popover → modal → API flow

### Phase 4: Real-time & Polish
10. Add WebSocket listeners to `CommentsContext`
11. Add CSS animations
12. Add translations

### Phase 5: Testing
13. Test text selection on desktop and mobile
14. Test real-time sync between browser tabs
15. Test edit/delete/resolve flows

---

## Open Questions for UI Design

1. **Selection Popover Design**: What should the popover look like? Icon only, or "Add comment" text?

2. **Inline Comment Styling**: How prominent should comments be? Subtle or visible by default?

3. **Comment Threading**: Should replies to comments be supported, or keep it flat?

4. **Resolved Comments**: Should resolved comments be hidden, grayed out, or in a separate section?

5. **Mobile UX**: On touch devices, text selection is tricky. Alternative approach?
   - Long-press to comment on entire paragraph?
   - Section-level comment buttons as fallback?

6. **Comment Panel Alternative**: Should there be a "View all comments" panel for overview?

7. **Notifications**: Should users receive notifications when someone comments on their transcription?

---

## Technical Notes

### Position Calculation Strategy
- `section`: From `data-section` attribute
- `paragraphIndex`: From `data-paragraph-index` attribute
- `selectedText`: Captured from `window.getSelection().toString()`

### Existing Patterns to Follow
- **Portals**: Use `createPortal()` like `DropdownMenu.tsx`
- **Animations**: Use existing `globals.css` animation patterns
- **Delete Confirmation**: Use inline confirmation from `FolderClient.tsx`
- **Button Component**: Use existing `Button.tsx` variants

### Mobile Considerations
- Touch selection works with `touchend` event
- Popover should be positioned at bottom on small viewports
- Minimum touch targets of 44px
