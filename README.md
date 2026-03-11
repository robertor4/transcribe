# Neural Summary

**Voice-to-Output Creation Platform**

**Create with your voice.**

Neural Summary transforms conversations into work-ready documents — effortlessly. Turn brainstorms into product specs, interviews into articles, client calls into follow-up emails, and vision talks into strategy documents. An AI-powered platform that goes beyond transcription to create deliverables.

### Core Value Proposition
**"Speaking becomes creating"** - Turn thinking (conversations) into working (documents) without the friction of manual writing, formatting, and structuring.

## Design Language: Calm Intelligence

Our interface embodies a futuristic-minimal aesthetic that blends human warmth with machine precision:

- **Tone**: Serene, confident, intelligent
- **Style**: Minimal, cinematic, spatial, human-centric
- **Visual DNA**: White space, soft gradients, precise typography, subtle motion
- **Philosophy**: Technology that listens rather than shouts — invisible, yet deeply present

*The visual equivalent of AI that feels effortless.*

## Positioning

Neural Summary is a **voice-to-output creation platform**, not a traditional transcription or meeting notes tool.

We transform conversations into work-ready documents—product specs, articles, strategies, emails—using AI that understands context and generates structured deliverables. Our upcoming **AI interview feature** will ask questions to extract ideas and turn them into polished outputs.

**We're not competing with:**
- Meeting note tools (Otter, Fireflies)
- Simple transcription services
- Traditional dictation software

**We enable:**
- **Product Managers** to turn brainstorms into specs in 5 minutes
- **Founders** to convert vision talks into strategy docs for teams
- **Content Creators** to transform interviews into publish-ready articles
- **Sales Leaders** to generate follow-up emails from client calls instantly

**The difference:** We don't just capture what was said—we create what needs to be done.

## Why Neural Summary?

**Your AI that listens, understands, and creates — so you can think, lead, and deliver.**

### The Problem We Solve
Your best ideas get lost in translation. You think in conversations. You work in documents. Between the two: hours of typing, formatting, restructuring. Professionals waste valuable time converting spoken thoughts into written deliverables—product specs, strategy documents, articles, follow-up emails.

### Our Solution
Neural Summary transforms the entire process from conversation to creation:
- **Save Time**: Turn 30-minute brainstorms into complete product specs or strategy docs
- **Create Deliverables**: Generate work-ready documents, not just transcripts—specs, articles, emails, strategies
- **AI-Powered Analysis**: Get 15+ specialized analysis templates (Executive Brief, Sales Analysis, Training Materials, etc.)
- **Never Miss Details**: Capture every decision, action item, and insight automatically with 99.5% accuracy
- **Share Effortlessly**: Send polished documents to your team with one click
- **Work Globally**: Translate documents into 15 languages instantly
- **Privacy-First**: Audio files are processed by secure transcription services and **never stored** - deleted within seconds after processing

### Privacy & Security You Can Trust

**Your audio is never stored on our servers.** When you upload a recording, it's sent directly to secure, enterprise-grade transcription services for processing, then **immediately deleted** - typically within seconds. We only retain the text transcript and analysis results.

This makes Neural Summary ideal for sensitive meetings:
- **Legal consultations** - Client confidentiality maintained
- **Medical discussions** - HIPAA-compliant workflow ready
- **Executive briefings** - Strategic discussions remain private
- **HR conversations** - Employee privacy protected
- **Research interviews** - Participant data secured

**Zero-knowledge architecture**: Your data is encrypted in transit and at rest. We process only what's necessary and delete audio immediately after transcription.

### Who Uses Neural Summary
Trusted by legal, medical, research, and executive teams where every word matters. From solo professionals to enterprise organizations, our platform scales with your needs while maintaining enterprise-grade security and compliance.

## Core Features

### Recording & Upload
- **1-Click Recording**: Record from mic, browser tab, or upload files — all from a redesigned step-by-step creation modal
- **Recording Preview**: Listen to your recording before processing with waveform visualization
- **Recording Recovery**: Auto-save to IndexedDB protects against browser crashes
- **Template Selection**: Choose output format before processing (summary, blog post, email, etc.)
- **Batch Processing**: Upload multiple files with merge or individual processing and drag-to-reorder
- **iOS/Safari Support**: Automatic WebM-to-MP4 conversion for reliable recording on all Apple devices

