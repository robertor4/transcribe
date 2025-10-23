# Neural Summary

**Transform every conversation into clarity.**

Neural Summary is an AI-powered platform that turns hours of audio into clear, structured notes, decisions, and next steps — in seconds. Whether you're handling meetings, interviews, calls, or podcasts, our platform helps professionals reclaim 10+ hours per week by automating transcription, analysis, and documentation.

## Why Neural Summary?

**Your AI that listens, understands, and summarizes — so you can think, lead, and decide.**

### The Problem We Solve
Professionals waste countless hours on manual note-taking, transcription, and documentation. Important details get lost, action items fall through the cracks, and teams struggle to stay aligned without endless meeting recaps.

### Our Solution
Neural Summary automates the entire process from audio to actionable insights:
- **Save Time**: Turn 1-hour meetings into 5-minute summaries
- **Never Miss Details**: Capture every action item, decision, and insight automatically
- **Improve Communication**: Analyze speaking patterns and become a more effective presenter
- **Share Effortlessly**: Send polished summaries to your team with one click
- **Work Globally**: Translate transcripts into 15 languages instantly

### Who Uses Neural Summary
Trusted by legal, medical, research, and executive teams where every word matters. From solo professionals to enterprise organizations, our platform scales with your needs while maintaining enterprise-grade security and compliance.

## Core Features

### Transcription & Processing
- **99.5% Accuracy**: Advanced AI transcription with automatic speaker identification
- **Large File Support**: Handle files up to 5GB with intelligent audio splitting
- **Batch Processing**: Upload multiple files at once with merge or individual processing options and drag-to-reorder functionality
- **Real-Time Updates**: Live progress tracking for every stage of processing
- **50+ Languages**: Automatic language detection with support for 99 languages

### AI-Powered Analysis
- **Executive Summaries**: Structured summaries with key points and decisions
- **Action Items**: Automatic extraction of tasks, deadlines, and follow-ups
- **Communication Analysis**: Speaking patterns, filler words, and presentation insights
- **Emotional Intelligence**: Tone and empathy analysis for better communication
- **Influence Patterns**: Persuasion techniques and decision-making dynamics
- **Personal Development**: Growth opportunities and actionable recommendations
- **Context-Aware Processing**: Provide background information during upload to enhance AI understanding and improve analysis accuracy

### Translation & Collaboration
- **Multi-Language Translation**: Translate transcriptions to 15 languages instantly using GPT-5-mini
- **Secure Sharing**: Password-protected links with expiration and view limits
- **Email Distribution**: Send summaries directly to stakeholders with recipient tracking
- **Timeline Visualization**: Interactive speaker timeline with timestamps

### Security & Compliance
- **Zero-Knowledge Architecture**: Your data is encrypted and inaccessible to us
- **Immediate Deletion**: Audio files deleted within seconds after processing
- **GDPR Compliant**: Enterprise-grade security and data protection
- **SOC 2 Type II**: Continuous compliance monitoring and auditing

## How It Works

Get started in under 60 seconds:

1. **Upload or Record Audio**
   - Use your phone, Zoom, or any recording app
   - Supports all major formats: M4A, MP3, WAV, MP4, WebM, FLAC, OGG
   - Drag & drop files up to 5GB or batch upload multiple files

2. **AI Processing**
   - Automatic transcription with 99.5% accuracy
   - Speaker identification and diarization
   - Context-aware analysis using GPT-5
   - Real-time progress updates via WebSocket

3. **Get Actionable Insights**
   - Executive summaries with key points
   - Extracted action items and deadlines
   - Communication and emotional intelligence analysis
   - One-click sharing with your team
   - Instant translation to 15 languages

