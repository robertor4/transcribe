# Production Deployment Guide

## Prerequisites

1. **Server Setup**
   - Ubuntu/Debian server with Docker and Docker Compose installed
   - Git installed
   - Sufficient disk space for Docker images and data

2. **Environment Variables**
   - Ensure `.env` file exists at `/opt/transcribe/.env` with all required variables

## Deployment Methods

### Method 1: Automated Script (Recommended)

From your local development machine:

```bash
./deploy-production.sh
```

This script will:
1. Commit any uncommitted changes (optional)
2. Push to GitHub
3. Pull latest code on server
4. Build Docker images
5. Restart containers
6. Verify deployment

### Method 2: GitHub Actions (CI/CD)

Simply push to the `main` branch:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

GitHub Actions will automatically deploy to production.

**Setup required** (one-time):
1. Add `SSH_PRIVATE_KEY` secret in GitHub repository settings
2. Ensure server has Git repository initialized

### Method 3: Manual Deployment

SSH to server and run:

```bash
ssh root@94.130.27.115
cd /opt/transcribe

# Pull latest code
git pull origin main

# Build and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker ps
docker logs transcribe-api
docker logs transcribe-web
```

## Docker Build Optimization

The API Dockerfile uses a multi-stage build with proper dependency management:

1. **Build stage**: Installs all dependencies and builds the application
2. **Production stage**: Installs only production dependencies for smaller image size

Key features:
- Uses `npm ci --workspace=apps/api` for proper monorepo dependency resolution
- Separates build-time and runtime dependencies
- Includes all necessary shared packages

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker logs transcribe-api
docker logs transcribe-web
```

### Missing Dependencies

The Dockerfile now properly handles monorepo dependencies:
- Installs workspace-specific dependencies
- Includes shared packages
- Uses production-only dependencies in final image

### Port Conflicts

Check if ports are in use:
```bash
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :6379  # Redis
```

### Database Connection Issues

Verify Firebase credentials in `.env`:
```bash
# On server
cat /opt/transcribe/.env | grep FIREBASE
```

## Health Checks

After deployment, verify:

1. **API Health**:
   ```bash
   curl https://neuralsummary.com/api/health
   ```

2. **Frontend**:
   ```bash
   curl https://neuralsummary.com
   ```

3. **Container Status**:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```

## Rollback

If deployment fails:

```bash
# On server
cd /opt/transcribe

# Revert to previous commit
git reset --hard HEAD^

# Rebuild with previous code
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Security Notes

1. **Never commit `.env` files** to Git
2. **Use GitHub Secrets** for sensitive data in CI/CD
3. **Regularly update** Docker images and dependencies
4. **Monitor logs** for suspicious activity

## Monitoring

Check application logs regularly:

```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f transcribe-api
docker logs -f transcribe-web
docker logs -f transcribe-redis
```

## Backup

Regular backups recommended for:
- Firebase Firestore data
- Firebase Storage files
- Server configuration files
- Environment variables