# V2 Analyses & Templates Architecture

## Overview

The V2 system uses a **template-driven generation pipeline** where predefined templates control how AI transforms conversation transcripts into structured outputs (emails, action items, blog posts, etc.). This replaces the V1 system that generated all analyses upfront.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User selects template    2. Optionally adds       3. Reviews &          │
│     in OutputGeneratorModal     custom instructions      generates           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  OutputGeneratorModal.tsx ──► api.ts ──► POST /transcriptions/:id/generate  │
│  (Step wizard UI)              (API client)                                  │
│                                                                              │
│  OutputDetailClient.tsx ◄── OutputRenderer.tsx ◄── Template Components      │
│  (Display page)               (Registry-based      (EmailTemplate, etc.)    │
│                                router)                                       │
│                                                                              │
│  Shared UI Components:                                                       │
│  └── outputTemplates/shared/TemplateHeader.tsx (icon + label + metadata)    │
│  └── outputTemplates/shared/BulletList.tsx (colored bullet lists)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (NestJS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  transcription.controller.ts ──► on-demand-analysis.service.ts              │
│  (API endpoint)                  (Orchestration)                             │
│                                          │                                   │
│                                          ▼                                   │
│  analysis-template.service.ts ◄── analysis-templates.ts                      │
│  (Template lookup)                (Template definitions)                     │
│                                          │                                   │
│                           template-helpers.ts                                │
│                           (Factory functions & shared constants)             │
│                                          │                                   │
│                                          ▼                                   │
│                           transcription.service.ts                           │
│                           (AI generation via OpenAI)                         │
│                                          │                                   │
│                                          ▼                                   │
│                           firebase.service.ts                                │
│                           (Firestore storage)                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files & Responsibilities

### Backend

| File | Purpose |
|------|---------|
| `apps/api/src/transcription/analysis-templates.ts` | **Template definitions** - Uses factory functions to define templates with `systemPrompt`, `userPrompt`, `outputFormat`, model preference |
| `apps/api/src/transcription/template-helpers.ts` | **Factory functions** - `createTemplate()`, `createStructuredTemplate()`, shared constants (`PROMPT_INSTRUCTIONS`, `SCHEMA_FRAGMENTS`) |
| `apps/api/src/transcription/analysis-template.service.ts` | **Template lookup** - `getTemplateById()`, `getAllTemplates()`, `getFeaturedTemplates()` |
| `apps/api/src/transcription/on-demand-analysis.service.ts` | **Orchestrator** - Combines template + transcript + context → calls AI → saves to Firestore |
| `apps/api/src/transcription/transcription.service.ts` | **AI generation** - `generateSummaryWithModel()` calls OpenAI with prompts |
| `apps/api/src/transcription/transcription.controller.ts` | **API endpoint** - `POST /:id/generate-analysis` |

### Frontend

| File | Purpose |
|------|---------|
| `apps/web/components/OutputGeneratorModal.tsx` | **Generation wizard** - 4-step UI for selecting template & adding instructions |
| `apps/web/components/outputTemplates/index.tsx` | **OutputRenderer** - Registry-based router that selects correct template component |
| `apps/web/components/outputTemplates/shared/TemplateHeader.tsx` | **Shared header** - Reusable icon + label + metadata header component |
| `apps/web/components/outputTemplates/shared/BulletList.tsx` | **Shared list** - Reusable bullet list with customizable colors |
| `apps/web/components/outputTemplates/EmailTemplate.tsx` | **Email display** - Renders `EmailOutput` structured data |
| `apps/web/components/outputTemplates/ActionItemsTemplate.tsx` | **Action items display** - Interactive checkboxes, priority sections |
| `apps/web/components/outputTemplates/BlogPostTemplate.tsx` | **Blog post display** - Sections, quotes, metadata |
| `apps/web/components/outputTemplates/LinkedInTemplate.tsx` | **LinkedIn display** - Post preview with hashtags |
| `apps/web/components/outputTemplates/CommunicationAnalysisTemplate.tsx` | **Analysis display** - Score rings, dimensions |
| `apps/web/app/[locale]/conversation/[id]/outputs/[outputId]/OutputDetailClient.tsx` | **Detail page** - Fetches & displays a single generated analysis |
| `apps/web/lib/outputTemplates.ts` | **Frontend template metadata** - Icons, descriptions for UI selection |
| `apps/web/lib/outputToMarkdown.ts` | **Clipboard converters** - `structuredOutputToHtml()` and `structuredOutputToMarkdown()` |

### Shared Types

| File | Purpose |
|------|---------|
| `packages/shared/src/types.ts` | **Type definitions** - `GeneratedAnalysis`, `StructuredOutput`, `EmailOutput`, `ActionItemsOutput`, etc. |

---

## Template Factory Pattern

Templates are created using factory functions that reduce boilerplate by automatically applying common fields.

### Factory Functions (template-helpers.ts)

```typescript
import { createTemplate, createStructuredTemplate, PROMPT_INSTRUCTIONS, SCHEMA_FRAGMENTS } from './template-helpers';

// For markdown output templates
createTemplate({
  id: 'my-template',
  name: 'My Template',
  description: 'Does something useful',
  category: 'professional',
  icon: 'FileText',
  color: 'blue',
  systemPrompt: 'You are an expert...',
  userPrompt: `Analyze this transcript...\n\n${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
  modelPreference: 'gpt-5-mini',
  estimatedSeconds: 15,
  order: 0,
  // Optional overrides
  featured: true,
  tags: ['analysis', 'productivity'],
});

