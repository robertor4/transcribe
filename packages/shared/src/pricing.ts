/**
 * Centralized Pricing Configuration
 *
 * This module contains all pricing data for the application, including:
 * - Base USD pricing for all subscription tiers
 * - Pay-as-you-go package configurations
 * - Currency conversion rates
 * - Locale-to-currency mappings
 * - Utility functions for pricing calculations and formatting
 *
 * Single source of truth for pricing across frontend and backend.
 */

// ============================================================================
// BASE PRICING (USD)
// ============================================================================

/**
 * Base pricing in USD - source of truth for all pricing
 * All other currencies are converted from these values
 */
export const BASE_PRICING = {
  usd: {
    professional: {
      monthly: 29,
      annual: 261, // $21.75/month when billed annually (25% discount)
      annualMonthly: 21.75, // Effective monthly rate for annual plan
    },
    payg: {
      hourly: 1.50,
      minimumPurchase: 15, // Minimum $15 purchase
      minimumHours: 10, // Gets you 10 hours minimum
    },
  },
} as const;

/**
 * Pay-as-you-go package tiers in USD
 * Each package offers bulk pricing for audio transcription hours
 */
export const PAYG_PACKAGES_USD = [
  { hours: 10, price: 15, savings: 0 },
  { hours: 20, price: 30, savings: 0 },
  { hours: 33, price: 50, savings: 0.50 }, // ~3% savings
  { hours: 67, price: 100, savings: 0.50 }, // ~3% savings
] as const;

// ============================================================================
// CURRENCY CONFIGURATION
// ============================================================================

/**
 * Currency conversion rates relative to USD
 * Format: 1 USD = X currency units
 *
 * Example: EUR: 0.92 means €0.92 = $1.00
 */
export const CURRENCY_CONVERSIONS = {
  USD: 1.0,
  EUR: 0.92, // Approximate conversion rate
  // Future currencies can be added here:
  // GBP: 0.79,
  // CAD: 1.35,
} as const;

export type SupportedCurrency = keyof typeof CURRENCY_CONVERSIONS;

/**
 * Currency metadata for display purposes
 */
export const CURRENCY_INFO: Record<SupportedCurrency, {
  code: string;
  symbol: string;
  name: string;
  format: 'prefix' | 'suffix'; // Where to place the symbol
}> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    format: 'prefix',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    format: 'prefix',
  },
};

/**
 * Locale to currency mapping
 * Determines which currency to display based on user's locale
 */
export const LOCALE_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  en: 'USD',
  nl: 'EUR', // Netherlands
  de: 'EUR', // Germany
  fr: 'EUR', // France
  es: 'EUR', // Spain
};

/**
 * Full locale codes for proper Intl.NumberFormat formatting
 * Maps our app locale codes to proper BCP 47 locale tags
 */
export const LOCALE_CODES: Record<string, string> = {
  en: 'en-US',
  nl: 'nl-NL',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
};

// ============================================================================
// TYPES
// ============================================================================

export interface PricingData {
  professional: {
    monthly: number;
    annual: number;
    annualMonthly: number;
    annualSavings: number;
    annualSavingsPercent: number;
  };
  payg: {
    hourly: number;
    minimumPurchase: number;
    minimumHours: number;
  };
}

export interface PaygPackage {
  hours: number;
  price: number;
  savings: number;
  effectiveHourlyRate: number;
}

