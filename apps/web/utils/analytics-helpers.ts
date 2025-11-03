/**
 * Analytics Helper Utilities
 *
 * Provides helper functions for formatting GA4 e-commerce events
 * following Google Analytics 4 recommended event schema.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

/**
 * GA4 Item structure for e-commerce events
 */
export interface GA4Item {
  item_id: string;           // e.g., "professional_monthly"
  item_name: string;         // e.g., "Professional Plan"
  item_category?: string;    // e.g., "Subscription"
  item_category2?: string;   // e.g., "Monthly"
  item_variant?: string;     // e.g., "monthly" or "annual"
  price: number;             // Item price
  quantity?: number;         // Default: 1
  currency?: string;         // e.g., "USD", "EUR"
}

/**
 * GA4 E-commerce Event Parameters
 */
export interface GA4EcommerceParams {
  currency: string;          // ISO 4217 currency code (USD, EUR, GBP)
  value: number;             // Total transaction value
  items: GA4Item[];          // Array of items
  transaction_id?: string;   // Unique transaction ID (e.g., Stripe session ID)
  affiliation?: string;      // Store or affiliation (default: "Neural Summary")
  coupon?: string;           // Coupon code if applied
  shipping?: number;         // Shipping cost (not applicable for SaaS)
  tax?: number;              // Tax amount
}

/**
 * Pricing tier configuration
 */
export type PricingTier = 'free' | 'professional' | 'payg';
export type BillingCycle = 'monthly' | 'annual' | 'one-time';

/**
 * Format pricing tier as GA4 item
 *
 * @param tier - Pricing tier (free, professional, payg)
 * @param price - Price in the specified currency
 * @param currency - ISO 4217 currency code
 * @param billingCycle - Billing cycle (monthly, annual, one-time)
 * @returns GA4Item formatted for analytics
 */
export function formatPricingTierItem(
  tier: PricingTier,
  price: number,
  currency: string = 'USD',
  billingCycle: BillingCycle = 'monthly'
): GA4Item {
  const tierNames: Record<PricingTier, string> = {
    free: 'Free Plan',
    professional: 'Professional Plan',
    payg: 'Pay-As-You-Go Credits'
  };

  const itemId = tier === 'payg'
    ? 'payg_credits'
    : `${tier}_${billingCycle}`;

  return {
    item_id: itemId,
    item_name: tierNames[tier],
    item_category: tier === 'payg' ? 'Credits' : 'Subscription',
    item_category2: billingCycle === 'one-time' ? 'One-Time' : billingCycle === 'annual' ? 'Annual' : 'Monthly',
    item_variant: billingCycle,
    price: price,
    quantity: 1,
    currency: currency
  };
}

/**
 * Format view_item event parameters
 *
 * @param tier - Pricing tier
 * @param price - Price in the specified currency
 * @param currency - ISO 4217 currency code
 * @param billingCycle - Billing cycle
 * @returns GA4 event parameters for view_item
 */
export function formatViewItemParams(
  tier: PricingTier,
  price: number,
  currency: string = 'USD',
  billingCycle: BillingCycle = 'monthly'
): GA4EcommerceParams {
  return {
    currency,
    value: price,
    items: [formatPricingTierItem(tier, price, currency, billingCycle)]
  };
}

/**
 * Format select_item event parameters
 *
 * @param tier - Pricing tier
 * @param price - Price in the specified currency
 * @param currency - ISO 4217 currency code
 * @param billingCycle - Billing cycle
 * @param itemListName - Name of the list (e.g., "Pricing Page", "Dashboard Upgrade")
 * @returns GA4 event parameters for select_item
 */
export function formatSelectItemParams(
  tier: PricingTier,
  price: number,
  currency: string = 'USD',
  billingCycle: BillingCycle = 'monthly',
  itemListName: string = 'Pricing Page'
): GA4EcommerceParams & { item_list_name: string } {
  return {
    currency,
    value: price,
    items: [formatPricingTierItem(tier, price, currency, billingCycle)],
    item_list_name: itemListName
  };
}

