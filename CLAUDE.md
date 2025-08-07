# Transcribe Web Application

## Project Overview
This is a web-based audio transcription application that converts audio files to text using OpenAI's Whisper API and generates summaries using GPT-4. Originally a CLI tool, it has been transformed into a full-stack web application.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Bull queues for job processing
- **Database**: Firebase Firestore for metadata storage
- **Storage**: Firebase Storage for audio files
- **Authentication**: Firebase Auth (Email/Password and Google providers)
- **Real-time Updates**: Socket.io WebSockets
- **AI Services**: OpenAI Whisper for transcription, GPT-4 for summarization
- **Queue Management**: Redis with Bull
- **Monorepo**: Turborepo for workspace management

## Project Structure
```
transcribe/
├── apps/
│   ├── api/                 # NestJS backend API
│   │   ├── src/
│   │   │   ├── transcription/  # Transcription service and controllers
│   │   │   ├── firebase/       # Firebase integration
│   │   │   ├── auth/           # Authentication guards
│   │   │   └── websocket/      # WebSocket gateway
│   │   └── .env              # Backend environment variables
│   └── web/                 # Next.js frontend
│       ├── app/              # App router pages
│       ├── components/       # React components
│       ├── contexts/         # React contexts (Auth)
│       └── .env.local        # Frontend environment variables
├── packages/
│   └── shared/              # Shared types and utilities
├── completed/               # Original CLI files (preserved)
└── .env                     # Root environment configuration
```

## Key Features
1. **File Upload**: Drag-and-drop interface for audio files (.m4a, .mp3, .wav, .mp4, .mpeg, .webm)
2. **Context Support**: Users can provide context for better transcription accuracy
3. **Real-time Progress**: WebSocket updates during transcription processing
4. **Transcription History**: View all past transcriptions with pagination
5. **Async Processing**: Queue-based architecture for scalable transcription
6. **Authentication**: Secure user authentication with Firebase Auth
7. **File Storage**: Secure file storage with Firebase Storage (uses new .firebasestorage.app format)

## Environment Configuration

### Root .env file
```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app  # Note: New format as of Oct 2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret

# API
PORT=3001
NODE_ENV=development
```

### apps/web/.env.local
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=app_id
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Commands

### Start Everything
```bash
npm run dev:all  # Starts Redis, builds shared package, and runs all services
```

### Individual Services
```bash
npm run dev           # Run all services (without Redis)
npm run redis:start   # Start Redis container
npm run build:shared  # Build shared types package
```

### Testing
```bash
npm run lint      # Run linting
npm run typecheck # Run TypeScript checks
```

## API Endpoints

### Transcription
- `POST /transcriptions/upload` - Upload audio file for transcription
- `GET /transcriptions` - Get user's transcription history (paginated)
- `GET /transcriptions/:id` - Get specific transcription details
- `DELETE /transcriptions/:id` - Delete a transcription

### WebSocket Events
- `subscribe_transcription` - Subscribe to transcription updates
- `unsubscribe_transcription` - Unsubscribe from updates
- `transcription_progress` - Progress updates during processing
- `transcription_complete` - Completion notification

## Processing Flow
1. User uploads audio file through web interface
2. File is validated (format and size checks)
3. File is uploaded to Firebase Storage
4. Transcription job is queued in Redis/Bull
5. Backend processes the job:
   - Downloads file from Firebase Storage
   - Sends to OpenAI Whisper API for transcription
   - Generates summary using GPT-4
   - Stores results in Firestore
6. Real-time updates sent via WebSocket
7. User sees completed transcription and summary

## Firebase Setup Notes

### Storage Bucket Format
As of October 2024, Firebase uses the new `.firebasestorage.app` domain format instead of the legacy `.appspot.com` format. Ensure your storage bucket is configured as:
```
project-id.firebasestorage.app
```

### Required Firestore Indexes
The application requires a composite index for querying transcriptions:
- Collection: `transcriptions`
- Fields: `userId` (Ascending), `createdAt` (Descending)

If you encounter an index error, click the link in the error message to create it automatically.

### Firebase Services Required
1. **Authentication**: Enable Email/Password and Google providers
2. **Firestore Database**: Create database in production mode
3. **Storage**: Initialize default storage bucket
4. **Service Account**: Download and extract values to .env file

## Common Issues and Solutions

1. **M4a File Upload Issues**: The system accepts multiple MIME types for M4a files including `audio/x-m4a`, `audio/m4a`, `audio/mp4`, and `application/octet-stream`

2. **Redis Port Conflicts**: If port 6379 is in use, the system will use existing Redis instance

3. **Firestore Undefined Values**: Optional fields (context, contextId) are conditionally added to avoid Firestore errors

4. **Port Conflicts**: The app will use alternative ports if defaults are occupied (e.g., 3002 for frontend if 3000 is busy)

## Architecture Decisions

1. **Monorepo with Turborepo**: Enables shared types and parallel development
2. **Queue-based Processing**: Scalable async processing with retry logic
3. **WebSockets for Real-time**: Immediate feedback during long-running operations
4. **Firebase Integration**: Managed auth, storage, and database services
5. **TypeScript Throughout**: Type safety across frontend, backend, and shared packages

## Security Considerations

- Firebase Auth tokens required for all API endpoints
- File size limits enforced (100MB max)
- Audio file format validation
- User isolation (users can only access their own transcriptions)
- Signed URLs for secure file access with expiration

## Original CLI Functionality
The original CLI transcription tool is preserved in the `completed/` directory. It accepts audio files, optional context, and generates transcripts and summaries using the same OpenAI services.