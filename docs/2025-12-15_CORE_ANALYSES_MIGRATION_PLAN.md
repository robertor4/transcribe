# Migration Plan: Deprecate coreAnalyses → Template-Based generatedAnalyses

**Date:** December 15, 2025
**Status:** Phase 1 Implemented ✅

## Overview

**Goal:** Stop using `coreAnalyses` field on transcription documents. All analyses (except summary) should use templates and store in `generatedAnalyses` collection.

**Timeline:**
- Phase 1 (Stop dual-writing): After V2 merges to main
- Phase 2 (Cleanup migration): ~1 week after V2 proven stable

**Key Decision:** Discard old markdown analyses. Users can regenerate from transcript using V2 structured templates.

---

## Target State

### Transcription Document (After Migration)
```typescript
{
  transcriptText: string;
  summaryV2: SummaryV2;          // KEPT on doc for fast access
  generatedAnalysisIds: string[]; // References to generatedAnalyses collection
  // coreAnalyses: REMOVED
}
```

### generatedAnalyses Collection
Contains all non-summary analyses:
- `actionItems` (structured JSON)
- `communicationAnalysis` (structured JSON)
- Any user-requested templates (email, blog, linkedin, etc.)

---

## Phase 1: Stop Dual-Writing (After V2 Release)

### 1.1 Backend: Processor Changes

**File:** `apps/api/src/transcription/transcription.processor.ts`

**Change:** Split `generateCoreAnalyses()` into:
1. Generate `summaryV2` → store directly on transcription doc
2. Generate `actionItems` → call `onDemandAnalysisService.generateFromTemplate()`
3. Generate `communicationAnalysis` → call `onDemandAnalysisService.generateFromTemplate()`

```typescript
// NEW FLOW (lines 128-210):

// 1. Generate summaryV2 only
const summaryV2 = await this.transcriptionService.generateSummaryV2Only(
  transcriptText,
  context,
  detectedLanguage,
);

// 2. Generate actionItems as GeneratedAnalysis (if requested)
const generatedAnalysisIds: string[] = [];
if (analysisSelection.generateActionItems) {
  const doc = await this.onDemandAnalysisService.generateFromTemplate(
    transcriptionId,
    'actionItems',
    userId,
    undefined,
    { skipDuplicateCheck: true }, // NEW option
  );
  generatedAnalysisIds.push(doc.id);
}

// 3. Generate communicationAnalysis as GeneratedAnalysis (if requested)
if (analysisSelection.generateCommunicationStyles) {
  const doc = await this.onDemandAnalysisService.generateFromTemplate(
    transcriptionId,
    'communicationAnalysis',
    userId,
    undefined,
    { skipDuplicateCheck: true },
  );
  generatedAnalysisIds.push(doc.id);
}

// 4. Update transcription (NO coreAnalyses)
const updateData = {
  status: TranscriptionStatus.COMPLETED,
  transcriptText,
  summaryV2,  // Direct on doc
  generatedAnalysisIds,
  // coreAnalyses: REMOVED
};
```

### 1.2 Backend: Service Changes

**File:** `apps/api/src/transcription/transcription.service.ts`

- Add `generateSummaryV2Only()` method (extract from existing `generateCoreAnalyses`)
- Mark `generateCoreAnalyses()` as `@deprecated`

**File:** `apps/api/src/transcription/on-demand-analysis.service.ts`

- Add `options?: { skipDuplicateCheck?: boolean }` parameter to `generateFromTemplate()`
- Skip lines 56-64 (duplicate check) when `skipDuplicateCheck: true`

### 1.3 Shared Types

**File:** `packages/shared/src/types.ts`

```typescript
export interface Transcription {
  // ... existing fields
  summaryV2?: SummaryV2;           // NEW: Top-level field
  coreAnalyses?: CoreAnalyses;     // DEPRECATED - kept for backwards compat
}

/**
 * @deprecated Use summaryV2 on transcription doc and generatedAnalyses collection
 */
export interface CoreAnalyses { ... }
```

### 1.4 Frontend: Adapter with Fallback

**File:** `apps/web/lib/types/conversation.ts`