/**
 * Format begin_checkout event parameters
 *
 * @param tier - Pricing tier
 * @param price - Price in the specified currency
 * @param currency - ISO 4217 currency code
 * @param billingCycle - Billing cycle
 * @param coupon - Optional coupon code
 * @returns GA4 event parameters for begin_checkout
 */
export function formatBeginCheckoutParams(
  tier: PricingTier,
  price: number,
  currency: string = 'USD',
  billingCycle: BillingCycle = 'monthly',
  coupon?: string
): GA4EcommerceParams {
  return {
    currency,
    value: price,
    items: [formatPricingTierItem(tier, price, currency, billingCycle)],
    affiliation: 'Neural Summary',
    ...(coupon && { coupon })
  };
}

/**
 * Format purchase event parameters
 *
 * @param tier - Pricing tier
 * @param price - Price in the specified currency
 * @param currency - ISO 4217 currency code
 * @param transactionId - Unique transaction ID (Stripe session/subscription ID)
 * @param billingCycle - Billing cycle
 * @param tax - Optional tax amount
 * @param coupon - Optional coupon code
 * @returns GA4 event parameters for purchase
 */
export function formatPurchaseParams(
  tier: PricingTier,
  price: number,
  currency: string = 'USD',
  transactionId: string,
  billingCycle: BillingCycle = 'monthly',
  tax?: number,
  coupon?: string
): GA4EcommerceParams {
  return {
    currency,
    value: price,
    items: [formatPricingTierItem(tier, price, currency, billingCycle)],
    transaction_id: transactionId,
    affiliation: 'Neural Summary',
    ...(tax && { tax }),
    ...(coupon && { coupon })
  };
}

/**
 * Format refund event parameters
 *
 * @param tier - Pricing tier
 * @param price - Refund amount
 * @param currency - ISO 4217 currency code
 * @param transactionId - Original transaction ID
 * @param billingCycle - Billing cycle
 * @returns GA4 event parameters for refund
 */
export function formatRefundParams(
  tier: PricingTier,
  price: number,
  currency: string = 'USD',
  transactionId: string,
  billingCycle: BillingCycle = 'monthly'
): GA4EcommerceParams {
  return {
    currency,
    value: price,
    items: [formatPricingTierItem(tier, price, currency, billingCycle)],
    transaction_id: transactionId,
    affiliation: 'Neural Summary'
  };
}

/**
 * Extract currency from locale
 * Fallback to USD if locale not recognized
 *
 * @param locale - Locale string (e.g., "en", "fr", "de")
 * @returns ISO 4217 currency code
 */
export function getCurrencyFromLocale(locale: string): string {
  const currencyMap: Record<string, string> = {
    'en': 'USD',
    'nl': 'EUR',
    'de': 'EUR',
    'fr': 'EUR',
    'es': 'EUR',
    'en-US': 'USD',
    'en-GB': 'GBP'
  };

  return currencyMap[locale] || 'USD';
}

/**
 * Get pricing tier from URL or tier string
 *
 * @param tierParam - Tier parameter from URL
 * @returns Validated pricing tier
 */
export function parsePricingTier(tierParam: string): PricingTier {
  const validTiers: PricingTier[] = ['free', 'professional', 'payg'];
  const tier = tierParam.toLowerCase() as PricingTier;

  return validTiers.includes(tier) ? tier : 'free';
}

/**
 * Get billing cycle from URL parameter
 *
 * @param cycleParam - Cycle parameter from URL
 * @returns Validated billing cycle
 */
export function parseBillingCycle(cycleParam: string | null): BillingCycle {
  if (!cycleParam) return 'monthly';

  const cycle = cycleParam.toLowerCase();
  if (cycle === 'annual' || cycle === 'yearly') return 'annual';
  if (cycle === 'one-time' || cycle === 'payg') return 'one-time';

  return 'monthly';
}
