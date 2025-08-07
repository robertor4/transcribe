# Transcribe App - Web Application

A modern web application for audio transcription and summarization using OpenAI's Whisper and GPT models, built with Next.js, NestJS, and Firebase.

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: NestJS with TypeScript, Bull Queue, WebSockets
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Real-time**: Socket.io for live progress updates

## Prerequisites

- Node.js 18+ and npm
- Redis server (for job queue)
- Firebase project
- OpenAI API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Install dependencies for all workspaces
cd apps/web && npm install && cd ../..
cd apps/api && npm install && cd ../..
cd packages/shared && npm install && cd ../..
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

### 5. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis

# Or install locally
brew install redis  # macOS
brew services start redis
```

### 6. Build Shared Package

```bash
cd packages/shared
npm run build
cd ../..
```

### 7. Run the Application

Development mode:
```bash
# Start all services
npm run dev

# Or start individually:
# Terminal 1 - Backend API
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

Production build:
```bash
npm run build
npm run start
```

## Usage

1. Navigate to http://localhost:3000
2. Sign up or sign in with Google/Email
3. Upload audio files (supports .m4a, .mp3, .wav, .mp4, etc.)
4. Provide optional context for better transcription accuracy
5. Monitor real-time progress
6. View and download transcriptions and summaries

## Features

- **Multi-file Upload**: Drag-and-drop interface for batch uploads
- **Context Support**: Improve accuracy with meeting context
- **Real-time Progress**: Live updates via WebSocket
- **Queue Management**: Robust job processing with retry logic
- **Authentication**: Secure user accounts with Firebase Auth
- **Responsive Design**: Works on desktop and mobile
- **Export Options**: Download transcripts and summaries

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
Ensure Redis is running: `redis-cli ping`

### Firebase Auth Error
Check Firebase project settings and service account permissions

### File Upload Issues
Verify Firebase Storage rules and CORS configuration

## License

MIT