# Cost Estimation Feature Implementation Plan

**Created:** 2025-10-31
**Status:** Planning - Not Yet Started
**Estimated Effort:** 8-12 hours

## Overview
Add comprehensive cost tracking and estimation for all AI API usage (OpenAI GPT-5/GPT-5-mini, Whisper, AssemblyAI) with an admin panel interface for viewing detailed cost breakdowns per transcription.

## Current State Analysis

### What Exists
- ✅ Admin panel with user management (`apps/web/app/[locale]/admin/page.tsx`)
- ✅ Admin guard and authentication system
- ✅ `Transcription.cost` field exists but is **never populated**
- ✅ `GeneratedAnalysis.tokenUsage` structure exists but is **never captured**
- ✅ Usage tracking (count-based, not cost-based) in `UsageService`
- ✅ OpenAI API calls return `completion.usage` but it's ignored

### What's Missing
- ❌ Token usage extraction from OpenAI API responses
- ❌ Cost calculation based on actual token usage
- ❌ AssemblyAI API usage/cost tracking
- ❌ Admin endpoints for cost data
- ❌ Frontend UI for cost visualization
- ❌ Historical data backfill for existing transcriptions

## Acceptance Criteria

1. **Admin Panel Tab**
   - New "Costs" tab in admin panel
   - View all transcriptions with cost estimates
   - Pagination (20 items per page)
   - Sortable by cost (highest first default)

2. **Transcription Cost Details**
   - Show per-transcription breakdown:
     - Transcription cost (AssemblyAI or Whisper)
     - Each analysis cost (model, tokens, price)
     - Total cost
   - Display model used for each analysis (GPT-5 vs GPT-5-mini)

3. **Cost Analytics**
   - Total API costs (all time)
   - Monthly cost trends
   - Cost by model breakdown
   - Top costliest transcriptions
   - Per-user cost analysis

4. **Data Accuracy**
   - Capture actual token usage from API responses
   - Store token counts in Firestore
   - Calculate costs based on current pricing models

## Implementation Phases

### Phase 1: Backend - Token Usage Capture & Cost Calculation

#### 1.1 Capture Token Usage from OpenAI API

**File:** `apps/api/src/transcription/transcription.service.ts`

**Location:** `generateSummaryWithModel()` method (around line 657-667)

**Changes:**
```typescript
// Current code (line 657):
const completion = await this.openai.chat.completions.create({
  model: selectedModel,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  max_completion_tokens: 8000,
});

return completion.choices[0].message.content || '';

// New code - capture usage:
const completion = await this.openai.chat.completions.create({
  model: selectedModel,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  max_completion_tokens: 8000,
});

const content = completion.choices[0].message.content || '';
const usage = completion.usage; // { prompt_tokens, completion_tokens, total_tokens }

return { content, usage };
```

**Also update:**
- All callers of `generateSummaryWithModel()` to handle returned object
- Store usage data when creating `GeneratedAnalysis` documents
- Update `Transcription` document with aggregated cost in `apiMetadata`

#### 1.2 Create Cost Calculator Service

