# Mobile Testing Setup Guide

This guide explains how to test the Neural Summary application on a mobile device connected to the same WiFi network as your development machine.

## Prerequisites

- Development machine and mobile device on the same WiFi network
- Local IP address of your development machine (e.g., `192.168.1.244`)
  - macOS: System Settings → Network → Wi-Fi → Details → IP Address
  - Or run: `ipconfig getifaddr en0`

## Required Configuration Changes

### 1. Frontend Environment Variables

Update `apps/web/.env.local` to use your local IP instead of `localhost`:

```bash
NEXT_PUBLIC_API_URL=http://192.168.1.244:3001
NEXT_PUBLIC_APP_URL=http://192.168.1.244:3000
```

**Note:** The `apps/web/.env.local` file takes precedence over the root `.env` file for the Next.js app.

### 2. Backend Environment Variables

Update the root `.env` file:

```bash
FRONTEND_URL=http://192.168.1.244:3000
NEXT_PUBLIC_APP_URL=http://192.168.1.244:3000
NEXT_PUBLIC_API_URL=http://192.168.1.244:3001
```

These are used for:
- **CORS** - Allowing requests from the frontend
- **WebSocket connections** - Socket.io origin validation
- **Email links** - Share transcription URLs
- **Stripe redirects** - After checkout/portal

### 3. NestJS Binding to All Interfaces

Ensure the API binds to `0.0.0.0` (all network interfaces) instead of just `localhost`.

In `apps/api/src/main.ts`, the listen call should be:

```typescript
const server = await app.listen(port, '0.0.0.0');
```

This allows the API to accept connections from any IP address, not just localhost.

### 4. Firebase Authorized Domains

For Firebase Authentication (especially Google OAuth) to work:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to: Authentication → Settings → Authorized domains
4. Add your local IP address (e.g., `192.168.1.244`)

**Note:** Email/password login works without this step, but OAuth providers require the domain to be whitelisted.

## After Making Changes

1. **Restart all services** - Environment variables are read at startup:
   ```bash
   npm run dev:all
   ```

2. **Clear mobile browser cache** - Old JavaScript bundles may have cached the localhost URLs

3. **Verify API accessibility** - On your mobile device, visit:
   ```
   http://192.168.1.244:3001/health
   ```
   You should see a "healthy" status response.

## Troubleshooting

### API not reachable from mobile

1. **Check firewall** - macOS may block incoming connections
   - System Settings → Network → Firewall → Allow Node.js

2. **Verify binding** - Ensure NestJS is using `0.0.0.0`:
   ```bash
   lsof -i :3001
   ```
   Should show `*:3001` not `localhost:3001`

### Conversations not loading

1. **Check Network tab** - Verify API calls go to `192.168.1.244:3001`, not `localhost:3001`
2. **Restart Next.js** - `NEXT_PUBLIC_*` variables are baked in at build/startup time
3. **Clear browser cache** - Force reload with cleared cache

### Firebase Auth errors

- "Domain not authorized" - Add your IP to Firebase Authorized Domains
- OAuth popup fails - Same fix as above

## Debugging Mobile Safari

To inspect your mobile browser from your Mac:

**On iPhone:**
1. Settings → Safari → Advanced → Enable "Web Inspector"

**On Mac:**
1. Safari → Settings → Advanced → "Show Develop menu in menu bar"
2. Connect iPhone via USB
3. Safari menu: Develop → [Your iPhone] → [The webpage]

## Reverting Changes

When done testing, revert to localhost configuration:

**apps/web/.env.local:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Root .env:**
```bash
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The `0.0.0.0` binding in main.ts can remain as it doesn't affect localhost development.
