# Redis Troubleshooting Guide

This guide helps diagnose and fix Redis connectivity issues in production deployments.

## Quick Diagnosis

Run the diagnostic script on the production server:

```bash
ssh root@<server> 'bash -s' < scripts/diagnose-redis.sh
```

This will provide a comprehensive report on Redis container status, connectivity, and logs.

## Common Issues

### 1. Redis Container Not Running

**Symptoms:**
- Health check shows: "Container is exited" or "not found"
- Docker ps shows container is stopped

**Solution:**
```bash
# On production server
cd /opt/transcribe
docker-compose -f docker-compose.prod.yml up -d redis
docker logs transcribe-redis
```

**Root Causes:**
- Container crashed due to OOM (Out of Memory)
- Docker daemon restarted
- Manual stop without restart
- Docker compose configuration error

### 2. Redis Not Responding to PING

**Symptoms:**
- Container is running but `redis-cli ping` times out or fails
- Health check shows: "Container running but not responding"

**Solution:**
```bash
# Check if Redis process is running inside container
docker exec transcribe-redis ps aux | grep redis

# Check Redis logs for errors
docker logs --tail 50 transcribe-redis

# Restart Redis container
docker-compose -f docker-compose.prod.yml restart redis
```

**Root Causes:**
- Redis process crashed but container is still running
- Redis is stuck in a long-running operation
- Memory exhaustion
- Corrupted data files

### 3. Network Connectivity Issues

**Symptoms:**
- API cannot connect to Redis
- Bull queue jobs fail to process
- Connection timeouts in API logs

**Solution:**
```bash
# Check network connectivity from API container
docker exec transcribe-api nc -zv transcribe-redis 6379

# Verify both containers are on the same network
docker network inspect transcribe_app-network

# Check Redis is listening on correct port
docker exec transcribe-redis netstat -tlnp | grep 6379
```

**Root Causes:**
- Containers on different networks
- Firewall rules blocking internal traffic
- Redis configured to listen on wrong interface

### 4. Redis Memory Issues

**Symptoms:**
- Container keeps crashing and restarting
- OOMKilled in container status
- Slow performance

**Solution:**
```bash
# Check memory usage
docker stats transcribe-redis --no-stream

# Check Redis memory info
docker exec transcribe-redis redis-cli INFO memory

# Check configured memory limit
docker inspect transcribe-redis | grep -i memory
```

**Root Causes:**
- Maxmemory setting too low
- Memory leak in Redis
- Too many keys stored
- Container memory limit too restrictive

## Health Check Improvements

The deployment workflow now includes enhanced health checks that:

1. **Check container status** before testing connectivity
2. **Use timeout** to prevent hanging on unresponsive Redis
3. **Show detailed logs** when health check fails
4. **Verify Docker health status** in addition to ping test

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml#L185-L210) for the implementation.

## Manual Health Check Commands

Run these commands on the production server to manually verify Redis health:

```bash
# Check container status
docker ps | grep transcribe-redis

# Check container health (Docker built-in)
docker inspect transcribe-redis --format='{{.State.Health.Status}}'

# Test Redis connectivity
docker exec transcribe-redis redis-cli ping

# Check Redis info
docker exec transcribe-redis redis-cli INFO server

# View recent logs
docker logs --tail 50 transcribe-redis

# Check memory usage
docker exec transcribe-redis redis-cli INFO memory | grep used_memory_human
```

## Configuration Reference

### Docker Compose Configuration

The Redis service is configured in [docker-compose.prod.yml](../docker-compose.prod.yml#L50-L66):

- **Image:** `redis:7-alpine`
- **Container name:** `transcribe-redis`
- **Port:** 6379 (internal network only, not exposed to host)
- **Healthcheck:** Runs `redis-cli ping` every 30 seconds
- **Restart policy:** `unless-stopped`
- **Network:** `app-network` (shared with API container)

### Environment Variables

API container connects to Redis using:

```bash
REDIS_HOST=transcribe-redis  # Docker service name
REDIS_PORT=6379
```

These are defined in `.env.production` on the server.

## Emergency Recovery

If Redis is completely broken and needs to be rebuilt:

```bash
# On production server
cd /opt/transcribe

# Stop and remove Redis container
docker-compose -f docker-compose.prod.yml stop redis
docker-compose -f docker-compose.prod.yml rm -f redis

# Remove Redis data volume (WARNING: This deletes all queue data)
docker volume rm transcribe_redis-data

# Recreate Redis from scratch
docker-compose -f docker-compose.prod.yml up -d redis

# Verify it's working
docker logs transcribe-redis
docker exec transcribe-redis redis-cli ping
```

**Note:** This will clear all Bull queue jobs. In-progress transcriptions will need to be resubmitted by users.

## Monitoring Best Practices

### Logs to Watch

```bash
# Real-time Redis logs
docker logs -f transcribe-redis

# Filter for errors
docker logs transcribe-redis 2>&1 | grep -i error

# Check for connection issues
docker logs transcribe-api 2>&1 | grep -i redis
```

### Key Metrics

Monitor these Redis metrics in production:

- **Memory usage:** Should stay below 80% of configured limit
- **Connected clients:** Should match number of API instances
- **Commands processed:** Should correlate with API activity
- **Keyspace:** Number of keys should be reasonable (not millions)

```bash
# Get all important metrics
docker exec transcribe-redis redis-cli INFO stats
docker exec transcribe-redis redis-cli INFO clients
docker exec transcribe-redis redis-cli DBSIZE
```

## Related Documentation

- [WebSocket Resilience](./WEBSOCKET_RESILIENCE.md) - Queue system depends on Redis
- [Deployment Guide](../CLAUDE.md#deployment) - Full deployment procedures
- [Docker Compose Config](../docker-compose.prod.yml) - Container definitions
