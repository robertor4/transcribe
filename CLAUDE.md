# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A production-ready monorepo application that **transforms conversations into work-ready documents**. Neural Summary is positioned as a **voice-to-output creation platform**, not just a transcription tool. Features automatic audio splitting for large files (up to 5GB for enterprise users), real-time progress tracking via WebSockets, context-aware AI processing using OpenAI Whisper and GPT-5 models, and an upcoming **AI interview feature** that asks questions to extract and structure ideas into deliverable documents.

### Core Value Proposition
**"Speaking becomes creating"** - Turn thinking (conversations) into working (documents) without the friction of manual writing, formatting, and structuring.

## Terminology Mapping (UI vs Code)

Since V2, the user-facing terminology differs from the internal code naming. This is intentional - renaming internal code would require database migrations, API changes, and significant testing effort.

| UI Term (V2) | Code Term | Description |
|--------------|-----------|-------------|
| **Conversation** | `transcription` | An uploaded audio file with its transcript and metadata |
| **AI Asset** | `analysis` | Generated content from a template (blog post, email, action items, etc.) |
| **AI Asset Template** | `analysisTemplate` | The prompt configuration that generates an AI Asset |

**Key locations:**
- Database collections: `transcriptions`, `analyses` (Firestore)
- Shared types: `Transcription`, `Analysis`, `AnalysisTemplate` (`packages/shared`)
- API endpoints: `/transcription/*`, `/analysis/*`
- WebSocket events: `transcription_progress`, `transcription_completed`
- Frontend rendering: `outputTemplates/` (renders AI Asset content)
- Backend prompts: `analysis-templates.ts`, `prompts.ts`

**Rule:** Use V2 terminology in UI strings (translations, labels, tooltips). Keep code names unchanged.

## Brand Guidelines

### Brand Positioning
Neural Summary is an AI workspace that turns spoken thinking into structured, professional output. Category: **Speech-to-Structure**.

**Mission**: Transform spoken thinking, meetings, and rough notes into structured, finished outputs.

**Primary Audience**: Product managers, engineering leads, consultants, and professional knowledge workers.

### Brand Personality & Voice
The brand feels like a highly capable professional assistant.

**Personality Attributes**: Calm, precise, confident, structured, opinionated but not loud.

**Voice Principles**:
- Clear over clever
- Professional, not academic
- Direct, not apologetic
- Human, not chatty

**Language Rules**:
- Use short sentences, active voice, concrete nouns
- Avoid emojis, exclamation marks, buzzwords, and AI self-reference

### Color Palette
- **Primary**: `#8D6AFA` (brand purple for key actions)
- **Primary Hover**: `#7A5AE0` (darker purple)
- **Secondary**: `#14D0DC` (cyan for emphasis)
- **Secondary Alt**: `#3F38A0` (deep purple for structure)
- **Accent/Dark**: `#23194B` (rare, deliberate use for dark backgrounds)
- **Text**: `text-gray-900` (headlines), `text-gray-700` (body)
- Light backgrounds: `from-gray-50 to-white` gradients

### Typography
- **Primary Font**: Montserrat (geometric sans-serif via Google Fonts)
- **Weights**: 300-800 for clear hierarchy
- Clear/confident headings, readable paragraphs with generous line height

### Tagline
**"YOU SPEAK. IT CREATES."**

### Logo & Brand Mark
- **Full logo**: `/apps/web/public/assets/logos/neural-summary-logo-wTagLine.svg`
- **Logo (no tagline)**: `/apps/web/public/assets/logos/neural-summary-logo.svg`
- **Logotype only**: `/apps/web/public/assets/logos/neural-summary-logotype.svg`

### Imagery Direction
**Good**: Abstract geometric visuals, diagrams, flows, grids, systems, calm compositions with whitespace.
**Bad**: Human faces, AI brains, glowing heads, robots, standard stock office scenes.

### UI Guidelines
- **Minimal text**: Few words, no marketing fluff - clarity and emotion over explanation
- **Spacing**: Generous padding, `space-y-8` to `space-y-16` for breathing room
- **No clutter**: Remove unnecessary badges, trust indicators, or marketing copy unless essential
- **Button styling**:
  - Primary CTAs: `rounded-full` (pill-shaped) - distinctive, approachable, modern
  - Secondary buttons: `rounded-lg` (8px) - for utility actions, forms
  - Component: Use `Button` component (`/apps/web/components/Button.tsx`) for consistent styling
  - Variants: `primary` (solid `#23194B` background), `secondary` (outlined with hover fill), `ghost` (transparent with hover background), `brand` (purple `#8D6AFA`), `danger` (red)
  - **Always prefer using the `Button` component** over custom styled `<button>` elements for consistency