Update `extractSummary()` to check both locations:

```typescript
// Try new location first
if (transcription.summaryV2) {
  return formatSummaryV2(transcription.summaryV2);
}
// Fallback to old location (backwards compat)
if (transcription.coreAnalyses?.summaryV2) {
  return formatSummaryV2(transcription.coreAnalyses.summaryV2);
}
```

### 1.5 Frontend: AnalysisTabs Update

**File:** `apps/web/components/AnalysisTabs.tsx`

For actionItems and communicationStyles:
- Remove from `analyses` prop reading
- Find in `generatedAnalyses` by templateId
- Render using existing `AnalysisContentRenderer` (already handles structured)

---

## Phase 2: Cleanup Migration (~1 Week After V2 Stable)

### 2.1 Migration Script

**New File:** `apps/api/src/scripts/migrate-core-analyses.ts`

```typescript
async function migrateTranscription(doc) {
  const updates: any = {};

  // 1. Promote summaryV2 to top-level
  if (doc.coreAnalyses?.summaryV2) {
    updates.summaryV2 = doc.coreAnalyses.summaryV2;
  }

  // 2. Delete coreAnalyses field
  updates.coreAnalyses = FieldValue.delete();

  // 3. Discard old markdown (actionItems, communicationStyles)
  // Users can regenerate using V2 templates

  await db.collection('transcriptions').doc(doc.id).update(updates);
}

// Batch process all transcriptions with coreAnalyses
async function runMigration() {
  const query = db.collection('transcriptions')
    .where('coreAnalyses', '!=', null)
    .limit(500);
  // ... batch processing loop
}
```

### 2.2 Code Cleanup (After Migration)

Remove:
- `CoreAnalyses` interface (or keep empty for type compat)
- `generateCoreAnalyses()` method
- `coreAnalyses` field from Transcription interface
- Frontend fallback code reading from `coreAnalyses`
- `coreAnalysesOutdated` flag and related logic

---

## Files to Modify

### Phase 1 (Stop Dual-Writing)

| File | Changes |
|------|---------|
| `apps/api/src/transcription/transcription.processor.ts` | Refactor to use `generateSummaryV2Only()` + `generateFromTemplate()` |
| `apps/api/src/transcription/transcription.service.ts` | Add `generateSummaryV2Only()`, deprecate `generateCoreAnalyses()` |
| `apps/api/src/transcription/on-demand-analysis.service.ts` | Add `skipDuplicateCheck` option |
| `packages/shared/src/types.ts` | Add `summaryV2` to Transcription, mark `CoreAnalyses` deprecated |
| `apps/web/lib/types/conversation.ts` | Update `extractSummary()` with fallback |
| `apps/web/components/AnalysisTabs.tsx` | Read actionItems/communication from `generatedAnalyses` |

### Phase 2 (Cleanup)

| File | Changes |
|------|---------|
| `apps/api/src/scripts/migrate-core-analyses.ts` | NEW: Migration script |
| `packages/shared/src/types.ts` | Remove `CoreAnalyses`, `coreAnalyses` field |
| `apps/api/src/transcription/transcription.service.ts` | Remove `generateCoreAnalyses()` |
| `apps/web/lib/types/conversation.ts` | Remove fallback code |
| `apps/web/components/AnalysisTabs.tsx` | Remove `analyses` prop handling for actionItems/communication |

---

## Backwards Compatibility

During transition (2-4 weeks between phases):
- **New transcriptions**: Only `summaryV2` + `generatedAnalyses`
- **Old transcriptions**: Frontend falls back to `coreAnalyses` if `summaryV2` not at root

After Phase 2 migration:
- All transcriptions have `summaryV2` at root
- `coreAnalyses` field deleted
- No fallback code needed

---

## Testing Checklist

- [ ] New transcription creates `summaryV2` at root level
- [ ] New transcription creates actionItems in `generatedAnalyses` collection
- [ ] New transcription creates communicationAnalysis in `generatedAnalyses` collection
- [ ] Old transcriptions still display correctly (fallback works)
- [ ] V2 conversation page renders structured actionItems correctly
- [ ] V2 conversation page renders structured communicationAnalysis correctly
- [ ] Migration script promotes `summaryV2` correctly
- [ ] Migration script removes `coreAnalyses` field