// For structured JSON output templates
createStructuredTemplate({
  id: 'email',
  name: 'Email Summary',
  // ... other fields ...
  jsonSchema: {  // Object, not string - auto-stringified
    type: 'object',
    properties: {
      type: { type: 'string', const: 'email' },
      subject: { type: 'string' },
      body: SCHEMA_FRAGMENTS.stringArray,  // Reusable fragment
      // ...
    },
    required: ['type', 'subject', 'body'],
  },
});
```

### Default Fields (applied automatically)

```typescript
{
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  isSystemTemplate: true,
  visibility: 'public',
  requiredTier: 'free',
  version: 1,
  featured: false,  // Default, can be overridden
}
```

### Shared Constants

```typescript
// PROMPT_INSTRUCTIONS - Common prompt text
PROMPT_INSTRUCTIONS.languageConsistency
// → 'If the transcript is in a non-English language, write ALL content in that same language.'

PROMPT_INSTRUCTIONS.languageAndHeaders
// → Combined language + sentence case header instructions

PROMPT_INSTRUCTIONS.jsonRequirement
// → 'Always respond with valid JSON matching the provided schema.'

// SCHEMA_FRAGMENTS - Reusable JSON schema parts
SCHEMA_FRAGMENTS.stringArray
// → { type: 'array', items: { type: 'string' } }

SCHEMA_FRAGMENTS.actionItem
// → Complete action item schema with task, owner, deadline, priority, etc.
```

---

## Template Structure

Each template in `analysis-templates.ts` follows this structure:

```typescript
interface AnalysisTemplate {
  id: string;                    // Unique identifier (e.g., 'email')
  name: string;                  // Display name (e.g., 'Email Summary')
  description: string;           // User-facing description
  category: string;              // Grouping: 'professional', 'content', 'personal'
  icon: string;                  // Lucide icon name
  color: string;                 // Accent color for UI

  // AI Configuration
  systemPrompt: string;          // Sets AI persona and behavior
  userPrompt: string;            // Instructions + JSON schema for structured output
  outputFormat: 'structured' | 'markdown';  // V2: 'structured' enables JSON mode
  jsonSchema?: string;           // JSON schema for structured output validation
  modelPreference: string;       // Which model to use (e.g., 'gpt-5-mini')

  // UI Configuration
  featured: boolean;             // Show in featured section
  order: number;                 // Sort order in UI