- **Inline action confirmations** (for destructive actions like Delete):
  - Initial state: `Button` with `variant="ghost"` showing the action (e.g., "Delete" with Trash icon)
  - Confirmation state: Replace button with inline confirmation UI containing:
    - Colored background container (`bg-red-50 dark:bg-red-900/20` for danger)
    - Confirmation text (e.g., "Delete?")
    - "Yes" button with `variant="danger"` and `size="sm"`
    - "No" button with `variant="ghost"` and `size="sm"`
  - Example: See `FolderClient.tsx` delete confirmation pattern

## Messaging Framework: The Five W's

Neural Summary's landing page follows a strategic narrative arc using the **Five W's** copywriting framework to guide visitors from problem → solution → transformation → vision.

### 1. **WHY - The Problem** ("The Cost of Translation")
**Pain point**: Ideas get lost between thinking (conversations) and working (documents). Hours wasted typing, formatting, restructuring.

**Key message**: "Your best ideas get lost in translation. You think in conversations. You work in documents."

### 2. **WHAT - The Solution** ("Three Steps to Creation")
**Solution**: Upload audio or let Neural Summary interview you → AI extracts and structures → Get work-ready documents.

**Key message**: "Speak → Extract → Create. Get work-ready documents instantly."

### 3. **WOW - The Magic** ("From Thinking to Done")
**Transformation**: 3-minute conversation → complete product spec. AI interviews you, asks questions, generates deliverables.

**Key message**: "Speaking becomes creating. No writing. No formatting. Just think out loud."

**Differentiator**: AI interview feature (not passive recording) - Neural Summary asks questions to extract ideas and generate structured documents.

### 4. **WHO - Use Cases** ("Built for Your Workflow")
**Personas**:
- **Product Manager**: Brainstorm → Product spec in 5 minutes
- **Founder**: Vision talk → Strategy doc for team
- **Content Creator**: Interview → Publish-ready article
- **Sales Leader**: Client call → Follow-up email in minutes

**Key message**: "Turn [your scenario] into [deliverable output] in minutes."

### 5. **WARP - The Future** ("The Future of Work")
**Vision**: The future of work isn't typing—it's thinking out loud. Voice becomes the primary creative input.

**Key message**: "Your ideas become requirements. Your vision becomes strategy. Your voice becomes output. This is how creative work should feel."

### Messaging Hierarchy
1. **Primary positioning**: Voice-to-output creation platform (NOT meeting notes tool)
2. **Core differentiator**: AI interview feature that generates work-ready documents
3. **Target outcome**: Turn conversations into deliverables (specs, articles, emails, strategies)
4. **Emotional benefit**: Remove friction between thinking and creating

**Avoid**: Positioning as "better meeting recorder" or "transcription service" - competitors own that space. Focus on **transformation** and **creation**.

## Brand Byline

**Official Header Byline**: "You speak. It creates."

This tagline appears in the header beneath the Neural Summary logo and embodies the core brand promise of Speech-to-Structure.

**Translations:**
- **English**: "You speak. It creates."
- **German**: "Du sprichst. Es kreiert."
- **Spanish**: "Tú hablas. Crea."
- **French**: "Vous parlez. Ça crée."
- **Dutch**: "Jij spreekt. Het creëert."

**Implementation:**
- **Location**: Header component (`apps/web/components/PublicHeader.tsx:35`)
- **Translation key**: `landing.hero.byline` in `apps/web/messages/{locale}.json`
- **Display**: Shown beneath "Neural Summary" name on all public pages (hidden on small screens)

## Changelog Maintenance

**CRITICAL**: All code changes MUST be documented in [CHANGELOG.md](CHANGELOG.md)

When making any changes to the codebase, always update the `[Unreleased]` section with:
- **Added**: New features, files, or capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes and error resolutions
- **Removed**: Deprecated or deleted features

The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and helps track project evolution. Update it immediately after implementing changes, not at the end of a session.

## Cutting a Release

Neural Summary uses **feature-based versioning**. Cut a new version when a significant feature or set of features is complete.

### Release Process

