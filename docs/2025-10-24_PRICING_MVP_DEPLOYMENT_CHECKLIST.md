# Pricing MVP Deployment Checklist

**Date Created**: October 24, 2025
**Feature Branch**: `feature/pricing-mvp-phase1`
**Target Environment**: Production
**Estimated Deployment Time**: 2-3 hours

---

## Pre-Deployment

### 1. Stripe Configuration (45 minutes)

Follow the [Stripe Setup Guide](./2025-10-24_STRIPE_SETUP_GUIDE.md) to complete these steps:

- [ ] **Create Stripe Products & Prices**
  - [ ] Professional Monthly ($29/month)
  - [ ] Professional Annual ($261/year)
  - [ ] Pay-As-You-Go ($1.50 per credit)
  - [ ] Save all Price IDs to environment variables

- [ ] **Configure Webhook Endpoints**
  - [ ] Production: `https://neuralsummary.com/api/stripe/webhook`
  - [ ] Add webhook secret to production `.env`
  - [ ] Test webhook signature verification

- [ ] **Enable Adaptive Pricing**
  - [ ] Settings → Payment Methods → Enable 15+ currencies
  - [ ] Test currency conversion (EUR, GBP, JPY)

- [ ] **Test Mode Verification**
  - [ ] Complete test checkout with test card (4242 4242 4242 4242)
  - [ ] Verify webhook events received
  - [ ] Verify user subscription created in Firestore
  - [ ] Test subscription cancellation

### 2. Environment Variables (15 minutes)

**Backend (.env)**

- [ ] `STRIPE_SECRET_KEY` - Live secret key from Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- [ ] `STRIPE_PRICE_PROFESSIONAL_MONTHLY` - Price ID for Professional Monthly
- [ ] `STRIPE_PRICE_PROFESSIONAL_ANNUAL` - Price ID for Professional Annual
- [ ] `STRIPE_PRICE_PAYG` - Price ID for Pay-As-You-Go credits
- [ ] `FRONTEND_URL` - Production frontend URL (for checkout redirects)
- [ ] Verify existing vars: `OPENAI_API_KEY`, `FIREBASE_*`, `REDIS_*`

**Frontend (.env.local)**

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live publishable key
- [ ] `NEXT_PUBLIC_API_URL` - Production API URL
- [ ] Verify existing vars: `NEXT_PUBLIC_FIREBASE_*`

### 3. Database Preparation (30 minutes)

**Firestore**

- [ ] **Migrate Existing Users**
  - [ ] Run migration script to add subscription fields:
    ```typescript
    subscriptionTier: 'free',
    usageThisMonth: { hours: 0, transcriptions: 0, onDemandAnalyses: 0, lastResetAt: new Date() }
    ```
  - [ ] Verify all users have `subscriptionTier` field
  - [ ] Verify all users have `usageThisMonth` object

- [ ] **Create Collections** (if not auto-created)
  - [ ] `usageRecords` - For tracking usage history
  - [ ] `overageCharges` - For tracking Professional overages

- [ ] **Backup Current Database**
  - [ ] Export all `users` collection data
  - [ ] Export all `transcriptions` collection data
  - [ ] Store backup in secure location

**Redis**

- [ ] Verify Redis is running and accessible
- [ ] Test Bull queue connection
- [ ] Clear any stale job queues: `FLUSHDB` (use with caution!)

### 4. Code Review & Testing (1 hour)

**Backend Tests**

- [ ] Run all unit tests: `cd apps/api && npm run test`
- [ ] Run integration tests: `npm run test:e2e`
- [ ] Verify no TypeScript errors: `npm run build`
- [ ] Test Stripe webhook signature verification
- [ ] Test quota enforcement with mock users

**Frontend Tests**

- [ ] Build frontend without errors: `cd apps/web && npm run build`
- [ ] Test all pricing page components render
- [ ] Test checkout flow (development mode)
- [ ] Test subscription management page
- [ ] Verify dark mode support across all new pages

**Integration Tests**