export interface CurrencyData {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  format: 'prefix' | 'suffix';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a USD amount to another currency
 * @param amountUsd - Amount in USD
 * @param currency - Target currency code
 * @returns Converted amount, rounded to 2 decimal places
 */
export function convertFromUsd(amountUsd: number, currency: SupportedCurrency): number {
  const rate = CURRENCY_CONVERSIONS[currency];
  return Math.round(amountUsd * rate * 100) / 100;
}

/**
 * Get currency information for a given locale
 * @param locale - Locale code (e.g., 'en', 'nl', 'de')
 * @returns Currency data including code, symbol, and name
 */
export function getCurrencyForLocale(locale: string): CurrencyData {
  const currency = LOCALE_CURRENCY_MAP[locale] || 'USD';
  const info = CURRENCY_INFO[currency];
  return {
    code: currency,
    symbol: info.symbol,
    name: info.name,
    format: info.format,
  };
}

/**
 * Get all pricing data for a given locale
 * Automatically converts from USD to the locale's currency
 *
 * @param locale - Locale code (e.g., 'en', 'nl', 'de')
 * @returns Complete pricing data in the locale's currency
 */
export function getPricingForLocale(locale: string): PricingData {
  const currency = LOCALE_CURRENCY_MAP[locale] || 'USD';
  const baseUsd = BASE_PRICING.usd;

  // Convert professional tier pricing
  const professionalMonthly = convertFromUsd(baseUsd.professional.monthly, currency);
  const professionalAnnual = convertFromUsd(baseUsd.professional.annual, currency);
  const professionalAnnualMonthly = convertFromUsd(baseUsd.professional.annualMonthly, currency);

  // Calculate annual savings
  const annualSavings = (professionalMonthly * 12) - professionalAnnual;
  const annualSavingsPercent = Math.round((annualSavings / (professionalMonthly * 12)) * 100);

  // Convert PAYG pricing
  const paygHourly = convertFromUsd(baseUsd.payg.hourly, currency);
  const paygMinimumPurchase = convertFromUsd(baseUsd.payg.minimumPurchase, currency);

  return {
    professional: {
      monthly: professionalMonthly,
      annual: professionalAnnual,
      annualMonthly: professionalAnnualMonthly,
      annualSavings,
      annualSavingsPercent,
    },
    payg: {
      hourly: paygHourly,
      minimumPurchase: paygMinimumPurchase,
      minimumHours: baseUsd.payg.minimumHours,
    },
  };
}

/**
 * Get PAYG package options for a given currency
 * @param currency - Currency code
 * @returns Array of PAYG packages with prices in the specified currency
 */
export function getPaygPackages(currency: SupportedCurrency): PaygPackage[] {
  return PAYG_PACKAGES_USD.map(pkg => {
    const convertedPrice = convertFromUsd(pkg.price, currency);
    const effectiveHourlyRate = convertedPrice / pkg.hours;

    return {
      hours: pkg.hours,
      price: convertedPrice,
      savings: pkg.savings,
      effectiveHourlyRate: Math.round(effectiveHourlyRate * 100) / 100,
    };
  });
}

/**
 * Format a price with locale-aware number formatting
 * Uses Intl.NumberFormat for proper decimal separators, thousands separators,
 * and currency symbol placement according to locale conventions
 *
 * @param amount - Price amount
 * @param locale - Locale code (e.g., 'en', 'nl', 'de', 'fr', 'es')
 * @param options - Formatting options
 * @returns Formatted price string with proper locale formatting
 *
 * @example
 * formatPriceLocale(29, 'en') // "$29"
 * formatPriceLocale(27, 'nl') // "€ 27"
 * formatPriceLocale(1.50, 'en', { decimals: 2 }) // "$1.50"
 * formatPriceLocale(1.40, 'de', { decimals: 2 }) // "1,40 €"
 */
export function formatPriceLocale(
  amount: number,
  locale: string,
  options: {
    decimals?: number;
    includeCode?: boolean;
  } = {}
): string {
  const { decimals = 0, includeCode = false } = options;

  // Get currency for this locale
  const currency = LOCALE_CURRENCY_MAP[locale] || 'USD';
  const localeCode = LOCALE_CODES[locale] || 'en-US';

  // Use Intl.NumberFormat for locale-aware formatting
  const formatter = new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    currencyDisplay: includeCode ? 'code' : 'symbol',
  });

  return formatter.format(amount);
}

/**
 * Format a price with the appropriate currency symbol (legacy function)
 * @deprecated Use formatPriceLocale() for proper locale-aware formatting
 * @param amount - Price amount
 * @param currency - Currency code
 * @param options - Formatting options
 * @returns Formatted price string (e.g., "$29" or "€27")
 */
export function formatPrice(
  amount: number,
  currency: SupportedCurrency,
  options: {
    decimals?: number;
    includeCode?: boolean;
  } = {}
): string {
  const { decimals = 0, includeCode = false } = options;
  const info = CURRENCY_INFO[currency];

  // Round to specified decimal places
  const roundedAmount = decimals === 0
    ? Math.round(amount)
    : Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Format the number
  const formattedNumber = decimals === 0
    ? roundedAmount.toString()
    : roundedAmount.toFixed(decimals);

  // Add currency symbol
  const formattedPrice = info.format === 'prefix'
    ? `${info.symbol}${formattedNumber}`
    : `${formattedNumber}${info.symbol}`;

  // Optionally add currency code
  return includeCode ? `${formattedPrice} ${info.code}` : formattedPrice;
}

/**
 * Calculate annual savings for a given currency
 * @param currency - Currency code
 * @returns Object with savings amount and percentage
 */
export function calculateAnnualSavings(currency: SupportedCurrency): {
  amount: number;
  percent: number;
  monthlyEquivalent: number;
} {
  const pricing = BASE_PRICING.usd.professional;

  const monthly = convertFromUsd(pricing.monthly, currency);
  const annual = convertFromUsd(pricing.annual, currency);
  const annualMonthly = convertFromUsd(pricing.annualMonthly, currency);

  const savingsAmount = (monthly * 12) - annual;
  const savingsPercent = Math.round((savingsAmount / (monthly * 12)) * 100);

  return {
    amount: Math.round(savingsAmount),
    percent: savingsPercent,
    monthlyEquivalent: annualMonthly,
  };
}

/**
 * Get the minimum PAYG package for a given currency
 * @param currency - Currency code
 * @returns The minimum PAYG package (10 hours)
 */
export function getMinimumPaygPackage(currency: SupportedCurrency = 'USD'): PaygPackage {
  const packages = getPaygPackages(currency);
  return packages[0]; // First package is always the minimum
}
