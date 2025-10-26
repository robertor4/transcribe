# Stripe Setup Guide - Quick Start

**Time Required:** 30 minutes
**Prerequisites:** Stripe account (sign up at https://stripe.com)

---

## Step 1: Create Stripe Account (5 minutes)

1. Go to https://stripe.com/register
2. Enter email and create password
3. Choose "Individual" or "Company"
4. Complete business verification (later in production, skip for testing)

---

## Step 2: Get API Keys (2 minutes)

### Development/Test Keys:

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy these keys:

```bash
# Publishable key (starts with pk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Secret key (starts with sk_test_) - NEVER commit to git!
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Production Keys (for launch):

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy the same format (pk_live_ and sk_live_)

---

## Step 3: Create Products (10 minutes)

### A. Create Professional Plan Product

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in:
   ```
   Name: Neural Summary Professional
   Description: 60 hours of audio transcription per month with unlimited analyses
   ```
4. Click **"Add pricing"**

#### Professional Monthly Price:
```
Price: $29.00 USD
Billing period: Monthly
```
5. Click **Save product**
6. **COPY THE PRICE ID** (starts with `price_`)
   ```bash
   STRIPE_PRICE_PROF_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

#### Professional Annual Price:
1. On the same product page, click **"Add another price"**
2. Fill in:
   ```
   Price: $290.00 USD  (17% discount - 2 months free)
   Billing period: Yearly
   ```
3. Click **Save**
4. **COPY THE PRICE ID**
   ```bash
   STRIPE_PRICE_PROF_ANNUAL=price_XXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### B. Create PAYG Credit Products (One-time payments)

For PAYG, we'll create one-time payment products:

1. Click **"+ Add product"**
2. Fill in:
   ```
   Name: Neural Summary Credits - 10 Hours
   Description: 10 hours of pay-as-you-go transcription credit
   ```
3. Click **"Add pricing"**
4. Fill in:
   ```
   Price: $15.00 USD
   One time
   ```
5. Click **Save product**
6. Repeat for other packages:
   - **20 Hours**: $30.00
   - **33 Hours**: $50.00
   - **67 Hours**: $100.00

**Note:** For PAYG, we'll handle credit tracking in our backend, not via recurring subscriptions.

---

## Step 4: Configure Webhook (8 minutes)

### Local Development (Using Stripe CLI):

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```
   - This opens browser for authentication
   - Confirm the pairing code matches

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

4. **COPY THE WEBHOOK SIGNING SECRET** (starts with `whsec_`)
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Production Deployment:

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Enter endpoint URL:
   ```
   https://api.neuralsummary.com/api/stripe/webhook
   ```
4. Click **"Select events"**
5. Check these events:
   - [x] `checkout.session.completed`
   - [x] `customer.subscription.created`
   - [x] `customer.subscription.updated`
   - [x] `customer.subscription.deleted`
   - [x] `invoice.payment_succeeded`
   - [x] `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **COPY THE SIGNING SECRET** from the endpoint details page
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

## Step 5: Enable Adaptive Pricing (Multi-Currency) (2 minutes)

1. Go to: https://dashboard.stripe.com/settings/billing/automatic
2. Scroll to **"Adaptive Pricing"**
3. Toggle **ON**
4. Save changes

**What this does:**
- Automatically converts $29 USD → €27 EUR → £23 GBP
- Shows prices in customer's local currency
- No extra configuration needed!

---

## Step 6: Enable Stripe Tax (Optional - 3 minutes)

For automatic VAT/sales tax calculation:

1. Go to: https://dashboard.stripe.com/settings/tax
2. Click **"Get started"**
3. Enter your business address
4. Toggle **"Automatically calculate tax"** to ON
5. Save changes

**What this does:**
- Automatically calculates VAT for EU customers
- Handles sales tax for US customers
- Shows correct tax on checkout

---

## Step 7: Test Mode Verification (2 minutes)

### Test with Stripe Test Cards:

```
Success Card:       4242 4242 4242 4242
Decline Card:       4000 0000 0000 0002
3D Secure Card:     4000 0027 6000 3184

CVC:    Any 3 digits
Expiry: Any future date (e.g., 12/25)
ZIP:    Any 5 digits
```

### Quick Test Checkout:

1. Start your local dev server:
   ```bash
   npm run dev:all
   ```

2. In another terminal, start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

3. Visit: http://localhost:3000/pricing

4. Click **"Start Professional"**

5. Use test card: `4242 4242 4242 4242`

6. Check terminal for webhook events:
   ```
   ✓ checkout.session.completed
   ✓ customer.subscription.created
   ✓ invoice.payment_succeeded
   ```

---

## Step 8: Environment Variables Summary

Create/update your `.env` files:

### Backend (`.env` in project root):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PROF_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PROF_ANNUAL=price_XXXXXXXXXXXXXXXXXXXXXXXXXX

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Keep existing vars...
OPENAI_API_KEY=sk-...
FIREBASE_PROJECT_ID=...
# ... etc
```

### Frontend (`apps/web/.env.local`):

```bash
# Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Keep existing vars...
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... etc
```

---

## Production Checklist

Before going live:

- [ ] Switch to production API keys (pk_live_ and sk_live_)
- [ ] Create production webhook endpoint
- [ ] Update FRONTEND_URL to production domain
- [ ] Test checkout flow end-to-end with real card
- [ ] Verify webhooks are received
- [ ] Enable 3D Secure for EU customers
- [ ] Complete business verification in Stripe
- [ ] Set up payout schedule
- [ ] Add company branding (logo, colors)

---

## Troubleshooting

### Webhook not receiving events?

```bash
# Check if webhook endpoint is accessible
curl https://your-domain.com/api/stripe/webhook

# Check Stripe CLI is running
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Check logs
stripe logs tail
```

### Checkout session not creating?

```bash
# Verify price IDs are correct
echo $STRIPE_PRICE_PROF_MONTHLY

# Test API key is valid
curl https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY:
```

### Can't see test payments in dashboard?

- Make sure you're in **Test Mode** (toggle in top right)
- Go to: https://dashboard.stripe.com/test/payments

---

## Quick Reference

### Useful Stripe Commands:

```bash
# Login
stripe login

# List products
stripe products list

# List prices
stripe prices list

# Trigger test webhook
stripe trigger checkout.session.completed

# View logs
stripe logs tail

# Test webhook endpoint
stripe trigger payment_intent.succeeded
```

### Stripe Dashboard URLs:

- **Test Dashboard**: https://dashboard.stripe.com/test
- **Products**: https://dashboard.stripe.com/test/products
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Logs**: https://dashboard.stripe.com/test/logs

---

## Next Steps

Once Stripe is configured:

1. ✅ Copy all API keys to `.env` files
2. ✅ Start webhook forwarding (`stripe listen`)
3. ✅ Test checkout flow locally
4. ✅ Proceed with frontend component creation
5. ✅ Add i18n translations
6. ✅ Deploy to production

---

**Estimated Time:** 30 minutes total
**Status:** Ready to configure
**Support:** https://support.stripe.com (24/7 live chat)