- [ ] **Complete User Journey**:
  1. [ ] Sign up new account (starts as Free)
  2. [ ] Upload 1 transcription (verify usage tracked)
  3. [ ] Navigate to Pricing page
  4. [ ] Click "Upgrade" to Professional
  5. [ ] Complete Stripe checkout (test mode)
  6. [ ] Verify redirected to success page
  7. [ ] Verify user's `subscriptionTier` updated to "professional"
  8. [ ] Verify Stripe `customerId` and `subscriptionId` saved
  9. [ ] Upload another transcription (should not hit limit)
  10. [ ] Navigate to Subscription page (verify usage displayed)

- [ ] **Quota Enforcement**:
  1. [ ] Create Free user with 3 transcriptions
  2. [ ] Attempt 4th transcription → should show QuotaExceededModal
  3. [ ] Create Professional user with 60 hours usage
  4. [ ] Upload transcription → should allow (overage charge)
  5. [ ] Create PAYG user with 0 credits
  6. [ ] Attempt transcription → should show "Insufficient Credits" modal

- [ ] **Webhook Handling**:
  - [ ] Test `checkout.session.completed` webhook
  - [ ] Test `customer.subscription.updated` webhook
  - [ ] Test `customer.subscription.deleted` webhook
  - [ ] Test `invoice.payment_failed` webhook
  - [ ] Verify all webhooks update Firestore correctly

---

## Deployment Steps

### Phase 1: Backend Deployment (30 minutes)

- [ ] **Merge Feature Branch**
  ```bash
  git checkout develop
  git pull origin develop
  git merge feature/pricing-mvp-phase1
  git push origin develop
  ```

- [ ] **Deploy Backend to Production**
  - [ ] SSH into production server
  - [ ] Pull latest code: `cd /opt/transcribe && git pull origin develop`
  - [ ] Install dependencies: `npm install` (root and apps/api)
  - [ ] Build shared package: `npm run build:shared`
  - [ ] Build backend: `cd apps/api && npm run build`
  - [ ] Update `.env` with production Stripe keys
  - [ ] Restart backend service:
    ```bash
    pm2 restart neural-summary-api
    pm2 save
    ```
  - [ ] Verify backend is running: `pm2 status`
  - [ ] Check logs: `pm2 logs neural-summary-api --lines 50`

- [ ] **Test Backend Health**
  - [ ] `curl https://neuralsummary.com/api/health` → Should return 200
  - [ ] Test Stripe webhook endpoint:
    ```bash
    curl -X POST https://neuralsummary.com/api/stripe/webhook \
      -H "Content-Type: application/json" \
      -d '{"type":"ping"}'
    ```

### Phase 2: Frontend Deployment (30 minutes)

- [ ] **Deploy Frontend to Production**
  - [ ] Build frontend with production env vars:
    ```bash
    cd apps/web
    NEXT_PUBLIC_API_URL=https://neuralsummary.com/api \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
    npm run build
    ```
  - [ ] Test build locally: `npm run start`
  - [ ] Upload build to production server or deploy via CI/CD
  - [ ] Restart frontend service:
    ```bash
    pm2 restart neural-summary-web
    pm2 save
    ```
  - [ ] Verify frontend is running: `pm2 status`

- [ ] **Test Frontend Health**
  - [ ] Visit `https://neuralsummary.com` → Should load
  - [ ] Visit `https://neuralsummary.com/en/pricing` → Pricing page should load
  - [ ] Verify Stripe Checkout loads: Click "Upgrade" → Should redirect to Stripe

### Phase 3: Stripe Configuration (15 minutes)

- [ ] **Activate Production Mode in Stripe**
  - [ ] Stripe Dashboard → Toggle to "Live mode"
  - [ ] Verify webhook endpoints are in Live mode
  - [ ] Send test webhook event to production

- [ ] **Configure Stripe Customer Portal** (for self-service cancellation)
  - [ ] Settings → Customer Portal → Enable
  - [ ] Configure cancellation options (immediate or end of period)
  - [ ] Add branding (logo, colors)
  - [ ] Test portal link: `https://billing.stripe.com/p/login/test_...`

### Phase 4: DNS & SSL (if needed)

