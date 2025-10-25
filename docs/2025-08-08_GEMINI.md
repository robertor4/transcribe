# Transcribe App - Project Context for AI Assistance

## Project Overview

The Transcribe App is a modern web application built as a monorepo using Turborepo, with a frontend in Next.js 14 (App Router) and a backend in NestJS. It provides audio transcription and summarization services using OpenAI's Whisper and GPT models.

### Key Features
- Large file support (up to 500MB) with automatic audio splitting
- Multiple audio format support (M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, OGG)
- Real-time progress tracking via WebSockets
- Intelligent summarization with GPT-4
- Queue-based architecture for batch processing
- Firebase-based authentication and storage

### Architecture
- **Monorepo**: Turborepo managing multiple workspaces
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: NestJS with TypeScript, Bull Queue, and WebSockets
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (new .firebasestorage.app format)
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Queue System**: Redis with Bull for job processing
- **AI Services**: OpenAI Whisper API + GPT-4

## Project Structure

```
transcribe-app/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types and utilities
├── cli/             # Original CLI tool
├── firebase/        # Firebase configuration
├── input/           # CLI input directory
├── output/          # CLI output directory
├── completed/       # CLI completed files directory
└── README.md
```

## Shared Package

The shared package (`packages/shared`) contains common types, constants, and utilities used across both frontend and backend:

- **Types**: TypeScript interfaces and enums for data structures
- **Constants**: File size limits, supported formats, model names, WebSocket events, error codes, subscription limits
- **Utilities**: File validation, formatting functions, error parsing, etc.

Key shared types include `Transcription`, `User`, `TranscriptionJob`, `TranscriptionProgress`, and `TranscriptionStatus`.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Redis server (for job queue)
- Firebase project with Auth, Firestore, and Storage enabled
- OpenAI API key with Whisper and GPT-4 access
- FFmpeg (optional, for audio splitting of large files)

### Quick Setup
```bash
# Install all dependencies and build shared package
npm run setup

# Start everything (Redis + all services)
npm run dev:all
```

### Manual Setup
```bash
# Install dependencies
npm install
cd apps/web && npm install && cd ../..
cd apps/api && npm install && cd ../..
cd packages/shared && npm install && npm run build && cd ../..

# Start services
npm run redis:start
npm run build:shared
npm run dev
```

## Key Scripts

### Root Level Scripts
- `npm run dev:all` - Start everything (Redis + all services)
- `npm run dev` - Start all services in development mode
- `npm run build` - Build all packages
- `npm run cli` - Run the original CLI tool
- `npm run redis:start` - Start Redis container
- `npm run setup` - Install all dependencies and build shared package

### Web App Scripts
- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application
- `npm run start` - Start production server

### API App Scripts
- `npm run start:dev` - Start NestJS development server
- `npm run build` - Build NestJS application
- `npm run start:prod` - Start production server

### Shared Package Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode compilation

## Environment Variables

The application requires several environment variables in `.env` files:

### Root/.env
- `OPENAI_API_KEY` - OpenAI API key
- Firebase Admin credentials (for backend)
- Redis connection details
- JWT secret

### Web/.env.local
- Firebase Client credentials (for frontend)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Firebase Configuration

The application uses Firebase for authentication, database, and storage:

- **Firestore Rules**: Define access control for users, transcriptions, contexts, and jobs
- **Storage Rules**: Control access to audio files, transcriptions, and profile images
- **Authentication**: Email/Password and Google OAuth providers

## Docker Deployment

The application includes Docker configurations for deployment:
- `docker-compose.yml` - Production deployment with Redis, API, and Web services
- `docker-compose.dev.yml` - Development deployment

## CLI Tool

The original CLI tool is still available at `cli/transcribe.js` and can be run with:
```bash
npm run cli
```

It supports batch processing and context-aware transcription.

## Development Conventions

### Code Style
- TypeScript for type safety across all applications
- ESLint and Prettier for code formatting
- Tailwind CSS for styling in the frontend

### Architecture Patterns
- Monorepo with Turborepo for workspace management
- Shared types and utilities in the `packages/shared` workspace
- REST API endpoints in the backend with WebSocket real-time updates
- Firebase integration for authentication and data storage

### Testing
- Jest for backend testing
- Next.js testing utilities for frontend

### Deployment
- Frontend can be deployed to Vercel
- Backend can be deployed to Google Cloud Run or Railway
- Docker configurations provided for containerized deployment

## Troubleshooting

Common issues and solutions:
- **Redis Connection Error**: Check Redis status with `npm run redis:check`
- **Firebase Auth Error**: Verify Firebase project settings and service account permissions
- **File Upload Issues**: Check Firebase Storage rules and CORS configuration
- **Large File Processing**: Install FFmpeg for automatic audio splitting
- **Port Conflicts**: API runs on port 3001, frontend on port 3000, Redis on port 6379

## Key Directories for Development

1. **apps/api/src** - Backend source code (NestJS controllers, services, modules)
2. **apps/web/src** - Frontend source code (Next.js components, pages, hooks)
3. **packages/shared/src** - Shared types, constants, and utilities
4. **firebase/** - Firebase security rules
5. **cli/** - Original CLI tool implementation

When working on new features, consider the data flow from frontend to backend through the shared types, and ensure consistency across all layers.