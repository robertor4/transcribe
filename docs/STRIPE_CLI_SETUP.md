# Stripe CLI Setup for Local Development

**Purpose**: Use real Stripe webhooks in local development, identical to production workflow.

---

## How It Works (Port Confusion Explained)

**Common Question:** *"If my API runs on port 3001, how can Stripe CLI also use port 3001?"*

**Answer:** Stripe CLI does **NOT** run on port 3001. It's not a server at all!

### What Stripe CLI Actually Does

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Stripe.com │────────▶│  Stripe CLI  │────────▶│  Your API:3001  │
│   (cloud)   │ webhook │  (on your    │  HTTP   │  (NestJS server)│
│             │  event  │   laptop)    │  POST   │                 │
└─────────────┘         └──────────────┘         └─────────────────┘
                         Not a server!            Runs on port 3001
                         Just forwards
                         webhooks
```

**Stripe CLI is a proxy/forwarder:**
1. **Your API** runs as a web server on port 3001 (like normal)
2. **Stripe CLI** runs as a background process (no port needed)
3. When you test checkout, Stripe sends a webhook to the CLI
4. The CLI makes an HTTP POST request to `localhost:3001/stripe/webhook`
5. Your API receives the POST and processes it

**Think of Stripe CLI like `curl`:**
```bash
# This is essentially what Stripe CLI does:
curl -X POST http://localhost:3001/stripe/webhook \
  -H "stripe-signature: xxx" \
  -d "webhook payload"
```

It doesn't need a port because it's making requests TO your API, not receiving requests.

---

## Installation

### macOS (Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

### Other Platforms
Download from: https://stripe.com/docs/stripe-cli

Verify installation:
```bash
stripe --version
```

---

## One-Time Setup

### 1. Login to Stripe
```bash
stripe login
```

This opens your browser to authorize the CLI with your Stripe account. Choose your account and allow access.

### 2. Get Webhook Secret for Development

**Option A: Start forwarding and get the secret**
```bash
stripe listen --forward-to localhost:3001/stripe/webhook
```

Output:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

Copy the `whsec_xxx` secret and add it to your root `.env` file:

```bash
# .env (root)
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Option B: Generate a permanent webhook secret for development**
```bash
stripe listen --print-secret
```

This gives you a webhook secret you can save permanently in `.env`.

---

## Daily Development Workflow

### Start Your Development Environment

**Terminal 1: Start Redis + Services**
```bash
npm run dev:all
```

**Terminal 2: Start Stripe CLI Webhook Forwarding**
```bash
stripe listen --forward-to localhost:3001/stripe/webhook
```

You should see:
```
> Ready! You can now receive webhook events from Stripe
> Listening for webhook events
```

**Terminal 3: (Optional) Watch webhook events**
```bash
stripe listen --forward-to localhost:3001/stripe/webhook --print-json
```

This shows you the full webhook payload for debugging.

---

## Testing the Webhook Flow

### 1. Test Subscription Checkout

1. Start your frontend: `npm run dev:all` (already running)
2. Start Stripe CLI forwarding: `stripe listen --forward-to localhost:3001/stripe/webhook`
3. Go to `http://localhost:3000/pricing`
4. Click "Upgrade to Pro"
5. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. Complete checkout

**What happens:**
```
[Stripe] Checkout completed
[Stripe] → Sends webhook to Stripe CLI
[Stripe CLI] → Forwards to localhost:3001/stripe/webhook
[Your API] → Receives checkout.session.completed
[Your API] → Updates Firebase with subscription
[Your API] → Returns 200 OK to Stripe CLI
[Browser] → Redirects to /checkout/success
[User] → Sees subscription immediately (already synced via webhook!)
```

**Check your Stripe CLI terminal:**
```
2025-10-25 15:30:12   --> checkout.session.completed [evt_xxx]
2025-10-25 15:30:12   <--  [200] POST http://localhost:3001/stripe/webhook [evt_xxx]
```

**Check your API logs:**
```
[Nest] INFO [StripeController] Received webhook event: checkout.session.completed
[Nest] INFO [StripeService] Processing checkout completion for user abc123
[Nest] INFO [StripeService] User abc123 upgraded to professional - usage reset
```

---

### 2. Trigger Test Webhooks Manually

You can trigger ANY webhook event without going through the full checkout flow:

**Trigger a completed checkout:**
```bash
stripe trigger checkout.session.completed
```

**Trigger a successful payment (monthly billing):**
```bash
stripe trigger invoice.payment_succeeded
```

**Trigger a failed payment:**
```bash
stripe trigger invoice.payment_failed
```

**Trigger subscription cancellation:**
```bash
stripe trigger customer.subscription.deleted
```

**See all available events:**
```bash
stripe trigger --help
```

This is HUGE for testing edge cases without manually creating subscriptions!

