# Production Deployment Architecture & Setup Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Initial VPS Setup](#initial-vps-setup)
3. [Component Breakdown](#component-breakdown)
4. [Deployment Process](#deployment-process)
5. [Issues Encountered & Solutions](#issues-encountered--solutions)
6. [Future Improvements](#future-improvements)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet (Users)                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTPS (443) / HTTP (80)
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)                           │
│  - SSL Termination (Let's Encrypt)                                  │
│  - Rate Limiting                                                    │
│  - Static Asset Caching                                             │
│  - WebSocket Proxy                                                  │
│  - Path-based Routing                                               │
└──────┬──────────────────────┬──────────────────────┬────────────────┘
       │                      │                      │
   /api, /socket.io           /                 /_next/static
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   API        │      │   Web        │      │   Static     │
│  (NestJS)    │      │  (Next.js)   │      │   Assets     │
│   Port 3001  │      │   Port 3000  │      │  (Cached)    │
└──────┬───────┘      └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    Redis     │      │  Firebase    │      │  AssemblyAI  │
│  (Job Queue) │      │  (Database)  │      │   (External) │
│   Port 6379  │      │   Storage    │      │     API      │
└──────────────┘      └──────────────┘      └──────────────┘
```

## Initial VPS Setup

### 1. Server Selection (Why Hetzner CX32?)
- **CPU**: 4 vCPUs - needed for parallel audio processing
- **RAM**: 8GB - required for FFmpeg operations and multiple Node.js processes
- **Storage**: 160GB NVMe - fast I/O for temporary audio file processing
- **Location**: Europe (low latency for European users)
- **Cost**: ~€16/month - excellent price/performance ratio

### 2. Base System Configuration

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y git curl wget nano ufw fail2ban

# Install Docker (Why Docker?)
# - Consistent environment across dev/prod
# - Easy rollbacks and updates
# - Resource isolation
# - No dependency conflicts
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Node.js (for build processes)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install FFmpeg (Why FFmpeg?)
# - Required for audio file splitting (>25MB files)
# - Handles multiple audio formats
# - Reliable and performant
apt install -y ffmpeg

# Install Nginx (Why Nginx?)
# - Reverse proxy for multiple services
# - SSL termination
# - WebSocket support
# - Static asset caching
# - Rate limiting
apt install -y nginx

# Install Certbot (Why Certbot?)
# - Free SSL certificates from Let's Encrypt
# - Automatic renewal
# - HTTPS is required for WebSocket Secure (WSS)
apt install -y certbot python3-certbot-nginx
```

### 3. Security Configuration

```bash
# Configure firewall (Why UFW?)
# - Simple interface for iptables
# - Prevents unauthorized access
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Configure fail2ban (Why?)
# - Prevents brute force attacks
# - Automatically bans suspicious IPs
systemctl enable fail2ban
systemctl start fail2ban

# Disable root SSH (Why?)
# - Security best practice
# - Use sudo user instead
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
```

## Component Breakdown

### 1. Nginx (Reverse Proxy)
**Purpose**: Single entry point for all traffic

**Why Nginx?**
- **SSL Termination**: Handles HTTPS, containers only deal with HTTP
- **Path-based Routing**: Routes `/api` to backend, `/` to frontend
- **WebSocket Proxy**: Special handling for Socket.io upgrade headers
- **Rate Limiting**: Prevents abuse and DDoS
- **Static Caching**: Improves performance for assets

**Configuration Highlights**:
```nginx
# Upstream definitions (Why?)
# - Docker service names as hostnames
# - Load balancing ready
upstream backend {
    server api:3001;
}

# WebSocket specific (Why?)
location /socket.io {
    proxy_pass http://backend/socket.io;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # Long timeouts for persistent connections
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### 2. Docker Compose Architecture
**Why Docker Compose?**
- **Service Orchestration**: Manages multiple containers as one unit
- **Networking**: Automatic DNS between containers
- **Volume Management**: Persistent data and logs
- **Environment Isolation**: Each service has its own environment

**Network Architecture**:
```yaml
networks:
  transcribe-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```
- **Custom Network**: Isolates containers from other Docker apps
- **Internal DNS**: Services can reach each other by name (e.g., `api`, `redis`)

### 3. Application Services

#### Frontend (Next.js)
**Why Next.js?**
- **SSR/SSG**: Better SEO and initial load performance
- **App Router**: Modern React patterns
- **Built-in Optimizations**: Image optimization, code splitting

**Production Considerations**:
- Build-time environment variables vs runtime
- Static asset optimization
- Locale-based routing

#### Backend (NestJS)
**Why NestJS?**
- **Enterprise Architecture**: Modular, scalable structure
- **TypeScript**: Type safety across the stack
- **Built-in WebSocket Support**: Socket.io integration
- **Dependency Injection**: Clean, testable code

**Key Modules**:
- **Transcription Module**: Handles audio processing
- **WebSocket Gateway**: Real-time updates
- **Firebase Module**: Auth and storage
- **Bull Queue**: Job processing

#### Redis (Job Queue)
**Why Redis?**
- **In-Memory Speed**: Fast job processing
- **Persistence**: AOF for data recovery
- **Bull Queue Compatible**: Robust job processing
- **Memory Efficient**: LRU eviction policy

**Configuration**:
```bash
redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 4. External Services

#### Firebase
**Why Firebase?**
- **Firestore**: NoSQL with real-time capabilities
- **Authentication**: OAuth providers out-of-box
- **Storage**: Managed file storage with CDN
- **No Infrastructure**: Fully managed service

#### AssemblyAI
**Why AssemblyAI?**
- **Speaker Diarization**: Identifies different speakers
- **High Accuracy**: Better than Whisper for conversations
- **Language Detection**: Automatic language identification
- **Fallback to Whisper**: Redundancy for reliability

## Deployment Process

### Initial Deployment
```bash
# 1. Clone repository
cd /opt/transcribe
git clone https://github.com/yourusername/transcribe.git current
cd current

# 2. Create environment file
cp .env.example .env.production
nano .env.production  # Add production values

# 3. Build and start
./scripts/docker-build-prod.sh
docker-compose -f docker-compose.prod.yml up -d

# 4. Setup SSL
certbot --nginx -d neuralsummary.com -d www.neuralsummary.com
```

### Continuous Deployment
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./scripts/deploy-update.sh
```

## Issues Encountered & Solutions

### 1. TypeScript Compilation Errors
**Issue**: Type assertions failing in production build
**Root Cause**: Stricter TypeScript settings in production
**Solution**: Fixed type assertions and null checks
```typescript
// Before
const sections = analysis as AnalysisSections
// After
const sections = analysis as unknown as AnalysisSections
```

### 2. Docker Build Failures
**Issue**: Node modules not found in production containers
**Root Cause**: Monorepo structure - modules installed at root, not in app directories
**Solution**: Copy root node_modules to containers
```dockerfile
# Copy all node_modules from root (monorepo structure)
COPY --from=builder /app/node_modules ./node_modules
```

### 3. Environment Variable Issues
**Issue**: Firebase auth errors - invalid API key
**Root Cause**: Build-time variables not available during Docker build
**Solution**: Copy .env.production into Docker context
```dockerfile
COPY .env.production ./apps/web/.env.production
RUN cd apps/web && npm run build
```

### 4. WebSocket Connection Failures
**Issue**: WebSocket not connecting in production
**Root Cause**: Frontend trying to connect to separate API URL instead of same origin
**Solution**: Detect production by hostname, use relative paths
```typescript
// Detect production by domain
function isProduction(): boolean {
  return window.location.hostname === 'neuralsummary.com';
}

// Use relative paths in production
const socketUrl = isProduction() ? '' : 'http://localhost:3001';
```

### 5. Nginx Rate Limiting
**Issue**: Static assets getting rate-limited (503 errors)
**Root Cause**: Rate limiting applied to all paths
**Solution**: Exclude static assets from rate limiting
```nginx
location ~* ^/_next/static/ {
    proxy_pass http://frontend;
    # No rate limiting for static assets
}
```

### 6. SSL Certificate Path Issues
**Issue**: Nginx failing to start - certificate not found
**Root Cause**: Template had placeholder domain names
**Solution**: Update all references to actual domain
```bash
sed -i 's/yourdomain.com/neuralsummary.com/g' nginx/sites-enabled/transcribe.conf
```

### 7. CORS Configuration
**Issue**: API rejecting frontend requests
**Root Cause**: CORS origin mismatch in production
**Solution**: Use FRONTEND_URL environment variable
```typescript
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL 
  : 'http://localhost:3000';
```

## Future Improvements

### 1. Infrastructure Enhancements
- **Kubernetes Migration**: Better scaling and orchestration
- **CDN Integration**: CloudFlare for global asset delivery
- **Database Replication**: Read replicas for better performance
- **Horizontal Scaling**: Multiple API instances with load balancing

### 2. Monitoring & Observability
- **Prometheus + Grafana**: Metrics and dashboards
- **Sentry Integration**: Error tracking and alerting
- **OpenTelemetry**: Distributed tracing
- **Log Aggregation**: ELK stack or similar

### 3. Performance Optimizations
- **Redis Clustering**: Distributed queue processing
- **Worker Separation**: Dedicated workers for transcription
- **Audio Processing Pipeline**: GPU acceleration for Whisper
- **Database Indexing**: Optimize Firestore queries

### 4. Security Improvements
- **WAF Integration**: Web Application Firewall
- **DDoS Protection**: CloudFlare or similar
- **Secrets Management**: HashiCorp Vault or AWS Secrets Manager
- **Regular Security Audits**: Automated vulnerability scanning

### 5. Development Workflow
- **CI/CD Pipeline**: GitHub Actions for automated deployment
- **Blue-Green Deployment**: Zero-downtime updates
- **Automated Testing**: E2E tests before deployment
- **Infrastructure as Code**: Terraform for reproducible setup

### 6. Cost Optimizations
- **Auto-scaling**: Scale down during low usage
- **Spot Instances**: For non-critical workers
- **Storage Optimization**: Automatic cleanup of old files
- **CDN Caching**: Reduce bandwidth costs

### 7. User Experience
- **Progressive Web App**: Offline capabilities
- **Real-time Collaboration**: Multiple users on same transcription
- **Mobile Apps**: Native iOS/Android apps
- **Batch Processing**: Upload multiple files at once

## Lessons Learned

1. **Monorepo Complexity**: Requires careful Docker configuration
2. **Environment Variables**: Clear separation between build-time and runtime
3. **WebSocket Proxying**: Needs special Nginx configuration
4. **Production Detection**: Can't rely on NODE_ENV in client code
5. **SSL is Critical**: Required for WebSocket Secure connections
6. **Rate Limiting**: Must be selective to avoid blocking legitimate traffic
7. **Docker Networking**: Service names as hostnames simplifies configuration
8. **Error Recovery**: Always implement fallback mechanisms
9. **Logging**: Comprehensive logging essential for debugging production issues
10. **Documentation**: Keep deployment docs updated as issues are resolved

## Conclusion

This deployment architecture provides a robust, scalable foundation for the transcription application. The use of Docker ensures consistency across environments, while Nginx provides efficient request routing and SSL termination. The separation of concerns between services allows for independent scaling and updates.

The key to successful deployment is understanding not just the "how" but the "why" behind each component and configuration choice. This knowledge enables quick troubleshooting and informed decisions when issues arise or requirements change.