# On-Demand Analysis System - Development Plan

## Executive Summary

Transform Neural Summary from generating all 6 analyses upfront to a flexible on-demand system where users can:
- Get 4 core analyses automatically (Summary, Action Items, Transcript, Communication)
- Browse and generate additional analyses from a curated template catalog
- Reduce initial processing costs by ~50%

**Key Simplification:** Only Neural Summary provides templates - no user-created custom analyses. This significantly reduces scope while delivering core value.

## Current System Analysis

### What Happens Today
1. User uploads audio file
2. AssemblyAI transcribes audio (~30-60s for typical meeting)
3. GPT-5 generates **ALL 6 analyses in parallel** (~60-90s):
   - Summary (GPT-5) - Always generated
   - Communication Styles (GPT-5/mini) - Always generated
   - Action Items (GPT-5/mini) - Always generated
   - **Emotional Intelligence (GPT-5/mini)** - ❌ Often unused
   - **Influence & Persuasion (GPT-5/mini)** - ❌ Often unused
   - **Personal Development (GPT-5/mini)** - ❌ Often unused
4. All analyses stored in Firestore
5. User sees all 6 tabs immediately

### Problems
- **Cost inefficiency**: Generating 6 analyses when most users only need 2-3
- **Processing time**: Extra 30-40 seconds for analyses that may never be viewed
- **No flexibility**: Can't add new analysis types without deployment
- **No personalization**: Limited to 6 fixed analysis types

---

## Proposed System Architecture

### Core Concept: Two-Tier Analysis System

#### Tier 1: Automatic Analyses (Generated on Upload)
These are **always generated** because they're essential:
1. **Summary** - Core overview of the conversation
2. **Action Items** - Tasks and deliverables
3. **Full Transcript** - Complete transcription text
4. **Communication** - Speaking patterns and dynamics
5. **Details** - Metadata tab (already client-side generated)

#### Tier 2: On-Demand Analyses (Generated When Requested)
Users browse and select from **Neural Summary's curated template catalog**:
- Professional insights (Emotional IQ, Influence, Development)
- Content creation (Blog Post, Email, LinkedIn, etc.)
- Specialized analysis (Sales Call, Risk Assessment, etc.)

---

## Data Model Changes

### 1. New: `AnalysisTemplate` Interface

```typescript
export interface AnalysisTemplate {
  id: string; // e.g., "system-emotional-iq"
  name: string; // "Emotional Intelligence"
  description: string; // Short description for catalog
  category: 'professional' | 'content' | 'specialized';
  icon: string; // Lucide icon name
  color: string; // Badge color
  systemPrompt: string; // GPT system prompt
  userPrompt: string; // GPT user prompt template
  modelPreference: 'gpt-5' | 'gpt-5-mini';
  estimatedSeconds: number; // ~20 for mini, ~30 for gpt-5
  featured: boolean; // Show in featured section
  order: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}
```

**Important:** All templates are system-defined constants in code. No Firestore collection needed.

### 2. New: `GeneratedAnalysis` Interface

```typescript
export interface GeneratedAnalysis {
  id: string;
  transcriptionId: string;
  userId: string;
  templateId: string; // Links to AnalysisTemplate
  templateName: string; // Snapshot for history (e.g., "Emotional Intelligence")
  content: string; // Generated markdown content
  model: 'gpt-5' | 'gpt-5-mini';
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  generatedAt: Date;
  generationTimeMs?: number;
}
```

### 3. Modified: `Transcription` Interface

```typescript
export interface Transcription {
  // ... existing fields ...

  // OLD: analyses?: AnalysisResults; // DEPRECATED

  // NEW: Only core analyses generated automatically
  coreAnalyses?: {
    summary: string;
    actionItems: string;
    communicationStyles: string;
    transcript: string;
  };

  // NEW: References to on-demand analyses
  generatedAnalysisIds?: string[]; // Array of GeneratedAnalysis IDs

  // Existing fields remain unchanged
  context?: string;
  detectedLanguage?: string;
  // ... rest of fields
}
```

### 4. Firestore Collections

```
/transcriptions/{transcriptionId}
  - coreAnalyses (map)
  - generatedAnalysisIds (array of IDs)

/generatedAnalyses/{analysisId}  # NEW COLLECTION
  - Stores user-generated on-demand analyses
```

**Note:** Templates are NOT stored in Firestore - they're defined in code as constants.

---

## System Template Catalog

All templates are defined in: `apps/api/src/transcription/analysis-templates.ts`

### Professional Analysis Templates

#### 1. **Emotional Intelligence**
- **ID:** `system-emotional-iq`
- **Category:** Professional
- **Icon:** Brain
- **Color:** pink
- **Model:** gpt-5-mini
- **Description:** Analyze emotional tone, empathy, and interpersonal dynamics
- **Prompt:** (existing `EMOTIONAL_INTELLIGENCE_PROMPT`)

#### 2. **Influence & Persuasion**
- **ID:** `system-influence`
- **Category:** Professional
- **Icon:** Target
- **Color:** orange
- **Model:** gpt-5-mini
- **Description:** Identify persuasion techniques and influence patterns
- **Prompt:** (existing `INFLUENCE_PERSUASION_PROMPT`)

#### 3. **Personal Development**
- **ID:** `system-development`
- **Category:** Professional
- **Icon:** TrendingUp
- **Color:** teal
- **Model:** gpt-5-mini
- **Description:** Identify growth opportunities and skill development areas
- **Prompt:** (existing `PERSONAL_DEVELOPMENT_PROMPT`)

### Content Creation Templates