1. **Move Unreleased to versioned section**:
   - Change `## [Unreleased]` content to `## [X.Y.Z] - YYYY-MM-DD`
   - Add new empty `## [Unreleased]` section at top
   - Add a brief subtitle (e.g., `### UI Rebrand & Dashboard Refinements`)

2. **Update version in package.json**:
   - Bump version to match changelog (e.g., `"version": "2.2.0"`)

3. **Commit and tag**:
   ```bash
   git add CHANGELOG.md package.json
   git commit -m "chore: release vX.Y.Z"
   git tag vX.Y.Z
   git push && git push --tags
   ```

### Version Numbering
- **Major (X.0.0)**: Breaking changes, major rewrites
- **Minor (X.Y.0)**: New features, significant improvements
- **Patch (X.Y.Z)**: Bug fixes, small tweaks

### Changelog Entry Format
Group changes by type: Added, Changed, Fixed, Removed, Security.
Include file locations for significant changes using `[filename](path)` links.

## Tech Stack
- **Monorepo**: Turborepo with shared TypeScript packages
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, React Dropzone, next-intl (5 languages)
- **Backend**: NestJS, TypeScript, Bull queues, Socket.io WebSockets
- **Database**: Firebase Firestore (NoSQL document store)
- **Storage**: Firebase Storage (new .firebasestorage.app format as of Oct 2024)
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Queue**: Redis with Bull for scalable job processing
- **Email Service**: Gmail SMTP with App Password for transactional emails (sharing transcripts)
- **AI Services**: 
  - AssemblyAI for transcription and speaker diarization (primary)
  - OpenAI Whisper API for transcription (fallback when AssemblyAI fails)
  - GPT-5/GPT-5-mini for summarization and sophisticated analysis
- **Audio Processing**: FFmpeg for splitting large files into 10-minute chunks

## Development Commands

### Quick Start
```bash
npm run fresh         # Clean install and start everything (recommended first run)
npm run dev:all       # Start Redis, build shared package, run all services
```

### Service Management
```bash
npm run dev           # Run frontend and backend in parallel (without Redis)
npm run redis:start   # Start Redis Docker container (or connect to existing)
npm run redis:stop    # Stop Redis container
npm run redis:check   # Verify Redis connectivity
npm run build:shared  # Build shared TypeScript types package
```

### Testing & Quality
```bash
# Backend (NestJS)
cd apps/api
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Generate coverage report
npm run test:e2e      # Run end-to-end tests
npm run lint          # Run ESLint with auto-fix

# Frontend (Next.js)
cd apps/web
npm run lint          # Run Next.js ESLint

# Monorepo-wide
npm run lint          # Run ESLint across all packages
```

### Testing Requirements

**CRITICAL**: Follow these testing practices:

1. **Cover new code with unit tests**: All new functionality, especially core business logic like transcription processing, duration extraction, and API integrations, must have corresponding unit tests.

2. **Run tests before committing**: Always run `npm run test` in the relevant package (e.g., `apps/api`) before committing code to ensure no regressions.

3. **Test file naming**: Place test files adjacent to the code they test with `.spec.ts` suffix (e.g., `assembly-ai.service.spec.ts` for `assembly-ai.service.ts`).

4. **Mock external dependencies**: Use Jest mocks for external APIs (OpenAI, AssemblyAI, Firebase) to ensure tests are fast and deterministic.

### Build & Production
```bash
npm run build         # Production build for all packages
npm run start         # Start production servers
npm run clean         # Clean all build artifacts and stop Redis
npm run setup         # Install all dependencies and build shared package
```

### Deployment

