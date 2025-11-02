# Implementation Plan: AI-Powered Transcript Correction

## Overview
Enable users to fix transcript errors (names, typos, terminology) using **natural language instructions** or **quick find & replace**, then regenerate core analyses based on corrected text.

## Key Design Decisions

### ✅ **AI-Powered Correction (Primary Feature)**
- User describes corrections in plain English
- Example: "Change 'John' to 'Jon' and 'Acme' to 'ACME Corporation'"
- GPT-5-mini processes transcript + instructions → returns corrected version
- **Iterative preview workflow:** User can refine instructions and preview again before applying
- **Why:** Handles repetitive errors across 50+ speaker segments in one action

### ✅ **Quick Find & Replace (Secondary Feature)**
- Traditional find/replace for simple, one-off corrections
- No AI cost, instant execution
- **Why:** Fast option for users who know exact changes needed

### ✅ **Speaker Segment Preservation**
- Backend applies corrections to both:
  - `transcriptText` (raw text for analyses)
  - `speakerSegments[].text` (individual segment boxes)
  - `transcriptWithSpeakers` (formatted display)
- **Why:** Maintains timestamps, speaker attribution, UI structure

---

## Implementation Plan

### **Phase 1: Backend - Correction Endpoints**

#### **1.1 AI-Powered Correction**
**New Endpoint:** `POST /transcriptions/:id/correct-transcript`

**Request:**
```typescript
{
  instructions: string;  // "Change 'John' to 'Jon'"
  previewOnly?: boolean; // If true, return diff without saving (default: true)
}
```

**Response (Preview Mode):**
```typescript
{
  original: string;
  corrected: string;
  diff: Array<{
    segmentIndex: number;
    speakerTag: string;
    timestamp: string;
    oldText: string;
    newText: string;
  }>;
  summary: {
    totalChanges: number;
    affectedSegments: number;
  };
}
```

**Response (Apply Mode - previewOnly=false):**
```typescript
{
  success: true;
  transcription: Transcription; // Updated transcript object
  deletedAnalysisIds: string[]; // IDs of deleted custom analyses
  clearedTranslations: string[]; // Language codes that were cleared
}
```

**Service Method:** `correctTranscriptWithAI()`
- Sends transcript + instructions to GPT-5-mini with specialized prompt (see below)
- Returns corrected `transcriptText` and updated `speakerSegments`
- If `previewOnly=true`: Return diff only, don't save
- If `previewOnly=false`: Update Firestore + clear translations/custom analyses

#### **1.2 Simple Find & Replace**
**New Endpoint:** `POST /transcriptions/:id/find-replace`

**Request:**
```typescript
{
  find: string;
  replace: string;
  matchCase?: boolean;
  wholeWord?: boolean;
  previewOnly?: boolean; // Same pattern as AI correction
}
```

**Service Method:** `findAndReplaceTranscript()`
- Uses regex to replace all matches in `transcriptText` and `speakerSegments`
- If `previewOnly=true`: Return preview diff only
- If `previewOnly=false`: Update Firestore, clear translations/custom analyses

#### **1.3 Data Integrity on Edit**
**Updates in `transcription.service.ts`:**
- Clear `translations` object
- Delete all `generatedAnalyses` documents (where `transcriptionId` matches)
- Update `transcriptText`, `speakerSegments`, `transcriptWithSpeakers`
- Set `updatedAt` timestamp
- **Keep:** `coreAnalyses` (user re-runs manually)

#### **1.4 Re-run Core Analyses** (No changes needed!)
- Reuse existing endpoint: `POST /transcriptions/:id/regenerate-core-analyses`
- Reuse existing service method: `generateCoreAnalyses()`
- Just needs to be exposed to frontend

---

### **Phase 2: Frontend - Correction UI**

#### **2.1 New Component: TranscriptCorrectionModal**
**Location:** `apps/web/components/TranscriptCorrectionModal.tsx`

