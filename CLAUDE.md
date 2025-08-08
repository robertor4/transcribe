# Neural Summary Web Application

## Project Overview
A production-ready web application for audio transcription and summarization using OpenAI's Whisper API and GPT-4. Features automatic audio splitting for large files (up to 500MB), real-time progress tracking via WebSockets, and intelligent context-aware summarization. Originally a CLI tool, now a full-stack monorepo application with enterprise-grade features.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Dropzone
- **Backend**: NestJS, TypeScript, Bull queues for job processing
- **Database**: Firebase Firestore for metadata storage
- **Storage**: Firebase Storage for audio files (new .firebasestorage.app format)
- **Authentication**: Firebase Auth (Email/Password and Google OAuth)
- **Real-time Updates**: Socket.io WebSockets for progress tracking
- **AI Services**: OpenAI Whisper API for transcription, GPT-4 for summarization
- **Queue Management**: Redis with Bull for scalable job processing
- **Audio Processing**: FFmpeg for automatic file splitting (files > 25MB)
- **Monorepo**: Turborepo for workspace management
- **Models**: whisper-1 for transcription, gpt-4o-mini/gpt-4o for summaries

## Project Structure
```
transcribe/
├── apps/
│   ├── api/                     # NestJS backend API
│   │   ├── src/
│   │   │   ├── transcription/   # Transcription service, controller, processor
│   │   │   ├── firebase/        # Firebase admin integration
│   │   │   ├── auth/            # Firebase authentication guards
│   │   │   ├── websocket/       # Socket.io gateway
│   │   │   └── utils/
│   │   │       └── audio-splitter.ts  # FFmpeg audio chunking
│   │   └── .env                 # Backend environment variables
│   └── web/                     # Next.js frontend
│       ├── app/                 # App router pages
│       ├── components/          # React components
│       ├── contexts/            # React contexts (Auth)
│       ├── lib/                 # API client, WebSocket, Firebase
│       └── .env.local           # Frontend environment variables
├── packages/
│   └── shared/                  # Shared types, constants, utilities
│       ├── src/
│       │   ├── types.ts         # TypeScript interfaces
│       │   ├── constants.ts     # Shared constants
│       │   └── utils.ts         # Validation utilities
│       └── dist/                # Built package
├── cli/                         # Original CLI tool (maintained)
├── firebase/                    # Firebase configuration files
└── .env                         # Root environment configuration
```

## Key Features

### Core Functionality
1. **Large File Support**: Handles files up to 500MB with automatic splitting into 10-minute chunks
2. **Multi-Format Support**: Accepts M4A, MP3, WAV, MP4, MPEG, MPGA, WebM, FLAC, OGG
3. **Smart Audio Splitting**: FFmpeg-based chunking for files exceeding Whisper's 25MB limit
4. **Context-Aware Processing**: Optional context for improved transcription accuracy
5. **Batch Processing**: Queue-based architecture supporting multiple concurrent jobs

### User Experience
6. **Drag-and-Drop Upload**: Intuitive file upload with react-dropzone
7. **Real-time Progress**: WebSocket updates showing processing status
8. **Transcription History**: Paginated view with Firestore composite indexing
9. **Authentication**: Firebase Auth with Email/Password and Google OAuth
10. **Responsive Design**: Mobile-first design with Tailwind CSS

### Technical Features
11. **Error Recovery**: Automatic retry logic with exponential backoff
12. **File Validation**: Client and server-side validation for format and size
13. **Secure Storage**: Firebase Storage with signed URLs (5-hour expiration)
14. **Type Safety**: Shared TypeScript types across frontend/backend
15. **Subscription Tiers**: Support for free/pro/enterprise limits (configurable)

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

### Quick Start
```bash
npm run fresh         # Clean install and start everything
npm run dev:all       # Start Redis, build shared, run all services
```

### Service Management
```bash
npm run dev           # Run all services (without Redis)
npm run redis:start   # Start Redis Docker container
npm run redis:stop    # Stop Redis container
npm run redis:check   # Verify Redis connectivity
npm run build:shared  # Build shared types package
```