  // Ecosystem fields (auto-applied by factory)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isSystemTemplate: boolean;
  visibility: string;
  requiredTier: string;
  version: number;
  tags?: string[];
  targetRoles?: string[];
  templateGroup?: string;
}
```

---

## Data Flow: Generation

```
1. User clicks "Generate" in OutputGeneratorModal
   └─► transcriptionApi.generateAnalysis(conversationId, templateId, customInstructions)

2. API receives request at POST /transcriptions/:id/generate-analysis
   └─► controller calls onDemandAnalysisService.generateFromTemplate()

3. Service orchestrates:
   a. Look up template by ID
   b. Fetch transcript from Firestore
   c. Combine stored context + customInstructions into effectiveContext
   d. Call transcriptionService.generateSummaryWithModel() with:
      - transcriptText
      - effectiveContext (injected into prompt)
      - template.systemPrompt
      - template.userPrompt
      - template.outputFormat ('structured' → JSON mode)

4. OpenAI returns JSON response (for structured templates)

5. Service parses JSON, saves to Firestore:
   └─► GeneratedAnalysis document in 'generatedAnalyses' collection
   └─► Includes customInstructions if provided

6. Frontend receives response, displays via OutputRenderer
```

---

## Content Types: Structured vs Markdown

### Structured (V2)

- `outputFormat: 'structured'` in template
- AI returns JSON matching schema in `userPrompt`
- Stored as parsed object in `content` field
- `contentType: 'structured'` in database
- Rendered by specific template components (EmailTemplate, ActionItemsTemplate, etc.)

**Structured Output Types:**
```typescript
type StructuredOutput =
  | EmailOutput
  | ActionItemsOutput
  | BlogPostOutput
  | LinkedInOutput
  | CommunicationAnalysisOutput;
```

### Markdown (V1 Legacy)

- `outputFormat: 'markdown'` or undefined
- AI returns plain text/markdown
- Stored as string in `content` field
- `contentType: 'markdown'` in database
- Rendered by generic markdown renderer

---

## Context & Custom Instructions Flow

Context flows through two paths and is combined before AI generation:

### 1. Stored Context
Set when uploading/recording a conversation. Stored in `transcription.context`.

### 2. Custom Instructions
Added during generation via modal Step 2. Passed as parameter to API.

### Combination Logic (on-demand-analysis.service.ts)

```typescript
let effectiveContext = transcription.context || '';
if (customInstructions) {
  effectiveContext = effectiveContext
    ? `${effectiveContext}\n\nAdditional instructions: ${customInstructions}`
    : customInstructions;
}
```

### Injection into Prompt (transcription.service.ts)

Context is injected above the user prompt:
```
## Context
The following context information is provided about this conversation:
[effectiveContext]

Please use this context to better understand references, participants, technical terms...
```

### Storage

Custom instructions are saved with the generated analysis for display in the UI:
```typescript
const analysis = {
  // ...
  customInstructions: customInstructions || undefined,
  // ...
};
```

---

## Rendering Pipeline

### OutputRenderer (Registry-Based Router)

The OutputRenderer uses a registry pattern instead of a switch statement, making it easy to add new templates:

```typescript
// Template component registry - add new templates here
const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<{ data: unknown }>> = {
  actionItems: ActionItemsTemplate,
  email: EmailTemplate,
  blogPost: BlogPostTemplate,
  linkedin: LinkedInTemplate,
  communicationAnalysis: CommunicationAnalysisTemplate,
};

export function OutputRenderer({ content, contentType }: OutputRendererProps) {
  // Markdown content
  if (contentType === 'markdown' || typeof content === 'string') {
    return <ReactMarkdown>{content}</ReactMarkdown>;
  }

  // Structured content - look up component in registry
  const structuredContent = content as StructuredOutput;
  const Component = TEMPLATE_COMPONENTS[structuredContent.type];

  if (Component) {
    return <Component data={structuredContent} />;
  }

  // Fallback for unknown types
  return <pre>{JSON.stringify(content, null, 2)}</pre>;
}
```

### Shared UI Components

Template components use shared components to reduce duplication:

```typescript
// TemplateHeader - consistent header with icon, label, and optional metadata
import { TemplateHeader } from './shared';

