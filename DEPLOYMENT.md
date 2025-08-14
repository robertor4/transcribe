# Deployment Guide for Hetzner VPS

This guide explains how to deploy the Transcribe application to a Hetzner VPS.

## Prerequisites

- A Hetzner VPS with Ubuntu 22.04 or 24.04
- A domain name pointing to your VPS IP address
- SSH access to your VPS
- All required API keys (OpenAI, Firebase, AssemblyAI, etc.)

## Quick Start

### 1. Initial VPS Setup

SSH into your VPS and run the setup script:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/transcribe/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh yourdomain.com your-email@example.com
```

This script will:
- Install Docker, Docker Compose, Node.js, FFmpeg, and Nginx
- Configure firewall and fail2ban for security
- Obtain SSL certificates from Let's Encrypt
- Set up automatic SSL renewal
- Configure system optimizations
- Create backup scripts

### 2. Configure Environment

After the setup script completes:

```bash
cd /opt/transcribe
nano .env.production
```

Fill in all the required values from `.env.production.example`:
- OpenAI API key
- Firebase credentials (both Admin SDK and Client SDK)
- AssemblyAI API key
- JWT secret
- Domain URLs

### 3. Deploy the Application

Clone your repository and deploy:

```bash
cd /opt/transcribe
git clone https://github.com/yourusername/transcribe.git current
cd current

# Update Nginx config with your domain
sed -i "s/yourdomain.com/your-actual-domain.com/g" nginx/sites-enabled/transcribe.conf

# Deploy using the script
./scripts/deploy.sh production
```

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Build Docker Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### 2. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Check Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## GitHub Actions Deployment

### 1. Set Up Secrets

In your GitHub repository settings, add these secrets:

- `SERVER_HOST`: Your VPS IP address or domain
- `SERVER_USER`: SSH username (usually `root` or deployment user)
- `SERVER_SSH_KEY`: Private SSH key for authentication
- `SERVER_PORT`: SSH port (default: 22)
- `DOMAIN_NAME`: Your domain name

### 2. Trigger Deployment

Deployments are triggered automatically when you push to the `main` branch, or manually via GitHub Actions.

## Service Management

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Update Application

```bash
cd /opt/transcribe/current
git pull origin main
./scripts/deploy.sh production
```

## Monitoring and Maintenance

### Health Checks

- Frontend: `https://yourdomain.com`
- API: `https://yourdomain.com/api/health`
- Redis: `docker exec transcribe-redis redis-cli ping`

### Backups

Automatic backups run daily at 2 AM. Manual backup:

```bash
/opt/transcribe/backup.sh
```

Backups are stored in `/backups/transcribe/`

### SSL Certificate Renewal

Certificates auto-renew via systemd timer. Check status:

```bash
systemctl status certbot-renewal.timer
sudo certbot renew --dry-run
```

### System Monitoring

If Netdata was installed:
- Access at: `http://yourdomain.com:19999`

Check system resources:

```bash
htop
docker stats
df -h
free -h
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs web

# Check environment file
cat .env.production

# Rebuild containers
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Redis Connection Issues

```bash
# Check Redis status
docker exec transcribe-redis redis-cli ping

# Check Redis logs
docker logs transcribe-redis

# Restart Redis
docker-compose -f docker-compose.prod.yml restart redis
```

### Nginx Issues

```bash
# Check Nginx configuration
docker exec transcribe-nginx nginx -t

# Reload Nginx
docker exec transcribe-nginx nginx -s reload

# Check Nginx logs
docker logs transcribe-nginx
```

### Port Conflicts

```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
sudo lsof -i :3001

# Stop conflicting services
sudo systemctl stop nginx  # If system nginx is running
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a
docker volume prune

# Clean up logs
truncate -s 0 /opt/transcribe/logs/*.log
```

## Security Considerations

1. **Firewall**: Only ports 22, 80, and 443 are open
2. **Fail2ban**: Protects against brute force attacks
3. **SSL**: All traffic is encrypted with Let's Encrypt certificates
4. **Environment Variables**: Sensitive data is kept in `.env.production`
5. **Docker Networks**: Services communicate via internal Docker network
6. **Rate Limiting**: Nginx limits requests to prevent abuse

## Performance Optimization

1. **Redis Memory**: Limited to 256MB with LRU eviction
2. **Nginx Caching**: Static assets cached for 1 year
3. **Gzip Compression**: Enabled for all text content
4. **Docker Logging**: Limited to 10MB per container with rotation
5. **Swap Space**: 2GB swap configured for memory overflow

## Scaling Considerations

For high traffic:

1. **Horizontal Scaling**: Deploy multiple API instances behind a load balancer
2. **Redis Cluster**: Use Redis Cluster for distributed caching
3. **CDN**: Use Cloudflare or similar for static assets
4. **Database**: Consider managed Firebase for better performance
5. **Monitoring**: Implement APM with New Relic or Datadog

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check the main README.md
4. Open an issue on GitHub