**New file:** `apps/api/src/admin/cost-calculator.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class CostCalculatorService {
  // Pricing (as of October 2025)
  private readonly PRICING = {
    'gpt-5': {
      input: 1.25 / 1_000_000,  // $1.25 per 1M tokens
      output: 10.0 / 1_000_000,  // $10 per 1M tokens
    },
    'gpt-5-mini': {
      input: 0.15 / 1_000_000,  // Verify actual pricing
      output: 0.60 / 1_000_000, // Verify actual pricing
    },
    whisper: 0.006 / 60, // $0.006 per minute = per second
    assemblyai: 0.00025 / 1, // Verify actual pricing (estimate: $0.00025/sec)
  };

  /**
   * Calculate cost for an AI analysis based on token usage
   */
  calculateAnalysisCost(
    tokenUsage: { prompt: number; completion: number; total: number },
    model: 'gpt-5' | 'gpt-5-mini',
  ): number {
    const pricing = this.PRICING[model];
    if (!pricing) return 0;

    const inputCost = tokenUsage.prompt * pricing.input;
    const outputCost = tokenUsage.completion * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Calculate transcription cost based on duration and provider
   */
  calculateTranscriptionCost(
    durationSeconds: number,
    provider: 'whisper' | 'assemblyai',
  ): number {
    const rate = this.PRICING[provider];
    return durationSeconds * rate;
  }

  /**
   * Calculate total cost for a transcription including all analyses
   */
  async calculateTotalCost(transcription: any): Promise<{
    transcriptionCost: number;
    analysisCost: number;
    totalCost: number;
    breakdown: any[];
  }> {
    // Implementation details
  }

  /**
   * Estimate cost for historical transcriptions without token data
   */
  estimateCostFromTranscriptLength(
    transcriptLength: number,
    model: 'gpt-5' | 'gpt-5-mini',
  ): number {
    // Rough estimate: 1 token ≈ 4 characters
    const estimatedTokens = Math.ceil(transcriptLength / 4);
    // Assume 50% input, 50% output for estimate
    return this.calculateAnalysisCost(
      {
        prompt: estimatedTokens * 0.5,
        completion: estimatedTokens * 0.5,
        total: estimatedTokens,
      },
      model,
    );
  }
}
```

**Module registration:** Add to `AdminModule` providers

#### 1.3 Update Data Models

**File:** `packages/shared/src/types.ts`

**Add to `Transcription` interface (around line 149):**

```typescript
export interface Transcription {
  // ... existing fields ...
  cost?: number; // Keep for backward compatibility

  /**
   * Detailed API usage and cost metadata
   */
  apiMetadata?: {
    // Transcription costs
    whisperCost?: number;
    assemblyAICost?: number;
    totalTranscriptionCost: number;

    // Analysis costs
    totalAnalysisCost: number;

    // Overall total
    totalCost: number;

    // Model breakdown
    modelBreakdown?: {
      'gpt-5': {
        analysesCount: number;
        totalTokens: number;
        cost: number;
      };
      'gpt-5-mini': {
        analysesCount: number;
        totalTokens: number;
        cost: number;
      };
    };

    // Flag for backfilled data
    estimated?: boolean;
    costCalculatedAt?: string; // ISO timestamp
  };

  // ... rest of fields ...
}
```

**Rebuild shared package after changes:**
```bash
npm run build:shared
```

### Phase 2: Backend - Admin API Endpoints

#### 2.1 New Admin Controller Methods

**File:** `apps/api/src/admin/admin.controller.ts`

**Add new endpoints:**

```typescript
@Get('transcriptions')
@UseGuards(FirebaseAuthGuard, AdminGuard)
async getTranscriptionsWithCosts(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
  @Query('sortBy') sortBy: 'date' | 'cost' = 'cost',
  @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  @Query('userId') userId?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('minCost') minCost?: number,
  @Query('maxCost') maxCost?: number,
): Promise<TranscriptionCostListDto> {
  // Implementation
}

@Get('transcriptions/:id/cost-breakdown')
@UseGuards(FirebaseAuthGuard, AdminGuard)
async getTranscriptionCostBreakdown(
  @Param('id') transcriptionId: string,
): Promise<DetailedCostBreakdownDto> {
  // Implementation
}

@Get('analytics/costs/summary')
@UseGuards(FirebaseAuthGuard, AdminGuard)
async getCostsSummary(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
): Promise<CostAnalyticsDto> {
  // Implementation
}

@Get('analytics/costs/by-user')
@UseGuards(FirebaseAuthGuard, AdminGuard)
async getCostsByUser(
  @Query('limit') limit: number = 10,
): Promise<UserCostDto[]> {
  // Implementation
}

@Get('analytics/costs/by-model')
@UseGuards(FirebaseAuthGuard, AdminGuard)
async getCostsByModel(): Promise<ModelCostDto[]> {
  // Implementation
}
```

#### 2.2 Create DTOs

**New file:** `apps/api/src/admin/dto/cost-response.dto.ts`