**Features:**
- Tabbed interface: "AI Fix" vs "Find & Replace"
- **AI Fix tab:**
  - Textarea for instructions
  - "Preview Changes" button → Shows diff
  - Example prompts for guidance
  - **After preview shown:**
    - Instructions textarea remains editable
    - "Preview Again" button (replaces "Preview Changes")
    - "Apply Changes" button (confirms and saves)
    - "Cancel" button (clears preview, resets form)
- **Find & Replace tab:**
  - Input fields for find/replace
  - Checkboxes: Match case, Whole word
  - "Preview" button → Shows matches
  - "Apply Changes" button
- **Diff preview pane** (collapsible):
  - Shows before/after for each segment
  - Scrollable list with colored highlights (red=removed, green=added)
  - Summary stats at top
- Warning about deleted translations/analyses (shown before "Apply Changes")

**State Management:**
```typescript
const [mode, setMode] = useState<'ai' | 'findreplace'>('ai');
const [instructions, setInstructions] = useState('');
const [findText, setFindText] = useState('');
const [replaceText, setReplaceText] = useState('');
const [preview, setPreview] = useState<CorrectionPreview | null>(null);
const [isLoadingPreview, setIsLoadingPreview] = useState(false);
const [isApplying, setIsApplying] = useState(false);
```

**User Flow (Iterative Preview):**
```
1. User opens modal → "AI Fix" tab
2. Types instructions: "Change 'John' to 'Jon'"
3. Clicks "Preview Changes" → Shows diff
4. User realizes also needs to fix "Acme"
5. Edits instructions: "Change 'John' to 'Jon' and 'Acme' to 'ACME Corp'"
6. Clicks "Preview Again" → Shows updated diff
7. User satisfied → Clicks "Apply Changes"
8. Confirmation dialog: "This will delete translations and custom analyses. Continue?"
9. Clicks "Yes" → Backend saves changes
10. Modal closes → Success toast shown
```

#### **2.2 Integration with TranscriptWithSpeakers**
**File:** `apps/web/components/TranscriptWithSpeakers.tsx`

**Changes:**
- Add "✏️ Fix" button next to "Show Timestamps" button
- Opens `TranscriptCorrectionModal` on click
- Pass current transcript data as props to modal
- After successful correction:
  - Refresh transcript display (via parent component callback)
  - Show success toast
  - Show "🔄 Re-run Analyses" button (inline or modal)

#### **2.3 Re-run Analyses Flow**
**After transcript correction saved:**
- Display prominent button: "🔄 Re-run Core Analyses"
- Info text: "Update Summary, Action Items, and Communication based on corrections"
- On click:
  - Show loading spinner overlay
  - Call `POST /transcriptions/:id/regenerate-core-analyses`
  - Update UI tabs with new analyses (via parent callback)
  - Success toast: "Analyses updated successfully!"

#### **2.4 New Component: DiffViewer** (Optional but Recommended)
**Location:** `apps/web/components/DiffViewer.tsx`

Reusable component for showing before/after diffs:
```typescript
interface DiffViewerProps {
  diff: TranscriptDiff[];
  summary: { totalChanges: number; affectedSegments: number };
}
```

Displays:
- Summary stats banner at top
- List of changes grouped by segment
- Color-coded highlights (red text with strikethrough for deletions, green for additions)
- Expand/collapse functionality for long segments

#### **2.5 API Client Methods**
**File:** `apps/web/lib/api-client.ts` (or similar)

Add methods:
```typescript
async correctTranscriptAI(
  id: string,
  instructions: string,
  previewOnly: boolean = true
): Promise<CorrectionPreview | ApplyResponse>

async findReplaceTranscript(
  id: string,
  find: string,
  replace: string,
  options: { matchCase?: boolean; wholeWord?: boolean; previewOnly?: boolean }
): Promise<CorrectionPreview | ApplyResponse>

async regenerateCoreAnalyses(id: string): Promise<Transcription>
```

---

### **Phase 3: Type Definitions**

**File:** `packages/shared/src/types.ts`

