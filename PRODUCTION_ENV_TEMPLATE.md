# Production Environment Variables Template

Create `.env.production` on your server with these variables:

```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Client (for Next.js frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (for NestJS backend)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app

# IMPORTANT: Do NOT set NEXT_PUBLIC_API_URL in production!
# The frontend will automatically use /api and /socket.io paths

# Redis (local Docker container)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# AssemblyAI
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Resend (Email service)
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@neuralsummary.com

# Frontend URL (for backend CORS and email links)
FRONTEND_URL=https://neuralsummary.com

# Environment
NODE_ENV=production
```

## Important Notes:

1. **Do NOT include NEXT_PUBLIC_API_URL** - The frontend detects production by hostname
2. **FRONTEND_URL must be https://neuralsummary.com** - Used for CORS and WebSocket
3. **REDIS_HOST must be 'redis'** - This is the Docker service name
4. **Firebase Storage bucket** - Use .firebasestorage.app format, not .appspot.com