**Result**: What used to take hours now takes seconds. Focus on decisions, not documentation.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with optimized rendering
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Internationalization**: next-intl (5 languages: en, nl, de, fr, es)
- **File Upload**: React Dropzone with multi-file batch upload and drag-to-reorder
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Real-time**: Socket.io client for progress updates
- **UI/UX**: Streamlined user profile menu with consolidated settings and notifications

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Queue Management**: Bull + Redis for job processing
- **Real-time**: Socket.io WebSockets with JWT authentication
- **Database**: Firebase Firestore (NoSQL document store)
- **Storage**: Firebase Storage (.firebasestorage.app format)
- **Email**: Gmail SMTP with App Password
- **Authentication**: Firebase Admin SDK

### AI Services
- **Primary Transcription**: AssemblyAI with speaker diarization and automatic language detection (99 languages)
- **Fallback Transcription**: OpenAI Whisper API
- **Analysis & Translation**: GPT-5 / GPT-5-mini with 272K token context window
- **Audio Processing**: FFmpeg for splitting large files into 10-minute chunks

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Traefik v3 with automatic SSL (Let's Encrypt)
- **Queue**: Redis with Bull for job processing
- **Deployment**: Hetzner VPS with Docker-based deployment

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
```

Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_API_URL=http://localhost:3001
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
transcribe/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── transcription/  # Core transcription logic
│   │   │   ├── auth/          # Authentication
│   │   │   ├── websocket/     # Real-time updates
│   │   │   ├── firebase/      # Firebase services
│   │   │   └── utils/         # Audio splitting, etc.
│   │   └── Dockerfile
│   └── web/                 # Next.js frontend
│       ├── app/
│       │   └── [locale]/    # Internationalized routes
│       ├── components/      # React components
│       ├── lib/            # Client utilities
│       ├── messages/       # Translation files
│       └── Dockerfile
├── packages/
│   └── shared/             # Shared TypeScript types
├── scripts/
│   └── deploy.sh          # Deployment script to Hetzner
├── docs/                   # Documentation
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── DOCKER.md          # Docker setup
│   └── ...
├── docker-compose.prod.yml # Production setup with Traefik
├── docker-compose.dev.yml  # Development Docker setup
└── turbo.json             # Turborepo configuration
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification
- `POST /auth/reset-password` - Password reset

### Transcription
- `POST /transcriptions/upload` - Upload single audio file
- `POST /transcriptions/batch-upload` - Upload multiple files (merge or individual)
- `GET /transcriptions` - List user transcriptions (paginated)
- `GET /transcriptions/:id` - Get specific transcription
- `PUT /transcriptions/:id/title` - Update transcription title
- `DELETE /transcriptions/:id` - Delete transcription

### Translation
- `POST /transcriptions/:id/translate` - Translate to target language
- `GET /transcriptions/:id/translations/:language` - Get specific translation
- `DELETE /transcriptions/:id/translations/:language` - Delete translation

### Sharing
- `POST /transcriptions/:id/share` - Create share link with settings
- `PUT /transcriptions/:id/share-settings` - Update share settings
- `DELETE /transcriptions/:id/share` - Revoke share link
- `POST /transcriptions/:id/share/email` - Send share via email with recipient tracking
- `GET /transcriptions/shared/:shareToken` - Access shared transcription (public)

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

### Required Firestore Index

Create a composite index:
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `createdAt` (Descending)

### Audio Processing Limits

- **Maximum file size**: 5GB (matches AssemblyAI's limit)
- **Chunk size**: 10 minutes or 25MB (whichever is smaller)
- **Supported formats**: M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, OGG
- **Batch upload**: Up to 10 files per batch (merge or individual processing)

### Translation Support

- **Supported languages**: 15 languages including English, Spanish, French, German, Dutch, Italian, Portuguese, Chinese, Japanese, Arabic, Russian, Korean, Hindi, Polish, Turkish
- **Translation model**: GPT-5-mini for cost-effective, high-quality translations
- **Caching**: Translations stored in Firestore for instant access
- **Coverage**: Translates full transcript and all analyses (summary, action items, etc.)

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

### Port Conflicts
- Backend: 3001 (configurable via PORT env)
- Frontend: 3000 (fallback to 3002 if busy)
- Redis: 6379

### Type Errors
After modifying the shared package:
```bash
npm run build:shared
```

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