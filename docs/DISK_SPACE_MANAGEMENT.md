# Disk Space Management Guide

## Emergency: Out of Disk Space

If deployment fails with `ENOSPC: no space left on device`, follow these steps immediately:

### Quick Fix (Run on Production Server)

```bash
# SSH into server
ssh root@<your-server>

# Quick cleanup command (safe - removes unused Docker resources)
docker system prune -af --volumes && npm cache clean --force

# Or use our cleanup script
cd /opt/transcribe
git pull origin main
bash scripts/cleanup-docker.sh
```

This will remove:
- Stopped containers
- Dangling images
- Unused networks
- Build cache
- NPM cache

### Check Disk Space Before Cleanup

```bash
ssh root@<server> 'bash -s' < scripts/check-disk-space.sh
```

This diagnostic script shows:
- Overall disk usage
- Docker disk usage breakdown
- Largest directories
- Docker images and containers
- Removable resources
- NPM cache size

## Understanding Docker Disk Usage

Docker can accumulate significant disk space over time due to:

### 1. Build Cache
Every `docker build` creates layers that are cached. Over multiple deployments, this adds up.

**Impact:** Can use several GB
**Solution:** Clean with `docker builder prune -f`

### 2. Dangling Images
Intermediate images from builds that are no longer tagged.

**Impact:** 1-5 GB typically
**Solution:** Remove with `docker image prune -f`

### 3. Old Images
Previous versions of your application images that are no longer needed.

**Impact:** Each image ~500MB-1GB, multiply by number of versions
**Solution:** Remove with `docker image prune -a -f --filter "until=720h"`

### 4. Stopped Containers
Containers that have exited but not been removed.

**Impact:** Usually small, but can add up
**Solution:** Remove with `docker container prune -f`

### 5. Unused Volumes
Docker volumes that are no longer attached to any container.

**Impact:** Varies, can be large if transcription data was stored here
**Solution:** Remove with `docker volume prune -f` (CAUTION: May delete data)

### 6. NPM Cache
Node.js package cache used during Docker builds.

**Impact:** 500MB - 2GB
**Solution:** Clean with `npm cache clean --force`

## Regular Maintenance

### Weekly Cleanup (Automated)

Add this to server crontab for automatic weekly cleanup:

```bash
# Edit crontab
crontab -e

# Add this line (runs every Sunday at 2 AM)
0 2 * * 0 cd /opt/transcribe && docker system prune -f && docker builder prune -f
```

### Monthly Deep Clean

Run the full cleanup script monthly:

```bash
cd /opt/transcribe
bash scripts/cleanup-docker.sh
```

### Monitoring Disk Space

Set up alerts when disk usage exceeds 80%:

```bash
# Add to crontab (checks daily at 6 AM)
0 6 * * * df / | tail -1 | awk '{if ($5+0 > 80) print "Disk usage high: " $5}' | mail -s "Disk Space Alert" your@email.com
```

## Deployment Best Practices

### Optimize Docker Builds

The deployment workflow uses `--no-cache` which prevents layer reuse but ensures clean builds. This is a trade-off:

**Current approach:** `docker-compose build --no-cache`
- ✅ Always fresh, no stale dependencies
- ❌ Uses more disk space
- ❌ Slower builds

**Alternative approach:** Remove `--no-cache` flag
- ✅ Faster builds
- ✅ Less disk usage
- ❌ May use stale dependencies

To switch to cached builds, modify [.github/workflows/deploy.yml](.github/workflows/deploy.yml#L160):

```yaml
# Change from:
docker-compose -f $COMPOSE_FILE build --no-cache

# To:
docker-compose -f $COMPOSE_FILE build
```

### Multi-stage Build Optimization

Your Dockerfiles use multi-stage builds which already help minimize image size:
- Build stage: Installs all dependencies
- Production stage: Only includes production dependencies

See [apps/api/Dockerfile](../apps/api/Dockerfile) and [apps/web/Dockerfile](../apps/web/Dockerfile)

## Disk Space Requirements

### Minimum Recommendations

For production deployment:
- **Minimum:** 20GB free space
- **Recommended:** 40GB free space
- **Comfortable:** 60GB+ free space

### Current Usage Breakdown (Typical)

```
Docker Images:          5-8 GB
Docker Containers:      500 MB
Docker Volumes:         1-2 GB (Redis data)
Build Cache:            3-5 GB
Application Code:       500 MB
NPM Cache:              1-2 GB
System/Other:           5 GB
-------------------------
Total:                  ~18-23 GB
```

## Troubleshooting Specific Errors

### ENOSPC During npm ci

**Error:** `npm warn tar TAR_ENTRY_ERROR ENOSPC: no space left on device`

**Cause:** Not enough disk space during npm install in Docker build

**Solution:**
1. Clean Docker build cache: `docker builder prune -af`
2. Remove old images: `docker image prune -af`
3. Clean npm cache: `npm cache clean --force`
4. Run cleanup script: `bash scripts/cleanup-docker.sh`

### Build Fails After Multiple Deployments

**Error:** Build succeeds locally but fails on server

**Cause:** Server accumulated build artifacts over multiple deployments

**Solution:**
1. Run full cleanup: `docker system prune -af`
2. Remove all build cache: `docker builder prune -af`
3. Redeploy with clean state

### Disk Full Despite Cleanup

**Symptoms:** Cleanup scripts show disk still >90% full

**Investigation:**
```bash
# Find largest directories
du -h --max-depth=2 /opt | sort -hr | head -20

# Check for large log files
find /var/log -type f -size +100M

# Check for large application logs
find /opt/transcribe -type f -size +100M
```

**Solutions:**
- Rotate/compress old logs
- Clear application-specific caches
- Consider server storage upgrade

## Server Upgrade Considerations

If cleanup is not sufficient, consider upgrading server storage:

### Signs You Need More Storage
- Cleanup only frees <10% of disk
- Running cleanup weekly or more often
- Deployments frequently fail with ENOSPC
- Planning to add more services

### Recommended Storage Tiers
- **Basic:** 40GB SSD (current minimum)
- **Standard:** 80GB SSD (recommended for production)
- **Enterprise:** 160GB+ SSD (for high-volume deployments)

## Automated Monitoring

Add this to your server for proactive monitoring:

```bash
#!/bin/bash
# /opt/transcribe/scripts/monitor-disk.sh

THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "ALERT: Disk usage at ${USAGE}%"

    # Auto-cleanup if usage is critical
    if [ "$USAGE" -gt 90 ]; then
        echo "Running emergency cleanup..."
        cd /opt/transcribe
        docker system prune -f
        docker builder prune -f
    fi
fi
```

Add to crontab:
```bash
*/30 * * * * /opt/transcribe/scripts/monitor-disk.sh
```

## Related Documentation

- [Deployment Guide](../CLAUDE.md#deployment) - Full deployment procedures
- [Docker Compose Config](../docker-compose.prod.yml) - Container definitions
- [Redis Troubleshooting](./REDIS_TROUBLESHOOTING.md) - Redis-specific issues
