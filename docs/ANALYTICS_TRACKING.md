# Analytics Tracking Guide

This document outlines the comprehensive Firebase Analytics tracking implementation for Neural Summary's e-commerce funnel.

## Table of Contents
- [Overview](#overview)
- [Frontend Events](#frontend-events)
- [Backend Events](#backend-events)
- [GA4 E-commerce Implementation](#ga4-e-commerce-implementation)
- [Testing](#testing)
- [Configuration](#configuration)

## Overview

Neural Summary uses **Firebase Analytics** (Google Analytics 4) for comprehensive event tracking across the entire user journey, from pricing page views to completed purchases. The implementation includes both **client-side** (frontend) and **server-side** (backend) tracking for maximum reliability.

### Key Features
- ✅ GA4 recommended e-commerce events
- ✅ Complete funnel tracking (pricing → checkout → purchase)
- ✅ Revenue attribution and tracking
- ✅ Server-side event validation via Stripe webhooks
- ✅ GDPR-compliant cookie consent
- ✅ Multi-currency support
- ✅ Debug mode for development

## Frontend Events

All frontend events are tracked via the `useAnalytics()` hook from [apps/web/contexts/AnalyticsContext.tsx](../apps/web/contexts/AnalyticsContext.tsx).

### Pricing Page Events

#### 1. `view_item_list`
**Triggered when:** User loads the pricing page
**Location:** [apps/web/app/[locale]/pricing/page.tsx:42](../apps/web/app/[locale]/pricing/page.tsx#L42)

```typescript
trackEvent('view_item_list', {
  item_list_name: 'Pricing Page',
  items: [
    { item_id: 'free_monthly', item_name: 'Free Plan', price: 0 },
    { item_id: 'professional_monthly', item_name: 'Professional Plan', price: 27 },
    { item_id: 'payg_credits', item_name: 'Pay-As-You-Go Credits', price: 1.50 }
  ],
  currency: 'USD',
  locale: 'en',
  user_authenticated: true
});
```

#### 2. `view_item`
**Triggered when:** User views a specific pricing card
**Location:** [apps/web/components/pricing/PricingCard.tsx:67-76](../apps/web/components/pricing/PricingCard.tsx#L67-L76)

```typescript
trackEvent('view_item', {
  currency: 'USD',
  value: 27.00,
  items: [{
    item_id: 'professional_monthly',
    item_name: 'Professional Plan',
    item_category: 'Subscription',
    price: 27.00,
    quantity: 1
  }],
  locale: 'en',
  tier_name: 'Professional',
  is_featured: true
});
```

#### 3. `select_item`
**Triggered when:** User clicks CTA button on pricing card
**Location:** [apps/web/components/pricing/PricingCard.tsx:79-89](../apps/web/components/pricing/PricingCard.tsx#L79-L89)

```typescript
trackEvent('select_item', {
  currency: 'USD',
  value: 27.00,
  items: [{
    item_id: 'professional_monthly',
    item_name: 'Professional Plan',
    price: 27.00
  }],
  item_list_name: 'Pricing Page',
  locale: 'en',
  cta_text: 'Get Started'
});
```

#### 4. `billing_cycle_toggled`
**Triggered when:** User switches between monthly/annual billing
**Location:** [apps/web/app/[locale]/pricing/page.tsx:52-62](../apps/web/app/[locale]/pricing/page.tsx#L52-L62)

```typescript
trackEvent('billing_cycle_toggled', {
  previous_cycle: 'monthly',
  new_cycle: 'annual',
  currency: 'USD',
  locale: 'en'
});
```

#### 5. `pricing_comparison_viewed`
**Triggered when:** User scrolls to feature comparison table
**Location:** [apps/web/app/[locale]/pricing/page.tsx:60-66](../apps/web/app/[locale]/pricing/page.tsx#L60-L66)

Uses Intersection Observer to track when 30% of the comparison table becomes visible.

#### 6. `pricing_faq_viewed`
**Triggered when:** User scrolls to FAQ section
**Location:** [apps/web/app/[locale]/pricing/page.tsx:68-74](../apps/web/app/[locale]/pricing/page.tsx#L68-L74)

### Checkout Funnel Events

#### 7. `begin_checkout`
**Triggered when:** User initiates checkout process
**Location:** [apps/web/app/[locale]/checkout/[tier]/page.tsx:67-73](../apps/web/app/[locale]/checkout/[tier]/page.tsx#L67-L73)

```typescript
trackEvent('begin_checkout', {
  currency: 'USD',
  value: 27.00,
  items: [{
    item_id: 'professional_monthly',
    item_name: 'Professional Plan',
    price: 27.00,
    quantity: 1
  }],
  affiliation: 'Neural Summary',
  locale: 'en',
  user_id: 'firebase_user_id'
});
```

#### 8. `add_payment_info`
**Triggered when:** Stripe checkout session created successfully
**Location:** [apps/web/app/[locale]/checkout/[tier]/page.tsx:111-117](../apps/web/app/[locale]/checkout/[tier]/page.tsx#L111-L117)

```typescript
trackEvent('add_payment_info', {
  currency: 'USD',
  value: 27.00,
  items: [...],
  session_id: 'stripe_session_id',
  user_id: 'firebase_user_id'
});
```

#### 9. `checkout_error`
**Triggered when:** Error occurs during checkout
**Location:** [apps/web/app/[locale]/checkout/[tier]/page.tsx:129-134](../apps/web/app/[locale]/checkout/[tier]/page.tsx#L129-L134)

```typescript
trackEvent('checkout_error', {
  error_message: 'Failed to create checkout session',
  tier: 'professional',
  locale: 'en',
  user_id: 'firebase_user_id'
});
```

### Purchase Completion Events

#### 10. `purchase` (Client-side)
**Triggered when:** User lands on success page after payment
**Location:** [apps/web/app/[locale]/checkout/success/page.tsx:65-79](../apps/web/app/[locale]/checkout/success/page.tsx#L65-L79)

```typescript
trackEvent('purchase', {
  transaction_id: 'stripe_session_id',
  value: 27.00,
  currency: 'USD',
  items: [{
    item_id: 'professional_subscription',
    item_name: 'Professional Plan',
    item_category: 'Subscription',
    price: 27.00,
    quantity: 1
  }],
  affiliation: 'Neural Summary',
  locale: 'en',
  user_id: 'firebase_user_id'
});
```

## Backend Events

Backend events are tracked via the `AnalyticsService` using GA4 Measurement Protocol API.

**Location:** [apps/api/src/analytics/analytics.service.ts](../apps/api/src/analytics/analytics.service.ts)

### Server-Side Purchase Tracking

#### 11. `purchase` (Server-side)
**Triggered when:** Stripe `checkout.session.completed` webhook received
**Location:** [apps/api/src/stripe/stripe.service.ts:419-426](../apps/api/src/stripe/stripe.service.ts#L419-L426)

```typescript
await this.analyticsService.trackPurchase(
  userId,
  sessionId,
  27.00,
  'USD',
  'professional',
  'monthly'
);
```

This provides server-side validation of purchases, ensuring revenue tracking even if client-side events fail.

### Recurring Payment Tracking

#### 12. `recurring_payment_succeeded`
**Triggered when:** Stripe `invoice.payment_succeeded` webhook for renewal
**Location:** [apps/api/src/analytics/analytics.service.ts:221-245](../apps/api/src/analytics/analytics.service.ts#L221-L245)

Tracks recurring subscription renewals separately from initial purchases.

### Refund Tracking

#### 13. `refund`
**Triggered when:** Subscription cancelled or refunded
**Location:** [apps/api/src/analytics/analytics.service.ts:112-141](../apps/api/src/analytics/analytics.service.ts#L112-L141)

```typescript
await this.analyticsService.trackRefund(
  userId,
  transactionId,
  27.00,
  'USD',
  'professional'
);
```

### Subscription Changes

#### 14. `subscription_updated`
**Triggered when:** User upgrades/downgrades subscription
**Location:** [apps/api/src/analytics/analytics.service.ts:149-179](../apps/api/src/analytics/analytics.service.ts#L149-L179)

```typescript
await this.analyticsService.trackSubscriptionUpdate(
  userId,
  subscriptionId,
  'free',
  'professional',
  27.00,
  'USD'
);
```

### Payment Failures

#### 15. `payment_failed`
**Triggered when:** Stripe `invoice.payment_failed` webhook
**Location:** [apps/api/src/analytics/analytics.service.ts:187-213](../apps/api/src/analytics/analytics.service.ts#L187-L213)

## GA4 E-commerce Implementation

### Standard Parameters

All e-commerce events include these standardized parameters following GA4 recommendations:

```typescript
{
  currency: string,           // ISO 4217 code (USD, EUR, GBP)
  value: number,              // Total transaction value
  items: [{
    item_id: string,          // Unique product identifier
    item_name: string,        // Human-readable product name
    item_category: string,    // Product category
    item_category2?: string,  // Sub-category (billing cycle)
    item_variant?: string,    // Product variant
    price: number,            // Item price
    quantity: number          // Quantity (always 1 for subscriptions)
  }],
  transaction_id?: string,    // Unique transaction ID (for purchases)
  affiliation?: string,       // Store name ("Neural Summary")
  locale?: string,            // User locale
  user_id?: string            // Firebase user ID
}
```

### Helper Utilities

All e-commerce parameters are generated using type-safe helper functions:

**Location:** [apps/web/utils/analytics-helpers.ts](../apps/web/utils/analytics-helpers.ts)

```typescript
import {
  formatPricingTierItem,
  formatViewItemParams,
  formatSelectItemParams,
  formatBeginCheckoutParams,
  formatPurchaseParams,
  formatRefundParams
} from '@/utils/analytics-helpers';
```

## Testing

### Development Mode

Enable analytics debug view in development:

```typescript
// apps/web/lib/firebase.ts
// Analytics automatically logs events in development
console.log('[Analytics] Event tracked:', eventName, params);
```

### GA4 DebugView

1. Open Firebase Console → Analytics → DebugView
2. Events appear in real-time when tracked
3. Verify event parameters match expected structure

### Server-Side Debug

Backend analytics automatically validates events using GA4 debug endpoint in development:

```typescript
// apps/api/src/analytics/analytics.service.ts:280-301
if (process.env.NODE_ENV === 'development') {
  await this.debugEvent(payload);
}
```

### Test Checklist

- [ ] Pricing page loads → `view_item_list` tracked
- [ ] View pricing card → `view_item` tracked
- [ ] Click CTA button → `select_item` tracked
- [ ] Toggle billing cycle → `billing_cycle_toggled` tracked
- [ ] Scroll to comparison → `pricing_comparison_viewed` tracked
- [ ] Scroll to FAQ → `pricing_faq_viewed` tracked
- [ ] Start checkout → `begin_checkout` tracked
- [ ] Checkout created → `add_payment_info` tracked
- [ ] Complete purchase → `purchase` tracked (client & server)
- [ ] Cancel subscription → `refund` tracked (server)

## Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Backend (.env)
```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=... # Generate in Firebase Console → Settings → Measurement Protocol API secrets
```

### Generating GA4 API Secret

1. Go to Firebase Console → Settings → Data Streams
2. Select your web stream
3. Scroll to "Measurement Protocol API secrets"
4. Click "Create" and copy the secret value

### Cookie Consent

Analytics respects user cookie preferences via `CookieConsent` component:

**Location:** [apps/web/components/CookieConsent.tsx](../apps/web/components/CookieConsent.tsx)

Users can:
- Accept all cookies (analytics enabled)
- Reject cookies (analytics disabled)
- Change preferences anytime via cookie settings

### Analytics Context

The `AnalyticsProvider` wraps the entire app and manages analytics state:

**Location:** [apps/web/contexts/AnalyticsContext.tsx](../apps/web/contexts/AnalyticsContext.tsx)

```tsx
// Usage in components
import { useAnalytics } from '@/contexts/AnalyticsContext';

const { trackEvent } = useAnalytics();

trackEvent('custom_event', {
  param1: 'value1',
  param2: 'value2'
});
```

## Revenue Reporting

### Expected GA4 Reports

With this implementation, you'll see data in:

1. **Monetization Overview**: Total revenue, ARPU, LTV
2. **E-commerce Purchases**: Purchase events, transaction details
3. **Purchase Journey**: Funnel visualization from pricing → purchase
4. **Product Performance**: Revenue by subscription tier
5. **User Lifetime Value**: Predicted LTV based on purchase patterns

### Custom Dimensions

The implementation sets these custom user properties:

- `subscription_tier`: Current tier (free, professional, payg)
- `user_type`: authenticated vs anonymous
- `locale`: User's selected language

## Troubleshooting

### Events Not Appearing

1. Check browser console for analytics logs
2. Verify Firebase config is correct
3. Check cookie consent is accepted
4. Look for errors in Network tab (requests to google-analytics.com)

### Server Events Not Working

1. Verify `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` are set
2. Check backend logs for analytics errors
3. Test debug endpoint manually
4. Ensure Stripe webhooks are firing correctly

### Revenue Mismatch

1. Compare Stripe dashboard revenue with GA4
2. Check for duplicate purchase events
3. Verify currency codes match
4. Ensure both client and server events fire

## Best Practices

1. **Always validate events** in DebugView before pushing to production
2. **Use helper functions** for consistent parameter formatting
3. **Track errors** with `checkout_error` and similar events
4. **Server-side validation** ensures accurate revenue tracking
5. **Respect user privacy** with proper cookie consent
6. **Test multi-currency** scenarios thoroughly
7. **Monitor event volume** to stay within GA4 limits

## References

- [GA4 E-commerce Implementation Guide](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Firebase Analytics Events](https://firebase.google.com/docs/analytics/events)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