---

## Troubleshooting

### Webhook Secret Mismatch

**Error in API logs:**
```
Webhook signature verification failed: No signatures found matching the expected signature
```

**Fix:**
1. Check your `.env` has the correct `STRIPE_WEBHOOK_SECRET`
2. Restart your API: `npm run dev:all`
3. The secret in `.env` MUST match what Stripe CLI shows when you run `stripe listen`

---

### Webhook Not Received

**Check:**
1. Stripe CLI is running: `stripe listen --forward-to localhost:3001/stripe/webhook`
2. API is running on port 3001: `curl http://localhost:3001/stripe/webhook` (should return 405 Method Not Allowed)
3. Check API logs for incoming webhook
4. Check Stripe CLI output for errors

**Common issue:**
```
Error: Failed to forward webhook event: connection refused
```

**Fix:** Make sure your API is running on port 3001 before starting Stripe CLI.

---

### Can't See Webhook Events in Stripe Dashboard

**Note:** Events forwarded via Stripe CLI are NOT shown in your Stripe Dashboard webhook logs. This is normal.

To see webhook history in the dashboard, you need to:
1. Deploy to a public server (staging/production)
2. Register the webhook endpoint in Stripe Dashboard
3. Then all webhooks will appear in Dashboard → Developers → Webhooks

In development, use the Stripe CLI terminal output to see webhook events.

---

### Port Already in Use

If port 3001 is busy:

1. Change API port in `apps/api/.env`:
   ```bash
   PORT=3002
   ```

2. Update Stripe CLI forward URL:
   ```bash
   stripe listen --forward-to localhost:3002/stripe/webhook
   ```

3. Update frontend API URL in `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

---

## Production Deployment

When you deploy to production, you DON'T use Stripe CLI. Instead:

### 1. Register Webhook in Stripe Dashboard

Go to: https://dashboard.stripe.com/webhooks

Click **"Add endpoint"**:
- **Endpoint URL**: `https://api.neuralsummary.com/stripe/webhook`
- **Events to send**:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 2. Get Production Webhook Secret

After creating the endpoint, Stripe shows you a webhook signing secret (e.g., `whsec_prod_xxx`).

Add this to your production environment variables:
```bash
STRIPE_WEBHOOK_SECRET=whsec_prod_xxx...
```

### 3. Test Production Webhooks

Stripe Dashboard → Webhooks → Your endpoint → "Send test webhook"

Check your production logs to verify it's working.

---

## Advanced: Multiple Webhook Endpoints

You can run multiple Stripe CLI sessions to test different scenarios:

**Terminal 1: Forward to local API**
```bash
stripe listen --forward-to localhost:3001/stripe/webhook
```

**Terminal 2: Forward to staging API**
```bash
stripe listen --forward-to https://staging.neuralsummary.com/stripe/webhook
```

**Terminal 3: Log all events to a file**
```bash
stripe listen --print-json > webhook-events.log
```

---

## Quick Reference

### Common Commands

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3001/stripe/webhook

# Start with verbose output
stripe listen --forward-to localhost:3001/stripe/webhook --print-json

# Trigger a test event
stripe trigger checkout.session.completed

# Check CLI version
stripe --version

# Re-authenticate
stripe login

# View recent events
stripe events list

# Get specific event details
stripe events retrieve evt_xxx
```

### Webhook Secret Locations

**Development:**
```bash
# Root .env
STRIPE_WEBHOOK_SECRET=whsec_dev_xxx...
```

**Production:**
```bash
# Production environment (Railway, Heroku, etc.)
STRIPE_WEBHOOK_SECRET=whsec_prod_xxx...
```

---

## Development Scripts (Recommended)

Add these to root `package.json`:

```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run redis:start\" \"npm run build:shared\" \"npm run dev\"",
    "dev:stripe": "stripe listen --forward-to localhost:3001/stripe/webhook",
    "dev:full": "concurrently \"npm run redis:start\" \"npm run build:shared\" \"npm run dev\" \"npm run dev:stripe\""
  }
}
```

Now you can run everything with one command:
```bash
npm run dev:full
```

This starts:
- ✅ Redis
- ✅ Shared package build
- ✅ Frontend + Backend
- ✅ Stripe webhook forwarding

---

## Summary

**Development Flow (Recommended):**
1. `npm run dev:all` - Start all services
2. `stripe listen --forward-to localhost:3001/stripe/webhook` - Start webhook forwarding
3. Test checkout flow
4. Webhooks work exactly like production

**No more:**
- ❌ Manual sync endpoints
- ❌ Different code paths for dev vs production
- ❌ Workarounds that might break in production

**Benefits:**
- ✅ Identical to production
- ✅ Test all webhook events
- ✅ Catch issues before deployment
- ✅ Faster development (trigger events manually)
