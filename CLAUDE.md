# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A production-ready monorepo application for audio transcription and intelligent summarization. Features automatic audio splitting for large files (up to 5GB for enterprise users), real-time progress tracking via WebSockets, and context-aware AI processing using OpenAI Whisper and GPT-4 models.

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
  - GPT-4o-mini/GPT-4o for summarization
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
4. **Data Storage**: Transcription metadata in Firestore, audio files in Firebase Storage with 5-hour signed URLs

### Key Architectural Patterns

#### Monorepo Structure
- `apps/api`: NestJS backend with modular architecture (transcription, auth, websocket, firebase modules)
- `apps/web`: Next.js frontend with App Router, internationalization, and Firebase client SDK
- `packages/shared`: Centralized TypeScript types, constants, and validation utilities (built before other packages)

#### Processing Architecture
- **Queue-based**: Bull/Redis enables horizontal scaling and job retry with exponential backoff
- **Audio Splitting**: AudioSplitter service (apps/api/src/utils/audio-splitter.ts:*) handles FFmpeg operations
- **Chunk Processing**: Parallel processing with ordered reassembly maintains chronological accuracy
- **Error Recovery**: Automatic retries for transient failures, cleanup of temporary files

#### Authentication & Security
- Firebase Auth tokens required for all API endpoints (FirebaseAuthGuard)
- User isolation enforced at Firestore query level (userId field)
- File access via temporary signed URLs (5-hour expiration)
- WebSocket authentication via JWT tokens

## Critical Implementation Details

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

### Required Firestore Composite Index
Create composite index for transcriptions:
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `createdAt` (Descending)

### Audio Processing Constraints
- Max file size: 1GB (Free), 3GB (Pro), 5GB (Enterprise)
- Chunk size: 10 minutes or 25MB (whichever is smaller)
- Supported formats: M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, OGG
- MIME type handling: Accepts variations like `audio/x-m4a`, `audio/mp4`, `application/octet-stream`

### WebSocket Event Protocol
```typescript
// Client subscribes to job updates
socket.emit('subscribe_transcription', { jobId, token });

// Server emits progress
socket.emit('transcription_progress', { 
  jobId, 
  progress: number, 
  stage: 'uploading' | 'processing' | 'summarizing' 
});

// Completion/failure events
socket.emit('transcription_completed', { jobId, transcriptionId });
socket.emit('transcription_failed', { jobId, error });
```

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
```

Frontend `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

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

### FFmpeg Not Found
AudioSplitter checks multiple paths: /usr/bin, /usr/local/bin, /opt/homebrew/bin
Install: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Ubuntu)

### Redis Connection Issues
```bash
npm run redis:check  # Verify connectivity
npm run redis:stop && npm run redis:start  # Restart
```

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

## UI Design Guidelines

### Brand Colors
- **Primary**: `#cc3399` (pink/magenta) 
- **Primary hover**: `#b82d89` (darker pink)
- **Primary light**: `bg-pink-50` for subtle backgrounds
- Always use brand colors for new UI screens and components

### Text Color Best Practices

**CRITICAL: Always specify explicit text colors for readability**

When creating UI components, NEVER use text size classes without color:
- ❌ WRONG: `className="text-sm"` or `className="text-sm font-medium"`
- ✅ CORRECT: `className="text-sm text-gray-700"` or `className="text-sm font-medium text-gray-800"`

**Text Color Guidelines:**
- **Headers/Titles**: `text-gray-900` (maximum contrast)
- **Primary text**: `text-gray-800` (buttons, important labels)
- **Secondary text**: `text-gray-700` (descriptions, form labels)
- **Tertiary text**: `text-gray-600` (hints only - use sparingly)
- **Never use**: `text-gray-500` or lighter for body text (poor readability)

**Interactive Elements:**
- **Default state**: `text-gray-700` minimum
- **Hover state**: `hover:text-gray-900` or `hover:text-[#cc3399]`
- **Selected/Active**: `text-[#cc3399]` or `text-gray-900`

**Input Fields & Textareas:**
- **Always include both text and placeholder colors**
- ❌ WRONG: `className="px-3 py-2 border border-gray-400 rounded-lg"`
- ✅ CORRECT: `className="px-3 py-2 border border-gray-400 rounded-lg text-gray-800 placeholder:text-gray-500"`
- **Input text**: `text-gray-800` (dark, readable)
- **Placeholder text**: `placeholder:text-gray-500` (visible but subtle)
- **Border**: `border-gray-400` minimum (not gray-300 or lighter)
- **Focus state**: `focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20`