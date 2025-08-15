# Deployment Instructions for neuralsummary.com

## Quick Deploy (For Updates)

SSH into your server and run:

```bash
cd /opt/transcribe/current
git pull origin main
./scripts/deploy-update.sh
```

## Complete Step-by-Step Deployment

### 1. SSH into your VPS

```bash
ssh root@neuralsummary.com
```

### 2. Navigate to the project directory

```bash
cd /opt/transcribe/current
```

### 3. Pull the latest changes

```bash
git pull origin main
```

### 4. Ensure .env.production exists

The `.env.production` file should already be on your server. If not, create it:

```bash
nano .env.production
```

Add all required environment variables (see `.env.example` for reference).

### 5. Stop current containers (if running)

```bash
docker-compose -f docker-compose.prod.yml down
```

### 6. Build and start the services

```bash
# Build images
./scripts/docker-build-prod.sh

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### 7. Verify deployment

Check that all services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Expected output:
- transcribe-redis: Up
- transcribe-api: Up  
- transcribe-web: Up
- transcribe-nginx: Up

### 8. Test WebSocket connectivity

Check if the API container can be reached from Nginx:

```bash
docker-compose -f docker-compose.prod.yml exec nginx wget -qO- http://api:3001/health
```

Should return: `{"status":"ok"}`

### 9. Monitor logs

Watch logs in real-time:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Or check specific service logs:

```bash
# API logs
docker-compose -f docker-compose.prod.yml logs --tail=50 api

# Nginx logs  
docker-compose -f docker-compose.prod.yml logs --tail=50 nginx

# Web logs
docker-compose -f docker-compose.prod.yml logs --tail=50 web
```

## Troubleshooting

### WebSocket not connecting

1. Check CORS configuration in API logs:
```bash
docker-compose -f docker-compose.prod.yml logs api | grep "CORS enabled"
```

2. Verify FRONTEND_URL is set correctly:
```bash
docker-compose -f docker-compose.prod.yml exec api printenv | grep FRONTEND_URL
```

Should show: `FRONTEND_URL=https://neuralsummary.com`

3. Test WebSocket endpoint directly:
```bash
curl -I https://neuralsummary.com/socket.io/
```

### Services not starting

1. Check Docker disk space:
```bash
df -h
docker system df
```

2. Clean up if needed:
```bash
docker system prune -a --volumes
```

3. Check Redis memory:
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO memory
```

### SSL Certificate issues

The SSL certificates should already be set up. If you need to renew:

```bash
certbot renew --nginx
```

### Port conflicts

Check what's using ports:
```bash
lsof -i :80
lsof -i :443
lsof -i :3000
lsof -i :3001
```

## Testing the Application

1. **Visit the website**: https://neuralsummary.com

2. **Test authentication**:
   - Sign up with email/password
   - Sign in with Google

3. **Test transcription**:
   - Upload an audio file
   - Watch for real-time progress updates
   - Verify transcription completes

4. **Check WebSocket in browser**:
   - Open Developer Console (F12)
   - Go to Network tab
   - Filter by WS (WebSocket)
   - Should see socket.io connection with status 101

## Maintenance Commands

### View running containers
```bash
docker ps
```

### Restart a specific service
```bash
docker-compose -f docker-compose.prod.yml restart api
```

### Update a single service
```bash
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api
```

### Backup database (Firestore)
Firestore is managed by Firebase, backups are automatic.

### Check Redis data
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli
> KEYS *
> INFO
```

### Clear Redis cache
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

## Important Notes

1. **Never commit .env.production** - It contains secrets and is gitignored
2. **Always test locally first** - Use `npm run dev` locally before deploying
3. **Monitor logs after deployment** - Watch for errors in the first few minutes
4. **WebSocket requires sticky sessions** - Single server setup handles this automatically

## Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set
3. Ensure Firebase services are configured correctly
4. Check that neuralsummary.com is in Firebase authorized domains