### Folder Organization
- **Folder System**: Organize conversations into folders with full CRUD operations
- **Drag & Drop**: Move conversations between folders with intuitive drag-and-drop
- **Folder Sharing**: Invite collaborators to folders (unlimited invitations)
- **Nested Organization**: Structure your work by project, client, or topic

### Personalized Experience
- **Onboarding Tour**: Step-by-step guided walkthrough for new users with questionnaire and UI spotlight tour
- **Time-Aware Greetings**: "Good morning, Roberto" based on time of day
- **Smart Defaults**: Remembers your preferences (language, templates, folder locations)
- **Usage Insights**: Conversation counts and activity summaries

### Transcription & Processing
- **99.5% Accuracy**: Advanced AI transcription with automatic speaker identification
- **Large File Support**: Handle files up to 5GB with intelligent audio splitting
- **Parallel Job Processing**: Configurable concurrency (default: 2 jobs simultaneously) for faster batch transcription
- **Real-Time Updates**: Live progress tracking with WebSocket resilience and automatic polling fallback
- **99 Languages**: Automatic language detection with support for 99 languages
- **Regenerate Summary**: Re-run AI summary with custom context and instructions for better results

### AI-Powered Analysis (Output System)
- **Auto-Generated Summary**: Editorial-style summary with sticky key points sidebar and collapsible deep dives
- **On-Demand Output Templates (15+)**: Generate specialized outputs only when needed
  - Professional: Emotional Intelligence, Communication Analysis, Personal Development, Executive Brief, Vision Document
  - Content Creation: Blog Post, Email, LinkedIn, Meeting Minutes, FAQ, Training Materials
  - Specialized: Sales Analysis, Customer Feedback, Risk Assessment, Technical Documentation, Action Items, Project Status Report, Recommendations Memo
- **Full-Page AI Assets**: Each generated asset opens in a dedicated full-page editorial layout with sidebar navigation
- **Per-Item Translation**: Translate individual AI assets independently with async processing
- **Context-Aware Processing**: Provide background information during upload to enhance AI understanding
- **Mermaid Diagram Rendering**: AI-generated flowcharts and diagrams render inline in asset views

### Translation & Collaboration
- **Multi-Language Translation**: Translate transcriptions to 15 languages instantly using GPT-5-mini
  - Per-item async translation for individual AI assets
  - Automatic preference persistence (remembers your language choice per transcription)
  - Translations included in shared transcripts automatically
- **Secure Sharing**: Password-protected links with expiration and view limits
  - Share core analyses and on-demand analyses with customizable access
  - Save shared conversations to your own library with one click
- **Email Distribution**: Send summaries directly to stakeholders with recipient tracking
- **Timeline Visualization**: Interactive speaker timeline with speaker stats sidebar and toolbar toggle

### Security & Compliance
- **Audio Never Stored**: Recordings processed by secure enterprise transcription services and deleted within seconds — never saved to our servers
- **Zero-Knowledge Architecture**: Your data is encrypted and inaccessible to us — only text transcripts retained
- **GDPR Compliant**: Enterprise-grade security and data protection with account deletion options
- **HIPAA-Ready Workflow**: Secure processing suitable for sensitive medical, legal, and confidential discussions
- **Cloudflare Turnstile CAPTCHA**: Bot and spam prevention on signup and login forms
- **Custom Email Verification**: Branded 6-digit code verification flow (replaces Firebase default)
- **Account Suspension**: Admin can suspend accounts with friendly user-facing messaging
- **Security Hardening**: Rate limiting, input validation, XSS protection, command injection protection
- **Secure Headers**: Helmet middleware with CSP, HSTS, and security best practices

### Subscription & Billing
- **Flexible Pricing**: Free tier, Professional subscription ($29/month), and Pay-As-You-Go options
- **Stripe Integration**: Secure payment processing with multi-currency support (15+ currencies)
- **Usage Tracking**: Real-time usage statistics with quota enforcement and overage billing
- **Subscription Management**: Easy upgrades, cancellations, and billing history access
- **Admin Panel**: User management with avatars, soft/hard delete, restore, and analytics