- [ ] Verify SSL certificate is valid for all routes
- [ ] Test all new routes return 200:
  - [ ] `/en/pricing`
  - [ ] `/en/checkout/professional`
  - [ ] `/en/checkout/success`
  - [ ] `/en/checkout/cancel`
  - [ ] `/en/dashboard/settings/subscription`

---

## Post-Deployment Verification (30 minutes)

### 1. Smoke Tests

**Free User Journey**

- [ ] Sign up new account
- [ ] Verify starts as Free tier
- [ ] Upload 1 transcription
- [ ] Verify usage tracked in Subscription page
- [ ] Attempt 4th transcription after uploading 3 → Should block

**Professional Upgrade Journey**

- [ ] Click "Upgrade" from Free account
- [ ] Complete checkout with real credit card
- [ ] Verify redirected to success page
- [ ] Verify subscription active in Stripe Dashboard
- [ ] Verify user's tier updated to "professional" in Firestore
- [ ] Upload transcription → Should not be blocked
- [ ] Check Subscription page → Should show Professional plan

**Webhook Verification**

- [ ] Stripe Dashboard → Webhooks → Check recent events
- [ ] Verify all webhook events return 200 status
- [ ] If any failures, check backend logs: `pm2 logs neural-summary-api | grep webhook`

### 2. Analytics & Monitoring

- [ ] **Set up Stripe Dashboard Monitoring**
  - [ ] Add email alerts for failed payments
  - [ ] Add alerts for high chargeback rates
  - [ ] Monitor daily revenue metrics

- [ ] **Backend Monitoring**
  - [ ] Check Redis queue processing: `redis-cli -h localhost -p 6379 LLEN transcription:queue`
  - [ ] Monitor error logs: `pm2 logs neural-summary-api --err --lines 100`
  - [ ] Set up log alerts for `PaymentRequiredException` errors

- [ ] **Frontend Monitoring**
  - [ ] Verify Google Analytics tracking (if enabled)
  - [ ] Check for JavaScript errors in production (Sentry, etc.)

### 3. User Communication

- [ ] **Notify Existing Users**
  - [ ] Send email announcement about new pricing plans
  - [ ] Include benefits of upgrading to Professional
  - [ ] Offer limited-time discount for early adopters (optional)

- [ ] **Update Documentation**
  - [ ] Update README with pricing information
  - [ ] Update Terms of Service if needed
  - [ ] Update Privacy Policy if needed (Stripe data processing)

---

## Rollback Plan

If critical issues arise, follow this rollback procedure:

### 1. Immediate Rollback (Backend)

```bash
# SSH into production server
cd /opt/transcribe

# Revert to previous commit
git log --oneline -10  # Find last stable commit
git checkout <previous-commit-hash>

# Rebuild and restart
npm run build:shared
cd apps/api && npm run build && cd ../..
pm2 restart neural-summary-api
```

### 2. Immediate Rollback (Frontend)

```bash
# Revert to previous deployment
cd apps/web
git checkout <previous-commit-hash>
npm run build
pm2 restart neural-summary-web
```

### 3. Disable Stripe Webhooks

- [ ] Stripe Dashboard → Webhooks → Disable production endpoint
- [ ] Prevents new subscription events from being processed

### 4. Revert Database Changes

- [ ] If user data was corrupted, restore from backup:
  ```bash
  # Restore Firestore backup
  gcloud firestore import gs://[BACKUP_BUCKET]/[BACKUP_DATE]
  ```

---

## Common Issues & Troubleshooting

### Issue: Webhook Signature Verification Failed

**Symptoms**: Stripe webhooks return 400 or 401 errors

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check backend logs: `pm2 logs neural-summary-api | grep "webhook"`
3. Test signature locally:
   ```typescript
   const signature = req.headers['stripe-signature'];
   const event = stripe.webhooks.constructEvent(body, signature, secret);
   ```

### Issue: User Subscription Not Updating

**Symptoms**: User completes checkout but still shows as "Free"