Add:
```typescript
export interface CorrectTranscriptRequest {
  instructions: string;
  previewOnly?: boolean; // Default: true
}

export interface FindReplaceRequest {
  find: string;
  replace: string;
  matchCase?: boolean;
  wholeWord?: boolean;
  previewOnly?: boolean; // Default: true
}

export interface TranscriptDiff {
  segmentIndex: number;
  speakerTag: string;
  timestamp: string; // Formatted like "1:23"
  oldText: string;
  newText: string;
}

export interface CorrectionPreview {
  original: string; // Full original transcript
  corrected: string; // Full corrected transcript
  diff: TranscriptDiff[]; // Only changed segments
  summary: {
    totalChanges: number; // Number of text changes
    affectedSegments: number; // Number of segments changed
  };
}

export interface CorrectionApplyResponse {
  success: boolean;
  transcription: Transcription; // Updated transcript object
  deletedAnalysisIds: string[]; // IDs of deleted custom analyses
  clearedTranslations: string[]; // Language codes that were cleared (e.g., ['es', 'fr'])
}
```

---

## User Journey (Full Flow with Iteration)

### **Scenario: Fix misspelled name across transcript**

1. User views transcription → Clicks "Transcript" tab
2. Sees "John" repeated 15 times, should be "Jon"
3. Clicks "✏️ Fix" button
4. Modal opens → "AI Fix" tab selected
5. Types: "Change 'John' to 'Jon'"
6. Clicks "Preview Changes"
7. Loading spinner (2-3 seconds)
8. Sees diff showing 15 changes across 8 segments
9. **Realizes also needs to fix "Acme" to "ACME Corporation"**
10. **Edits instructions:** "Change 'John' to 'Jon' and 'Acme' to 'ACME Corporation'"
11. **Clicks "Preview Again"**
12. **Sees updated diff** showing 23 total changes (15 John + 8 Acme)
13. Satisfied with preview
14. Clicks "Apply Changes"
15. Confirmation dialog: "⚠️ This will delete existing translations and custom analyses. Continue?"
16. Clicks "Confirm"
17. Loading spinner (1-2 seconds)
18. Backend updates Firestore, clears translations/analyses
19. Modal closes
20. Success toast: "✅ Transcript corrected successfully! 23 changes applied."
21. Button appears: "🔄 Re-run Core Analyses"
22. User clicks → Loading spinner (15-20 seconds)
23. Analyses tabs refresh with corrected names
24. User can later re-translate or regenerate custom analyses if needed

---

## Technical Implementation Details

### **AI Correction Prompt Design**
```typescript
const CORRECTION_SYSTEM_PROMPT = `You are a transcript correction assistant.
Your job is to apply the user's instructions to fix errors in transcripts
while preserving the original structure and meaning.

RULES:
1. Only make changes explicitly described in the user's instructions
2. Preserve all speaker labels (e.g., "Speaker 1:", "Speaker 2:")
3. Maintain original timestamps and formatting
4. Do not add, remove, or rephrase content beyond the requested corrections
5. Apply changes consistently across all occurrences
6. Preserve punctuation and capitalization unless instructed otherwise

Return ONLY the corrected transcript in the exact same format as the input.`;

const CORRECTION_USER_PROMPT = `ORIGINAL TRANSCRIPT:
{transcript}

CORRECTION INSTRUCTIONS:
{instructions}

Provide the corrected transcript below:`;
```

