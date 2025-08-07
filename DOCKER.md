# Docker Setup for Transcribe Application

## Overview
The application now includes Docker support for both development and production environments, with ffmpeg built into the containers for audio processing.

## Prerequisites
- Docker Desktop installed
- Docker Compose installed

## Quick Start

### Development with Docker
```bash
# Start development environment with hot reload
npm run dev:docker

# Or build and start manually
docker-compose -f docker-compose.dev.yml up --build
```

### Production with Docker
```bash
# Build and start all services
npm run docker:build
npm run docker:up

# Or using docker-compose directly
docker-compose up -d --build

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## Architecture

### Services
1. **Redis**: Message queue for job processing
2. **API**: NestJS backend with ffmpeg for audio processing
3. **Web**: Next.js frontend application

### Key Features
- **FFmpeg Built-in**: Each API container includes ffmpeg for audio splitting
- **Audio Splitting**: Automatically splits files >25MB into chunks for Whisper API
- **Volume Mounts**: Temp directory for audio processing is mounted as volume
- **Health Checks**: All services include health check endpoints
- **Networking**: Services communicate via Docker network

## File Processing Flow
1. Large audio files (>25MB) are automatically detected
2. Files are split into 10-minute chunks using ffmpeg
3. Each chunk is processed separately through Whisper API
4. Transcriptions are merged back together
5. Temporary files are cleaned up

## Docker Commands

### Development
```bash
# Start dev environment
npm run dev:docker

# Rebuild dev containers
npm run dev:docker:build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop dev environment
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Build production images
npm run docker:build

# Start production services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Remove volumes (clean slate)
docker-compose down -v
```

## Environment Variables
Ensure your `.env` and `apps/web/.env.local` files are configured before running Docker containers.

## Troubleshooting

### FFmpeg Not Found
The Docker containers include ffmpeg by default. If you see ffmpeg errors:
1. Rebuild the containers: `docker-compose build --no-cache`
2. Check container logs: `docker logs transcribe-api`

### Port Conflicts
If ports are already in use:
1. Stop local services using ports 3000, 3001, or 6379
2. Or modify port mappings in docker-compose.yml

### File Size Limits
- Maximum file size: 500MB (configurable)
- Files >25MB are automatically split
- Each chunk: ~10 minutes of audio

## Benefits of Docker Setup
1. **Consistency**: Same environment across all developers
2. **FFmpeg Included**: No need to install ffmpeg locally
3. **Isolation**: Services run in isolated containers
4. **Easy Setup**: Single command to start everything
5. **Production Ready**: Same Docker images for dev and prod