## How It Works

Get started in under 60 seconds:

1. **Record or Upload**
   - Record from your mic, capture a browser tab, or upload existing recordings
   - Supports all major formats: M4A, MP3, WAV, MP4, WebM, FLAC, OGG
   - Drag & drop files up to 5GB or batch upload multiple files
   - Step-by-step creation modal guides you through the process
   - **Privacy guarantee**: Audio sent to secure transcription service, never stored on our servers

2. **Secure AI Processing**
   - Audio processed by secure, enterprise-grade transcription services
   - Automatic transcription with 99.5% accuracy
   - Speaker identification and diarization
   - Context-aware AI analysis for summaries and insights
   - Real-time progress updates via WebSocket
   - **Audio deleted within seconds** after processing — only text transcript retained

3. **Get Actionable Insights**
   - Editorial-style summary with key points sidebar auto-generated
   - 15+ on-demand AI asset templates for specialized outputs
   - Full-page asset views with editorial layouts and Mermaid diagram support
   - One-click sharing with your team (includes translations automatically)
   - Instant translation to 15 languages with per-item async processing
   - Interactive timeline view with speaker stats and context-aware copying

**Result**: What used to take hours now takes seconds. Focus on decisions, not documentation. Your sensitive conversations remain private with immediate audio deletion.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with optimized rendering
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Internationalization**: next-intl (5 languages: en, nl, de, fr, es)
- **File Upload**: React Dropzone with multi-file batch upload and drag-to-reorder
- **Authentication**: Firebase Auth (Email/Password + Google OAuth with custom domain)
- **Real-time**: Socket.io client for progress updates
- **Domain Split**: `neuralsummary.com` (marketing) + `app.neuralsummary.com` (app)

### Backend
- **Framework**: NestJS with modular architecture
- **Language**: TypeScript
- **Queue Management**: Bull + Redis for job processing with parallel concurrency
- **Real-time**: Socket.io WebSockets with JWT authentication and automatic reconnection
- **Database**: Firebase Firestore (NoSQL document store)
- **Storage**: Firebase Storage (.firebasestorage.app format)
- **Email**: Gmail SMTP with App Password and domain alias support
- **Authentication**: Firebase Admin SDK with custom 6-digit email verification
- **Payment Processing**: Stripe integration for subscriptions and PAYG
- **Scheduling**: Cron jobs for usage resets, overage checks, and cleanup
- **Spam Prevention**: Cloudflare Turnstile integration

### AI Services
- **Primary Transcription**: AssemblyAI with speaker diarization and automatic language detection (99 languages)
- **Fallback Transcription**: OpenAI Whisper API
- **Analysis & Translation**: GPT-5 / GPT-5-mini with 272K token context window
- **Audio Processing**: FFmpeg for splitting large files into 10-minute chunks

