# Neural Notes - Audio Transcription & AI Summarization Platform

A production-ready monorepo application for audio transcription and intelligent summarization. Features automatic audio splitting for large files (up to 500MB), real-time progress tracking via WebSockets, and context-aware AI processing.

## Features

- **Advanced Audio Processing**: Handle files up to 500MB with automatic splitting into optimal chunks
- **Multi-Language Support**: Interface available in English, Dutch, German, French, and Spanish
- **Real-Time Progress Tracking**: WebSocket-based updates for transcription and summarization progress
- **Speaker Diarization**: Automatic speaker identification and separation
- **AI-Powered Analysis**: Multiple analysis types including summaries, action items, emotional intelligence insights
- **Secure File Sharing**: Share transcriptions with temporary, secure links
- **Enterprise-Ready**: Scalable architecture with Redis queues and horizontal scaling support

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Internationalization**: next-intl (5 languages)
- **File Upload**: React Dropzone
- **Authentication**: Firebase Auth

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Queue Management**: Bull + Redis
- **Real-time**: Socket.io WebSockets
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Admin SDK

### AI Services
- **Primary Transcription**: AssemblyAI (with speaker diarization)
- **Fallback Transcription**: OpenAI Whisper API
- **Summarization**: GPT-4o-mini / GPT-4o
- **Audio Processing**: FFmpeg for file splitting

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (production)
- **Queue**: Redis
- **Deployment**: VPS with automated scripts

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
OPENAI_API_KEY=your_openai_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
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

### Docker Development
```bash
npm run dev:docker       # Run entire stack in Docker
npm run dev:docker:build # Build Docker images for development
npm run docker:logs      # View Docker container logs
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
│   ├── setup-vps.sh       # VPS setup automation
│   ├── deploy.sh          # Deployment script
│   └── deploy-update.sh   # Update deployment
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── turbo.json             # Turborepo configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/reset-password` - Password reset

### Transcription
- `POST /api/transcription/upload` - Upload audio file
- `GET /api/transcription` - List user transcriptions
- `GET /api/transcription/:id` - Get specific transcription
- `DELETE /api/transcription/:id` - Delete transcription
- `POST /api/transcription/:id/share` - Create share link
- `GET /api/transcription/shared/:shareToken` - Access shared transcription

### WebSocket Events
- `subscribe_transcription` - Subscribe to job updates
- `transcription_progress` - Progress updates
- `transcription_completed` - Job completion
- `transcription_failed` - Job failure

## Deployment

### VPS Deployment

1. Run the setup script on a fresh Ubuntu 22.04/24.04 VPS:
```bash
sudo bash scripts/setup-vps.sh yourdomain.com your@email.com
```

2. Deploy the application:
```bash
./scripts/deploy.sh
```

3. For updates:
```bash
./scripts/deploy-update.sh
```

### Docker Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

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

- Maximum file size: 500MB
- Chunk size: 10 minutes or 25MB (whichever is smaller)
- Supported formats: M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, OGG

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