<TemplateHeader
  icon={Mail}
  label="Email Preview"
  iconColor="text-[#cc3399]"  // optional, defaults to brand color
  metadata={<span>3 key points</span>}  // optional
/>

// BulletList - consistent bullet styling with customizable colors
import { BulletList } from './shared';

<BulletList
  items={data.keyPoints}
  bulletColor="bg-blue-500"  // optional, defaults to gray
  className="text-blue-800"  // optional additional classes
/>
```

### Template Components

Each template component receives typed data and renders a rich UI:

```typescript
// EmailTemplate.tsx
import { TemplateHeader, BulletList } from './shared';

interface EmailTemplateProps {
  data: EmailOutput;
}

export function EmailTemplate({ data }: EmailTemplateProps) {
  return (
    <div className="space-y-6">
      <TemplateHeader icon={Mail} label="Email Preview" />

      <div className="bg-white border rounded-xl">
        <div className="px-6 py-4 border-b bg-gray-50">
          <span>Subject:</span>
          <h2>{data.subject}</h2>
        </div>
        <div className="px-6 py-6">
          <p>{data.greeting}</p>
          {data.body.map(p => <p key={p}>{p}</p>)}

          {data.keyPoints.length > 0 && (
            <BulletList items={data.keyPoints} bulletColor="bg-blue-500" />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Clipboard Copy (Rich Text)

The Copy button in OutputDetailClient copies structured content as rich text HTML with plain text fallback:

```typescript
const handleCopy = async () => {
  if (typeof output.content === 'string') {
    // Plain markdown - copy as text
    await navigator.clipboard.writeText(output.content);
  } else {
    // Structured content - copy as rich text
    const html = structuredOutputToHtml(output.content as StructuredOutput);
    const plainText = structuredOutputToMarkdown(output.content as StructuredOutput);

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      }),
    ]);
  }
};
```

This allows pasting into email clients or Google Docs with formatting preserved.

---

## Database Schema

### GeneratedAnalysis Document

Stored in Firestore collection: `generatedAnalyses`

```typescript
interface GeneratedAnalysis {
  id: string;                    // Firestore document ID
  transcriptionId: string;       // Parent transcription
  userId: string;                // Owner
  templateId: string;            // e.g., 'email'
  templateName: string;          // e.g., 'Email Summary' (snapshot)
  content: string | object;      // Markdown string or structured JSON
  contentType: 'structured' | 'markdown';
  model: string;                 // e.g., 'gpt-5-mini'
  customInstructions?: string;   // User-provided instructions
  generatedAt: Date;
  generationTimeMs?: number;
}
```

### Firestore Index

Required composite index:
- Collection: `generatedAnalyses`
- Fields: `transcriptionId` (Ascending), `userId` (Ascending), `generatedAt` (Descending)

---

## API Endpoints

### Generate Analysis
```
POST /transcriptions/:id/generate-analysis
Body: {
  templateId: string,
  customInstructions?: string
}
Response: GeneratedAnalysis
```

### Get Single Analysis
```
GET /transcriptions/:id/analyses/:analysisId
Response: GeneratedAnalysis
```

### Get All Analyses for Transcription
```
GET /transcriptions/:id/analyses
Response: GeneratedAnalysis[]
```

### Delete Analysis
```
DELETE /transcriptions/:id/analyses/:analysisId
Response: { success: boolean }
```

### Get Templates
```
GET /analysis-templates
Response: AnalysisTemplate[]
```

---

## Current Templates (V2)

| ID | Name | Category | Output Format | Model |
|----|------|----------|---------------|-------|
| `actionItems` | Action Items | professional | structured | gpt-5-mini |
| `email` | Email Summary | content | structured | gpt-5-mini |
| `blogPost` | Blog Post | content | structured | gpt-5 |
| `linkedin` | LinkedIn Post | content | structured | gpt-5-mini |
| `communicationAnalysis` | Communication Analysis | professional | structured | gpt-5-mini |

---

## Adding a New Template

### Step 1: Define Backend Template

In `analysis-templates.ts`:

```typescript
createStructuredTemplate({
  id: 'myNewTemplate',
  name: 'My New Template',
  description: 'What it does',
  category: 'content',
  icon: 'FileText',
  color: 'blue',
  systemPrompt: `You are an expert... ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
  userPrompt: `Create output...\n\n${PROMPT_INSTRUCTIONS.languageConsistency}\n\nReturn JSON: {...}`,
  modelPreference: 'gpt-5-mini',
  estimatedSeconds: 15,
  order: 10,
  tags: ['my-tag'],
  jsonSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', const: 'myNewTemplate' },
      // ... your fields
    },
    required: ['type', ...],
  },
}),
```

### Step 2: Define TypeScript Type

In `packages/shared/src/types.ts`:

```typescript
export interface MyNewTemplateOutput {
  type: 'myNewTemplate';
  // ... your fields
}