#### 4. **Blog Post Draft**
- **ID:** `system-blog-post`
- **Category:** Content
- **Icon:** FileEdit
- **Color:** purple
- **Model:** gpt-5
- **Description:** Transform conversation into an engaging blog post
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Convert this conversation into a well-structured blog post.

  Requirements:
  - Engaging headline that captures the main topic
  - Hook opening paragraph
  - 3-5 main sections with descriptive headings
  - Use conversational yet professional tone
  - Include specific examples and quotes from the discussion
  - Conclude with key takeaways
  - Add relevant subheadings for scannability

  Write in an accessible style suitable for a professional blog audience.
  ```

#### 5. **Email Summary**
- **ID:** `system-email-summary`
- **Category:** Content
- **Icon:** Mail
- **Color:** blue
- **Model:** gpt-5-mini
- **Description:** Create a concise email summary for stakeholders
- **Estimated Time:** ~20 seconds
- **Prompt:**
  ```
  Write a professional email summarizing this conversation.

  Format:
  Subject: [Concise subject line]

  Body:
  - Brief context (1-2 sentences)
  - Key decisions made (bullet points)
  - Action items with owners
  - Next steps

  Keep it under 200 words, professional tone, ready to send.
  ```

#### 6. **LinkedIn Post**
- **ID:** `system-linkedin-post`
- **Category:** Content
- **Icon:** Share2
- **Color:** indigo
- **Model:** gpt-5-mini
- **Description:** Create a LinkedIn post highlighting key insights
- **Estimated Time:** ~20 seconds
- **Prompt:**
  ```
  Transform this conversation into an engaging LinkedIn post.

  Requirements:
  - Hook opening (question or bold statement)
  - 3-5 key insights or takeaways
  - Use short paragraphs for mobile reading
  - Professional yet conversational tone
  - Include 3-5 relevant hashtags
  - Call to action or question for engagement
  - Keep under 200 words

  Focus on insights that would interest your professional network.
  ```

#### 7. **Meeting Minutes (Formal)**
- **ID:** `system-meeting-minutes`
- **Category:** Content
- **Icon:** FileText
- **Color:** gray
- **Model:** gpt-5-mini
- **Description:** Generate formal meeting minutes with sections
- **Estimated Time:** ~25 seconds
- **Prompt:**
  ```
  Create formal meeting minutes from this conversation.

  Structure:
  # Meeting Minutes - [Extract Topic]

  **Date:** [Extract or indicate unknown]
  **Attendees:** [List speakers/participants]

  ## Agenda Items
  [List topics discussed]

  ## Discussion Summary
  For each agenda item:
  - Key points raised
  - Different viewpoints
  - Relevant details

  ## Decisions Made
  [Bullet list of concrete decisions]

  ## Action Items
  | Task | Owner | Deadline |
  |------|-------|----------|
  [Table format]

  ## Next Meeting
  [Date/topics if mentioned]
  ```

### Specialized Templates

#### 8. **Executive Briefing**
- **ID:** `system-executive-briefing`
- **Category:** Professional
- **Icon:** Briefcase
- **Color:** slate
- **Model:** gpt-5
- **Description:** One-page executive summary for leadership
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Create a one-page executive briefing suitable for senior leadership.

  Structure:

  # Executive Briefing: [Topic]

  ## Situation
  What's happening? (2-3 sentences)

  ## Key Findings
  - Finding 1 with impact
  - Finding 2 with impact
  - Finding 3 with impact

  ## Recommendations
  1. Primary recommendation with rationale
  2. Secondary recommendation
  3. Alternative if applicable

  ## Risk Assessment
  - Critical risks and likelihood
  - Mitigation strategies

  ## Resource Requirements
  Budget, timeline, personnel needed

  ## Decision Required
  What leadership needs to decide

  Keep it scannable - use bold for key terms, limit to 1 page.
  ```

#### 9. **Sales Call Analysis**
- **ID:** `system-sales-analysis`
- **Category:** Specialized
- **Icon:** TrendingUp
- **Color:** green
- **Model:** gpt-5
- **Description:** Analyze sales calls for objections and opportunities
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Analyze this sales conversation comprehensively.

  ## Customer Profile
  - Key pain points mentioned
  - Current situation/challenges
  - Budget indicators
  - Decision-making authority

  ## Objections Raised
  For each objection:
  - What was said
  - Underlying concern
  - How it was handled
  - Recommended response

  ## Buying Signals
  - Positive indicators
  - Questions about implementation
  - Timeline discussions

  ## Competitor Mentions
  - Alternatives being considered
  - Comparison points raised

  ## Next Steps
  - Agreed actions
  - Follow-up timeline
  - Documents to send

  ## Win Probability
  - Assessment (high/medium/low)
  - Key factors influencing outcome
  - What could move the needle
  ```

#### 10. **Customer Feedback Extraction**
- **ID:** `system-customer-feedback`
- **Category:** Specialized
- **Icon:** MessageCircle
- **Color:** blue
- **Model:** gpt-5-mini
- **Description:** Extract product feedback and feature requests
- **Estimated Time:** ~25 seconds
- **Prompt:**
  ```
  Extract all product feedback from this customer conversation.

  ## Feature Requests
  - [Feature]: Description, why they need it, priority indicated

  ## Reported Issues
  - [Issue]: What's broken, impact, workaround if mentioned

  ## Positive Feedback
  - What's working well
  - Favorite features
  - Praise quotes

  ## Improvement Suggestions
  - What could be better
  - Usability concerns
  - Missing capabilities

  ## Pain Points
  - Current frustrations
  - Workflow blockers
  - Competitor advantages mentioned

  ## Priority Assessment
  Rate each item: Critical / High / Medium / Low
  ```

#### 11. **Risk Assessment**
- **ID:** `system-risk-assessment`
- **Category:** Professional
- **Icon:** ShieldAlert
- **Color:** red
- **Model:** gpt-5
- **Description:** Identify risks and mitigation strategies
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Conduct a comprehensive risk assessment of this discussion.

  ## Identified Risks

  For each risk, analyze:

  ### [Risk Category]: [Specific Risk]
  - **Description:** What is the risk?
  - **Likelihood:** High / Medium / Low
  - **Impact:** Critical / High / Medium / Low
  - **Risk Score:** [Likelihood × Impact]
  - **Indicators:** Warning signs mentioned
  - **Mitigation:** Proposed or recommended strategies
  - **Owner:** Who should manage this risk

  Categories to consider:
  - Technical risks
  - Business risks
  - Timeline/schedule risks
  - Resource/budget risks
  - Market/competitive risks
  - Regulatory/compliance risks

  ## Risk Matrix
  [Prioritize risks by score]

  ## Immediate Actions Required
  [Critical risks needing immediate attention]
  ```

