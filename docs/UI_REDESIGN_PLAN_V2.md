# 🎯 Neural Summary 2.0: Voice-to-Output Platform (Simplified)

**Vision Document - Revised Architecture**
**Date:** January 2025
**Status:** Prototype Phase - V2 (~35% Complete)
**Last Updated:** January 23, 2025

## 📋 Implementation Status Overview

**Prototype Progress: 35% Complete**

- ✅ **UI Architecture** (85%) - Three-pane layouts, navigation, detail pages
- ✅ **Core Components** (75%) - FAB, modals, buttons, empty states, personalization
- 🚧 **Output System** (60%) - Templates defined, 2/5 fully rendered, mock generation working
- ❌ **Viral Growth Features** (0%) - Public sharing, analytics, folder invites not started
- ❌ **Backend Integration** (0%) - All features use mock data, no real API calls
- ❌ **Image Generation** (0%) - Replicate integration not started

**Key Achievement:** 4-step output generation wizard exceeds original plan's simple button approach

**Critical Gaps:** All viral growth mechanics (Phase 3-5) are missing - these are core to the V2 differentiation strategy

[📊 Detailed status breakdown below in "V2 Prototype Status" section](#v2-prototype-status)

---

## 🎨 Core Philosophy

**"One Conversation, Many Outputs"**

Users record/upload audio → AI creates:
1. **Source Content** (transcript + comprehensive summary)
2. **Derived Outputs** (generated on-demand from source)

**Key Principle**: Keep it simple. Let AI do transformation work. Focus on output quality and viral growth.

**Information Architecture**: Simple 1:1 model
- **1 Conversation** = 1 audio recording (or merged recordings) = Many outputs
- **Folders** = Organization tool for grouping related conversations
- **NOT**: Multi-source synthesis (future roadmap item)

---

## 📊 Revised Data Architecture

### Clean Data Model (Firestore)

```typescript
// Collection: folders (renamed from workspaces)
folders/{folderId}
  - name: string
  - ownerId: string
  - color: string (for visual distinction)
  - createdAt: timestamp
  - members: {
      [userId]: {
        role: 'owner' | 'editor' | 'viewer'
        joinedAt: timestamp
        invitedBy: string (userId)
      }
    }
  - settings: {
      defaultOutputTypes: string[] // which outputs to show by default
      visibility: 'private' | 'team' | 'public'
    }
  - stats: {
      conversationCount: number
      totalMinutes: number
    }

// Collection: conversations (renamed from documents/transcriptions)
conversations/{conversationId}
  - folderId: string (null = personal/no folder)
  - userId: string (creator)
  - title: string
  - createdAt: timestamp
  - updatedAt: timestamp
  - status: 'pending' | 'processing' | 'ready' | 'failed'

  // Source content (immutable after generation)
  // Note: One conversation = one recording (or merged recordings)
  - source: {
      audioUrl: string (Firebase Storage)
      audioDuration: number (seconds)
      transcript: {
        text: string (full transcript)
        speakers: number
        confidence: number
      }
      summary: {
        text: string (comprehensive AI summary)
        keyPoints: string[]
        generatedAt: timestamp
      }
    }

  // Metadata
  - tags: string[]
  - templateType: string ('meeting' | 'spec' | 'article' | 'custom')

  // Sharing & virality
  - sharing: {
      isPublic: boolean
      publicLinkId: string (short UUID for sharing)
      viewCount: number
      sharedWith: string[] (email addresses for folder invitations)
    }

// Subcollection: conversations/{conversationId}/outputs
// Cache generated outputs for fast retrieval
outputs/{outputType}
  - type: 'email' | 'actionItems' | 'blogPost' | 'linkedin' | 'communicationAnalysis' | 'userStories' (future)
  - content: object (structured JSON)
  - generatedAt: timestamp
  - promptVersion: string (for tracking prompt changes)
  - metadata: {
      wordCount: number
      estimatedReadTime: number
    }

// Collection: publicLinks (for analytics & access control)
publicLinks/{linkId}
  - conversationId: string
  - createdBy: string (userId)
  - createdAt: timestamp
  - expiresAt: timestamp (optional)
  - viewCount: number
  - uniqueViewers: string[] (IP hashes for analytics)
  - convertedUsers: string[] (userIds who signed up from this link)
```

**⚠️ Implementation Note:** This data model is **not yet implemented**. The prototype currently uses mock data structures defined in `/apps/web/lib/mockData.ts`. Backend migration is Phase 1 of implementation (see roadmap below).

---

## 📊 V2 Prototype Status

### ✅ Completed Features (~35% Overall)

#### **Pages (All Functional with Mock Data)**
1. **Dashboard V2** - `/app/[locale]/prototype-dashboard-v2/page.tsx`
   - ✅ Personalized greeting with time-of-day awareness (`getGreeting()`)
   - ✅ Quick Create buttons (8 templates)
   - ✅ Folders section with stats
   - ✅ Ungrouped conversations list
   - ✅ Empty states with CTAs
   - ✅ FAB integration
   - ✅ Milestone toast detection

2. **Conversation View V2** - `/app/[locale]/prototype-conversation-v2/[id]/page.tsx`
   - ✅ Three-pane layout (left nav + content + right context panel)
   - ✅ Vertical sections: Summary, Generated Outputs, Transcript
   - ✅ Sticky section navigation
   - ✅ Output gallery with cards
   - ✅ Generate output flow (4-step wizard)
   - ✅ FAB integration

3. **Folder View V2** - `/app/[locale]/prototype-folder-v2/[id]/page.tsx`
   - ✅ Three-pane layout
   - ✅ Folder metadata in right panel
   - ✅ Member list with roles
   - ✅ Conversation list
   - ✅ Empty states

4. **Output Detail Page** - `/app/[locale]/prototype-conversation-v2/[id]/outputs/[outputId]/page.tsx`
   - ✅ Dedicated detail page for each output
   - ✅ Template-specific rendering (Blog, Email)
   - ✅ Actions: Copy, Export, Regenerate, Share
   - ✅ Right metadata panel
   - ✅ Breadcrumb navigation

5. **Transcript Page** - `/app/[locale]/prototype-conversation-v2/[id]/transcript/page.tsx`
   - ✅ Dedicated transcript view with speaker timeline

#### **Core V2 Components (18 New Components)**

**Layout System:**
- ✅ `ThreePaneLayout` - Main container with collapsible sidebar
- ✅ `LeftNavigation` / `LeftNavigationCollapsed` - Sidebar with sections
- ✅ `CollapsibleSidebar` - Reusable wrapper
- ✅ `RightContextPanel` - Contextual metadata panel

**V2 UI Patterns:**
- ✅ `FloatingRecordButton` - Bottom-right FAB (implemented, not connected)
- ✅ `RecordingModal` - Full-screen recording interface (UI only, no real recording)
- ✅ `MilestoneToast` - Bottom-left celebration toasts
- ✅ `EmptyState` - Reusable empty state component
- ✅ `Button` - Standardized button system (5 variants: primary, secondary, brand, ghost, danger)
- ✅ `OutputGeneratorModal` - **4-step wizard** (exceeds plan - see deviations below)
- ✅ `DropdownMenu` - Reusable dropdown for actions

**Detail Page System (Not in Original Plan):**
- ✅ `DetailPageLayout` - Standardized wrapper
- ✅ `DetailPageHeader` - Header with breadcrumbs and actions
- ✅ `DetailMetadataPanel` - Right panel for metadata
- ✅ `DetailRightPanel`, `RightPanelSection`, `DetailItem`
- ✅ `ActionButton`, `ConversationCard`, `PrototypeNotice`

**Helper Utilities:**
- ✅ `userHelpers.ts` - Time-aware greetings, milestones, formatting
- ✅ `outputTemplates/` - Modular template library (5 templates defined)
- ✅ `mockData.ts` - Complete conversation/folder/output schemas

#### **Output Templates (2/5 Fully Rendered)**
- ✅ **EmailTemplate** - Full email rendering with subject, body, key points
- ✅ **BlogPostTemplate** - Magazine-style with hero image placeholder, sections, quotes
- 🚧 **LinkedInTemplate** - Defined but renders as `PlaceholderTemplate`
- 🚧 **ActionItemsTemplate** - Defined but renders as `PlaceholderTemplate`
- 🚧 **UserStoriesTemplate** - Defined but renders as `PlaceholderTemplate`

---

### 🚧 Partial / Needs Work

1. **ShareModal** - `/components/ShareModal.tsx`
   - ⚠️ Exists for **V1 transcription sharing** only
   - ❌ Does NOT implement V2 viral growth features:
     - No 150-word preview for anonymous users
     - No signup prompts
     - No conversion tracking
     - No unlimited public sharing mechanics
   - ✅ Has V1 features: password protection, email sending

2. **Output Template Renderers**
   - 🚧 3/5 templates need React rendering components
   - Currently fall back to `PlaceholderTemplate`

---

### ❌ Not Started (Major Gaps)

#### **Viral Growth Features (0% - Critical to V2 Strategy)**

1. **PublicConversationView** - Anonymous preview with signup conversion
   - ❌ 150-word content preview
   - ❌ "Create account to see full content" blur/paywall
   - ❌ Contextual signup CTAs
   - ❌ Conversion tracking

2. **FolderInvite Component** - Email invitation system
   - ❌ Email invitation form
   - ❌ Role selection UI (owner/editor/viewer)
   - ❌ Invitation email templates
   - ❌ Join folder flow (with/without account)

3. **ImpactDashboard** - Viral analytics
   - ❌ "Your Impact" widget
   - ❌ Shared conversation stats
   - ❌ View counts and signup attribution
   - ❌ Top shared conversations list

4. **ImageGenerator** - Blog post visuals
   - ❌ Replicate integration (Flux Schnell / Flux 1.1 Pro)
   - ❌ Image generation UI in blog template
   - ❌ Credit system for controlling costs

5. **Real Backend Integration**
   - ❌ Data model migration (transcriptions → conversations)
   - ❌ Folders collection with CRUD
   - ❌ Outputs subcollection (cache layer)
   - ❌ Real output generation API (GPT-5 integration exists but not connected to V2 UI)
   - ❌ Public links collection
   - ❌ Conversion attribution tracking

---

### 🆕 Features Added Beyond Original Plan

These components/patterns were created during implementation but weren't in the original plan:

1. **4-Step Output Generator Wizard** - `OutputGeneratorModal`
   - Plan called for simple "Generate" button
   - Implementation: Sophisticated wizard (Type → Instructions → Review → Generate)
   - **Better UX** than plan - allows customization before generation

2. **Complete Detail Page Architecture**
   - `DetailPageLayout`, `DetailPageHeader`, `DetailMetadataPanel`
   - Breadcrumb navigation system
   - Action button system
   - **Not specified in plan** - evolved organically

3. **Modular Template Library** - `/lib/outputTemplates/`
   - Individual template files with type-safe schemas
   - Central registry with `allTemplates` array
   - **More sophisticated** than plan suggested

4. **Transcript as Separate Page**
   - Plan: Transcript as a tab within conversation view
   - Implementation: Dedicated route with full timeline

5. **Enhanced Button System**
   - 5 variants with consistent styling
   - Icon support, fullWidth, size options
   - Plan didn't specify this level of detail

---

### 📝 Implementation Deviations

Key differences from original plan:

| Feature | Original Plan | Implementation | Reason |
|---------|--------------|----------------|--------|
| Output Generation | Simple "Generate" button | 4-step wizard modal | Better UX - allows instructions/customization |
| User Instructions | During conversation **creation** | During **output generation** | More flexible - different instructions per output |
| Transcript View | Tab within conversation | Separate page route | Better focus, dedicated timeline UI |
| Detail Pages | Not specified | Full architecture system | Needed for polish and consistency |
| Share Modal | V2 viral features | V1 functionality only | V2 viral features not yet implemented |

---

## 🚀 Viral Growth Mechanics

### 1. **Smart Sharing Flow**

**Current User Shares Conversation:**
```
[Share Button] → Modal:

  ┌─────────────────────────────────────────┐
  │  Share "Q4 Product Roadmap"             │
  ├─────────────────────────────────────────┤
  │                                         │
  │  🔗 Public Link                         │
  │  https://neuralsummary.com/s/abc123     │
  │  [Copy Link] [QR Code]                  │
  │                                         │
  │  📊 Link Analytics                      │
  │  • 12 views                             │
  │  • 3 signed up from this link 🎉       │
  │                                         │
  │  ─── OR ───                             │
  │                                         │
  │  📧 Invite to Folder                    │
  │  Email: [________________]              │
  │  Role: [Editor ▼]                       │
  │  [Send Invite]                          │
  │                                         │
  │  Folder members (unlimited invitations for viral growth): │
  │  • john@company.com (Editor)            │
  │  • sarah@company.com (Viewer)           │
  │                                         │
  └─────────────────────────────────────────┘
```

### 2. **Public View Experience (Anonymous User)**

**When visiting shared link without login:**

```
┌─────────────────────────────────────────────────────────────┐
│  Neural Summary                           [Sign Up] [Log In] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Q4 Product Roadmap                                          │
│  Shared by Roberto from DreamOne · 45 min recording          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🎁 Want to create your own voice-to-document?        │  │
│  │  Sign up free - 3 hours/month included               │  │
│  │  [Create Free Account →]                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [📄 Summary] [📋 Action Items] [💬 Comments (3)]           │
│                                                               │
│  ─── Summary ───                                              │
│  This roadmap outlines the Q4 2025 product strategy...       │
│  [Continue reading - Create account to see full content]     │
│                                                               │
│  ⚠️ You're viewing as guest. Sign up to:                     │
│  • Export outputs (email, blog, LinkedIn)                    │
│  • Add comments and collaborate                              │
│  • Create your own documents from voice                      │
│                                                               │
│  [Create Free Account] [Already have account? Log in]        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Viral Elements:**
- ✅ **Unlimited public sharing** (even for free tier - maximize viral reach)
- ✅ Allow **limited preview** without account (first 150 words)
- ✅ Show **value proposition** contextually ("Create your own...")
- ✅ Track **conversion attribution** (which shared link drove signup)
- ✅ Offer **immediate value** after signup (access full content + create own)

### 3. **Public View Experience (Logged-In User, Not Member)**

**When user is logged in but not folder member:**

```
┌─────────────────────────────────────────────────────────────┐
│  Q4 Product Roadmap                                          │
│  Shared by Roberto from DreamOne · 45 min conversation       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  💼 Want to join the "Product Launch" folder?         │  │
│  │  Request access to collaborate on conversations       │  │
│  │  [Request to Join →]                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [Full content visible - you're logged in]                   │
│  ...                                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 4. **Folder Invitation Flow**

**Owner invites member via email:**

```
Email to: john@company.com
Subject: Roberto invited you to "Product Launch" folder

─────────────────────────────────────────

Hi John,

Roberto has invited you to collaborate on the "Product Launch"
folder in Neural Summary.

📁 Folder: Product Launch
🎯 Your role: Editor (can view, comment, create conversations)
📊 Contains: 12 conversations, 3.5 hours of content

[Accept Invitation →]  [View Sample Conversation →]

────

What is Neural Summary?
Turn voice conversations into work-ready documents - specs,
articles, meeting notes, and more.

Not interested? [Decline invitation]

─────────────────────────────────────────
```

**After clicking "Accept":**
- **Has account?** → Log in → Join folder → Redirect to folder
- **No account?** → Sign up → Auto-join folder → Redirect to folder

### 5. **Viral Analytics Dashboard (for creators)**

```
┌─────────────────────────────────────────────────────────────┐
│  Your Impact 🎉                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 Conversations shared: 8                                  │
│  👀 Total views: 142                                         │
│  🎁 New signups from your shares: 7 users                    │
│                                                               │
│  Top shared conversations:                                    │
│  1. "Q4 Roadmap" → 45 views, 3 signups                      │
│  2. "Client Onboarding" → 38 views, 2 signups               │
│  3. "AI Strategy" → 27 views, 2 signups                     │
│                                                               │
│  🏆 You're in the top 10% of sharers!                        │
│  Unlock: Custom branding on shared links (Coming soon)       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Simplified UI Architecture

### **1. Dashboard: Creation-First**

```
┌─────────────────────────────────────────────────────────────┐
│  🎤 What do you want to create today?                        │
│                                                               │
│  Quick Create:                                                │
│  [📄 Document] [💼 Meeting] [📝 Article] [🎯 Custom]        │
│                                                               │
│  📁 Folders                                                  │
│  ├─ 💼 Product Launch (12 conversations) [Open →]           │
│  ├─ 🎯 Client Projects (8 conversations) [Open →]           │
│  └─ [+ New Folder]                                           │
│                                                               │
│  Recent Conversations                                         │
│  ├─ "Q4 Roadmap" · 2h ago · Ready · 12 views               │
│  ├─ "Client Call" · Yesterday · Ready · 3 views            │
│  └─ [View All →]                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **2. Conversation View: Source + Outputs**

```
┌─────────────────────────────────────────────────────────────┐
│  Q4 Product Roadmap                                          │
│  📁 Product Launch · 45 min · Created 2 hours ago           │
│                                                               │
│  [🎙️ Audio] [📄 Transcript] [📊 Summary] [🎯 Outputs]      │
│  [👥 Share]                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  === CURRENT VIEW: Summary ===                               │
│                                                               │
│  This roadmap outlines the Q4 2025 product strategy          │
│  focusing on AI-powered features to increase user...         │
│  [Full summary text - immutable source content]              │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  🎯 Generate Outputs From This Conversation                  │
│                                                               │
│  📧 Email Summary                                            │
│  → Professional recap for stakeholders                       │
│  [Generate →]                                                │
│                                                               │
│  ✅ Action Items                                             │
│  → Extract tasks with owners & deadlines                     │
│  [Generate →]                                                │
│                                                               │
│  📝 Blog Post Draft                                          │
│  → Turn insights into 800-word article                       │
│  [Generate →]                                                │
│                                                               │
│  💼 LinkedIn Post                                            │
│  → Shareable professional update (280 chars)                 │
│  [Generate →]                                                │
│                                                               │
│  📋 User Stories (for PMs)                                   │
│  → Convert requirements to user story format                 │
│  [Generate →]                                                │
│                                                               │
│  ✨ Custom Output                                            │
│  → Describe what you need                                    │
│  [Configure & Generate →]                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **3. Generated Output View**

**After clicking "Generate Email Summary":**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Conversation                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📧 Email Summary                                            │
│  Generated from "Q4 Product Roadmap" · Just now              │
│                                                               │
│  [📋 Copy] [📤 Send via Email] [🔄 Regenerate] [⋯ More]     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Subject: Q4 Product Roadmap - Key Highlights         │  │
│  │                                                        │  │
│  │  Hi team,                                              │  │
│  │                                                        │  │
│  │  I wanted to share the key points from our Q4         │  │
│  │  planning session:                                     │  │
│  │                                                        │  │
│  │  • Focus: AI-powered features to increase engagement  │  │
│  │  • Target: 50% reduction in spec creation time        │  │
│  │  • Timeline: Launch by October 15                     │  │
│  │                                                        │  │
│  │  Full details available in the document.              │  │
│  │                                                        │  │
│  │  Best,                                                 │  │
│  │  Roberto                                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  💡 This output was generated from your conversation.        │
│  Edit directly, then copy or send.                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Backend API Endpoints

```typescript
// Generate output on-demand
POST /api/conversations/:conversationId/outputs/:outputType
Body: {
  customPrompt?: string // for custom outputs or user instructions
  tone?: 'professional' | 'casual' | 'technical'
  length?: 'short' | 'medium' | 'long'
}
Response: {
  content: object | string // JSON for structured outputs, string for simple
  cached: boolean // true if from cache
  generatedAt: timestamp
}

// Sharing endpoints
POST /api/conversations/:conversationId/share
Body: {
  type: 'public' | 'folder'
  emails?: string[] // for folder invitations 
  role?: 'editor' | 'viewer'
  expiresAt?: timestamp
}
Response: {
  publicLinkId: string
  publicUrl: string
}
Note: Public link sharing is UNLIMITED (even for free tier) to maximize viral growth

// Public conversation access (no auth required)
GET /api/public/:linkId
Response: {
  conversation: {
    title: string
    createdBy: { name: string, folder?: string }
    duration: number
    preview: string // first 150 words if not logged in
  }
  requiresAuth: boolean // true if user needs to sign up for full access
}

// Folder operations
POST /api/folders
POST /api/folders/:folderId/invite
POST /api/folders/:folderId/join
```

### Output Generation Service

```typescript
// apps/api/src/outputs/outputs.service.ts

@Injectable()
export class OutputsService {

  async generateOutput(
    conversationId: string,
    outputType: OutputType,
    options?: GenerationOptions
  ): Promise<GeneratedOutput> {

    // 1. Get source content
    const conversation = await this.getConversation(conversationId);
    const source = conversation.source.summary.text; // or transcript

    // 2. Check cache
    const cached = await this.getCachedOutput(conversationId, outputType);
    if (cached && !options?.forceRegenerate) {
      return cached;
    }

    // 3. Generate using AI (with user instructions if provided)
    const prompt = this.buildPrompt(outputType, source, options);
    const content = await this.openAIService.generate(prompt, {
      responseFormat: { type: 'json_object' } // For structured outputs
    });

    // 4. Cache result
    await this.cacheOutput(conversationId, outputType, content);

    // 5. Return
    return {
      content: JSON.parse(content), // Structured JSON
      cached: false,
      generatedAt: new Date()
    };
  }

  private buildPrompt(
    type: OutputType,
    source: string,
    options?: GenerationOptions
  ): string {
    const systemPrompt = this.getSystemPromptForType(type);

    const userInstructions = options?.customPrompt ? `
      USER INSTRUCTIONS (HIGH PRIORITY):
      ${options.customPrompt}

      Follow these instructions carefully when creating the output.
      Extract and focus on the specific aspects mentioned.
    ` : '';

    return `
      ${systemPrompt}

      ${userInstructions}

      SOURCE CONTENT:
      ${source}

      OUTPUT AS JSON using the schema defined above.
    `;
  }

  private getSystemPromptForType(type: OutputType): string {
    const prompts = {
      email: `Transform this conversation into a professional email summary.
        Output JSON schema:
        {
          "subject": "Subject line",
          "greeting": "Hi team,",
          "body": ["paragraph 1", "paragraph 2"],
          "keyPoints": ["bullet 1", "bullet 2"],
          "actionItems": ["action 1", "action 2"],
          "closing": "Best, [Name]"
        }`,

      actionItems: `Extract actionable tasks from this conversation.
        Output JSON schema:
        {
          "items": [
            {
              "task": "Task description",
              "owner": "Person name or null",
              "deadline": "Date or null",
              "priority": "high | medium | low"
            }
          ]
        }`,

      blogPost: `Convert this conversation into an 800-word blog post.
        Output JSON schema:
        {
          "headline": "Engaging headline",
          "subheading": "Optional subheading",
          "hook": "Opening paragraph",
          "sections": [
            {
              "heading": "Section title",
              "paragraphs": ["p1", "p2"],
              "bulletPoints": ["point 1"] or null,
              "quotes": [{"text": "quote", "attribution": "name"}] or null
            }
          ],
          "callToAction": "Closing CTA",
          "metadata": {
            "wordCount": 847,
            "targetAudience": "Product Managers",
            "tone": "professional"
          },
          "images": {
            "hero": {
              "prompt": "Image generation prompt",
              "altText": "Alt text"
            },
            "sections": [
              {
                "position": "after_section_1",
                "prompt": "Image prompt",
                "altText": "Alt text"
              }
            ]
          }
        }`,

      linkedin: `Create a LinkedIn post (280 characters max).
        Output JSON schema:
        {
          "content": "Post text with hook, insight, CTA",
          "hashtags": ["tag1", "tag2"],
          "characterCount": 275
        }`,

      userStories: `Convert requirements into user story format.
        Output JSON schema:
        {
          "stories": [
            {
              "title": "Story title",
              "asA": "user type",
              "iWant": "goal",
              "soThat": "benefit",
              "acceptanceCriteria": ["criterion 1", "criterion 2"],
              "priority": "high | medium | low"
            }
          ]
        }`,
    };

    return prompts[type];
  }
}
```

---

## 📋 Comprehensive Output Types Library

### **Launch Output Types (Phase 2)**
These will be implemented first with full JSON schemas and React templates:

1. **📧 Email Summary** - Professional recap for stakeholders
2. **✅ Action Items** - Checklist with owners and deadlines
3. **📝 Blog Post** - 800-1200 word article with image generation
4. **💼 LinkedIn Post** - 280-character professional update
5. **📋 User Stories** - Agile format for product teams

---

### **Product Development & Tech**
6. **🐛 Bug Report** - Structured: Steps to reproduce, expected vs actual, severity
7. **📊 Product Requirements Document (PRD)** - Problem, solution, success metrics, technical specs
8. **🎯 Feature Specification** - Detailed technical + UX requirements
9. **🗺️ Roadmap Summary** - Timeline, milestones, dependencies
10. **📝 Release Notes** - User-facing changelog with benefits
11. **🔬 Technical Documentation** - API docs, architecture decision records
12. **💡 Sprint Planning Summary** - Goals, commitments, capacity
13. **🔄 Retrospective Notes** - What went well, what to improve, action items

---

### **Creative & Marketing**
14. **🐦 Twitter/X Thread** - 10-tweet thread format with viral hooks
15. **📧 Email Newsletter** - Subject + preview + body + CTA
16. **📱 Social Media Caption** - Instagram/Facebook with hashtags
17. **🎨 Creative Brief** - Campaign goals, target audience, key messages
18. **📊 Campaign Report** - Performance summary, insights, recommendations
19. **🎬 Video Script** - Scene-by-scene breakdown with timestamps
20. **📢 Press Release** - AP style, newsworthy angle, quotes
21. **📰 Article Outline** - Headline, sections, key points, sources
22. **📚 eBook Chapter** - Long-form content with subsections
23. **💬 Quote Collection** - Best quotes from conversation, attributed

---

### **Sales & Business Development**
24. **📧 Follow-up Email** - Meeting recap + next steps + value reinforcement
25. **💼 Proposal Summary** - Problem, solution, pricing, timeline
26. **🤝 Meeting Notes** - Attendees, discussion points, decisions, action items
27. **📊 Sales Call Summary** - Pain points, objections, opportunities
28. **🎯 Qualification Report** - BANT framework: Budget, Authority, Need, Timeline
29. **💰 ROI Calculation** - Investment vs return, break-even analysis
30. **📈 Competitor Analysis** - Feature comparison, positioning
31. **🔄 Deal Status Update** - For CRM or team sync
32. **🎁 Value Proposition** - Problem, solution, unique benefits

---

### **HR & Recruitment**
33. **👤 Candidate Summary** - Skills, experience, culture fit assessment
34. **📋 Interview Debrief** - Strengths, concerns, rating, recommendation
35. **📝 Job Description** - Responsibilities, requirements, benefits
36. **🎯 Performance Review Notes** - Achievements, areas for growth, goals
37. **📧 Offer Letter Draft** - Role, compensation, start date, next steps
38. **🤝 Onboarding Plan** - Week-by-week tasks and milestones
39. **💬 1:1 Meeting Summary** - Discussion topics, feedback, action items
40. **📊 Team Health Check** - Sentiment, blockers, engagement

---

### **Consulting & Strategy**
41. **📊 Executive Summary** - High-level overview for leadership
42. **🎯 Strategy Document** - Vision, objectives, tactics, KPIs
43. **📈 Stakeholder Update** - Progress, blockers, next steps
44. **🔍 Problem Analysis** - Root cause, impact, proposed solutions
45. **✅ Decision Framework** - Options, pros/cons, recommendation
46. **📋 Project Brief** - Scope, timeline, budget, resources
47. **🗓️ Meeting Agenda** - Topics, objectives, time allocation
48. **🎓 Workshop Summary** - Activities, insights, next steps

---

### **Content Creation**
49. **🎙️ Podcast Show Notes** - Episode summary, timestamps, links, quotes
50. **📧 Email Sequence** - Drip campaign: 5-7 emails with goals
51. **🎓 Course Outline** - Modules, lessons, learning objectives
52. **📖 Book Summary** - Key ideas, quotes, takeaways
53. **🎥 YouTube Description** - SEO-optimized description with timestamps
54. **📝 Case Study** - Challenge, solution, results with metrics

---

### **Personal Productivity**
55. **📅 Calendar Events** - Meeting summaries formatted for calendar
56. **📝 Note Summary** - Condensed version for quick reference
57. **🎯 Goals & OKRs** - Objectives and key results format
58. **💡 Ideas & Insights** - Creative ideas extracted and categorized
59. **📚 Learning Notes** - Key concepts, examples, applications

---

### **Implementation Priority**

**Phase 2 (Week 2)**: Launch with 5 core types
- Email Summary, Action Items, Blog Post, LinkedIn Post, User Stories

**Phase 3-4**: Add 10 popular types based on user research
- Meeting Notes, PRD, Sales Call Summary, Follow-up Email, Sprint Planning, etc.

**Phase 5+**: Expand library to 20-30 types based on:
- User requests
- Usage data (which types get most regenerations)
- Industry-specific needs
- Community templates (allow users to create custom templates)

**Future**: Custom template builder
- Users define their own JSON schemas
- Community sharing marketplace
- Industry-specific template packs

---

## 📈 Growth Loops

### **Loop 1: Public Sharing → Signup**
1. User creates valuable conversation
2. Shares public link with team/clients
3. Recipients see value + limited preview (150 words)
4. Sign up to see full content + create own
5. New user creates → shares → repeat

**Metrics:**
- Conversion rate: Public views → Signups (target: 15%)
- Attribution: Track which shared conversations drive most signups

### **Loop 2: Folder Collaboration → Team Expansion**
1. User invites colleagues to folder (unlimited invitations for viral growth)
2. Colleagues see team's conversations
3. Colleagues create their own conversations
4. Folder becomes central knowledge hub
5. Team invites more members → repeat

**Metrics:**
- Folder adoption: % of users who create folders (target: 40%)
- Invite rate: Invitations sent per folder (target: 2 for free, 5+ for paid)
- Team conversion: Invited users who become active (target: 60%)

### **Loop 3: Output Quality → Word of Mouth**
1. User generates high-quality output (blog post, email)
2. Uses output in their workflow (sends email, publishes blog)
3. Recipients ask "How did you create this?"
4. User shares Neural Summary link
5. New signups → repeat

**Metrics:**
- Output usage: % of generated outputs actually used (target: 70%)
- Referral rate: Users who invite others organically (target: 25%)
- NPS score (target: 50+)

---

## 🎯 Implementation Phases

### **Phase 1: Simplified Data Model (Week 1)** - ❌ **Not Started (0%)**
- [ ] Migrate existing transcriptions to new `conversations` schema
- [ ] Create `folders` collection with basic CRUD
- [ ] Implement `outputs` subcollection (cache layer)
- [ ] Update frontend to use new data structure
- [ ] Add user instructions field to creation wizard

**Status:** Prototype uses mock data from `/apps/web/lib/mockData.ts`. Backend migration blocked until prototype is complete.

---

### **Phase 2: Output Generation with JSON (Week 2)** - ✅ **Prototype Complete (90%)**
- [x] Build OutputsService with structured JSON prompts (mock implementation)
- [x] Create generation API endpoints (mocked)
- [x] Implement caching logic (mocked)
- [x] Design output generation UI components (**4-step wizard - exceeds plan**)
- [x] Build React templates for rendering JSON outputs (2/5 complete: Email, Blog)
- [x] Add "Generate" buttons to conversation view
- [ ] Connect to real backend API (blocked by Phase 1)

**Status:** Frontend complete and exceeds expectations. Backend integration pending.

**Deviations:**
- ✨ **Enhanced**: 4-step wizard (`OutputGeneratorModal`) vs simple button
- ✨ **Enhanced**: User instructions per output (not just at creation)
- 🚧 **Partial**: 3/5 template renderers still need to be built (LinkedIn, ActionItems, UserStories)

---

### **Phase 3: Public Sharing with Viral Mechanics (Week 3)** - ❌ **Not Started (0%)**
- [ ] Implement public link generation (unlimited sharing for all tiers)
- [ ] Create public conversation view (anonymous with 150-word preview)
- [ ] Add signup prompts with limited preview blur effect
- [ ] Track view analytics and conversions
- [ ] Build share modal with link/invite options

**Status:** ShareModal exists for V1 but lacks V2 viral features. **Critical gap** for growth strategy.

---

### **Phase 4: Folders & Collaboration (Week 4)** - ❌ **Not Started (0%)**
- [ ] Folder invitation system 
- [ ] Email invitation templates
- [ ] Join folder flow (with/without account)
- [ ] Folder member management UI
- [ ] Role-based access control

**Status:** Folder UI exists in prototype but no invitation/collaboration features.

---

### **Phase 5: Viral Features & Image Generation (Week 5)** - ❌ **Not Started (0%)**
- [ ] Conversion attribution tracking
- [ ] "Your Impact" analytics dashboard
- [ ] Social proof on public pages ("X people created from this")
- [ ] Replicate integration for image generation (Flux Schnell + Flux Pro)
- [ ] Image generation UI in blog post template
- [ ] Credit system for image generation

**Status:** None of these features started. Image generation is lower priority than viral sharing.

---

## 🎨 Design System Updates

### Component Status

#### ✅ **Implemented (Exceeds Plan)**

**Core V2 Components:**
1. ✅ `<OutputGeneratorModal />` - **4-step wizard** (Type → Instructions → Review → Generate)
   - **Plan:** Simple "Generate" button
   - **Reality:** Sophisticated multi-step flow with customization
   - Location: `/components/OutputGeneratorModal.tsx`

2. ✅ `<Button />` - Standardized button system
   - 5 variants: primary, secondary, brand, ghost, danger
   - Icon support, fullWidth, size options (sm, md, lg)
   - Location: `/components/Button.tsx`

3. ✅ `<FloatingRecordButton />` - Bottom-right FAB for quick recording
   - Location: `/components/FloatingRecordButton.tsx`

4. ✅ `<RecordingModal />` - Full-screen recording interface
   - Location: `/components/RecordingModal.tsx`
   - Note: UI only, not connected to real recording

5. ✅ `<MilestoneToast />` - Celebration toasts for achievements
   - Location: `/components/MilestoneToast.tsx`

6. ✅ `<EmptyState />` - Reusable empty state component
   - Location: `/components/EmptyState.tsx`

**Output Templates (2/5 Complete):**
7. ✅ `<EmailTemplate />` - Renders email JSON with subject, body, key points
   - Location: `/components/output-templates/EmailTemplate.tsx`

8. ✅ `<BlogPostTemplate />` - Magazine-style blog post with hero image placeholder
   - Location: `/components/output-templates/BlogPostTemplate.tsx`

9. 🚧 `<LinkedInTemplate />` - Defined in library, renders as `PlaceholderTemplate`
   - Location: `/lib/outputTemplates/linkedin.ts` (data only)

10. 🚧 `<ActionItemsTemplate />` - Defined in library, renders as `PlaceholderTemplate`
    - Location: `/lib/outputTemplates/actionItems.ts` (data only)

11. 🚧 `<UserStoriesTemplate />` - Defined in library, renders as `PlaceholderTemplate`
    - Location: `/lib/outputTemplates/userStories.ts` (data only)

**Layout System (Not in Original Plan):**
12. ✅ `<ThreePaneLayout />` - Main container with collapsible sidebar
    - Location: `/components/ThreePaneLayout.tsx`

13. ✅ `<DetailPageLayout />`, `<DetailPageHeader />`, `<DetailMetadataPanel />` - Complete detail page architecture
    - Location: `/components/DetailPageLayout.tsx`, etc.

14. ✅ `<DropdownMenu />` - Reusable dropdown for action menus
    - Location: `/components/DropdownMenu.tsx`

#### 🚧 **Partial (V1 Version Exists, V2 Features Missing)**

15. 🚧 `<ShareModal />` - **Exists for V1, needs V2 viral features**
    - Location: `/components/ShareModal.tsx`
    - ✅ Has: Password protection, email sending, content selection
    - ❌ Missing: 150-word preview, signup prompts, unlimited public sharing, conversion tracking

#### ❌ **Not Started (Critical Gaps)**

16. ❌ `<PublicConversationView />` - Anonymous preview with signup conversion
    - **Needed for:** Viral growth loop (150-word preview → signup)

17. ❌ `<FolderInvite />` - Email invitation form
    - **Needed for:** Collaboration 

18. ❌ `<ImpactDashboard />` - Viral analytics widget
    - **Needed for:** "Your Impact" stats, conversion tracking

19. ❌ `<SignupPrompt />` - Contextual signup CTA on public pages
    - **Needed for:** Public page conversion

20. ❌ `<ImageGenerator />` - Replicate integration (Flux Schnell/Pro)
    - **Needed for:** Blog post image generation
    - Lower priority than viral features

21. ❌ `<CreationWizard />` - Multi-step conversation creation flow
    - Note: Output generation wizard exists, but conversation creation is still simple

---

### Updated Pages/Components

#### ✅ **Fully Migrated to V2:**
1. ✅ `<Dashboard />` → `/prototype-dashboard-v2`
   - Folders section, quick create, personalized greeting, FAB

2. ✅ `<ConversationView />` → `/prototype-conversation-v2/[id]`
   - Three-pane layout, output generation, vertical sections

3. ✅ `<FolderView />` → `/prototype-folder-v2/[id]`
   - Three-pane layout, member list, conversation list

#### 🆕 **New Pages (Not in Plan):**
4. ✅ Output Detail Page - `/prototype-conversation-v2/[id]/outputs/[outputId]`
   - Dedicated page for each output with actions

5. ✅ Transcript Page - `/prototype-conversation-v2/[id]/transcript`
   - Separate route instead of just a tab

---

## 🚀 Success Metrics

### User Engagement:
- **Output generation rate**: 2+ outputs per conversation (target)
- **Output usage**: 70% of outputs copied/exported
- **Time to value**: <5 min from upload to first output
- **Instructions usage**: 40% of users provide custom instructions

### Viral Growth:
- **Share rate**: 40%+ of conversations shared publicly (unlimited sharing)
- **Conversion rate**: 15% of public viewers sign up (150-word preview)
- **Folder adoption**: 40% of users create folders
- **Folder invite rate**: 2 invites per folder (free tier limit)

### Business:
- **Team plan adoption**: 25% of folders with 2+ members convert to paid
- **Retention**: 60%+ monthly active (folder stickiness)
- **NPS**: 50+ (outputs drive satisfaction)
- **Image generation**: 20% of blog posts use generated images

---

## 💡 Key Differentiators

**vs Otter.ai / Fireflies:**
- **Them**: Meeting transcription with static AI notes
- **Us**: Dynamic output generation for any format you need + custom instructions

**vs Notion AI:**
- **Them**: Blank page → AI writing assistant
- **Us**: Voice conversation → Source → Infinite structured outputs

**vs Loom:**
- **Them**: Video messaging with transcripts
- **Us**: Audio → Text-based deliverables (emails, docs, posts) with JSON structure

**Our Unique Value:**
1. **Conversation → Outputs model**: One conversation (merged recordings), unlimited formats
2. **Structured JSON outputs**: Content separated from layout, flexible rendering
3. **Custom instructions**: User guides AI to extract exactly what they need
4. **Viral sharing**: Public links (150-word preview) drive growth + folder collaboration
5. **AI transformation**: Not just transcription - restructuring for different contexts
6. **Image generation**: Blog posts with AI-generated visuals (Replicate/Flux)

---

## 🏁 Next Steps

### **Immediate: Prototype Visual Completion (Estimated: 2-3 days)**

Complete the V2 prototype to fully demonstrate the "One Conversation → Many Outputs" vision with mock data:

#### **1. Complete Output Template Renderers (High Priority)**
- [ ] Build `LinkedInTemplate.tsx` - Render LinkedIn post JSON
- [ ] Build `ActionItemsTemplate.tsx` - Render action items as checklist
- [ ] Build `UserStoriesTemplate.tsx` - Render Agile user stories format
- **Why:** Show complete output generation capability (currently 2/5 done)

#### **2. Add Viral Growth UI Mockups (Critical Gap)**
- [ ] Create `PublicConversationView` page mockup
  - 150-word content preview with blur effect
  - "Sign up to see full content" CTA
  - Signup prompt with value proposition
- [ ] Add `ImpactDashboard` widget to dashboard
  - Mock analytics: shares, views, signups driven
  - Top shared conversations list
- [ ] Create folder invitation mockup in share modal
  - Email invitation form
  - Role selection (owner/editor/viewer)
  - Member limit indicator (unlimited invitations for viral growth)
- **Why:** Viral features are core to V2 differentiation but 0% complete

#### **3. Wire Up Quick Create Flow (UX Polish)**
- [ ] Connect Quick Create buttons to navigate to mock conversation creation
- [ ] Show template selection → upload/record → processing → conversation detail
- [ ] Complete the end-to-end creation journey
- **Why:** Currently buttons don't do anything

#### **4. Polish Empty States (UX Consistency)**
- [ ] Make empty state CTAs navigate to appropriate actions
- [ ] Add more contextual empty states where needed
- **Why:** Improve demo experience

---

### **Future: Backend Implementation (After Prototype Approval)**

Once prototype is validated, implement real infrastructure:

#### **Phase 1: Data Model Migration (Week 1)**
1. Migrate `transcriptions` → `conversations` collection
2. Create `folders` collection with CRUD operations
3. Implement `outputs` subcollection as cache layer
4. Create `publicLinks` collection for viral tracking

#### **Phase 2: Real Output Generation (Week 2)**
1. Build `OutputsService` with GPT-5 integration
2. Create REST API endpoints for generation
3. Implement caching logic in Firestore
4. Connect V2 UI to real backend
5. Test prompt quality and iterate

#### **Phase 3: Viral Sharing Infrastructure (Week 3)**
1. Public link generation (unlimited for all tiers)
2. Anonymous conversation view with 150-word preview
3. Signup conversion tracking
4. View analytics and attribution

#### **Phase 4: Folder Collaboration (Week 4)**
1. Email invitation system
2. Join folder flow (with/without account)
3. Role-based access control
4. Member management

#### **Phase 5: Image Generation (Week 5+)**
1. Replicate API integration (Flux models)
2. Credit system for cost control
3. Image generation UI in blog template

---

### **Success Criteria for Prototype Completion**

✅ **Visual Completeness:**
- All 5 output templates render beautifully
- Complete end-to-end UX flow (create → generate → share)
- Viral growth UI demonstrated (public view, analytics, invites)

✅ **Demo-Ready:**
- Can show complete "One Conversation → Many Outputs" story
- All major screens and flows clickable
- Professional polish throughout

✅ **Stakeholder Validation:**
- Get feedback on UX before backend investment
- Validate viral growth mechanics design
- Confirm output quality meets expectations

---

## 📋 Summary: Key Decisions & Implementation Status

### **Strategic Decisions (From Original Plan)**

**Naming:**
- ✅ **"Conversation"** instead of Recording/Document (reflects merged recordings)
- ✅ **"Folder"** instead of Workspace (simple, clear, familiar)
- **Status:** Terminology used throughout prototype ✅

**Architecture:**
- ✅ **Model A**: Simple 1:1 (one conversation → many outputs)
- ✅ **NOT**: Multi-source synthesis (future roadmap)
- ✅ **JSON outputs**: Content separated from layout
- ✅ **User instructions**: Guide AI extraction ~~during creation~~ **→ per output** (deviation)
- **Status:** Data model defined but not implemented (mock data only) 🚧

**Viral Features (CRITICAL - 0% Complete):**
- ✅ **Decision Made:** Unlimited public sharing for all tiers (maximize viral reach)
- ✅ **Decision Made:** Unlimited folder invitations (no member limits to enable viral growth)
- ✅ **Decision Made:** 150-word preview for anonymous users (not 500)
- ✅ **Decision Made:** Conversion attribution tracking
- ✅ **Decision Made:** NO comment system (pre-PMF simplicity)
- **Status:** UI mockups not started ❌ **← Highest priority gap**

**Image Generation:**
- ✅ **Decision Made:** Replicate integration (Flux Schnell + Flux 1.1 Pro)
- ✅ **Decision Made:** Credit system for controlling costs
- ✅ **Decision Made:** Blog post template primary use case
- **Status:** Not implemented ❌ (lower priority than viral features)

**Output Types:**
- ✅ **Decision Made:** Launch with 5 core types: Email, Blog Post, LinkedIn, Action Items, Communication Analysis
- ✅ **Cataloged:** 59 total types for future expansion (User Stories moved to future roadmap)
- ✅ **Approach:** Phased rollout based on user demand
- **Status:** 5 core types fully implemented with renderers ✅

---

### **Implementation Achievements**

**What Exceeded Expectations:**
- ✨ **4-step output wizard** (plan called for simple button)
- ✨ **Complete detail page architecture** (not in plan)
- ✨ **Modular template library** (more sophisticated than planned)
- ✨ **Three-pane layouts** (better UX than specified)
- ✨ **Enhanced button system** (5 variants with full customization)

**What's On Track:**
- ✅ UI architecture and navigation (85% complete)
- ✅ Core V2 components (18 new components built)
- ✅ Personalization features (100% complete)
- ✅ Mock data structures matching planned schema

**What's Behind:**
- ❌ Viral growth UI (0% - critical gap)
- ❌ Remaining output templates (3/5 need renderers)
- ❌ Backend integration (all mocked)
- ❌ Image generation (not started)

---

### **Prototype Completion Roadmap**

**To finish prototype visually (2-3 days):**
1. Build 3 remaining template renderers
2. Create viral growth UI mockups (public view, analytics, invites)
3. Wire up Quick Create buttons
4. Polish empty states

**Then backend implementation (4-5 weeks):**
1. Data model migration
2. Real output generation API
3. Viral sharing infrastructure
4. Folder collaboration
5. Image generation

---

**This plan prioritizes:**
- ✅ **Simplicity** - 1 conversation → many outputs (not complex building blocks)
- ✅ **AI Transformation** - Leverage GenAI strengths + custom instructions
- ⚠️ **Viral Growth** - PLANNED but UI not implemented yet (0%)
- ✅ **Clean Architecture** - Conversations + folders + JSON outputs (mocked)
- ✅ **Flexible Rendering** - JSON content + React templates (2/5 complete)
- ✅ **Fast Validation** - No comments, focus on core value

**Current Priority:** Complete viral growth UI mockups to validate full V2 strategy before backend investment.
