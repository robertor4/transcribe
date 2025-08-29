# Production Deployment Guide

## Overview

Neural Summary uses Docker containers orchestrated with Docker Compose, with Traefik as the reverse proxy handling SSL certificates automatically via Let's Encrypt. The deployment is managed through Git, ensuring consistent and reproducible deployments.

## Architecture

```
Internet → Traefik (443/80) → Docker Network → Services
                ↓                      ↓
         SSL via Let's Encrypt    ├── Web (Next.js) :3000
                                  ├── API (NestJS) :3001
                                  └── Redis :6379
```

## Prerequisites

### Server Requirements
- Ubuntu/Debian server (tested on Ubuntu 24.04)
- Minimum 2GB RAM, 20GB disk space
- Docker and Docker Compose installed
- Git installed
- Ports 80, 443, and 22 (SSH) open

### Local Requirements
- SSH access to server (root@94.130.27.115)
- Git repository access (https://github.com/robertor4/transcribe.git)

## Initial Server Setup

### 1. Prepare the Server

```bash
# SSH to server
ssh root@94.130.27.115

# Clone repository
cd /opt
git clone https://github.com/robertor4/transcribe.git transcribe
cd transcribe

# Create production environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

### 2. Environment Configuration

The `.env.production` file must contain:

```env
# Core Services
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-hex-32>
PORT=3001

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app

# API Keys
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...

# Email Service (Gmail with App Password)
GMAIL_AUTH_USER=your-gmail@gmail.com
GMAIL_FROM_EMAIL=noreply@neuralsummary.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Frontend Configuration
FRONTEND_URL=https://neuralsummary.com

# Firebase Client SDK (for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API URL (keep as /api for production)
NEXT_PUBLIC_API_URL=/api
```

## Deployment Commands

### Standard Deployment (Full Rebuild)

```bash
./deploy.sh
```

This will:
1. Check for uncommitted changes
2. Push to GitHub
3. Pull latest code on server
4. Build all Docker images
5. Deploy with zero downtime
6. Run health checks

### Quick Deployment (Code Changes Only)

```bash
./deploy.sh --quick
```

Perfect for:
- Frontend text/style changes
- Backend logic updates
- Configuration changes
- No dependency changes

### Service-Specific Updates

```bash
# Update only web frontend
./deploy.sh --service web

# Update only API backend
./deploy.sh --service api

# Update multiple services
./deploy.sh --service api,web
```

### Skip Docker Build

```bash
# Deploy without rebuilding images
./deploy.sh --no-build
```

### Help & Options

```bash
./deploy.sh --help
```

## Post-Deployment Verification

### 1. Check Service Health

The deployment script automatically runs health checks, but you can verify manually:

```bash
# Check all containers
ssh root@94.130.27.115 "docker ps | grep transcribe"

# Check specific service logs
ssh root@94.130.27.115 "docker logs -f transcribe-api"
ssh root@94.130.27.115 "docker logs -f transcribe-web"
```

### 2. Verify Site Access

1. Visit https://neuralsummary.com
2. Check SSL certificate (should show Let's Encrypt)
3. Test key features:
   - User registration/login
   - File upload
   - Transcription processing
   - WebSocket real-time updates

### 3. Monitor Logs

```bash
# View all logs
ssh root@94.130.27.115 "cd /opt/transcribe && docker-compose -f docker-compose.prod.yml logs -f"

# View specific service
ssh root@94.130.27.115 "docker logs --tail 100 transcribe-api"
```

## Troubleshooting

### Container Issues

```bash
# Container won't start
docker logs transcribe-[service]

# Restart specific service
docker-compose -f docker-compose.prod.yml restart [service]

# Rebuild specific service
docker-compose -f docker-compose.prod.yml up -d --build [service]
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker logs transcribe-traefik | grep -i cert

# Verify DNS
nslookup neuralsummary.com

# Check certificate
curl -I https://neuralsummary.com
```

### WebSocket Connection Issues

WebSockets are routed through Traefik at `/api/socket.io`. If issues occur:

1. Check API container: `docker logs transcribe-api | grep -i websocket`
2. Verify Traefik labels in docker-compose.prod.yml
3. Check browser console for connection errors

### Database/Storage Issues

```bash
# Check Redis
docker exec transcribe-redis redis-cli ping

# Monitor Redis
docker exec transcribe-redis redis-cli monitor

# Check Firebase connection
docker logs transcribe-api | grep -i firebase
```

## Rollback Procedure

The deployment script tracks commits for easy rollback:

### Quick Rollback

```bash
# The deploy script shows the previous commit after each deployment
# Use it to rollback:
git reset --hard <previous-commit-hash>
./deploy.sh --quick
```

### Manual Rollback

```bash
# On server
ssh root@94.130.27.115
cd /opt/transcribe

# Revert to previous commit
git log --oneline -5  # View recent commits
git reset --hard <commit-hash>

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## Monitoring & Maintenance

### Daily Tasks
- Check error logs: `docker logs transcribe-api | grep ERROR`
- Monitor disk space: `df -h`
- Check memory usage: `docker stats`

### Weekly Tasks
- Review container logs for warnings
- Check for security updates: `npm audit`
- Backup .env.production file
- Clean old Docker images: `docker image prune -a`

### Monthly Tasks
- Update dependencies: `npm update`
- Rotate JWT secrets
- Review Traefik access logs
- Full backup of server configuration

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.production` to Git
   - Use strong, unique passwords
   - Rotate API keys regularly

2. **Server Security**
   - Keep Docker and system packages updated
   - Use SSH keys instead of passwords
   - Configure firewall (ufw) properly
   - Disable root SSH after setting up sudo user

3. **Application Security**
   - Enable rate limiting
   - Monitor for suspicious activity
   - Regular security audits
   - Keep dependencies updated

## Backup Strategy

### Application Data
- Firebase Firestore: Use Firebase Console export
- Firebase Storage: Use Firebase Admin SDK backup scripts
- Redis: Persistent AOF enabled, backup /data volume

### Server Configuration
```bash
# Backup critical files
tar -czf backup-$(date +%Y%m%d).tar.gz \
  /opt/transcribe/.env.production \
  /opt/transcribe/docker-compose.prod.yml
```

## Development vs Production

### Local Testing
For local Docker testing:
```bash
./test-docker-local.sh
```

### Key Differences
- Production uses Traefik for SSL and routing
- Production uses optimized Docker builds
- Production has stricter security headers
- Production uses `/api` prefix for all API calls

## Support & Debugging

### Common Issues

**Q: Deployment succeeds but site shows 502 Bad Gateway**
- A: Containers are still starting. Wait 30 seconds and refresh.

**Q: WebSocket connections failing**
- A: Check if API container is healthy and Traefik labels are correct.

**Q: File uploads failing**
- A: Verify Firebase Storage bucket configuration and credentials.

### Debug Commands

```bash
# Check environment variables in container
docker exec transcribe-api env | grep FIREBASE

# Test API endpoint
curl https://neuralsummary.com/api/health

# Check disk usage
docker system df

# View Traefik routing
docker exec transcribe-traefik cat /etc/traefik/traefik.yml
```

### Getting Help

1. Check container logs first
2. Verify environment variables
3. Ensure all services are running
4. Review recent commits for breaking changes

## Additional Scripts

### Email Debugging
```bash
./scripts/debug/email.sh
```

### Local Docker Testing
```bash
./test-docker-local.sh
```

---

**Last Updated**: December 2024
**Deployment Server**: 94.130.27.115
**Production URL**: https://neuralsummary.com