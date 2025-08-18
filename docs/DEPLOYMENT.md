# Production Deployment Guide

## Overview

This application uses **Traefik** as a reverse proxy with automatic SSL certificate management from Let's Encrypt. All services run in Docker containers for consistency and easy deployment.

## Architecture

```
Internet → Traefik (80/443) → Docker Services
              ↓
    - Automatic SSL via Let's Encrypt
    - Service discovery via Docker labels
    - Health checks and load balancing
```

## Prerequisites

- Ubuntu/Debian server (tested on Ubuntu 24.04)
- Docker and Docker Compose installed
- Domain pointing to server IP
- Ports 80 and 443 open

## Quick Deployment

### 1. Configure Server IP

Edit `scripts/deploy.sh` and set your server IP:
```bash
SERVER_IP="YOUR_SERVER_IP"  # Replace with actual IP
```

### 2. Set Environment Variables

Create `.env.production` with your production values:
```env
# Traefik
ACME_EMAIL=admin@yourdomain.com

# API Keys
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...
JWT_SECRET=...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=...
FIREBASE_STORAGE_BUCKET=...

# Frontend URLs
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Deploy

```bash
# Deploy to server
./scripts/deploy.sh
```

## Files Structure

```
.
├── docker-compose.prod.yml    # Production Docker Compose with Traefik
├── docker-compose.dev.yml     # Local development setup
├── scripts/
│   └── deploy.sh              # Main deployment script
└── .env.production            # Production environment variables
```

## Docker Services

### Traefik (Reverse Proxy)
- Handles all incoming HTTP/HTTPS traffic
- Automatically obtains SSL certificates
- Routes requests based on domain and path
- Port 8080: Dashboard (disable in production)

### Web (Next.js Frontend)
- Serves the web application
- Routes: All paths except `/api/*`
- Automatic locale detection and routing

### API (NestJS Backend)
- Handles all API requests
- Routes: `/api/*` paths
- WebSocket support for real-time updates

### Redis (Queue & Cache)
- Job queue for audio processing
- Session storage
- Persistent with AOF enabled

## Common Commands

### Deploy/Update
```bash
# Full deployment
./scripts/deploy.sh

# Update existing deployment
ssh root@SERVER_IP "cd /opt/transcribe && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
```

### Monitor Services
```bash
# Check service status
ssh root@SERVER_IP "docker ps"

# View logs
ssh root@SERVER_IP "docker logs transcribe-traefik -f"
ssh root@SERVER_IP "docker logs transcribe-api -f"
ssh root@SERVER_IP "docker logs transcribe-web -f"

# Check health
ssh root@SERVER_IP "curl https://yourdomain.com/api/health"
```

### Manage Services
```bash
# Restart a service
ssh root@SERVER_IP "docker-compose -f docker-compose.prod.yml restart api"

# Stop all services
ssh root@SERVER_IP "docker-compose -f docker-compose.prod.yml down"

# Start all services
ssh root@SERVER_IP "docker-compose -f docker-compose.prod.yml up -d"
```

## Troubleshooting

### SSL Certificate Issues
If certificates aren't generating:
1. Verify DNS points to server: `nslookup yourdomain.com`
2. Check Traefik logs: `docker logs transcribe-traefik`
3. Ensure ports 80/443 are open: `ufw status`

### Service Not Accessible
1. Check container health: `docker ps`
2. Verify Traefik routing: Access http://SERVER_IP:8080 (if dashboard enabled)
3. Check service logs for errors

### API Routes Not Working
1. Ensure health checks pass: `docker ps` (should show "healthy")
2. Check API logs: `docker logs transcribe-api`
3. Verify labels in docker-compose.prod.yml

## Security Notes

1. **Disable Traefik Dashboard**: Remove port 8080 and dashboard flags in production
2. **Use Strong Passwords**: Generate secure JWT_SECRET with `openssl rand -hex 32`
3. **Keep Secrets Safe**: Never commit `.env.production` to Git
4. **Regular Updates**: Keep Docker images updated
5. **Firewall**: Only allow ports 22, 80, 443

## Backup

```bash
# Backup Redis data
docker run --rm -v transcribe_redis-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup Traefik certificates
docker run --rm -v transcribe_traefik-certificates:/certs -v $(pwd):/backup alpine \
  tar czf /backup/certs-backup-$(date +%Y%m%d).tar.gz -C /certs .
```

## Updating Domain

To change the domain:
1. Update `Host` rules in `docker-compose.prod.yml`
2. Update `NEXT_PUBLIC_APP_URL` in `.env.production`
3. Update `ACME_EMAIL` if needed
4. Redeploy: `./scripts/deploy.sh`

## Support

For issues:
1. Check container logs
2. Verify environment variables
3. Ensure all services are healthy
4. Check Traefik dashboard (if enabled) for routing information