### Infrastructure
- **Monorepo**: Turborepo with shared TypeScript packages
- **Containerization**: Docker & Docker Compose with health checks
- **Reverse Proxy**: Traefik v3 with automatic SSL (Let's Encrypt)
- **Queue**: Redis (512MB) with Bull for parallel job processing
- **Deployment**: Automated CI/CD via GitHub Actions with rollback support
- **Server**: Hetzner VPS with zero-downtime deployments
- **Video**: Remotion for promo video compositions and animations

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker (for Redis)
- FFmpeg (for audio processing)
- Firebase project with Firestore and Storage enabled
- API keys for OpenAI and AssemblyAI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/transcribe.git
cd transcribe
```

2. Set up environment variables:

Create `.env` in the root directory:
```bash
# AI Services
OPENAI_API_KEY=your_openai_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
GPT_MODEL_PREFERENCE=gpt-5  # Options: gpt-5, gpt-5-mini
QUALITY_MODE=premium  # Options: premium, balanced

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app

# Email Service (Gmail SMTP)
GMAIL_AUTH_USER=your-email@gmail.com  # Primary Gmail account
GMAIL_FROM_EMAIL=noreply@yourdomain.com  # Email shown in FROM field
GMAIL_APP_PASSWORD=your_app_password  # Google App Password

# Redis (local development)
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your_jwt_secret

# Server
PORT=3001

# Processing Configuration
TRANSCRIPTION_CONCURRENCY=2  # Number of jobs processed simultaneously

# Spam Prevention (Cloudflare Turnstile)
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app.yourdomain.com  # Custom domain for Google OAuth
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key  # Cloudflare Turnstile
```

3. Install dependencies and start development:
```bash
npm run fresh  # Clean install and start everything
```

This command will:
- Install all dependencies
- Build the shared TypeScript package
- Start Redis in Docker
- Launch both frontend and backend in development mode

## Development Commands

### Core Commands
```bash
npm run fresh         # Clean install and start everything (recommended first run)
npm run dev:all       # Start Redis, build shared package, run all services
npm run dev           # Run frontend and backend (without Redis)
npm run build         # Production build for all packages
npm run start         # Start production servers
```

### Service Management
```bash
npm run redis:start   # Start Redis Docker container
npm run redis:stop    # Stop Redis container
npm run redis:check   # Verify Redis connectivity
npm run build:shared  # Build shared TypeScript types package
```

### Docker Commands
```bash
docker-compose -f docker-compose.dev.yml up    # Run development stack in Docker
docker-compose -f docker-compose.prod.yml up   # Run production stack locally
docker-compose logs -f                          # View container logs
```

### Testing & Quality
```bash
npm run lint          # Run ESLint across all packages
npm run test          # Run tests (in individual packages)
npm run clean         # Clean all build artifacts and stop Redis
```

## Project Structure

```
neural-summary/
├── apps/
│   ├── api/                      # NestJS backend
│   │   ├── src/
│   │   │   ├── transcription/    # Core transcription logic & prompts
│   │   │   ├── folder/           # Folder management
│   │   │   ├── auth/             # Authentication, email verification, Turnstile
│   │   │   ├── admin/            # Admin panel API (user management)
│   │   │   ├── websocket/        # Real-time updates
│   │   │   ├── firebase/         # Firebase services & repositories
│   │   │   ├── usage/            # Usage tracking & cron jobs
│   │   │   ├── email/            # Gmail SMTP email service
│   │   │   ├── stripe/           # Subscription & billing
│   │   │   └── utils/            # Audio splitting, etc.
│   │   └── Dockerfile
│   ├── web/                      # Next.js frontend
│   │   ├── app/
│   │   │   └── [locale]/         # Internationalized routes
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── dashboard/        # Dashboard components
│   │   │   ├── detail-pages/     # Conversation detail layouts
│   │   │   ├── outputTemplates/  # AI Asset renderers (blog, email, etc.)
│   │   │   ├── onboarding/       # User onboarding tour & questionnaire
│   │   │   ├── landing/          # Landing page sections (dark theme)
│   │   │   ├── paywall/          # Subscription UI
│   │   │   └── pricing/          # Pricing page components
│   │   ├── hooks/                # React hooks (useFolders, useTranscriptions)
│   │   ├── lib/
│   │   │   └── services/         # API service layer (folderService, etc.)
│   │   ├── messages/             # Translation files (en, nl, de, fr, es)
│   │   └── Dockerfile
│   └── video/                    # Remotion video compositions
├── packages/
│   └── shared/                   # Shared TypeScript types
├── scripts/                      # Deployment & maintenance scripts
├── docs/                         # Documentation
│   ├── V2_PROTOTYPE_GUIDE.md     # Component patterns
│   ├── UI_DESIGN_SYSTEM.md       # Design system guidelines
│   └── ...
├── docker-compose.prod.yml       # Production setup with Traefik
├── docker-compose.dev.yml        # Development Docker setup
└── turbo.json                    # Turborepo configuration
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/send-verification-code` - Send 6-digit verification code via email
- `POST /auth/verify-email` - Verify email with 6-digit code
- `POST /auth/resend-verification` - Resend verification code
- `POST /auth/reset-password` - Password reset
- `POST /auth/verify-turnstile` - Verify Cloudflare Turnstile CAPTCHA token

### Transcription
- `POST /transcriptions/upload` - Upload single audio file (with quota enforcement)
- `POST /transcriptions/batch-upload` - Upload multiple files (merge or individual)
- `GET /transcriptions` - List user transcriptions (paginated)
- `GET /transcriptions/:id` - Get specific transcription
- `PUT /transcriptions/:id/title` - Update transcription title
- `POST /transcriptions/:id/regenerate-summary` - Regenerate summary with custom context/instructions
- `POST /transcriptions/copy-from-share/:shareToken` - Copy shared conversation to own library
- `GET /transcriptions/check-copy/:shareToken` - Check if shared conversation already copied
- `DELETE /transcriptions/:id` - Delete transcription

### Analysis
- `GET /transcriptions/analysis-templates` - List all available on-demand templates
- `POST /transcriptions/:id/generate-analysis` - Generate on-demand analysis from template
- `GET /transcriptions/:id/analyses` - List user's generated analyses
- `DELETE /transcriptions/:id/analyses/:analysisId` - Delete generated analysis

### Translation
- `POST /transcriptions/:id/translate` - Translate to target language (includes on-demand analyses)
- `GET /transcriptions/:id/translations/:language` - Get specific translation
- `DELETE /transcriptions/:id/translations/:language` - Delete translation
- `PATCH /transcriptions/:id/translation-preference` - Update preferred translation language

### Folders (V2)
- `POST /folders` - Create a new folder
- `GET /folders` - List user's folders
- `GET /folders/:id` - Get folder details
- `PUT /folders/:id` - Update folder (name, color, sortOrder)
- `DELETE /folders/:id` - Delete folder (options: move contents or delete with contents)
- `GET /folders/:id/transcriptions` - List transcriptions in folder
- `PATCH /transcriptions/:id/folder` - Move transcription to folder

### Sharing
- `POST /transcriptions/:id/share` - Create share link with settings (includes on-demand analyses)
- `PUT /transcriptions/:id/share-settings` - Update share settings
- `DELETE /transcriptions/:id/share` - Revoke share link
- `POST /transcriptions/:id/share/email` - Send share via email with recipient tracking
- `GET /transcriptions/shared/:shareToken` - Access shared transcription (public)

### Subscription & Billing
- `POST /stripe/create-checkout-session` - Create Stripe checkout for subscription
- `POST /stripe/create-payg-session` - Create PAYG credit purchase session
- `POST /stripe/cancel-subscription` - Cancel active subscription
- `GET /stripe/subscription` - Get current subscription details
- `GET /stripe/billing-history` - Get billing history with invoice links
- `POST /stripe/webhook` - Stripe webhook endpoint (for payment events)

### User Management
- `GET /user/me` - Get current user profile
- `PATCH /user/me` - Update user profile (name, photo)
- `DELETE /user/me?hardDelete=true` - Delete account (soft or hard delete)
- `GET /user/usage-stats` - Get usage statistics for current billing period

### Admin
- `GET /admin/users` - List all users with avatars (admin only)
- `GET /admin/users/tier/:tier` - Filter users by subscription tier (admin only)
- `GET /admin/users/:userId` - Get detailed user information (admin only)
- `DELETE /admin/users/:userId?hardDelete=true` - Soft or hard delete user account (admin only)
- `POST /admin/users/:userId/restore` - Restore soft-deleted user (admin only)

### WebSocket Events
- `subscribe_transcription` - Subscribe to job updates
- `transcription_progress` - Real-time progress updates (upload/processing/summarizing)
- `transcription_completed` - Job completion notification
- `transcription_failed` - Job failure notification

## Deployment

### Production Deployment (GitHub Actions)

The application uses **GitHub Actions** for automated CI/CD deployment with health checks and rollback capabilities.

**Automatic Deployment:**
- Push to `main` branch triggers automatic deployment to production
- Zero-downtime deployment with health verification
- Automatic rollback on failure

**Manual Deployment:**
1. Go to [GitHub Actions](https://github.com/your-org/neural-summary/actions)
2. Run "Deploy to Production" workflow
3. Choose deployment type:
   - **Full** - Complete rebuild and deploy (default)
   - **Quick** - Restart services without rebuild
   - **Service-only** - Deploy specific services (api, web, redis, traefik)

**Rollback:**
```bash
# Via GitHub Actions
Go to Actions → Run "Rollback Deployment" workflow
```

**Emergency Manual Deployment:**
```bash
./deploy-manual.sh              # Backup script for emergencies
./deploy-manual.sh --quick      # Quick restart
./deploy-manual.sh --service api,web  # Deploy specific services
```

**Required GitHub Secrets:**
- `SSH_PRIVATE_KEY` - SSH key for server access
- `DEPLOY_SERVER` - Production server IP/hostname

**Infrastructure:**
- **Reverse Proxy**: Traefik v3 with automatic SSL (Let's Encrypt)
- **Containers**: Docker Compose with health checks
- **Server**: Hetzner VPS (or any Docker-capable server)

For detailed deployment instructions, see `CLAUDE.md`

## Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Enable Storage (use `.firebasestorage.app` format)
4. Create a service account and download the JSON key
5. Set up authentication methods (Email/Password, Google)

### Required Firestore Indexes

Create composite indexes:

**Transcriptions index:**
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `createdAt` (Descending)

**Folders index (V2):**
- Collection: `folders`
- Fields: `userId` (Ascending), `sortOrder` (Ascending), `createdAt` (Ascending)

**Transcriptions by folder index (V2):**
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `folderId` (Ascending), `createdAt` (Descending)

Note: Firestore will provide a link to auto-create indexes when queries fail.

### Subscription Tiers & Limits

- **Free Tier**:
  - 3 transcriptions/month
  - 30 minutes max duration per file
  - 100MB max file size
  - 2 on-demand analyses/month
- **Professional Tier** ($29/month):
  - 60 hours/month
  - Unlimited transcriptions
  - 5GB max file size
  - Unlimited on-demand analyses
  - Overage billing at $0.50/hour
- **Pay-As-You-Go**:
  - $1.50/hour
  - No subscription required
  - Credits never expire
  - 5GB max file size

### Audio Processing Limits

- **Maximum file size**: 100MB (Free), 5GB (Professional/PAYG)
- **Chunk size**: 10 minutes or 25MB (whichever is smaller)
- **Supported formats**: M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, OGG
- **Batch upload**: Up to 10 files per batch (merge or individual processing)
- **Parallel processing**: Configurable concurrency (default: 2 jobs)

### Translation Support

- **Supported languages**: 15 languages including English, Spanish, French, German, Dutch, Italian, Portuguese, Chinese, Japanese, Arabic, Russian, Korean, Hindi, Polish, Turkish
- **Translation model**: GPT-5-mini for cost-effective, high-quality translations
- **Caching**: Translations stored in Firestore for instant access
- **Coverage**: Translates full transcript, core analyses, and on-demand analyses
- **Preference persistence**: System remembers language choice per transcription
- **Shared transcripts**: Translations automatically included when sharing

## Troubleshooting

### FFmpeg Not Found
Install FFmpeg:
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt-get install ffmpeg`

### Redis Connection Issues
```bash
npm run redis:check  # Verify connectivity
npm run redis:stop && npm run redis:start  # Restart
```

**Production diagnostics:**
```bash
ssh root@<server> 'bash -s' < scripts/diagnose-redis.sh
```

### Port Conflicts
- Backend: 3001 (configurable via PORT env)
- Frontend: 3000 (fallback to 3002 if busy)
- Redis: 6379

### Type Errors
After modifying the shared package:
```bash
npm run build:shared
```

### Deployment Issues

**Out of Disk Space:**
```bash
# Emergency cleanup on production server
docker system prune -af && npm cache clean --force
# Or use cleanup script
bash scripts/cleanup-docker.sh
```

**SSL Certificate Issues (Traefik Default Cert):**
```bash
# Run diagnostic script
./scripts/check-traefik-certs.sh
# Verify ACME_EMAIL is configured in .env.production
```

See [CLAUDE.md](CLAUDE.md) for detailed troubleshooting guides and production monitoring.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For issues and questions, please open an issue in the GitHub repository.