**Model:** Use `gpt-5-mini` for cost efficiency (corrections don't need advanced reasoning)

**Fallback:** If GPT-5-mini unavailable, use `gpt-5`

### **Speaker Segment Update Logic**
```typescript
async applyCorrectionsToSegments(
  originalSegments: SpeakerSegment[],
  correctedText: string
): Promise<SpeakerSegment[]> {
  // Strategy: Split corrected text by speaker labels, match to original segments

  // 1. Parse corrected text into segments (match "Speaker X:" pattern)
  const correctedSegments = parseSpeakerSegments(correctedText);

  // 2. Match corrected segments to original by speaker order and timestamps
  const updatedSegments = originalSegments.map((original, index) => {
    const corrected = correctedSegments[index];

    if (!corrected || corrected.speakerTag !== original.speakerTag) {
      // Fallback: Keep original if structure mismatch
      console.warn(`Segment mismatch at index ${index}, preserving original`);
      return original;
    }

    return {
      ...original,
      text: corrected.text // Update only the text field
    };
  });

  return updatedSegments;
}

function parseSpeakerSegments(text: string): Array<{ speakerTag: string; text: string }> {
  // Split by "Speaker N:" pattern
  const regex = /(Speaker \d+):\s*/g;
  const parts = text.split(regex).filter(Boolean);

  const segments = [];
  for (let i = 0; i < parts.length; i += 2) {
    segments.push({
      speakerTag: parts[i],
      text: parts[i + 1]?.trim() || ''
    });
  }

  return segments;
}
```

### **Data Cleanup on Edit**
```typescript
async applyTranscriptCorrections(
  userId: string,
  transcriptionId: string,
  correctedData: {
    transcriptText: string;
    speakerSegments: SpeakerSegment[];
    transcriptWithSpeakers: string;
  }
): Promise<CorrectionApplyResponse> {
  // 1. Update transcript fields
  await this.firebaseService.updateTranscription(transcriptionId, {
    transcriptText: correctedData.transcriptText,
    speakerSegments: correctedData.speakerSegments,
    transcriptWithSpeakers: correctedData.transcriptWithSpeakers,
    updatedAt: new Date()
  });

  // 2. Get current state for tracking what's deleted
  const transcription = await this.firebaseService.getTranscription(userId, transcriptionId);
  const existingTranslations = Object.keys(transcription.translations || {});

  // 3. Delete custom analyses
  const analyses = await this.firebaseService.getGeneratedAnalysesByTranscription(transcriptionId);
  const deletedAnalysisIds = analyses.map(a => a.id);
  await Promise.all(analyses.map(a => this.firebaseService.deleteGeneratedAnalysis(a.id)));

  // 4. Clear translations and analysis references
  await this.firebaseService.updateTranscription(transcriptionId, {
    translations: {}, // Clear all translations
    generatedAnalysisIds: [], // Clear custom analysis references
  });

  // 5. Fetch updated transcription for response
  const updatedTranscription = await this.firebaseService.getTranscription(userId, transcriptionId);

  return {
    success: true,
    transcription: updatedTranscription,
    deletedAnalysisIds,
    clearedTranslations: existingTranslations
  };
}
```

### **Find & Replace Logic**
```typescript
async findAndReplace(
  transcript: string,
  segments: SpeakerSegment[],
  find: string,
  replace: string,
  options: { matchCase?: boolean; wholeWord?: boolean }
): Promise<{ text: string; segments: SpeakerSegment[]; changes: number }> {
  let flags = 'g'; // Global
  if (!options.matchCase) flags += 'i'; // Case-insensitive

  let pattern = find;
  if (options.wholeWord) {
    pattern = `\\b${find}\\b`; // Word boundaries
  }

  const regex = new RegExp(pattern, flags);
  let changeCount = 0;

  // Replace in main transcript
  const updatedText = transcript.replace(regex, (match) => {
    changeCount++;
    return replace;
  });

  // Replace in each segment
  const updatedSegments = segments.map(segment => ({
    ...segment,
    text: segment.text.replace(regex, replace)
  }));

  // Rebuild formatted transcript
  const updatedFormatted = updatedSegments
    .map(s => `${s.speakerTag}: ${s.text}`)
    .join('\n\n');

  return {
    text: updatedText,
    segments: updatedSegments,
    changes: changeCount
  };
}
```

---

## Files to Modify/Create

### **Backend (7 files)**
1. `apps/api/src/transcription/transcription.controller.ts` - Add 2 endpoints (correctTranscript, findReplace)
2. `apps/api/src/transcription/transcription.service.ts` - Add correction methods + preview logic
3. `apps/api/src/transcription/prompts.ts` - Add CORRECTION_SYSTEM_PROMPT, CORRECTION_USER_PROMPT
4. `packages/shared/src/types.ts` - Add request/response types (see Phase 3)
5. `apps/api/src/firebase/firebase.service.ts` - Add `getGeneratedAnalysesByTranscription()`, `deleteGeneratedAnalysis()`
6. `apps/api/src/transcription/transcription.module.ts` - Ensure OpenAI service injected
7. `apps/api/test/transcription.service.spec.ts` - Unit tests for correction logic

### **Frontend (6 files)**
1. `apps/web/components/TranscriptCorrectionModal.tsx` - **NEW** main modal component
2. `apps/web/components/DiffViewer.tsx` - **NEW** diff display component (optional)
3. `apps/web/components/TranscriptWithSpeakers.tsx` - Add "✏️ Fix" button + integration
4. `apps/web/components/TranscriptionList.tsx` - Add re-run analyses callback (if needed)
5. `apps/web/lib/api-client.ts` - Add API methods (correctTranscriptAI, findReplace, regenerateCoreAnalyses)
6. `apps/web/messages/en.json` - Add i18n strings (+ duplicate to nl.json, de.json, fr.json, es.json)

### **Documentation (2 files)**
1. `CHANGELOG.md` - Document feature under [Unreleased] section
2. `docs/TRANSCRIPT_CORRECTION_FEATURE.md` - This file (implementation reference)

---

## Testing Checklist

### **Backend Tests**
- [ ] AI correction applies simple instructions correctly ("Change A to B")
- [ ] AI correction handles multiple instructions ("Change A to B and C to D")
- [ ] Preview mode (`previewOnly=true`) returns diff without saving
- [ ] Apply mode (`previewOnly=false`) saves changes to Firestore
- [ ] Speaker segments update preserves timestamps and speaker attribution
- [ ] `transcriptWithSpeakers` formatted string rebuilt correctly
- [ ] Translations deleted on edit
- [ ] Custom analyses deleted on edit (all documents in `generatedAnalyses` collection)
- [ ] `generatedAnalysisIds` array cleared
- [ ] User ownership validation works (rejects edits by non-owner)
- [ ] Find & replace handles case sensitivity correctly
- [ ] Find & replace handles whole word matching
- [ ] Find & replace counts changes accurately
- [ ] Error handling for malformed instructions
- [ ] Error handling for OpenAI API failures (retry logic)

### **Frontend Tests**
- [ ] Modal opens when "✏️ Fix" button clicked
- [ ] Tab switching works (AI Fix ↔ Find & Replace)
- [ ] Preview button generates diff (shows loading state)
- [ ] Diff viewer displays changes with correct formatting
- [ ] Instructions textarea remains editable after preview shown
- [ ] "Preview Again" button regenerates diff with updated instructions
- [ ] "Apply Changes" button saves corrections (shows confirmation dialog)
- [ ] Confirmation dialog warns about deleted translations/analyses
- [ ] Success toast shown after successful correction
- [ ] Transcript display refreshes with corrected text
- [ ] "🔄 Re-run Analyses" button appears after correction
- [ ] Re-run analyses updates Summary, Action Items, Communication tabs
- [ ] Loading states display correctly during all async operations
- [ ] Error messages shown for API failures (user-friendly)
- [ ] Modal closes on cancel/success
- [ ] Multi-language UI strings work (en, nl, de, fr, es)

### **Edge Cases**
- [ ] Empty transcript handling (shows error message)
- [ ] Very long transcripts (10K+ words) - pagination or scrolling in diff
- [ ] No speaker segments (fallback to plain text correction)
- [ ] Instructions that don't match any text (shows "0 changes" in preview)
- [ ] Special characters in find/replace (regex escaping)
- [ ] Unicode characters (emoji, accents, etc.)
- [ ] Concurrent edits by same user (lock mechanism or latest-wins)
- [ ] User navigates away during processing (cancel pending requests)
- [ ] Network timeout during preview (retry button)
- [ ] Transcription deleted while modal open (error handling)

### **Integration Tests**
- [ ] End-to-end: Edit transcript → Preview → Refine → Apply → Re-run analyses
- [ ] Translation regeneration after correction (manual test)
- [ ] Custom analysis regeneration after correction (manual test)
- [ ] Shared transcript behavior (edits by owner only)

---

## Performance Considerations

### **AI Correction Response Time**
- **Expected:** 2-5 seconds for preview (depends on transcript length)
- **Optimization:** Use `gpt-5-mini` instead of `gpt-5` (5x cheaper, faster)
- **Fallback:** Show timeout message after 30 seconds, allow retry

### **Large Transcript Handling**
- **Limit:** GPT-5-mini supports 128K tokens (~96K words)
- **Strategy:** For transcripts >50K words, warn user and suggest find/replace instead
- **UI:** Paginate diff viewer if >100 changes

### **Firestore Write Optimization**
- Use batch writes for updating segments + metadata
- Delete custom analyses in parallel (Promise.all)

---

## Security Considerations

1. **User Ownership Validation:**
   - Always verify `userId` matches authenticated user before allowing edits
   - Return 403 Forbidden if user doesn't own transcription

2. **Input Sanitization:**
   - Validate instructions length (max 2000 characters)
   - Escape special regex characters in find/replace
   - Prevent prompt injection in AI instructions (sanitize before sending to GPT)

3. **Rate Limiting:**
   - Max 10 preview requests per transcription per hour (prevent abuse)
   - Max 5 apply requests per transcription per hour

4. **Data Integrity:**
   - Validate `speakerSegments` structure before saving (prevent corruption)
   - Rollback transaction if any step fails

---

## Cost Analysis

### **AI Correction Costs (GPT-5-mini)**
- **Input:** ~1K tokens per 750 words of transcript + 100 tokens for instructions
- **Output:** ~1K tokens per 750 words corrected
- **Example:** 5K word transcript = ~7K input + 7K output = 14K tokens total
- **Cost:** $0.0028 per correction (14K tokens × $0.20/1M tokens)
- **Annual estimate** (assuming 1K corrections/month): $34/year

### **Find & Replace Costs**
- Zero AI costs (client-side regex)

---

## Rollout Plan

### **Phase 1: MVP (Week 1-2)**
- ✅ Backend: AI correction endpoint (preview + apply modes)
- ✅ Backend: Find & replace endpoint
- ✅ Frontend: Basic modal with AI Fix tab only
- ✅ Frontend: Simple diff viewer (text-based)
- ✅ Integration: Re-run analyses button
- ✅ Testing: Core functionality + edge cases

### **Phase 2: Polish (Week 3)**
- ✅ Frontend: Add Find & Replace tab
- ✅ Frontend: Enhanced diff viewer with color coding
- ✅ Frontend: Iterative preview refinement (editable instructions)
- ✅ UX: Confirmation dialogs, loading states, error messages
- ✅ i18n: Translate all strings to 5 languages

### **Phase 3: Optimization (Week 4)**
- ✅ Performance: Optimize large transcript handling
- ✅ AI: Add automatic suggestion on load (detect common errors)
- ✅ Analytics: Track usage metrics (preview vs apply rates, avg changes)
- ✅ Documentation: Update user guide + changelog

---

## Success Metrics

**Usage Metrics:**
- Number of corrections per week
- Preview-to-apply conversion rate (target: >70%)
- Average number of preview iterations before apply (target: <2)
- AI Fix vs Find & Replace usage ratio

**Quality Metrics:**
- User satisfaction rating (post-correction survey)
- Error rate (corrections that fail or produce unexpected results)
- Re-run analyses adoption rate (% of users who re-run after correction)

**Performance Metrics:**
- Average preview generation time (target: <3 seconds)
- Average apply time (target: <2 seconds)
- API error rate (target: <1%)

---

## Future Enhancements (Post-Launch)

1. **Smart Suggestions:**
   - Auto-detect common errors on load (misspelled names, inconsistent terminology)
   - Show suggested corrections as clickable chips

2. **Speaker Name Management:**
   - First-class feature: "Rename Speaker 1 to 'Jane Doe'"
   - Persist speaker name mappings for future transcriptions

3. **Batch Corrections:**
   - Queue multiple instruction sets
   - Apply all at once with combined preview

4. **Correction History:**
   - Track previous versions (undo/redo)
   - Show diff between any two versions

5. **Translation-Aware Corrections:**
   - Optionally preserve translations by re-translating only changed segments
   - Cost optimization: Only re-translate affected sentences

6. **Voice Commands:**
   - "Hey Neural, fix the speaker names" → Opens modal with AI suggestion

7. **Collaborative Editing:**
   - Multiple users can suggest corrections (requires ownership model changes)

---

## Questions for Stakeholders

- [ ] Should we show AI cost estimate before applying corrections? (e.g., "This will cost ~$0.003")
- [ ] Should corrections be logged for audit trail? (compliance requirement)
- [ ] Should we allow corrections on shared transcriptions? (owner-only or collaborators too?)
- [ ] What's the acceptable preview generation time? (3s? 5s? 10s?)
- [ ] Should we offer undo functionality? (requires version history)

---

## Estimated Effort

**Development:**
- Backend implementation: 5-6 hours
- Frontend implementation: 6-8 hours
- Testing (manual + automated): 3-4 hours
- Code review + refinement: 2 hours
- **Total development**: ~16-20 hours

**Post-Launch:**
- Documentation: 1 hour
- User training materials: 1 hour
- Analytics setup: 1 hour
- **Total post-launch**: ~3 hours

**Grand Total:** ~19-23 hours (~3-4 days for 1 developer)

---

## Implementation Notes

### **Priority Order:**
1. Backend: AI correction endpoint (preview mode) - **HIGHEST**
2. Frontend: Basic modal + diff viewer
3. Backend: Apply mode + data cleanup
4. Frontend: Iterative preview (editable instructions)
5. Backend: Find & replace endpoint
6. Frontend: Find & Replace tab
7. Integration: Re-run analyses button
8. Polish: i18n, error handling, loading states

### **Dependencies:**
- OpenAI API key with GPT-5-mini access
- Firestore composite index for `generatedAnalyses` (transcriptionId + generatedAt)
- Frontend: React 18+ (for concurrent rendering during preview updates)

### **Risk Mitigation:**
- **Risk:** GPT produces malformed output → **Mitigation:** Validate structure before saving, rollback on error
- **Risk:** Slow preview times for large transcripts → **Mitigation:** Show progress indicator, timeout after 30s
- **Risk:** User applies changes by accident → **Mitigation:** Confirmation dialog with clear warning
- **Risk:** Concurrent edits corrupt data → **Mitigation:** Optimistic locking or last-write-wins strategy

---

## Changelog Entry (Draft)

```markdown
### Added
- **AI-Powered Transcript Correction**: Fix errors in transcriptions using natural language instructions
  - Example: "Change 'John' to 'Jon' and fix company names"
  - Iterative preview workflow: Refine instructions and preview again before applying
  - Preserves speaker segments, timestamps, and formatting
- **Quick Find & Replace**: Traditional find/replace for simple corrections
  - Supports case sensitivity and whole word matching
  - Instant preview with change count
- **Re-run Core Analyses**: Regenerate Summary, Action Items, and Communication based on corrected transcripts
  - Accessed via "🔄 Re-run Analyses" button after transcript correction
- **Transcript Correction Modal**: Intuitive UI with tabbed interface (AI Fix / Find & Replace)
  - Color-coded diff viewer showing before/after changes
  - Confirmation dialogs to prevent accidental data loss

### Changed
- Editing transcripts now automatically clears translations and custom analyses to maintain consistency
  - Users can manually regenerate translations and on-demand analyses after corrections

### Technical
- New endpoints: `POST /transcriptions/:id/correct-transcript`, `POST /transcriptions/:id/find-replace`
- Uses GPT-5-mini for cost-efficient AI corrections (~$0.003 per 5K word transcript)
- Validates user ownership before allowing edits
```

---

**Last Updated:** 2025-10-31
**Status:** Planning / Ready for Implementation
**Owner:** TBD