#### 12. **Technical Documentation**
- **ID:** `system-tech-docs`
- **Category:** Specialized
- **Icon:** Code
- **Color:** purple
- **Model:** gpt-5
- **Description:** Create technical documentation from discussions
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Create technical documentation from this engineering discussion.

  # Technical Documentation: [Extract Topic]

  ## Overview
  Brief description of what's being built/decided

  ## Architecture Decisions
  - **Decision:** What was chosen
  - **Rationale:** Why this approach
  - **Alternatives Considered:** Other options discussed
  - **Trade-offs:** Pros and cons

  ## Technical Specifications
  - Technologies/frameworks mentioned
  - Key components
  - Data structures
  - APIs/integrations

  ## Implementation Details
  - Setup requirements
  - Configuration needed
  - Dependencies
  - Code patterns to follow

  ## Known Issues & Limitations
  - Current limitations
  - Technical debt incurred
  - Future improvements needed

  ## Testing Strategy
  - How to test
  - Edge cases to cover

  ## Deployment Notes
  - Deployment process
  - Environment requirements
  - Rollback procedures
  ```

#### 13. **FAQ Generator**
- **ID:** `system-faq`
- **Category:** Content
- **Icon:** HelpCircle
- **Color:** yellow
- **Model:** gpt-5-mini
- **Description:** Extract common questions and answers
- **Estimated Time:** ~20 seconds
- **Prompt:**
  ```
  Extract all questions discussed and create a comprehensive FAQ.

  Format each Q&A pair:

  ## [Category Name]

  **Q: [Question in user's words]**
  A: [Clear, concise answer based on discussion. Include specific details, examples, or caveats mentioned.]

  Requirements:
  - Group related questions by category
  - Write questions as actual user questions
  - Keep answers clear and actionable
  - Include relevant context/examples
  - Note if question wasn't fully answered

  Categories might include:
  - Getting Started
  - Features & Functionality
  - Troubleshooting
  - Pricing & Plans
  - Technical Details
  - Best Practices
  ```

#### 14. **Conflict Analysis**
- **ID:** `system-conflict-analysis`
- **Category:** Professional
- **Icon:** AlertTriangle
- **Color:** orange
- **Model:** gpt-5
- **Description:** Identify disagreements and resolution paths
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Analyze all disagreements and conflicts in this conversation.

  ## Conflicts Identified

  For each conflict:

  ### Conflict [#]: [Topic of Disagreement]

  **Parties Involved:** [Speaker identifiers]

  **Positions:**
  - Party A's position: [What they argued for]
  - Party B's position: [What they argued for]

  **Root Cause:**
  What's the underlying disagreement? (values, priorities, information gap, etc.)

  **Arguments Presented:**
  - Key points raised by each side
  - Evidence or reasoning used

  **Emotional Tone:**
  - How heated did it get?
  - Signs of frustration or defensiveness

  **Resolution:**
  - Was it resolved? How?
  - Compromise reached?
  - Agreement to revisit later?

  **Remaining Tensions:**
  - Unresolved aspects
  - Lingering disagreements

  ## Conflict Resolution Assessment
  - What worked in resolving conflicts?
  - What could have been handled better?
  - Recommendations for future disagreements

  ## Action Items from Conflicts
  [Specific next steps to address unresolved issues]
  ```

#### 15. **Training Material**
- **ID:** `system-training`
- **Category:** Content
- **Icon:** GraduationCap
- **Color:** teal
- **Model:** gpt-5
- **Description:** Convert conversation into training content
- **Estimated Time:** ~30 seconds
- **Prompt:**
  ```
  Convert this conversation into structured training material.

  # Training Module: [Extract Topic]

  ## Learning Objectives
  After completing this training, learners will be able to:
  - [Objective 1 - specific and measurable]
  - [Objective 2]
  - [Objective 3]

  ## Prerequisites
  - What learners should know before starting
  - Required skills or background

  ## Key Concepts

  ### Concept 1: [Name]
  - **Definition:** Clear explanation
  - **Why It Matters:** Importance/context
  - **Example:** Real example from discussion
  - **Common Mistakes:** Pitfalls to avoid

  [Repeat for each concept]

  ## Step-by-Step Guide
  1. [First step with details]
  2. [Second step with details]
  [Continue...]

  ## Practice Exercises
  - Exercise 1: [Hands-on activity]
  - Exercise 2: [Scenario-based question]

  ## Summary
  Key takeaways in bullet points

  ## Additional Resources
  - [Resources mentioned in discussion]
  - [Recommended reading/tools]

  ## Assessment
  - How will learners know they've mastered this?
  - Self-check questions
  ```

---

## Template Definition in Code

**File:** `apps/api/src/transcription/analysis-templates.ts`

```typescript
import { AnalysisTemplate } from '@transcribe/shared';
import * as prompts from './prompts';

export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'system-emotional-iq',
    name: 'Emotional Intelligence',
    description: 'Analyze emotional tone, empathy, and interpersonal dynamics',
    category: 'professional',
    icon: 'Brain',
    color: 'pink',
    systemPrompt: prompts.getSystemPromptByType('emotional_intelligence'),
    userPrompt: prompts.getPromptByType('emotional_intelligence'),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-influence',
    name: 'Influence & Persuasion',
    description: 'Identify persuasion techniques and influence patterns',
    category: 'professional',
    icon: 'Target',
    color: 'orange',
    systemPrompt: prompts.getSystemPromptByType('influence_persuasion'),
    userPrompt: prompts.getPromptByType('influence_persuasion'),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... continue for all 15 templates
];

// Helper to get template by ID
export function getTemplateById(id: string): AnalysisTemplate | undefined {
  return ANALYSIS_TEMPLATES.find(t => t.id === id);
}

// Helper to get templates by category
export function getTemplatesByCategory(category: string): AnalysisTemplate[] {
  return ANALYSIS_TEMPLATES.filter(t => t.category === category);
}

// Helper to get featured templates
export function getFeaturedTemplates(): AnalysisTemplate[] {
  return ANALYSIS_TEMPLATES.filter(t => t.featured).sort((a, b) => a.order - b.order);
}
```

---

## UI/UX Design

### 1. New Tab: "More Analyses" 📊

Replace the automatic Emotional IQ, Influence, Development tabs with a single **"More Analyses"** tab.

**Tab Order:**
1. Summary
2. Action Items
3. Full Transcript
4. Communication
5. **📊 More Analyses** (NEW)
6. Details

### 2. More Analyses Tab Content

#### A. Header Section
```
┌─────────────────────────────────────────────────────┐
│  📊 More Analyses                                    │
│  Generate additional insights from your              │
│  transcription using AI-powered templates            │
└─────────────────────────────────────────────────────┘
```

#### B. Previously Generated Section
Shows only if user has generated analyses before:

```
┌─────────────────────────────────────────────────────┐
│  Your Analyses                                       │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐│
│  │ 🧠 Emotional IQ      │  │ 📧 Email Summary     ││
│  │ 5 minutes ago        │  │ 2 hours ago          ││
│  │ [View] [Delete]      │  │ [View] [Delete]      ││
│  └──────────────────────┘  └──────────────────────┘│
└─────────────────────────────────────────────────────┘
```

#### C. Template Catalog with Categories

```
┌─────────────────────────────────────────────────────┐
│  ⭐ Featured Templates                               │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ 🧠 Emotional │ │ 🎯 Influence │ │ 💡 Personal ││
│  │    IQ        │ │  Persuasion  │ │ Development ││
│  │              │ │              │ │             ││
│  │ ~20 seconds  │ │ ~20 seconds  │ │ ~20 seconds ││
│  │ [Generate]   │ │ [Generate]   │ │ [Generate]  ││
│  └──────────────┘ └──────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ✍️ Content Creation                                 │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ ✏️ Blog Post │ │ 📧 Email     │ │ 📱 LinkedIn ││
│  │    Draft     │ │   Summary    │ │    Post     ││
│  │              │ │              │ │             ││
│  │ ~30 seconds  │ │ ~20 seconds  │ │ ~20 seconds ││
│  │ [Generate]   │ │ [Generate]   │ │ [Generate]  ││
│  └──────────────┘ └──────────────┘ └─────────────┘│
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ 📝 Meeting   │ │ 💼 Executive │ │ ❓ FAQ      ││
│  │   Minutes    │ │   Briefing   │ │  Generator  ││
│  │              │ │              │ │             ││
│  │ ~25 seconds  │ │ ~30 seconds  │ │ ~20 seconds ││
│  │ [Generate]   │ │ [Generate]   │ │ [Generate]  ││
│  └──────────────��� └──────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🎯 Specialized Analysis                             │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ 📈 Sales     │ │ 💬 Customer  │ │ ⚠️ Risk     ││
│  │   Analysis   │ │   Feedback   │ │  Assessment ││
│  │              │ │              │ │             ││
│  │ ~30 seconds  │ │ ~25 seconds  │ │ ~30 seconds ││
│  │ [Generate]   │ │ [Generate]   │ │ [Generate]  ││
│  └──────────────┘ └──────────────┘ └─────────────┘│
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ 💻 Technical │ │ ⚡ Conflict  │ │ 🎓 Training ││
│  │    Docs      │ │   Analysis   │ │  Material   ││
│  │              │ │              │ │             ││
│  │ ~30 seconds  │ │ ~30 seconds  │ │ ~30 seconds ││
│  │ [Generate]   │ │ [Generate]   │ │ [Generate]  ││
│  └──────────────┘ └──────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────┘
```

### 3. Template Card Design

Each card shows:
- **Icon** (emoji or Lucide icon with colored background)
- **Template name**
- **Estimated generation time**
- **Generate button** with loading state
- **Hover:** Show full description in tooltip

### 4. Generation Flow

#### Step 1: User Clicks "Generate"
- Button shows loading spinner
- Disable button during generation
- Show estimated time

#### Step 2: Generation Progress
```
┌──────────────────────┐
│ 🧠 Emotional IQ      │
│                      │
│ Generating...        │
│ ████████░░░░ 60%     │
│                      │
│ Usually ~20 seconds  │
└──────────────────────┘
```

#### Step 3: Completion
- Card shows "✓ Generated"
- New card appears in "Your Analyses" section
- Auto-navigate to view the analysis (or show "View" button)

### 5. Analysis View

When user clicks "View", show analysis in the same UI as other analyses:

**New Dynamic Tab:**
Tab appears in navigation with template icon/name (e.g., "🧠 Emotional IQ")

**Tab Content:**
- Markdown-rendered analysis content
- Copy button (top right)
- Delete button
- Timestamp footer
- Token usage (optional, for debugging)

---

## Backend Implementation

### API Endpoints

#### 1. Get Templates (Read-Only)

```typescript
GET /api/analysis-templates
  Response: AnalysisTemplate[]

GET /api/analysis-templates/:templateId
  Response: AnalysisTemplate
```

These endpoints simply return the constant array defined in code.

#### 2. Generate Analysis

```typescript
POST /api/transcriptions/:transcriptionId/generate-analysis
  Body: {
    templateId: string
  }
  Response: GeneratedAnalysis

GET /api/transcriptions/:transcriptionId/analyses
  Response: GeneratedAnalysis[]

DELETE /api/transcriptions/:transcriptionId/analyses/:analysisId
  Response: { success: boolean }
```

### Service Layer

#### 1. New: `AnalysisTemplateService`

```typescript
@Injectable()
export class AnalysisTemplateService {
  // Get all templates
  getTemplates(): AnalysisTemplate[] {
    return ANALYSIS_TEMPLATES;
  }

  // Get template by ID
  getTemplateById(id: string): AnalysisTemplate | undefined {
    return getTemplateById(id);
  }

  // Get templates by category
  getTemplatesByCategory(category: string): AnalysisTemplate[] {
    return getTemplatesByCategory(category);
  }

  // Get featured templates
  getFeaturedTemplates(): AnalysisTemplate[] {
    return getFeaturedTemplates();
  }
}
```

**Note:** Very simple service - just returns constants.

#### 2. Modified: `TranscriptionService`

**Change:** `generateAllAnalyses()` → `generateCoreAnalyses()`

```typescript
// OLD - Generate 6 analyses
async generateAllAnalyses(
  transcriptionText: string,
  context?: string,
  language?: string
): Promise<AnalysisResults>

// NEW - Generate only 4 core analyses
async generateCoreAnalyses(
  transcriptionText: string,
  context?: string,
  language?: string
): Promise<{
  summary: string;
  actionItems: string;
  communicationStyles: string;
  transcript: string;
}>
```

**Implementation:**
```typescript
async generateCoreAnalyses(
  transcriptionText: string,
  context?: string,
  language?: string
) {
  this.logger.log('Generating core analyses (Summary, Action Items, Communication)...');

  const analysisPromises = [
    // Summary - Always use GPT-5
    this.generateSummaryWithModel(
      transcriptionText,
      AnalysisType.SUMMARY,
      context,
      language,
      'gpt-5'
    ).catch(err => {
      this.logger.error('Summary generation failed:', err);
      return 'Summary generation failed. Please try again.';
    }),

    // Action Items - Use GPT-5-mini
    this.generateSummaryWithModel(
      transcriptionText,
      AnalysisType.ACTION_ITEMS,
      context,
      language,
      'gpt-5-mini'
    ).catch(err => {
      this.logger.error('Action items generation failed:', err);
      return null;
    }),

    // Communication Styles - Use GPT-5-mini
    this.generateSummaryWithModel(
      transcriptionText,
      AnalysisType.COMMUNICATION_STYLES,
      context,
      language,
      'gpt-5-mini'
    ).catch(err => {
      this.logger.error('Communication styles generation failed:', err);
      return null;
    }),
  ];

  const [summary, actionItems, communicationStyles] = await Promise.all(analysisPromises);

  this.logger.log('Core analyses completed');

  return {
    summary,
    actionItems,
    communicationStyles,
    transcript: transcriptionText, // No AI needed - just the text
  };
}
```

#### 3. New: `OnDemandAnalysisService`

```typescript
@Injectable()
export class OnDemandAnalysisService {
  constructor(
    private firebaseService: FirebaseService,
    private transcriptionService: TranscriptionService,
    private templateService: AnalysisTemplateService,
  ) {}

  async generateFromTemplate(
    transcriptionId: string,
    templateId: string,
    userId: string,
  ): Promise<GeneratedAnalysis> {
    // 1. Get template
    const template = this.templateService.getTemplateById(templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    // 2. Get transcription
    const transcription = await this.firebaseService.getTranscription(
      userId,
      transcriptionId,
    );
    if (!transcription) {
      throw new BadRequestException('Transcription not found');
    }

    // 3. Check if this analysis already exists (prevent duplicates)
    const existing = await this.getUserAnalyses(transcriptionId, userId);
    const duplicate = existing.find(a => a.templateId === templateId);
    if (duplicate) {
      return duplicate; // Return existing instead of regenerating
    }

    // 4. Get transcript text
    const transcriptText = transcription.coreAnalyses?.transcript ||
                          transcription.transcriptText;

    if (!transcriptText) {
      throw new BadRequestException('No transcript available');
    }

    // 5. Generate analysis using the template
    const startTime = Date.now();
    const content = await this.transcriptionService.generateSummaryWithModel(
      transcriptText,
      null, // No AnalysisType enum - use custom prompts
      transcription.context,
      transcription.detectedLanguage,
      template.modelPreference,
      template.systemPrompt,
      template.userPrompt,
    );
    const generationTimeMs = Date.now() - startTime;

    // 6. Save to Firestore
    const analysis: Omit<GeneratedAnalysis, 'id'> = {
      transcriptionId,
      userId,
      templateId,
      templateName: template.name,
      content,
      model: template.modelPreference,
      generatedAt: new Date(),
      generationTimeMs,
    };

    const analysisId = await this.firebaseService.createGeneratedAnalysis(analysis);

    // 7. Add reference to transcription
    await this.firebaseService.addAnalysisReference(transcriptionId, analysisId);

    return { ...analysis, id: analysisId };
  }

  async getUserAnalyses(
    transcriptionId: string,
    userId: string,
  ): Promise<GeneratedAnalysis[]> {
    return this.firebaseService.getGeneratedAnalyses(transcriptionId, userId);
  }

  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    const analysis = await this.firebaseService.getGeneratedAnalysisById(analysisId);

    if (!analysis || analysis.userId !== userId) {
      throw new UnauthorizedException('Cannot delete this analysis');
    }

    // Remove from transcription reference
    await this.firebaseService.removeAnalysisReference(
      analysis.transcriptionId,
      analysisId,
    );

    // Delete the analysis
    await this.firebaseService.deleteGeneratedAnalysis(analysisId);
  }
}
```

**Note:** Need to modify `generateSummaryWithModel` to accept custom prompts:

```typescript
async generateSummaryWithModel(
  transcriptionText: string,
  analysisType?: AnalysisType,
  context?: string,
  language?: string,
  model?: string,
  customSystemPrompt?: string,  // NEW
  customUserPrompt?: string,    // NEW
): Promise<string> {
  // Use custom prompts if provided, otherwise use analysisType
  const systemPrompt = customSystemPrompt ||
                      this.getSystemPromptForAnalysis(analysisType, language);

  const userPrompt = customUserPrompt ||
                    this.buildPromptForAnalysis(transcriptionText, analysisType, context, language);

  // Rest of generation logic...
}
```

### Processor Changes

**File:** `apps/api/src/transcription/transcription.processor.ts`

**Line 99 Change:**
```typescript
// OLD
const analyses = await this.transcriptionService.generateAllAnalyses(
  transcriptText,
  context,
  detectedLanguage,
);

// NEW
const coreAnalyses = await this.transcriptionService.generateCoreAnalyses(
  transcriptText,
  context,
  detectedLanguage,
);
```

**Update Firestore Save (Line ~105):**
```typescript
// OLD
await this.firebaseService.updateTranscription(transcriptionId, {
  analyses: {
    summary,
    communicationStyles,
    actionItems,
    emotionalIntelligence,
    influencePersuasion,
    personalDevelopment,
    transcript: transcriptText,
  },
  // ...
});

// NEW
await this.firebaseService.updateTranscription(transcriptionId, {
  coreAnalyses: {
    summary: coreAnalyses.summary,
    actionItems: coreAnalyses.actionItems,
    communicationStyles: coreAnalyses.communicationStyles,
    transcript: transcriptText,
  },
  generatedAnalysisIds: [], // Initialize empty array
  // ...
});
```

### Firebase Service Changes

**File:** `apps/api/src/firebase/firebase.service.ts`

Add new methods:

```typescript
// Create generated analysis
async createGeneratedAnalysis(
  analysis: Omit<GeneratedAnalysis, 'id'>,
): Promise<string> {
  const docRef = await this.db.collection('generatedAnalyses').add({
    ...analysis,
    generatedAt: analysis.generatedAt,
  });
  return docRef.id;
}

// Get generated analyses for a transcription
async getGeneratedAnalyses(
  transcriptionId: string,
  userId: string,
): Promise<GeneratedAnalysis[]> {
  const snapshot = await this.db
    .collection('generatedAnalyses')
    .where('transcriptionId', '==', transcriptionId)
    .where('userId', '==', userId)
    .orderBy('generatedAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as GeneratedAnalysis[];
}

// Get single generated analysis
async getGeneratedAnalysisById(analysisId: string): Promise<GeneratedAnalysis | null> {
  const doc = await this.db.collection('generatedAnalyses').doc(analysisId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as GeneratedAnalysis;
}

// Delete generated analysis
async deleteGeneratedAnalysis(analysisId: string): Promise<void> {
  await this.db.collection('generatedAnalyses').doc(analysisId).delete();
}

// Add analysis reference to transcription
async addAnalysisReference(transcriptionId: string, analysisId: string): Promise<void> {
  await this.db.collection('transcriptions').doc(transcriptionId).update({
    generatedAnalysisIds: admin.firestore.FieldValue.arrayUnion(analysisId),
  });
}

// Remove analysis reference from transcription
async removeAnalysisReference(transcriptionId: string, analysisId: string): Promise<void> {
  await this.db.collection('transcriptions').doc(transcriptionId).update({
    generatedAnalysisIds: admin.firestore.FieldValue.arrayRemove(analysisId),
  });
}
```

---

## Frontend Implementation

### Component Structure

```
apps/web/components/
├── AnalysisTabs.tsx (MODIFIED - support dynamic tabs)
├── MoreAnalysesTab.tsx (NEW - main container)
├── TemplateCard.tsx (NEW - individual template card)
├── TemplateCatalog.tsx (NEW - organized grid of templates)
├── GeneratedAnalysisList.tsx (NEW - show user's analyses)
└── AnalysisLoadingState.tsx (NEW - loading UI)
```

### Component Details

#### 1. `MoreAnalysesTab.tsx` (NEW)

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { AnalysisTemplate, GeneratedAnalysis } from '@transcribe/shared';
import { analysisApi } from '@/lib/api';
import { TemplateCatalog } from './TemplateCatalog';
import { GeneratedAnalysisList } from './GeneratedAnalysisList';

interface MoreAnalysesTabProps {
  transcriptionId: string;
  onAnalysisGenerated: (analysis: GeneratedAnalysis) => void;
  onViewAnalysis: (analysis: GeneratedAnalysis) => void;
  generatedAnalyses: GeneratedAnalysis[];
}

export const MoreAnalysesTab: React.FC<MoreAnalysesTabProps> = ({
  transcriptionId,
  onAnalysisGenerated,
  onViewAnalysis,
  generatedAnalyses,
}) => {
  const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
  const [loading, setLoading] = useState<string | null>(null); // templateId being generated
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await analysisApi.getTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleGenerate = async (templateId: string) => {
    setLoading(templateId);
    setError(null);

    try {
      const response = await analysisApi.generateAnalysis(transcriptionId, templateId);
      if (response.success && response.data) {
        onAnalysisGenerated(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate analysis');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (analysisId: string) => {
    try {
      await analysisApi.deleteAnalysis(transcriptionId, analysisId);
      // Parent will refresh the list
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          More Analyses
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate additional insights from your transcription using AI-powered templates
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Previously Generated Analyses */}
      {generatedAnalyses.length > 0 && (
        <GeneratedAnalysisList
          analyses={generatedAnalyses}
          onView={onViewAnalysis}
          onDelete={handleDelete}
        />
      )}

      {/* Template Catalog */}
      <TemplateCatalog
        templates={templates}
        generatingTemplateId={loading}
        onGenerate={handleGenerate}
        generatedTemplateIds={generatedAnalyses.map(a => a.templateId)}
      />
    </div>
  );
};
```

#### 2. `TemplateCatalog.tsx` (NEW)

```typescript
'use client';

import React from 'react';
import { AnalysisTemplate } from '@transcribe/shared';
import { TemplateCard } from './TemplateCard';

interface TemplateCatalogProps {
  templates: AnalysisTemplate[];
  generatingTemplateId: string | null;
  onGenerate: (templateId: string) => void;
  generatedTemplateIds: string[]; // Already generated
}

export const TemplateCatalog: React.FC<TemplateCatalogProps> = ({
  templates,
  generatingTemplateId,
  onGenerate,
  generatedTemplateIds,
}) => {
  const featured = templates.filter(t => t.featured);
  const professional = templates.filter(t => t.category === 'professional' && !t.featured);
  const content = templates.filter(t => t.category === 'content');
  const specialized = templates.filter(t => t.category === 'specialized');

  const renderSection = (title: string, emoji: string, items: AnalysisTemplate[]) => {
    if (items.length === 0) return null;

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {emoji} {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onGenerate={() => onGenerate(template.id)}
              generating={generatingTemplateId === template.id}
              alreadyGenerated={generatedTemplateIds.includes(template.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderSection('Featured Templates', '⭐', featured)}
      {renderSection('Content Creation', '✍️', content)}
      {renderSection('Professional Analysis', '💼', professional)}
      {renderSection('Specialized Analysis', '🎯', specialized)}
    </div>
  );
};
```

#### 3. `TemplateCard.tsx` (NEW)

```typescript
'use client';

import React from 'react';
import { AnalysisTemplate } from '@transcribe/shared';
import { Loader2, Check } from 'lucide-react';
import * as Icons from 'lucide-react';

interface TemplateCardProps {
  template: AnalysisTemplate;
  onGenerate: () => void;
  generating: boolean;
  alreadyGenerated: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onGenerate,
  generating,
  alreadyGenerated,
}) => {
  // Get icon component dynamically
  const IconComponent = (Icons as any)[template.icon] || Icons.FileText;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[template.color as keyof typeof colorClasses] || colorClasses.gray}`}>
        <IconComponent className="h-5 w-5" />
      </div>

      {/* Template Info */}
      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {template.name}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {template.description}
      </p>

      {/* Estimated Time */}
      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
        ~{template.estimatedSeconds} seconds
      </p>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={generating || alreadyGenerated}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
          alreadyGenerated
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 cursor-default'
            : generating
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
            : 'bg-[#cc3399] text-white hover:bg-[#b82d89] dark:bg-[#cc3399] dark:hover:bg-[#b82d89]'
        }`}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </span>
        ) : alreadyGenerated ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Generated
          </span>
        ) : (
          'Generate'
        )}
      </button>
    </div>
  );
};
```

#### 4. `GeneratedAnalysisList.tsx` (NEW)

```typescript
'use client';