**Production Deployment (Automated via GitHub Actions):**
- Push to `main` branch triggers automatic deployment to production
- Manual deployment: Go to [Actions](https://github.com/your-org/neural-summary/actions) → Run "Deploy to Production" workflow
- Workflow options:
  - **Deployment type**: full (default), quick (restart only), service-only
  - **Services**: Specify services to deploy (api, web, redis, traefik)
  - **Skip build**: Deploy without rebuilding Docker images
- Health checks run automatically after deployment
- View deployment history and status in GitHub Actions UI

**Rollback:**
- Go to [Actions](https://github.com/your-org/neural-summary/actions) → Run "Rollback Deployment" workflow
- Option to rollback to previous deployment or specify commit hash
- Automatic health checks after rollback

**Health Checks:**
- Manual: Run "Health Check" workflow in GitHub Actions
- Checks Redis, API, Web, Traefik, and site accessibility
- Generates detailed health report

**Emergency/Manual Deployment:**
```bash
./deploy-manual.sh              # Backup script for emergency deployments
./deploy-manual.sh --quick      # Quick restart without rebuild
./deploy-manual.sh --service api,web  # Deploy specific services
```

**GitHub Secrets Required:**
- `SSH_PRIVATE_KEY` - SSH key for server access
- `DEPLOY_SERVER` - Production server IP/hostname


## High-Level Architecture

### Request Flow
1. **File Upload**: Client validates file (format/size) → Uploads to Firebase Storage → Creates job in Redis queue
2. **Processing Pipeline**:
   - Small files (<25MB): Direct to Whisper API
   - Large files (>25MB): FFmpeg splits → Parallel chunk processing → Ordered merge
3. **Real-time Updates**: Socket.io broadcasts progress per chunk → Client receives updates
4. **Polling Fallback**: Automatic API polling when WebSocket fails (see [WebSocket Resilience](docs/2025-10-21_WEBSOCKET_RESILIENCE.md))
5. **Data Storage**: Transcription metadata in Firestore, audio files in Firebase Storage with 5-hour signed URLs

### Key Architectural Patterns

#### Monorepo Structure
- `apps/api`: NestJS backend with modular architecture (transcription, auth, websocket, firebase modules)
- `apps/web`: Next.js frontend with App Router, internationalization, and Firebase client SDK
- `packages/shared`: Centralized TypeScript types, constants, and validation utilities (built before other packages)

#### Processing Architecture
- **Queue-based**: Bull/Redis enables horizontal scaling and job retry with exponential backoff
- **Parallel Job Processing**: Configurable concurrency (default: 2 jobs simultaneously) via `TRANSCRIPTION_CONCURRENCY` env var
  - Location: `apps/api/src/transcription/transcription.processor.ts:34-36`
  - Requires: 512MB+ Redis memory (increased from 256MB)
  - Benefits: 2-3x faster batch processing, better resource utilization
  - Trade-offs: Higher memory usage, increased API quota consumption
- **Audio Splitting**: AudioSplitter service (apps/api/src/utils/audio-splitter.ts:*) handles FFmpeg operations
- **Chunk Processing**: Parallel processing with ordered reassembly maintains chronological accuracy
- **Error Recovery**: Automatic retries for transient failures, cleanup of temporary files

#### Authentication & Security
- Firebase Auth tokens required for all API endpoints (FirebaseAuthGuard)
- User isolation enforced at Firestore query level (userId field)
- File access via temporary signed URLs (5-hour expiration)
- WebSocket authentication via JWT tokens

#### Firebase Auth vs Firestore User Data
**CRITICAL DISTINCTION** - Always use the correct method to access user data:

**Firebase Auth (`getUserById()`):**
- Located at: `apps/api/src/firebase/firebase.service.ts:531`
- **Only** contains basic authentication data:
  - `uid`, `email`, `emailVerified`, `displayName`, `photoURL`
- **Does NOT include** subscription or business data
- Use for: Authentication checks only

**Firestore User Document (`getUser()`):**
- Located at: `apps/api/src/firebase/firebase.service.ts:547`
- Contains **complete user profile** from Firestore:
  - All Auth fields PLUS:
  - `subscriptionTier`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`
  - `role`, `usageStats`, `paygCredits`, etc.
- Use for: Any business logic requiring subscription/usage data

**Common Bug Pattern:**
Using `getUserById()` when subscription data is needed will cause features to fail silently, showing "free" tier even for paid users.

**Example Fix:**
```typescript
// ❌ WRONG - Only gets auth data
const userData = await this.firebaseService.getUserById(user.uid);
if (!userData?.stripeSubscriptionId) { ... }

// ✅ CORRECT - Gets full Firestore document
const userData = await this.firebaseService.getUser(user.uid);
if (!userData?.stripeSubscriptionId) { ... }
```

**Files that commonly need `getUser()`:**
- `apps/api/src/stripe/stripe.controller.ts` (all methods)
- `apps/api/src/guards/subscription.guard.ts`
- `apps/api/src/usage/usage.service.ts`
- Any controller/service checking subscription status or limits

## External API Integration Best Practices

**CRITICAL: Always Verify Latest API Documentation**

When implementing or debugging integrations with external APIs (Stripe, OpenAI, AssemblyAI, Firebase, etc.), **ALWAYS** check the most recent official API documentation online before making assumptions about:

- Endpoint URLs and paths
- Request/response data structures
- Field names and data types (e.g., camelCase vs snake_case)
- Nested object structures
- Authentication methods
- API versions and breaking changes

**Why This Matters:**
- Third-party services frequently update their APIs
- Data structures evolve (e.g., Stripe moved `current_period_start/end` from root to `items.data[0]`)
- Documentation may be outdated in AI training data
- Field names and nesting can change between API versions

**Example Lessons Learned:**
- **Stripe Subscriptions**: Modern Stripe subscription objects store `current_period_start` and `current_period_end` in `items.data[0]`, not at the root level as in older versions
- Always use `WebFetch` or `WebSearch` tools to verify current API structure when debugging integration issues
- Don't assume field locations based on older documentation or examples

**Process:**
1. When implementing: Check latest API docs first
2. When debugging: Verify actual API response structure (log full objects)
3. When unsure: Search for recent examples or changelog updates
4. Always handle API evolution gracefully with fallbacks

## Critical Implementation Details

### GPT-5 Model Configuration
**Current Model**: GPT-5 (upgraded from GPT-4o in October 2025)

**Model Selection Strategy** (configured in `apps/api/src/transcription/transcription.service.ts`):
- **Primary Summary**: Always uses `gpt-5` for highest quality reasoning and insights
- **Secondary Analyses**: Quality-based selection
  - `QUALITY_MODE=premium` OR transcript > 10K characters → `gpt-5`
  - `QUALITY_MODE=balanced` AND transcript < 10K characters → `gpt-5-mini`
- **Default Fallback**: `gpt-5` if `GPT_MODEL_PREFERENCE` env var not set

**Cost Savings** (vs GPT-4o):
- Input tokens: $1.25/1M (50% cheaper than GPT-4o's $2.50/1M)
- Output tokens: $10/1M (same as GPT-4o)
- Overall: ~28% cost reduction per analysis
- Semantic caching: 90% discount on repeated inputs ($0.125/1M)

**Capabilities**:
- Input limit: 272K tokens (vs 128K for GPT-4o)
- Output limit: 128K tokens
- Reasoning levels: minimal, low, medium, high (configurable)
- Better quality for sophisticated transcript analysis

**Environment Variables**:
```bash
GPT_MODEL_PREFERENCE=gpt-5        # Options: gpt-5, gpt-5-mini, gpt-5-nano
QUALITY_MODE=premium              # Options: premium, balanced
```

### Prompts Location
All AI prompts for transcription analysis are located in:
```
apps/api/src/transcription/prompts.ts
```
Supported analysis types: Summary, Communication Styles, Action Items, Emotional Intelligence, Influence/Persuasion, Personal Development, Custom

### Firebase Storage Configuration
**IMPORTANT**: Use new `.firebasestorage.app` format (not `.appspot.com`):
```
FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app
```

### Required Firestore Composite Indexes

**Transcriptions index** (existing):
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `createdAt` (Descending)

**Folders index** (V2):
- Collection: `folders`
- Fields: `userId` (Ascending), `sortOrder` (Ascending), `createdAt` (Ascending)

**Transcriptions by folder index** (V2):
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `folderId` (Ascending), `createdAt` (Descending)

Note: Firestore will provide a link to auto-create indexes when queries fail. Follow the link in the error message to create the index.

### Audio Processing Constraints
- Max file size: 1GB (Free), 3GB (Pro), 5GB (Enterprise)
- Chunk size: 10 minutes or 25MB (whichever is smaller)
- Supported formats: M4A, MP3, WAV, MP4, MOV, MPEG, MPGA, WebM, FLAC, OGG
- MIME type handling: Accepts variations like `audio/x-m4a`, `audio/mp4`, `video/quicktime`, `application/octet-stream`

### WebSocket Event Protocol & Resilience
The application uses Socket.io for real-time updates with **automatic polling fallback** for reliability.

**Event Protocol:**
```typescript
// Client subscribes to job updates
socket.emit('subscribe_transcription', { jobId, token });

// Server emits progress (every 3s during processing)
socket.emit('transcription_progress', {
  jobId,
  progress: number,
  stage: 'uploading' | 'processing' | 'summarizing'
});

// Completion/failure events
socket.emit('transcription_completed', { jobId, transcriptionId });
socket.emit('transcription_failed', { jobId, error });
```

**Resilience Features:**
- **Automatic reconnection** with exponential backoff (3 attempts: 2s, 4s, 8s)
- **Dual transport** fallback (WebSocket → HTTP polling)
- **API polling fallback** when WebSocket fails (polls every 10s for stale transcriptions)
- **Extended timeout** from 5 to 10 minutes for long transcriptions
- **Connection health tracking** with automatic recovery

**See full documentation:** [WebSocket Resilience Guide](docs/2025-10-21_WEBSOCKET_RESILIENCE.md)

### Email Service (Gmail SMTP with Domain Alias)
- **Service**: Gmail SMTP with App Password for transactional emails
- **Implementation**: `apps/api/src/email/email.service.ts`
- **Use Case**: Sending share transcript emails to recipients
- **Configuration**: 
  - `GMAIL_AUTH_USER`: Primary Gmail account for authentication (e.g., roberto@dreamone.nl)
  - `GMAIL_FROM_EMAIL`: Email address shown in FROM field (e.g., noreply@neuralsummary.com - domain alias)
  - `GMAIL_APP_PASSWORD`: App Password from primary account
- **Features**: HTML and plain text email templates with branding
- **Setup**: 
  1. Enable 2FA on primary Gmail account
  2. Generate App Password at https://myaccount.google.com/apppasswords
  3. Configure domain alias in Google Workspace (neuralsummary.com)
  4. Create email aliases as needed (noreply@neuralsummary.com)

### Internationalization (i18n)
- Supported locales: en, nl, de, fr, es (defined in apps/web/i18n.config.ts:1)
- URL structure: `/[locale]/...` (e.g., `/en/dashboard`, `/fr/landing`)
- Translation files: `apps/web/messages/[locale].json`
- Components use `useTranslations` hook from next-intl

#### Translation Capitalization Rules
Follow proper grammatical capitalization for each language:

- **English**: Use sentence case for mid-sentence words
  - ✅ "How it works" (not "How it Works")
  - First word capitalized, subsequent words lowercase unless proper nouns

- **Dutch**: Follow Dutch capitalization rules (similar to English)
  - ✅ "Hoe het werkt" (not "Hoe het Werkt")
  - Only capitalize first word and proper nouns

- **Spanish**: Follow Spanish capitalization rules
  - ✅ "Cómo funciona" (not "Cómo Funciona")
  - Only capitalize first word and proper nouns

- **French**: Follow French capitalization rules
  - ✅ "Comment ça marche" (not "Comment ça Marche")
  - Only capitalize first word and proper nouns

- **German**: Follow German capitalization rules
  - ✅ "So funktioniert's"
  - Nouns are capitalized, but verbs/adjectives follow sentence case

**Rule of thumb**: Use proper sentence case appropriate to each language. Avoid title case (capitalizing every word) unless specifically required by the language's grammar rules.

### Environment Variables
Root `.env`:
```bash
OPENAI_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=...
PORT=3001
ASSEMBLYAI_API_KEY=...
GMAIL_AUTH_USER=roberto@dreamone.nl  # Primary Gmail account for authentication
GMAIL_FROM_EMAIL=noreply@neuralsummary.com  # Email address shown in FROM field (domain alias)
GMAIL_APP_PASSWORD=...  # Google App Password from primary account
TRANSCRIPTION_CONCURRENCY=2  # Number of jobs processed simultaneously (default: 2)
```

Frontend `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Scheduled Tasks (Cron Jobs)

The application runs **5 automated cron jobs** for maintenance, billing, and cleanup. All cron jobs respect graceful shutdown (`app.enableShutdownHooks()` in [main.ts](apps/api/src/main.ts:107)) and run in UTC timezone.

**Configuration Requirements:**
- `ScheduleModule.forRoot()` must be imported in [app.module.ts](apps/api/src/app.module.ts:25)
- All cron services must be registered as providers in their respective modules

#### 1. Cleanup Service
**File**: [apps/api/src/transcription/cleanup.service.ts](apps/api/src/transcription/cleanup.service.ts)
- **Schedule**: `@Cron(CronExpression.EVERY_HOUR)` - Runs every hour
- **Purpose**: Clean up zombie transcriptions and orphaned files
- **What it does**:
  - Finds transcriptions stuck in PENDING/PROCESSING status for >24 hours
  - Marks zombie transcriptions as FAILED with error message
  - Deletes orphaned files from Firebase Storage
  - Prevents accumulation of corrupted state from timeout failures
- **Why needed**: Handles edge cases where uploads fail due to timeouts, crashes, or network issues

#### 2. Monthly Usage Reset
**File**: [apps/api/src/usage/usage.scheduler.ts](apps/api/src/usage/usage.scheduler.ts:139-245)
- **Schedule**: `@Cron('0 0 1 * *')` - 1st of month at 00:00 UTC
- **Purpose**: Reset monthly usage quotas for all users
- **Features**:
  - Resumable after crash (saves progress every 10 users)
  - Graceful shutdown support (can pause and resume)
  - Checks for missed resets on startup (recovers from downtime)
  - Processes all users with error tracking
- **Why needed**: Subscription plans have monthly usage limits that must reset on billing cycle

#### 3. Daily Overage Check
**File**: [apps/api/src/usage/usage.scheduler.ts](apps/api/src/usage/usage.scheduler.ts:251-327)
- **Schedule**: `@Cron('0 2 * * *')` - Daily at 02:00 UTC
- **Purpose**: Check Professional/Business tier users for overage charges
- **What it does**:
  - Calculates usage beyond monthly quota
  - Logs overage hours and charges
  - Actual billing handled via Stripe webhooks on subscription renewal
- **Why needed**: Professional tier has $0.50/hour overage billing after 60 hours/month

#### 4. Daily Usage Warnings
**File**: [apps/api/src/usage/usage.scheduler.ts](apps/api/src/usage/usage.scheduler.ts:333-393)
- **Schedule**: `@Cron('0 10 * * *')` - Daily at 10:00 UTC
- **Purpose**: Send warnings to users approaching quota limits
- **What it does**:
  - Checks all users for 80%+ quota usage
  - Logs warnings for users near their limits
  - TODO: Email notification integration pending
- **Why needed**: Prevents users from hitting hard quota limits without warning

#### 5. Monthly Usage Cleanup
**File**: [apps/api/src/usage/usage.scheduler.ts](apps/api/src/usage/usage.scheduler.ts:399-445)
- **Schedule**: `@Cron('0 3 15 * *')` - 15th of month at 03:00 UTC
- **Purpose**: Delete old usage records to reduce database size
- **What it does**:
  - Finds usage records older than 12 months
  - Batch deletes old records from Firestore
- **Why needed**: Keeps `usageRecords` collection size manageable (GDPR data retention)

**Monitoring Cron Jobs:**
- All jobs log start/complete/error messages with duration metrics
- Check logs: `docker logs -f transcribe-api | grep -E "Cleanup|Usage"`
- Failed jobs log errors but don't crash the application

## V2 Prototype Components

See [V2 Prototype Guide](docs/V2_PROTOTYPE_GUIDE.md) for detailed component specs.

**Quick Reference:**
- `MilestoneToast` - Celebration toasts for 1st, 10th, 50th, etc. (`/apps/web/components/MilestoneToast.tsx`)
- `EmptyState` - Friendly empty states across app (`/apps/web/components/EmptyState.tsx`)
- Helper functions in `/apps/web/lib/userHelpers.ts`

**Active V2 Pages:**
- `/prototype-dashboard-v2` - Dashboard with personalized greeting, milestones
- `/prototype-conversation-v2/[id]` - Conversation view with vertical sections
- `/prototype-folder-v2/[id]` - Folder view with improved empty states

## SEO Guidelines for Landing Page

**CRITICAL**: All landing page changes MUST follow these requirements:

1. **Server Components Only**: Landing page must be server-rendered (no 'use client')
2. **Metadata API**: Use Next.js Metadata export for all meta tags
3. **Structured Data**: Include JSON-LD for Organization, SoftwareApplication, FAQ schemas
4. **Semantic HTML**: Proper hierarchy (header, nav, main, section, footer)
5. **Performance**: Image optimization with width/height attributes, lazy loading
6. **Accessibility**: ARIA labels for all interactive elements, alt text for images

Landing page locations:
- Main: `/apps/web/app/[locale]/landing/page.tsx`
- Home redirect: `/apps/web/app/[locale]/page.tsx`
- Layout: `/apps/web/app/[locale]/layout.tsx`
- Sitemap: `/apps/web/app/sitemap.ts`
- Robots: `/apps/web/public/robots.txt`

## Common Troubleshooting

### Deployment Fails: Out of Disk Space

**Error:** `ENOSPC: no space left on device` during deployment

**Quick Fix (run on production server):**
```bash
# Emergency cleanup
docker system prune -af && npm cache clean --force

# Or use comprehensive cleanup script
cd /opt/transcribe
bash scripts/cleanup-docker.sh
```

**Check disk space:**
```bash
ssh root@<server> 'bash -s' < scripts/check-disk-space.sh
```

**Full documentation:** [Disk Space Management Guide](docs/2025-10-23_DISK_SPACE_MANAGEMENT.md)

### FFmpeg Not Found
AudioSplitter checks multiple paths: /usr/bin, /usr/local/bin, /opt/homebrew/bin
Install: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Ubuntu)

### Redis Connection Issues
```bash
npm run redis:check  # Verify connectivity
npm run redis:stop && npm run redis:start  # Restart
```

**Production server diagnostics:**
```bash
ssh root@<server> 'bash -s' < scripts/diagnose-redis.sh
```

**Full documentation:** [Redis Troubleshooting Guide](docs/2025-10-23_REDIS_TROUBLESHOOTING.md)

### Port Conflicts
- Backend: 3001 (configurable via PORT env)
- Frontend: 3000 (falls back to 3002 if busy)
- Redis: 6379 (Docker container)

### Firebase Issues
- Storage bucket must use `.firebasestorage.app` format
- Firestore composite index required (follow error link to auto-create)
- CORS configuration: Deploy `firebase/cors.json` for cross-origin uploads

### Type Errors After Changes to Shared Package
Always rebuild shared package after modifications:
```bash
npm run build:shared
```

### Traefik Default Certificate (Self-Signed SSL)

**Issue:** Website shows "TRAEFIK DEFAULT CERT" instead of Let's Encrypt certificate

**Root Causes:**
1. **ACME_EMAIL not configured** - Most common issue
2. **Port 80 blocked** - HTTP challenge requires port 80 accessible
3. **Let's Encrypt rate limiting** - Too many failed attempts
4. **Certificate volume corruption** - acme.json file issues

**Quick Fix:**
```bash
# 1. Run diagnostic script (highly recommended)
./scripts/check-traefik-certs.sh

# 2. Add ACME_EMAIL to production environment
ssh root@94.130.27.115
cd /opt/transcribe
echo "ACME_EMAIL=admin@neuralsummary.com" >> .env.production

# 3. Restart Traefik to apply changes
docker-compose -f docker-compose.prod.yml restart traefik

# 4. Monitor certificate acquisition
docker logs -f transcribe-traefik | grep -i acme
```

**If Still Failing - Reset Certificates:**
```bash
# Stop Traefik
docker-compose -f docker-compose.prod.yml stop traefik

# Remove certificate volume
docker volume rm transcribe_traefik-certificates

# Recreate with fresh volume
docker-compose -f docker-compose.prod.yml up -d traefik

# Watch logs for certificate issuance
docker logs -f transcribe-traefik
```

**Verify Let's Encrypt Certificate:**
```bash
# Check certificate issuer (should show "Let's Encrypt")
curl -vI https://neuralsummary.com 2>&1 | grep "issuer:"

# Or use OpenSSL
echo | openssl s_client -servername neuralsummary.com -connect neuralsummary.com:443 2>/dev/null | openssl x509 -noout -issuer
```

**Rate Limit Troubleshooting:**
If you hit Let's Encrypt rate limits (50 certs/domain/week), use staging:

Add to [docker-compose.prod.yml](docker-compose.prod.yml:*) Traefik command section:
```yaml
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

Test with staging, then remove this line for production certs.

**Security Note:** The insecure Traefik dashboard (port 8080) has been removed for production security.

**Full diagnostic tool:** [scripts/check-traefik-certs.sh](scripts/check-traefik-certs.sh)

## UI Design Guidelines

See [UI Design System](docs/UI_DESIGN_SYSTEM.md) for comprehensive styling rules.

**Quick Reference:**
- **Primary brand**: `#cc3399` (hover: `#b82d89`)
- **Text**: Always specify explicit colors (never just `text-sm` without color)
- **Headers**: `text-gray-900`, **Body**: `text-gray-700`, **Hints**: `text-gray-600`
- **Buttons**: Use `<Button>` component (`/apps/web/components/Button.tsx`)
  - Variants: `primary`, `secondary`, `brand`, `ghost`, `danger`
  - Sizes: `sm`, `md`, `lg`
  - Always use `rounded-full` for main CTAs