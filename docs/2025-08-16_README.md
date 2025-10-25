# Neural Summary - Technical Documentation

Welcome to the Neural Summary technical documentation. This directory contains detailed guides for developers working on the application.

## 📚 Documentation Index

### System Architecture & Features

**[WebSocket Resilience & Polling Fallback](WEBSOCKET_RESILIENCE.md)** ⭐ **NEW**
- Comprehensive guide to the dual-layer real-time update system
- WebSocket connection management and automatic failover
- API polling fallback mechanism for reliability
- Configuration, testing, and troubleshooting
- **Read this if:** You're working on real-time features, debugging connection issues, or optimizing performance

### Quick Links

| Topic | Documentation | Location |
|-------|---------------|----------|
| **Getting Started** | See below | This file |
| **Project Overview** | [CLAUDE.md](../CLAUDE.md) | Root directory |
| **Real-time Updates** | [WEBSOCKET_RESILIENCE.md](WEBSOCKET_RESILIENCE.md) | This directory |
| **Deployment** | [CLAUDE.md#deployment](../CLAUDE.md#deployment) | Root directory |

---

## 🚀 Application Overview

Neural Summary is a production-ready monorepo application for audio transcription and intelligent summarization.

### Key Features

- **Large File Support**: Automatically splits audio files up to 5GB (enterprise tier)
- **Multiple Formats**: Supports M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, and OGG
- **Real-time Updates**: WebSocket-based progress tracking with automatic polling fallback
- **Smart Summarization**: Context-aware transcription with GPT-5 powered analyses
- **Batch Processing**: Queue-based architecture for handling multiple files
- **Secure Storage**: Firebase-based authentication and file storage
- **Multi-language**: Support for 5 languages (EN, NL, DE, FR, ES)
- **Speaker Diarization**: Automatic speaker detection and labeling (AssemblyAI)

## Architecture

- **Frontend**: Next.js 15 (App Router) with TypeScript, Tailwind CSS v4
- **Backend**: NestJS with TypeScript, Bull queues, Socket.io WebSockets
- **Database**: Firebase Firestore (NoSQL document store)
- **Storage**: Firebase Storage (new .firebasestorage.app format as of Oct 2024)
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Queue**: Redis with Bull for scalable job processing
- **AI Services**:
  - AssemblyAI for transcription and speaker diarization (primary)
  - OpenAI Whisper API for transcription (fallback)
  - GPT-5/GPT-5-mini for summarization and analysis
- **Monorepo**: Turborepo with shared TypeScript packages
- **Audio Processing**: FFmpeg for splitting large files

## Prerequisites

- Node.js 18+ and npm
- Redis server (for job queue)
- Firebase project with Auth, Firestore, and Storage enabled
- OpenAI API key with Whisper and GPT-4 access
- FFmpeg (optional, for audio splitting of large files)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Quick setup (recommended)
npm run setup

# Or manual installation
npm install
cd apps/web && npm install && cd ../..
cd apps/api && npm install && cd ../..
cd packages/shared && npm install && npm run build && cd ../..
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- Firebase configuration (client and admin)
- Redis connection details

### 3. Set up Firebase

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password and Google providers)
3. Create Firestore database
4. Enable Storage
5. Generate service account key for backend
6. Copy Firebase config to `.env`

### 4. Deploy Firebase Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 5. Start the Application

#### Quick Start (Recommended)
```bash
# Start everything (Redis + all services)
npm run dev:all
```

#### Manual Start
```bash
# Start Redis
npm run redis:start

# Build shared package
npm run build:shared

# Start all services
npm run dev
```

#### Individual Services
```bash
# Terminal 1 - Backend API (port 3001)
cd apps/api && npm run start:dev

# Terminal 2 - Frontend (port 3000)
cd apps/web && npm run dev
```

#### Production Build
```bash
npm run build
npm run start
```

## Usage

1. Navigate to http://localhost:3000
2. Sign up or sign in with Google/Email
3. Upload audio files (supports M4A, MP3, WAV, MP4, MPEG, WebM, FLAC, OGG)
4. Provide optional context for better transcription accuracy
5. Monitor real-time progress with WebSocket updates
6. View, search, and download transcriptions and summaries

## Features

### File Processing
- **Large File Support**: Automatically splits files up to 500MB into 10-minute chunks
- **Smart Chunking**: Maintains context across split segments
- **Multiple Formats**: Supports 9+ audio/video formats including MP4
- **Batch Upload**: Process multiple files simultaneously

### AI Capabilities
- **Whisper Transcription**: High-accuracy speech-to-text using OpenAI Whisper
- **GPT-4 Summaries**: Intelligent summarization with context awareness
- **Context Support**: Provide meeting context for improved accuracy

### User Experience
- **Real-time Progress**: Live WebSocket updates during processing
- **Drag & Drop**: Intuitive file upload interface
- **Transcription History**: Paginated view of all past transcriptions
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Error Recovery**: Automatic retry logic for failed jobs

## API Endpoints

### Transcription
- `POST /transcriptions/upload` - Upload audio file
- `GET /transcriptions` - List user's transcriptions
- `GET /transcriptions/:id` - Get specific transcription
- `DELETE /transcriptions/:id` - Delete transcription

### WebSocket Events
- `transcription_progress` - Real-time progress updates
- `transcription_completed` - Completion notification
- `transcription_failed` - Error notification

## CLI Tool

The original CLI tool is still available:

```bash
npm run cli

# With options
npm run cli -- --batch  # Same context for all files
npm run cli -- --no-context  # No context
```

## Project Structure

```
transcribe-app/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types and utilities
├── firebase/         # Firebase configuration
├── cli/             # Original CLI tool
└── README.md
```

## Deployment

### Frontend (Vercel)
```bash
cd apps/web
vercel --prod
```

### Backend (Google Cloud Run / Railway)
```bash
cd apps/api
# Follow platform-specific deployment guides
```

## Troubleshooting

### Redis Connection Error
```bash
# Check Redis status
npm run redis:check

# Restart Redis
npm run redis:stop && npm run redis:start
```

### Firebase Auth Error
- Verify Firebase project settings
- Check service account permissions
- Ensure authentication providers are enabled

### File Upload Issues
- Verify Firebase Storage rules allow authenticated uploads
- Check CORS configuration in `cors.json`
- Ensure file size is within limits (500MB max)

### Large File Processing
- Install FFmpeg for automatic audio splitting:
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt-get install ffmpeg
  
  # Windows
  choco install ffmpeg
  ```

### Port Conflicts
- API runs on port 3001 (configurable via PORT env)
- Frontend runs on port 3000 (Next.js default)
- Redis runs on port 6379 (Docker container)

## License

MIT