### Development Workflow
```bash
npm run setup         # Install all dependencies and build shared
npm run clean         # Clean all build artifacts and stop Redis
npm run build         # Production build for all services
npm run lint          # Run ESLint across monorepo
```

### CLI Tool (Legacy)
```bash
npm run cli           # Run original CLI transcription tool
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
- `transcription_completed` - Completion notification
- `transcription_failed` - Error notification

## Processing Flow

### Standard Files (< 25MB)
1. User uploads audio file through drag-and-drop interface
2. Client-side validation (format, size, MIME type)
3. File uploaded to Firebase Storage with progress tracking
4. Transcription job queued in Redis/Bull with metadata
5. Backend processor:
   - Downloads file from Firebase Storage
   - Sends directly to OpenAI Whisper API
   - Generates summary using GPT-4
   - Stores results in Firestore
6. WebSocket emits real-time progress updates
7. User receives notification and views results

### Large Files (> 25MB, up to 500MB)
1. User uploads large audio file
2. Client validates file (up to 500MB limit)
3. File uploaded to Firebase Storage
4. Job queued with 'requires_splitting' flag
5. Backend processor with AudioSplitter:
   - Downloads file from Firebase Storage
   - Checks FFmpeg availability
   - Splits audio into 10-minute chunks (max 25MB each)
   - Processes each chunk through Whisper API
   - Merges transcriptions maintaining chronological order
   - Generates unified summary with full context
   - Cleans up temporary chunk files
   - Stores complete results in Firestore
6. WebSocket emits progress for each chunk
7. User sees consolidated transcription

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

### File Upload Issues
1. **M4A MIME Type Variations**: System handles `audio/x-m4a`, `audio/m4a`, `audio/mp4`, and `application/octet-stream`
2. **Large File Failures**: Ensure FFmpeg is installed for files > 25MB
3. **MP4 Video Files**: Whisper extracts audio track automatically

### Infrastructure Issues
4. **Redis Port Conflicts**: Script checks for existing Redis on 6379 before starting Docker container
5. **FFmpeg Not Found**: AudioSplitter checks multiple paths (/usr/bin, /usr/local/bin, /opt/homebrew/bin)
6. **Port Conflicts**: Frontend falls back to 3002 if 3000 is busy

### Firebase Issues
7. **Firestore Undefined Values**: Optional fields (context, contextId) conditionally added
8. **Storage Bucket Format**: Must use new `.firebasestorage.app` format (not `.appspot.com`)
9. **Composite Index Error**: Click error link to auto-create required index
10. **CORS Configuration**: Deploy `cors.json` for cross-origin uploads

### Processing Issues
11. **Whisper API Timeout**: Large chunks may timeout - system retries with exponential backoff
12. **Memory Issues**: FFmpeg streaming prevents loading entire file into memory
13. **Chunk Synchronization**: Chunks processed in parallel but merged in order

## Architecture Decisions

### Monorepo Structure
1. **Turborepo**: Enables parallel builds, shared dependencies, and unified tooling
2. **Shared Package**: Single source of truth for types, constants, and utilities
3. **Independent Services**: Frontend and backend can be deployed separately

### Processing Architecture
4. **Queue-based Processing**: Bull/Redis for scalable async job handling
5. **Audio Splitting**: FFmpeg integration for handling files beyond API limits
6. **Chunk Processing**: Parallel processing with ordered merging
7. **Retry Logic**: Exponential backoff for transient failures

### Real-time Communication
8. **WebSockets**: Socket.io for bidirectional real-time updates
9. **Event-driven Updates**: Progress events for each processing stage
10. **Connection Management**: Automatic reconnection with state recovery

### Storage & Data
11. **Firebase Suite**: Managed services reduce operational overhead
12. **Firestore**: NoSQL for flexible schema evolution
13. **Composite Indexing**: Optimized queries for user transcriptions
14. **Signed URLs**: Temporary access without permanent public links

### Development Experience
15. **TypeScript**: End-to-end type safety with shared types
16. **Hot Reload**: Fast development iteration
17. **Docker**: Containerized Redis for consistent development
18. **Environment Configuration**: Separate configs for dev/staging/prod

## Security Considerations

### Authentication & Authorization
- Firebase Auth tokens required for all API endpoints
- FirebaseAuthGuard validates tokens on each request
- User isolation enforced at database query level
- JWT tokens for WebSocket authentication

### File Security
- Client and server-side format validation
- File size limits enforced (500MB max, configurable by tier)
- MIME type verification against whitelist
- Signed Firebase Storage URLs with 5-hour expiration
- Temporary chunk files deleted after processing

### API Security
- Rate limiting on upload endpoints
- Input sanitization for context fields
- Error messages don't expose system internals
- Queue job isolation by user ID

### Infrastructure
- Environment variables for sensitive configuration
- Service account keys never committed to repository
- Redis password protection in production
- HTTPS enforcement in production deployment

## SEO Guidelines for Landing Page

### IMPORTANT: All changes to the landing page MUST follow these SEO best practices:

#### 1. **Page Structure Requirements**
- Landing page MUST be a server component (not 'use client') for optimal SEO
- Use Next.js Metadata API for all meta tags
- Include JSON-LD structured data for Organization, SoftwareApplication, and FAQ schemas
- Maintain proper HTML semantic structure (header, nav, main, section, article, footer)

#### 2. **Meta Tags Checklist**
- Title: 50-60 characters, include primary keywords
- Description: 150-155 characters, compelling call-to-action
- Keywords: Include relevant search terms (audio transcription, AI transcription, speech to text)
- Open Graph tags for social media sharing
- Twitter Card metadata
- Canonical URLs and hreflang tags for all supported languages

#### 3. **Content Optimization**
- H1 tag: Single, descriptive, includes main keyword
- H2/H3 tags: Logical hierarchy for sections
- Alt text: Descriptive alt text for ALL images
- ARIA labels: For interactive elements and navigation
- Focus keywords naturally integrated in content

#### 4. **Technical SEO Files**
- robots.txt: Must exist in /public with proper directives
- sitemap.ts: Dynamic sitemap generation for all locales
- Structured data: JSON-LD scripts with proper schema.org markup

#### 5. **Performance & Accessibility**
- Image optimization: Width/height attributes, lazy loading for below-fold images
- Semantic HTML: Use proper elements (nav, section, article, blockquote, cite)
- ARIA attributes: aria-label, aria-labelledby, aria-hidden for decorative elements
- Mobile-first responsive design

#### 6. **Landing Page File Locations**
- Main landing: `/apps/web/app/[locale]/landing/page.tsx`
- Layout metadata: `/apps/web/app/[locale]/layout.tsx`
- Sitemap: `/apps/web/app/sitemap.ts`
- Robots: `/apps/web/public/robots.txt`

### Example Landing Page Structure:
```tsx
// Server component with metadata
export const metadata: Metadata = {
  title: 'Neural Notes - AI-Powered Audio Transcription',
  description: 'Transform audio into accurate transcripts...',
  // ... comprehensive metadata
};

// JSON-LD structured data component
function JsonLd() {
  return <script type="application/ld+json">...</script>;
}

// Main component with semantic HTML
export default function LandingPage() {
  return (
    <>
      <JsonLd />
      <header>...</header>
      <main>
        <section aria-label="Hero">...</section>
        <section aria-labelledby="features-heading">...</section>
      </main>
      <footer>...</footer>
    </>
  );
}
```

## Original CLI Functionality
The original CLI transcription tool is preserved in the `cli/` directory. It accepts audio files, optional context, and generates transcripts and summaries using the same OpenAI services.

## Future Enhancements (Planned)
- Speaker diarization for multi-speaker audio
- Real-time transcription via streaming
- Export to multiple formats (PDF, DOCX, SRT)
- Webhook notifications for completion
- Team collaboration features
- Custom vocabulary and terminology support
- Integration with cloud storage providers (Dropbox, Google Drive)
- Batch file processing UI improvements
- Translation capabilities
- Audio enhancement preprocessing