```typescript
export class TranscriptionCostDto {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  createdAt: string;
  duration?: number;
  status: string;
  analysesCount: number;
  totalCost: number;
  transcriptionCost: number;
  analysisCost: number;
  estimated: boolean;
}

export class TranscriptionCostListDto {
  transcriptions: TranscriptionCostDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregates: {
    totalCost: number;
    avgCost: number;
    minCost: number;
    maxCost: number;
  };
}

export class AnalysisCostDetail {
  type: string;
  model: 'gpt-5' | 'gpt-5-mini';
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
}

export class DetailedCostBreakdownDto {
  transcriptionId: string;
  fileName: string;
  createdAt: string;

  transcription: {
    provider: 'whisper' | 'assemblyai';
    duration: number;
    cost: number;
  };

  coreAnalyses: AnalysisCostDetail[];
  onDemandAnalyses: AnalysisCostDetail[];

  totalCost: number;
  modelBreakdown: {
    'gpt-5': { count: number; cost: number };
    'gpt-5-mini': { count: number; cost: number };
  };

  estimated: boolean;
}

export class CostAnalyticsDto {
  totalCost: number;
  periodCost: number; // For filtered date range
  transcriptionCount: number;
  avgCostPerTranscription: number;

  costByModel: {
    model: string;
    cost: number;
    percentage: number;
  }[];

  costOverTime: {
    date: string;
    cost: number;
  }[];

  topCostlyTranscriptions: TranscriptionCostDto[];
}

export class UserCostDto {
  userId: string;
  userEmail: string;
  subscriptionTier: string;
  totalCost: number;
  transcriptionCount: number;
  avgCostPerTranscription: number;
}

export class ModelCostDto {
  model: string;
  usageCount: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerUse: number;
}
```

### Phase 3: Frontend - Admin Cost Dashboard

#### 3.1 Create Cost Management Tab

**New file:** `apps/web/app/[locale]/admin/costs/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import TranscriptionCostsTable from '@/components/admin/TranscriptionCostsTable';
import CostAnalytics from '@/components/admin/CostAnalytics';

export default function AdminCostsPage() {
  const t = useTranslations('admin');
  const [activeView, setActiveView] = useState<'table' | 'analytics'>('table');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {t('costs.title')}
      </h1>

      {/* View toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveView('table')}
          className={`px-4 py-2 rounded-lg ${
            activeView === 'table'
              ? 'bg-[#cc3399] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('costs.tableView')}
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-4 py-2 rounded-lg ${
            activeView === 'analytics'
              ? 'bg-[#cc3399] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('costs.analyticsView')}
        </button>
      </div>

      {/* Content */}
      {activeView === 'table' ? (
        <TranscriptionCostsTable />
      ) : (
        <CostAnalytics />
      )}
    </div>
  );
}
```

**Update:** `apps/web/app/[locale]/admin/page.tsx` to add "Costs" tab in navigation

#### 3.2 Transcriptions Cost Table Component

**New file:** `apps/web/components/admin/TranscriptionCostsTable.tsx`

**Features:**
- Server-side pagination
- Column sorting (date, cost, user, analyses count)
- Filters (date range, user search, cost range)
- Click row to open detailed breakdown modal
- Export to CSV button
- Loading states with skeletons

**Columns:**
| Date | User | Filename | Duration | Status | Analyses | Cost | Actions |
|------|------|----------|----------|--------|----------|------|---------|

**Styling:** Use brand colors (#cc3399), follow UI guidelines from CLAUDE.md

#### 3.3 Cost Breakdown Modal Component

**New file:** `apps/web/components/admin/CostBreakdownModal.tsx`

**Sections:**

1. **Header**
   - Filename
   - Created date
   - Total cost (large, prominent)
   - Estimated badge if applicable

2. **Transcription Section**
   - Provider (AssemblyAI / Whisper)
   - Duration (MM:SS format)
   - Cost

3. **Core Analyses Section**
   - Table with columns: Analysis Type | Model | Prompt Tokens | Completion Tokens | Cost
   - Summary (GPT-5)
   - Action Items (model varies)
   - Communication Styles (model varies)

4. **On-Demand Analyses Section**
   - Same table structure
   - List all generated analyses
   - Sortable by cost

5. **Cost Summary**
   - Pie chart: Transcription vs Analyses cost split
   - Pie chart: GPT-5 vs GPT-5-mini cost split
   - Total tokens used
   - Cost per analysis (average)

**Styling:** Modal overlay, clean card layout, charts using recharts or similar

#### 3.4 Cost Analytics Dashboard Component

**New file:** `apps/web/components/admin/CostAnalytics.tsx`

**Overview Cards (top row):**
- Total API Costs (all time)
- This Month Costs
- Average Cost/Transcription
- Total Transcriptions

**Charts Section:**

1. **Cost Over Time** (Line chart)
   - X-axis: Days/Months (date range selector)
   - Y-axis: Cost ($)
   - Two lines: Transcription cost, Analysis cost

2. **Cost by Model** (Pie chart)
   - GPT-5 vs GPT-5-mini split
   - Show percentage and dollar amount

3. **Transcription vs Analysis** (Pie chart)
   - Total transcription costs vs total analysis costs

4. **Top 10 Costliest Transcriptions** (Bar chart)
   - Horizontal bars
   - Show filename + cost
   - Click to open detailed breakdown

5. **Cost by User** (Table)
   - User email, subscription tier, total cost, transcription count, avg cost
   - Sortable
   - Top 10 by default, "View All" button

**Export Functionality:**
- "Export to CSV" button
- Downloads full cost data with all details

### Phase 4: Migration & Backfill

#### 4.1 Create Migration Script

**New file:** `apps/api/src/scripts/backfill-costs.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FirebaseService } from '../firebase/firebase.service';
import { CostCalculatorService } from '../admin/cost-calculator.service';