import React from 'react';
import { GeneratedAnalysis } from '@transcribe/shared';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';

interface GeneratedAnalysisListProps {
  analyses: GeneratedAnalysis[];
  onView: (analysis: GeneratedAnalysis) => void;
  onDelete: (analysisId: string) => void;
}

export const GeneratedAnalysisList: React.FC<GeneratedAnalysisListProps> = ({
  analyses,
  onView,
  onDelete,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Your Analyses
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.map(analysis => (
          <div
            key={analysis.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {analysis.templateName}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {formatDistanceToNow(new Date(analysis.generatedAt), { addSuffix: true })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onView(analysis)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#cc3399] text-white rounded-lg text-sm font-medium hover:bg-[#b82d89] transition-colors"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              <button
                onClick={() => onDelete(analysis.id)}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 5. Modified: `AnalysisTabs.tsx`

**Changes needed:**
1. Accept `generatedAnalyses` prop
2. Create dynamic tabs for generated analyses
3. Add "More Analyses" tab
4. Handle viewing generated analyses

```typescript
// Add to interface
interface AnalysisTabsProps {
  analyses: CoreAnalyses; // Changed from AnalysisResults
  transcriptionId?: string;
  transcription?: Transcription;
  speakerSegments?: Array<...>;
  speakers?: Array<...>;
  generatedAnalyses?: GeneratedAnalysis[]; // NEW
}

// Inside component, add state for generated analyses view
const [viewingAnalysis, setViewingAnalysis] = useState<GeneratedAnalysis | null>(null);

// Create dynamic tabs array
const tabs = [
  { key: 'summary', label: 'Summary', content: analyses.summary },
  { key: 'actionItems', label: 'Action Items', content: analyses.actionItems },
  { key: 'transcript', label: 'Full Transcript', content: analyses.transcript },
  { key: 'communicationStyles', label: 'Communication', content: analyses.communicationStyles },
  { key: 'moreAnalyses', label: 'More Analyses', content: null }, // Special tab
  ...(generatedAnalyses || []).map(ga => ({
    key: `generated-${ga.id}`,
    label: ga.templateName,
    content: ga.content,
    isGenerated: true,
  })),
  { key: 'details', label: 'Details', content: null }, // Special tab
];

// Render More Analyses tab content
{activeTab === 'moreAnalyses' && (
  <MoreAnalysesTab
    transcriptionId={transcriptionId}
    onAnalysisGenerated={(analysis) => {
      // Add to list and switch to view
      setViewingAnalysis(analysis);
      setActiveTab(`generated-${analysis.id}`);
    }}
    onViewAnalysis={(analysis) => {
      setActiveTab(`generated-${analysis.id}`);
    }}
    generatedAnalyses={generatedAnalyses || []}
  />
)}
```

### API Integration

**File:** `apps/web/lib/api.ts`

Add new methods:

```typescript
export const analysisApi = {
  // Get all templates
  getTemplates: async (): Promise<ApiResponse<AnalysisTemplate[]>> => {
    return api.get('/analysis-templates');
  },

  // Get single template
  getTemplate: async (id: string): Promise<ApiResponse<AnalysisTemplate>> => {
    return api.get(`/analysis-templates/${id}`);
  },

  // Generate analysis
  generateAnalysis: async (
    transcriptionId: string,
    templateId: string
  ): Promise<ApiResponse<GeneratedAnalysis>> => {
    return api.post(`/transcriptions/${transcriptionId}/generate-analysis`, {
      templateId,
    });
  },

  // Get user's generated analyses for a transcription
  getUserAnalyses: async (
    transcriptionId: string
  ): Promise<ApiResponse<GeneratedAnalysis[]>> => {
    return api.get(`/transcriptions/${transcriptionId}/analyses`);
  },

  // Delete generated analysis
  deleteAnalysis: async (
    transcriptionId: string,
    analysisId: string
  ): Promise<ApiResponse> => {
    return api.delete(`/transcriptions/${transcriptionId}/analyses/${analysisId}`);
  },
};
```

---

## Migration Strategy

### Phase 1: Backward Compatibility (Week 1-2)

**Goal:** Deploy new system without breaking existing transcriptions.

#### 1. Database Schema
- Keep `analyses` field for existing transcriptions
- Add `coreAnalyses` field for new transcriptions
- Frontend reads from both (coreAnalyses first, fallback to analyses)

#### 2. Adapter Function

```typescript
// Helper to normalize data
function getAnalysesForDisplay(transcription: Transcription) {
  // New format
  if (transcription.coreAnalyses) {
    return {
      summary: transcription.coreAnalyses.summary,
      actionItems: transcription.coreAnalyses.actionItems,
      communicationStyles: transcription.coreAnalyses.communicationStyles,
      transcript: transcription.coreAnalyses.transcript,
    };
  }

  // Old format (backward compatibility)
  if (transcription.analyses) {
    return {
      summary: transcription.analyses.summary,
      actionItems: transcription.analyses.actionItems,
      communicationStyles: transcription.analyses.communicationStyles,
      transcript: transcription.analyses.transcript,
    };
  }

  return null;
}
```

### Phase 2: Data Migration (Week 3)

**Script:** `apps/api/scripts/migrate-analyses.ts`

**Purpose:** Convert old transcriptions to new format.

**Logic:**
1. Find all transcriptions with `analyses` but not `coreAnalyses`
2. Extract core analyses (summary, actionItems, communicationStyles, transcript)
3. Save as `coreAnalyses`
4. If Emotional IQ, Influence, or Development exist, create `GeneratedAnalysis` records
5. Link generated analyses to transcription

**Example:**
```typescript
async function migrateTranscription(transcriptionId: string) {
  const transcription = await getTranscription(transcriptionId);

  if (!transcription.analyses) return;
  if (transcription.coreAnalyses) return; // Already migrated

  // Move core analyses
  const coreAnalyses = {
    summary: transcription.analyses.summary,
    actionItems: transcription.analyses.actionItems,
    communicationStyles: transcription.analyses.communicationStyles,
    transcript: transcription.analyses.transcript,
  };

  // Migrate old analyses as GeneratedAnalysis
  const analysesToMigrate = [
    { key: 'emotionalIntelligence', templateId: 'system-emotional-iq', name: 'Emotional Intelligence' },
    { key: 'influencePersuasion', templateId: 'system-influence', name: 'Influence & Persuasion' },
    { key: 'personalDevelopment', templateId: 'system-development', name: 'Personal Development' },
  ];

  const generatedAnalysisIds: string[] = [];

  for (const { key, templateId, name } of analysesToMigrate) {
    if (transcription.analyses[key]) {
      const analysisId = await createGeneratedAnalysis({
        transcriptionId,
        userId: transcription.userId,
        templateId,
        templateName: name,
        content: transcription.analyses[key],
        model: 'gpt-5-mini',
        generatedAt: transcription.completedAt || transcription.createdAt,
      });
      generatedAnalysisIds.push(analysisId);
    }
  }

  // Update transcription
  await updateTranscription(transcriptionId, {
    coreAnalyses,
    generatedAnalysisIds,
  });

  console.log(`Migrated ${transcriptionId}: ${generatedAnalysisIds.length} analyses moved`);
}
```

**Run migration:**
```bash
npm run migrate:analyses -- --batch-size=100 --dry-run
npm run migrate:analyses -- --batch-size=100 # Actual migration
```

### Phase 3: Cleanup (Week 4)

1. Remove deprecated `generateAllAnalyses()` method
2. Remove old `analyses` field handling from frontend
3. (Optional) Delete `analyses` field from old Firestore documents to save storage

---

## Cost Analysis

### Current System Costs

**Assumptions:**
- Average transcript: 5,000 tokens
- GPT-5: $1.25/1M input, $10/1M output
- GPT-5-mini: $0.15/1M input, $1.25/1M output
- Average output: 2,000 tokens per analysis

**Current (6 analyses):**
1. Summary (GPT-5): $0.026
2. Communication (GPT-5-mini): $0.003
3. Action Items (GPT-5-mini): $0.003
4. Emotional IQ (GPT-5-mini): $0.003
5. Influence (GPT-5-mini): $0.003
6. Development (GPT-5-mini): $0.003

**Total:** ~$0.041 per transcription

### New System Costs

**Core (4 analyses, always generated):**
1. Summary (GPT-5): $0.026
2. Communication (GPT-5-mini): $0.003
3. Action Items (GPT-5-mini): $0.003
4. Transcript: $0 (no AI)

**Total:** ~$0.032 per transcription

**Savings:** $0.041 - $0.032 = **$0.009 per transcription (22% reduction)**

**On-demand analyses (pay-per-use):**
- GPT-5-mini template: ~$0.003
- GPT-5 template: ~$0.026

**Projected scenarios:**
- **80% users generate 0 additional:** 22% cost savings
- **80% users generate 1-2 additional:** ~15% cost savings
- **All users generate 3+ additional:** Break-even (but better UX and flexibility)

### Processing Time Savings

**Current:** ~90 seconds total (40s transcription + 50s analyses)
**New:** ~60 seconds for core (40s transcription + 20s core analyses)

**Time savings:** ~30 seconds (33% faster initial processing)

---

## Monitoring & Success Metrics

### Usage Metrics
1. % of users who generate on-demand analyses
2. Most popular templates (track generation count per template)
3. Average # of analyses per transcription
4. Time-to-first-analysis (should be faster)

### Performance Metrics
1. Core analysis generation time
2. On-demand analysis generation time (by template/model)
3. Cache hit rate (preventing duplicate generations)
4. API response times

### Cost Metrics
1. Total tokens used (by model)
2. Cost per transcription (should decrease)
3. Cost per user (month over month)
4. Savings vs. old system

### Quality Metrics
1. Analysis deletion rate (indicates poor quality/usefulness)
2. User engagement (do they generate more analyses?)

---

## Implementation Checklist

### Backend
- [ ] Create `AnalysisTemplate` and `GeneratedAnalysis` types in shared package
- [ ] Define 15 templates in `analysis-templates.ts`
- [ ] Create `AnalysisTemplateService` (simple read-only service)
- [ ] Create `OnDemandAnalysisService` (generate, list, delete)
- [ ] Modify `TranscriptionService.generateAllAnalyses()` → `generateCoreAnalyses()`
- [ ] Update `transcription.processor.ts` to use core analyses
- [ ] Add Firebase methods for generated analyses
- [ ] Create API endpoints (templates + generation)
- [ ] Add duplicate prevention (don't regenerate same template)
- [ ] Update prompts.ts to export individual prompts for templates
- [ ] Write migration script
- [ ] Unit tests for services
- [ ] Integration tests for API endpoints

### Frontend
- [ ] Create `MoreAnalysesTab.tsx`
- [ ] Create `TemplateCatalog.tsx`
- [ ] Create `TemplateCard.tsx`
- [ ] Create `GeneratedAnalysisList.tsx`
- [ ] Modify `AnalysisTabs.tsx` for dynamic tabs
- [ ] Add `analysisApi` methods to `api.ts`
- [ ] Update types for `CoreAnalyses` vs `AnalysisResults`
- [ ] Implement backward compatibility adapter
- [ ] Handle loading/error states
- [ ] Test responsive design
- [ ] Update internationalization (if needed)

### Database
- [ ] Create Firestore index for `generatedAnalyses` collection
  - `(transcriptionId, userId, generatedAt DESC)`
- [ ] Test migration script on staging
- [ ] Run migration on production

### Documentation
- [ ] Update API documentation
- [ ] User guide for new analysis catalog
- [ ] Update CLAUDE.md with new architecture

### Deployment
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Run migration script
- [ ] Monitor metrics
- [ ] Verify cost savings

---

## Questions for Team Review

1. **Template Selection:** Are the 15 proposed templates the right mix? Should we add/remove any?

2. **Featured Templates:** Which 3-4 templates should be marked as "featured"?

3. **Migration Timeline:** Is 4 weeks realistic?

4. **Tab Naming:** "More Analyses" vs "Additional Analyses" vs "Analyze Further"?

5. **Duplicate Prevention:** Should we allow regeneration of the same template, or always show cached version?

6. **Sharing:** Should generated analyses be included when sharing transcriptions?

7. **Storage Costs:** Should we implement expiration for old generated analyses?

8. **Rate Limiting:** 10 generations per minute per user - is this sufficient?

9. **Template Updates:** If we update a template's prompt, should old analyses show which version was used?

10. **Mobile UX:** Any concerns about the template catalog on mobile?

---

## Success Criteria

### Must Have (MVP)
1. ✅ Core analyses generate in <60 seconds (vs 90s currently)
2. ✅ Template catalog displays 15 system templates
3. ✅ Users can generate on-demand analyses
4. ✅ Generated analyses persist and are viewable
5. ✅ Backward compatibility maintained (old transcriptions work)
6. ✅ 20%+ cost reduction achieved
7. ✅ Zero data loss during migration
8. ✅ Duplicate prevention works (don't regenerate same template)

### Should Have
1. ✅ On-demand analysis generation <30 seconds
2. ✅ Responsive design works on mobile
3. ✅ Delete functionality for generated analyses
4. ✅ Clear loading states during generation

### Nice to Have (Post-MVP)
1. ⏭️ Template recommendations based on transcript content
2. ⏭️ Batch generation (generate multiple templates at once)
3. ⏭️ Export individual analyses as PDF
4. ⏭️ Template popularity rankings

---

## Conclusion

This simplified on-demand analysis system delivers the core value without the complexity of user-created templates:

**Benefits:**
- **Cost Efficiency:** 20-40% reduction in AI costs
- **Faster Processing:** 33% faster time-to-first-result
- **Flexibility:** Easy to add new templates via code
- **Better UX:** Users only pay for (time/cost) what they need
- **Scalability:** Adding templates is just adding to a constant array

**Reduced Scope:**
- No custom prompt creation UI
- No user template management
- No template marketplace
- Simpler database schema (no user templates collection)
- Faster development timeline

**Recommendation:** This is a great MVP that can be expanded later if users demand custom template creation.
