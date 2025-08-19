# Production Deployment Guide

## Prerequisites
- Ubuntu/Debian server with Docker and Docker Compose installed
- Domain name pointed to server IP (neuralsummary.com)
- SSH access to production server
- Firebase project with Analytics enabled

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure `.env.production` contains all required values:

```bash
# Critical for Analytics
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Get this from Firebase Console:
# 1. Go to Firebase Console > Project Settings
# 2. Scroll to "Your apps" section
# 3. Find your Web app
# 4. Copy the measurementId value
```

### 2. Firebase Analytics Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Analytics > Dashboard
4. If not enabled, click "Enable Google Analytics"
5. Choose or create a Google Analytics account
6. Copy the Measurement ID (G-XXXXXXXXXX)

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

On your production server:

```bash
# 1. Clone the repository (if not already done)
git clone https://github.com/robertor4/transcribe.git
cd transcribe

# 2. Create .env.production from example
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 3. Run deployment script
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Build packages
npm run build:shared
npm run build

# 4. Build and start Docker containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 5. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Post-Deployment Verification

### 1. Check Service Health
```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### 2. Verify Analytics Integration
1. Visit https://neuralsummary.com
2. Open browser DevTools > Network tab
3. Filter by "google-analytics" or "gtag"
4. Verify analytics requests are being sent
5. Check for cookie consent banner appearance

### 3. Firebase Console Verification
1. Go to Firebase Console > Analytics > DebugView
2. Enable debug mode on your device:
   - Browser console: `localStorage.setItem('analytics_consent', 'true')`
3. Navigate through your site
4. Verify events appear in DebugView

### 4. SSL Certificate Verification
```bash
# Check SSL certificate
curl -I https://neuralsummary.com

# Check Traefik logs for certificate generation
docker-compose -f docker-compose.prod.yml logs traefik | grep -i "certificate"
```

## Monitoring Analytics

### Real-time Analytics
1. Firebase Console > Analytics > Realtime
2. View active users and events as they happen

### Key Metrics to Monitor
- **User Engagement**: Active users, session duration
- **Feature Adoption**: Upload events, transcription completions
- **Conversion Funnel**: Signup → Email Verification → First Upload
- **Error Rates**: Failed uploads, transcription errors

### Custom Reports
1. Go to Analytics > Analysis
2. Create custom reports for:
   - Daily active users by locale
   - Transcription success rate
   - Most used features
   - User retention cohorts

## Troubleshooting

### Analytics Not Working

1. **Check Measurement ID**:
```bash
# Verify in .env.production
grep MEASUREMENT_ID .env.production
```

2. **Check Container Environment**:
```bash
docker-compose -f docker-compose.prod.yml exec web env | grep FIREBASE
```

3. **Rebuild if needed**:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache web
docker-compose -f docker-compose.prod.yml up -d web
```

### Cookie Consent Not Appearing
1. Clear browser localStorage
2. Check browser console for errors
3. Verify component is rendered in layout

### Events Not Tracking
1. Check browser console for analytics errors
2. Verify consent is granted: `localStorage.getItem('analytics_consent')`
3. Check network tab for blocked requests
4. Disable ad blockers temporarily

## Security Considerations

1. **Never expose sensitive keys**:
   - Keep `.env.production` out of version control
   - Use Docker secrets for sensitive data

2. **Regular Updates**:
   ```bash
   # Update dependencies
   npm update
   npm audit fix
   
   # Update Docker images
   docker-compose -f docker-compose.prod.yml pull
   ```

3. **Monitor Access**:
   - Review Traefik access logs regularly
   - Set up alerts for unusual activity

## Rollback Procedure

If issues occur after deployment:

```bash
# 1. Checkout previous version
git checkout HEAD~1

# 2. Rebuild and redeploy
npm run build
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 3. Or restore from backup
docker-compose -f docker-compose.prod.yml down
# Restore your backup...
docker-compose -f docker-compose.prod.yml up -d
```

## Maintenance

### Daily Checks
- Monitor error rates in Firebase Analytics
- Check disk space: `df -h`
- Review container logs for errors

### Weekly Tasks
- Review analytics reports
- Check for security updates
- Backup `.env.production` file

### Monthly Tasks
- Rotate JWT secrets
- Review and optimize Docker images
- Clean up old Docker images: `docker system prune -a`

## Support

For issues with:
- **Analytics**: Check Firebase Console > Analytics > DebugView
- **Deployment**: Review Docker logs
- **SSL/Domain**: Check Traefik configuration
- **Application**: Check API and web container logs