// Add to StructuredOutput union
export type StructuredOutput =
  | EmailOutput
  | ActionItemsOutput
  | BlogPostOutput
  | LinkedInOutput
  | CommunicationAnalysisOutput
  | MyNewTemplateOutput;
```

### Step 3: Create Frontend Component

In `apps/web/components/outputTemplates/MyNewTemplate.tsx`:

```typescript
import { FileText } from 'lucide-react';
import type { MyNewTemplateOutput } from '@transcribe/shared';
import { TemplateHeader, BulletList } from './shared';

interface MyNewTemplateProps {
  data: MyNewTemplateOutput;
}

export function MyNewTemplate({ data }: MyNewTemplateProps) {
  return (
    <div className="space-y-6">
      <TemplateHeader icon={FileText} label="My New Template" />
      {/* Render your content */}
    </div>
  );
}
```

### Step 4: Register in OutputRenderer

In `apps/web/components/outputTemplates/index.tsx`:

```typescript
import { MyNewTemplate } from './MyNewTemplate';

const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<{ data: unknown }>> = {
  // ... existing templates
  myNewTemplate: MyNewTemplate as React.ComponentType<{ data: unknown }>,
};
```

### Step 5: Add Clipboard Support

In `apps/web/lib/outputToMarkdown.ts`:

```typescript
case 'myNewTemplate': {
  const data = content as MyNewTemplateOutput;
  // Return markdown and HTML versions
}
```

---

## Key Implementation Details

### Duplicate Prevention
The service checks for existing analyses with the same templateId before generating:

```typescript
const existing = await this.getUserAnalyses(transcriptionId, userId);
const duplicate = existing.find(a => a.templateId === templateId);
if (duplicate) {
  return duplicate; // Return existing instead of regenerating
}
```

### JSON Parsing for Structured Output
```typescript
const rawContent = await this.transcriptionService.generateSummaryWithModel(...);

let content: GeneratedAnalysis['content'] = rawContent;
if (isStructured) {
  try {
    content = JSON.parse(rawContent);
  } catch (parseError) {
    // Fall back to storing as markdown if JSON parsing fails
  }
}
```

### Custom Instructions Display
Custom instructions are shown in the right panel of OutputDetailClient:

```typescript
const customSections = output.customInstructions ? (
  <RightPanelSection icon={StickyNote} title="Custom Instructions" showBorder>
    <p className="text-sm text-gray-600 whitespace-pre-wrap">
      {output.customInstructions}
    </p>
  </RightPanelSection>
) : null;
```

---

## Future Enhancements

1. **Template versioning** - Track which version of a template was used
2. **Batch generation** - Generate multiple templates at once
3. **Template recommendations** - Suggest templates based on transcript content
4. **Export options** - Export as PDF, Word, etc.
5. **Template customization** - Allow users to tweak prompts (advanced feature)