**Solution**:
1. Check Stripe webhook was received: Stripe Dashboard → Webhooks → Recent events
2. Check backend processed webhook: `pm2 logs neural-summary-api | grep "checkout.session.completed"`
3. Verify Firestore user document updated: Firebase Console → Firestore → users → [userId]
4. Manual fix: Update user document with `subscriptionTier: 'professional'` and Stripe IDs

### Issue: Quota Not Enforcing

**Symptoms**: Free users can upload more than 3 transcriptions

**Solution**:
1. Check usage tracking is working: Firebase Console → Firestore → users → [userId] → `usageThisMonth`
2. Verify `SubscriptionGuard` is applied to upload endpoint
3. Check backend logs: `pm2 logs neural-summary-api | grep "checkQuota"`
4. Run manual reset: Update `usageThisMonth.lastResetAt` to current date

### Issue: Stripe Checkout Not Loading

**Symptoms**: Clicking "Upgrade" shows error or blank page

**Solution**:
1. Check browser console for JavaScript errors
2. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
3. Test checkout session creation:
   ```bash
   curl -X POST https://neuralsummary.com/api/stripe/create-checkout-session \
     -H "Authorization: Bearer <firebase-token>" \
     -H "Content-Type: application/json" \
     -d '{"tier":"professional","billing":"monthly"}'
   ```

---

## Post-Launch Monitoring (First 48 Hours)

### Metrics to Track

- [ ] **Conversion Rates**
  - Free → Professional upgrades
  - Checkout completion rate
  - Cancellation rate

- [ ] **Technical Health**
  - Webhook success rate (target: 99%+)
  - API error rate (target: <1%)
  - Average checkout time (target: <30 seconds)

- [ ] **User Behavior**
  - Average usage per tier
  - Time to first upgrade
  - Quota exceeded events

### Daily Checklist (First Week)

- [ ] Review Stripe Dashboard for failed payments
- [ ] Check backend error logs for payment exceptions
- [ ] Monitor Redis queue for processing delays
- [ ] Review user feedback/support tickets
- [ ] Track revenue vs. cost (OpenAI API usage)

---

## Success Criteria

Deployment is considered successful when:

- [ ] All webhooks return 200 status (no failures in Stripe Dashboard)
- [ ] At least 1 successful Professional upgrade in first 24 hours
- [ ] Free users are correctly blocked at quota limits
- [ ] Professional users can upload without limits
- [ ] Subscription management page loads without errors
- [ ] No critical errors in backend logs
- [ ] API response time <500ms for quota checks
- [ ] Zero data corruption or loss

---

## Contact Information

**On-Call Engineers**:
- Backend: [Your contact]
- Frontend: [Your contact]
- DevOps: [Your contact]

**Stripe Support**: support@stripe.com
**Emergency Rollback Contact**: [Your contact]

---

## Appendix

### A. Manual User Migration Script

If needed, migrate existing users to new schema:

```typescript
// apps/api/src/scripts/migrate-users.ts
import { getFirestore } from 'firebase-admin/firestore';

async function migrateUsers() {
  const db = getFirestore();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let migrated = 0;
  for (const doc of snapshot.docs) {
    const user = doc.data();

    // Skip if already migrated
    if (user.subscriptionTier) continue;

    // Add subscription fields
    await doc.ref.update({
      subscriptionTier: 'free',
      usageThisMonth: {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      },
    });

    migrated++;
    console.log(`Migrated user ${doc.id}`);
  }

  console.log(`Migrated ${migrated} users`);
}

migrateUsers().catch(console.error);
```

### B. Test Stripe Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3001/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### C. Useful Commands

```bash
# Check Redis queue length
redis-cli -h localhost -p 6379 LLEN transcription:queue

# Monitor Redis in real-time
redis-cli -h localhost -p 6379 MONITOR

# Check backend health
curl https://neuralsummary.com/api/health

# View recent backend logs
pm2 logs neural-summary-api --lines 100

# Restart services
pm2 restart all
pm2 save

# Database backup
firebase firestore:export gs://neural-summary-backups/$(date +%Y%m%d)
```

---

**Deployment Completed By**: _______________
**Date**: _______________
**Sign-off**: _______________