async function backfillCosts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);
  const costCalculator = app.get(CostCalculatorService);

  console.log('Starting cost backfill...');

  // Get all transcriptions without apiMetadata
  const transcriptions = await firebaseService.firestore
    .collection('transcriptions')
    .where('apiMetadata', '==', null)
    .get();

  console.log(`Found ${transcriptions.size} transcriptions to backfill`);

  let processed = 0;
  let failed = 0;

  for (const doc of transcriptions.docs) {
    try {
      const data = doc.data();

      // Estimate transcription cost
      const transcriptionCost = data.duration
        ? costCalculator.calculateTranscriptionCost(
            data.duration,
            'assemblyai', // Default assumption
          )
        : 0;

      // Estimate analysis costs
      let analysisCost = 0;
      let gpt5Count = 0;
      let gpt5miniCount = 0;

      // Core analyses (summary always GPT-5)
      if (data.summary) {
        const cost = costCalculator.estimateCostFromTranscriptLength(
          data.transcriptText?.length || 0,
          'gpt-5',
        );
        analysisCost += cost;
        gpt5Count++;
      }

      // Count other core analyses
      if (data.coreAnalyses) {
        const coreCount = Object.keys(data.coreAnalyses).length - 1; // Exclude summary
        // Estimate based on quality mode (assume balanced)
        const model = data.transcriptText?.length > 10000 ? 'gpt-5' : 'gpt-5-mini';
        const costPerAnalysis = costCalculator.estimateCostFromTranscriptLength(
          data.transcriptText?.length || 0,
          model,
        );
        analysisCost += costPerAnalysis * coreCount;

        if (model === 'gpt-5') {
          gpt5Count += coreCount;
        } else {
          gpt5miniCount += coreCount;
        }
      }

      // On-demand analyses
      if (data.generatedAnalysisIds?.length > 0) {
        // Fetch each analysis to get model info
        // Estimate based on model
        // Add to analysisCost
      }

      const apiMetadata = {
        assemblyAICost: transcriptionCost,
        totalTranscriptionCost: transcriptionCost,
        totalAnalysisCost: analysisCost,
        totalCost: transcriptionCost + analysisCost,
        modelBreakdown: {
          'gpt-5': {
            analysesCount: gpt5Count,
            totalTokens: 0, // Unknown for estimates
            cost: 0, // Calculate from analyses
          },
          'gpt-5-mini': {
            analysesCount: gpt5miniCount,
            totalTokens: 0,
            cost: 0,
          },
        },
        estimated: true,
        costCalculatedAt: new Date().toISOString(),
      };

      // Update Firestore
      await doc.ref.update({ apiMetadata });

      processed++;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${transcriptions.size}`);
      }
    } catch (error) {
      console.error(`Failed to process ${doc.id}:`, error);
      failed++;
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${transcriptions.size}`);

  await app.close();
}

backfillCosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
```

**Run script:**
```bash
cd apps/api
npm run build
node dist/scripts/backfill-costs.js
```

**Note:** Run on production database after deploying the new code

### Phase 5: Internationalization

**Update:** `apps/web/messages/en.json`

```json
{
  "admin": {
    "costs": {
      "title": "Cost Analysis",
      "tableView": "Transcriptions",
      "analyticsView": "Analytics",
      "totalCost": "Total Cost",
      "avgCost": "Average Cost",
      "estimatedBadge": "Estimated",
      "columns": {
        "date": "Date",
        "user": "User",
        "filename": "Filename",
        "duration": "Duration",
        "status": "Status",
        "analysesCount": "Analyses",
        "cost": "Cost"
      },
      "breakdown": {
        "title": "Cost Breakdown",
        "transcription": "Transcription",
        "coreAnalyses": "Core Analyses",
        "onDemandAnalyses": "On-Demand Analyses",
        "provider": "Provider",
        "model": "Model",
        "promptTokens": "Prompt Tokens",
        "completionTokens": "Completion Tokens",
        "totalTokens": "Total Tokens",
        "costSummary": "Cost Summary"
      },
      "analytics": {
        "overview": "Overview",
        "costOverTime": "Cost Over Time",
        "costByModel": "Cost by Model",
        "transcriptionVsAnalysis": "Transcription vs Analysis Costs",
        "topCostly": "Top 10 Costliest Transcriptions",
        "costByUser": "Cost by User",
        "exportCsv": "Export to CSV"
      }
    }
  }
}
```

**Repeat for:** nl.json, de.json, fr.json, es.json (translate strings)

## Files Summary

### New Files (7):
1. `apps/api/src/admin/cost-calculator.service.ts` - Cost calculation logic
2. `apps/api/src/admin/dto/cost-response.dto.ts` - DTOs for API responses
3. `apps/api/src/scripts/backfill-costs.ts` - Migration script
4. `apps/web/app/[locale]/admin/costs/page.tsx` - Costs page
5. `apps/web/components/admin/TranscriptionCostsTable.tsx` - Costs table
6. `apps/web/components/admin/CostBreakdownModal.tsx` - Detail modal
7. `apps/web/components/admin/CostAnalytics.tsx` - Analytics dashboard
8. `docs/PLAN_COST_ESTIMATION_FEATURE.md` - This planning document

### Modified Files (5):
1. `packages/shared/src/types.ts` - Add apiMetadata field
2. `apps/api/src/transcription/transcription.service.ts` - Capture token usage
3. `apps/api/src/admin/admin.controller.ts` - Add cost endpoints
4. `apps/api/src/admin/admin.module.ts` - Register CostCalculatorService
5. `apps/web/app/[locale]/admin/page.tsx` - Add Costs tab
6. `apps/web/messages/*.json` - Add translations (5 files)

## Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Update `packages/shared/src/types.ts` with apiMetadata
- [ ] Run `npm run build:shared`
- [ ] Create `CostCalculatorService` with pricing models
- [ ] Modify `TranscriptionService.generateSummaryWithModel()` to capture token usage
- [ ] Update all callers to handle new return format
- [ ] Store token usage when creating GeneratedAnalysis documents
- [ ] Calculate and store apiMetadata when transcription completes
- [ ] Test token capture with new transcription

### Phase 2: Admin API
- [ ] Create cost DTOs in `admin/dto/cost-response.dto.ts`
- [ ] Add `GET /admin/transcriptions` endpoint with pagination/filtering
- [ ] Add `GET /admin/transcriptions/:id/cost-breakdown` endpoint
- [ ] Add `GET /admin/analytics/costs/summary` endpoint
- [ ] Add `GET /admin/analytics/costs/by-user` endpoint
- [ ] Add `GET /admin/analytics/costs/by-model` endpoint
- [ ] Register CostCalculatorService in AdminModule
- [ ] Test all endpoints with Postman/Insomnia

### Phase 3: Frontend UI
- [ ] Create costs page at `app/[locale]/admin/costs/page.tsx`
- [ ] Build `TranscriptionCostsTable` component with pagination
- [ ] Build `CostBreakdownModal` component with charts
- [ ] Build `CostAnalytics` component with overview cards
- [ ] Add "Costs" tab to admin navigation
- [ ] Add translations to all language files
- [ ] Test UI with mock data
- [ ] Connect to backend APIs
- [ ] Test filtering, sorting, pagination
- [ ] Test modal interactions
- [ ] Verify responsive design

### Phase 4: Migration & Deployment
- [ ] Create backfill script
- [ ] Test backfill on local/staging database
- [ ] Run backfill on production (after deploying new code)
- [ ] Verify backfilled data accuracy
- [ ] Monitor API performance with new cost calculations

### Phase 5: Documentation & Cleanup
- [ ] Update CHANGELOG.md with all changes
- [ ] Add cost tracking documentation to README/CLAUDE.md
- [ ] Document API pricing models and update process
- [ ] Create admin guide for cost analysis feature
- [ ] Remove this planning document or mark as completed

## Open Questions

### Pricing Verification Needed:
1. **GPT-5-mini pricing** - Current estimates need verification from OpenAI pricing page
2. **AssemblyAI pricing** - Need actual pricing per minute/hour from AssemblyAI dashboard

### Design Decisions:
3. **Historical data strategy:**
   - Option A: Backfill with estimates for all existing transcriptions
   - Option B: Only track costs going forward (mark old as "No cost data")
   - **Recommendation:** Option A with "estimated" flag

4. **Cost visibility:**
   - Option A: Admin-only (current plan)
   - Option B: Show users their own transcription costs
   - **Recommendation:** Admin-only for now, add user-facing in future

5. **Export format:**
   - CSV (included in plan)
   - JSON (easy to add)
   - Excel (requires additional library)
   - **Recommendation:** Start with CSV, add others if requested

6. **Real-time cost preview:**
   - Show estimated cost before uploading
   - Show running cost during processing
   - **Recommendation:** Add in Phase 6 (future enhancement)

### Technical Considerations:
7. **Caching strategy:** Should cost calculations be cached? (Probably yes for analytics)
8. **Performance:** Index Firestore on `apiMetadata.totalCost` for sorting?
9. **Alerts:** Email admin when monthly costs exceed threshold?

## Success Metrics

After implementation, verify:
- [ ] All new transcriptions capture actual token usage
- [ ] Cost calculations match OpenAI/AssemblyAI billing (within 5%)
- [ ] Admin can view costs for all transcriptions
- [ ] Pagination and filtering work correctly
- [ ] Charts render without errors
- [ ] Export to CSV works
- [ ] No performance degradation on transcription processing
- [ ] Mobile-responsive admin interface

## Future Enhancements (Not in Scope)

1. **User-facing cost display** - Show users their own transcription costs
2. **Budget alerts** - Email notifications when costs exceed thresholds
3. **Cost optimization suggestions** - Recommend using GPT-5-mini when appropriate
4. **Cost predictions** - Estimate cost before upload based on file size
5. **Billing integration** - Pass-through costs to PAYG users
6. **Cost comparison reports** - Month-over-month, user-over-user
7. **API usage quotas** - Rate limiting based on cost
8. **Real-time cost tracking** - WebSocket updates during processing

## References

- OpenAI Pricing: https://openai.com/api/pricing/
- AssemblyAI Pricing: https://www.assemblyai.com/pricing
- GPT-5 Model: [apps/api/src/transcription/transcription.service.ts](../apps/api/src/transcription/transcription.service.ts)
- Analysis Templates: [apps/api/src/transcription/analysis-templates.ts](../apps/api/src/transcription/analysis-templates.ts)
- Shared Types: [packages/shared/src/types.ts](../packages/shared/src/types.ts)
- Admin Controller: [apps/api/src/admin/admin.controller.ts](../apps/api/src/admin/admin.controller.ts)
