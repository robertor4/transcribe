# 🎯 Neural Summary 2.0: Voice-to-Output Platform (Simplified)

**Vision Document - Revised Architecture**
**Date:** January 2025
**Status:** Planning Phase - V2 (Simplified)

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
      sharedWith: string[] (email addresses for folder invitations - max 2 for free tier)
    }

// Subcollection: conversations/{conversationId}/outputs
// Cache generated outputs for fast retrieval
outputs/{outputType}
  - type: 'email' | 'actionItems' | 'blogPost' | 'linkedin' | 'userStories' | 'custom'
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
  │  Folder members (max 2 for free tier): │
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
  emails?: string[] // for folder invitations (max 2 members for free tier)
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
1. User invites colleagues to folder (max 2 for free tier)
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

### **Phase 1: Simplified Data Model (Week 1)**
- [ ] Migrate existing transcriptions to new `conversations` schema
- [ ] Create `folders` collection with basic CRUD
- [ ] Implement `outputs` subcollection (cache layer)
- [ ] Update frontend to use new data structure
- [ ] Add user instructions field to creation wizard

### **Phase 2: Output Generation with JSON (Week 2)**
- [ ] Build OutputsService with structured JSON prompts
- [ ] Create generation API endpoints
- [ ] Implement caching logic
- [ ] Design output generation UI components
- [ ] Build React templates for rendering JSON outputs (email, blog, etc.)
- [ ] Add "Generate" buttons to conversation view

### **Phase 3: Public Sharing with Viral Mechanics (Week 3)**
- [ ] Implement public link generation (unlimited sharing for all tiers)
- [ ] Create public conversation view (anonymous with 150-word preview)
- [ ] Add signup prompts with limited preview blur effect
- [ ] Track view analytics and conversions
- [ ] Build share modal with link/invite options

### **Phase 4: Folders & Collaboration (Week 4)**
- [ ] Folder invitation system (max 2 members for free tier)
- [ ] Email invitation templates
- [ ] Join folder flow (with/without account)
- [ ] Folder member management UI
- [ ] Role-based access control

### **Phase 5: Viral Features & Image Generation (Week 5)**
- [ ] Conversion attribution tracking
- [ ] "Your Impact" analytics dashboard
- [ ] Social proof on public pages ("X people created from this")
- [ ] Replicate integration for image generation (Flux Schnell + Flux Pro)
- [ ] Image generation UI in blog post template
- [ ] Credit system for image generation

---

## 🎨 Design System Updates

### New Components Needed:
1. `<OutputGenerator />` - Card with "Generate" button + output display
2. `<ShareModal />` - Public link (unlimited) + folder invite (max 2 members for free tier)
3. `<PublicConversationView />` - Anonymous/limited preview (150 words) with signup prompts
4. `<FolderInvite />` - Email invitation form (max 2 members for free tier)
5. `<ImpactDashboard />` - Viral analytics widget
6. `<SignupPrompt />` - Contextual signup CTA on public pages
7. `<OutputTemplates />` - JSON renderers for each output type (start with 5):
   - `<EmailTemplate />` - Renders email JSON
   - `<BlogPostTemplate />` - Renders blog JSON with image generation
   - `<LinkedInTemplate />` - Renders LinkedIn post JSON
   - `<ActionItemsTemplate />` - Renders action items JSON
   - `<UserStoriesTemplate />` - Renders user stories JSON
8. `<ImageGenerator />` - Replicate integration component (Flux Schnell/Pro)
9. `<CreationWizard />` - Multi-step creation flow with instructions field

### Updated Components:
1. `<ConversationView />` (was DocumentView) - Add "Outputs" tab with generator cards
2. `<Dashboard />` - Add folders section, replace "documents" with "conversations"
3. `<Header />` - Add folder switcher dropdown

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

1. **Review & approve** this simplified plan
2. **Prototype** output generation UI (mockup key screens)
3. **Build** Phase 1: Data model migration (transcriptions → conversations)
4. **Test** output prompt quality with JSON schemas (iterate on prompts)
5. **Build** Phase 2: Output templates + image generation
6. **Launch** Phase 3: Public sharing with viral mechanics (150-word preview)
7. **Measure** conversion rates and iterate

---

## 📋 Summary: Key Decisions Made

**Naming:**
- ✅ **"Conversation"** instead of Recording/Document (reflects merged recordings)
- ✅ **"Folder"** instead of Workspace (simple, clear, familiar)

**Architecture:**
- ✅ **Model A**: Simple 1:1 (one conversation → many outputs)
- ✅ **NOT**: Multi-source synthesis (future roadmap)
- ✅ **JSON outputs**: Content separated from layout
- ✅ **User instructions**: Guide AI extraction during creation

**Viral Features:**
- ✅ **Unlimited public sharing** for all tiers (maximize viral reach)
- ✅ **150-word preview** for anonymous users (not 500)
- ✅ **Max 2 folder members** for free tier (not sharing limit)
- ✅ **Conversion attribution** tracking
- ✅ **NO comment system** (pre-PMF simplicity)

**Image Generation:**
- ✅ **Replicate integration** (Flux Schnell + Flux 1.1 Pro)
- ✅ **Credit system** for controlling costs
- ✅ **Blog post template** primary use case

**Output Types:**
- ✅ **Launch with 5 core types**: Email, Action Items, Blog Post, LinkedIn, User Stories
- ✅ **59 total types cataloged** for future expansion
- ✅ **Phased rollout** based on user demand and usage data

---

**This plan prioritizes:**
✅ Simplicity (1 conversation → outputs, not complex building blocks)
✅ AI-powered transformation (leverage GenAI strengths + custom instructions)
✅ Viral growth (unlimited public sharing + 150-word preview + folder collaboration)
✅ Clean architecture (conversations + folders + structured JSON outputs)
✅ Flexible rendering (JSON content + React templates)
✅ Fast validation (no comments system, focus on core value)