---

## Implementation Status

### Phase 1: Stop Dual-Writing ✅ (Completed Dec 15, 2025)

**Backend:**
- ✅ Added `skipDuplicateCheck` option to `OnDemandAnalysisService.generateFromTemplate()`
- ✅ Added `generateSummaryV2Only()` method to `TranscriptionService`
- ✅ Marked `generateCoreAnalyses()` as `@deprecated`
- ✅ Refactored `TranscriptionProcessor` to use new flow
- ✅ Injected `OnDemandAnalysisService` into processor

**Shared Types:**
- ✅ Added `summaryV2` field to `Transcription` interface
- ✅ Marked `CoreAnalyses` interface as `@deprecated`
- ✅ Marked `coreAnalyses` field as `@deprecated`

**Frontend:**
- ✅ Updated `conversation.ts` adapter with fallback logic
- ✅ Added `ANALYSIS_TO_TEMPLATE_MAP` to `AnalysisTabs.tsx`
- ✅ Added `findGeneratedAnalysisByKey()` and `hasAnalysisContent()` helpers
- ✅ Updated tab rendering to check both `generatedAnalyses` and `analyses`

**Migration Script:**
- ✅ Created `apps/api/src/scripts/migrate-core-analyses.ts`

### Phase 2: Cleanup Migration ⏳ (Pending ~1 week after V2 stable)

Run the migration script:
```bash
cd apps/api
npx ts-node src/scripts/migrate-core-analyses.ts --dry-run  # Preview
npx ts-node src/scripts/migrate-core-analyses.ts            # Execute
```

---

## Template Versioning Strategy

### Why Versioning?

When templates evolve (prompt changes, schema updates), existing analyses may become incompatible or inconsistent with new versions. Template versioning enables:

1. **Detection** of outdated analyses
2. **Selective regeneration** ("New template available, regenerate?")
3. **Backwards compatibility** logic in the UI
4. **Audit trail** of what version produced each analysis

### Version Format

Templates use semantic versioning (`MAJOR.MINOR.PATCH`):

- **MAJOR (x.0.0)**: Breaking changes - schema structure changes, field renames
- **MINOR (0.x.0)**: New fields added, prompt improvements that change output quality
- **PATCH (0.0.x)**: Bug fixes, typo corrections, minor prompt tweaks

### Implementation

**Template Definition** (`packages/shared/src/types.ts`):
```typescript
export interface AnalysisTemplate {
  // ... other fields
  version: string; // Semantic version (e.g., "1.0.0")
}
```

**Generated Analysis** (`packages/shared/src/types.ts`):
```typescript
export interface GeneratedAnalysis {
  // ... other fields
  templateVersion: string; // Snapshot of version at generation time
}
```

**Version Constant** (`apps/api/src/transcription/template-helpers.ts`):
```typescript
export const CURRENT_TEMPLATE_VERSION = '1.0.0';
```

### Compatibility Scenarios

| Change Type | Version Bump | Impact on Existing Analyses |
|-------------|--------------|----------------------------|
| Schema field added | MINOR | Old analyses work, missing new field |
| Schema field renamed | MAJOR | Old analyses incompatible with new UI |
| Schema field removed | MAJOR | Old analyses have extra unused field |
| Prompt quality improvement | MINOR | Old analyses have different quality |
| Prompt typo fix | PATCH | Negligible impact |

### Future Enhancements (Optional)

1. **Version comparison utility**:
   ```typescript
   function isAnalysisOutdated(analysis: GeneratedAnalysis, template: AnalysisTemplate): boolean {
     return semver.lt(analysis.templateVersion, template.version);
   }
   ```

2. **UI indicator for outdated analyses**:
   - Show badge: "Generated with template v1.0.0 (v1.1.0 available)"
   - Offer "Regenerate with latest template" button

3. **Bulk regeneration tool**:
   - Admin script to regenerate all analyses for a specific template when major version changes
