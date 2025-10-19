# Neural Summary - Audio Transcription & AI Summarization Platform

A production-ready monorepo application for audio transcription and intelligent summarization. Features automatic audio splitting for large files (up to 5GB for enterprise users), real-time progress tracking via WebSockets, multi-language translation, and context-aware AI processing using GPT-5.

## Features

- **Advanced Audio Processing**: Handle files up to 5GB with automatic splitting into optimal chunks
- **Multi-Language Translation**: Translate transcripts and analyses into 15 languages using GPT-5-mini
- **Multi-Language Interface**: UI available in English, Dutch, German, French, and Spanish
- **Real-Time Progress Tracking**: WebSocket-based updates for transcription and summarization progress
- **Speaker Diarization**: Automatic speaker identification and timeline visualization
- **AI-Powered Analysis**: Multiple analysis types including summaries, action items, communication styles, emotional intelligence, influence patterns, and personal development insights
- **Batch Upload**: Upload multiple files with merge or individual processing options
- **Secure File Sharing**: Share transcriptions with password protection, expiration, and view limits
- **Email Sharing**: Send transcripts directly via email with Gmail SMTP
- **Enterprise-Ready**: Scalable architecture with Redis queues and horizontal scaling support

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Internationalization**: next-intl (5 languages: en, nl, de, fr, es)
- **File Upload**: React Dropzone with drag-to-reorder
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Real-time**: Socket.io client for progress updates

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
- `POST /transcriptions/:id/share/email` - Send share via email
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