/**
 * Reusable Stripe mock creators for unit testing
 */
import Stripe from 'stripe';

/**
 * Creates a mock Stripe customer
 */
export function createMockStripeCustomer(
  overrides: Partial<Stripe.Customer> = {},
): Stripe.Customer {
  return {
    id: 'cus_test123',
    object: 'customer',
    email: 'test@example.com',
    name: 'Test User',
    metadata: {},
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    ...overrides,
  } as Stripe.Customer;
}

/**
 * Creates a mock Stripe subscription
 */
export function createMockStripeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60;

  return {
    id: 'sub_test123',
    object: 'subscription',
    customer: 'cus_test123',
    status: 'active',
    current_period_start: now,
    current_period_end: thirtyDaysFromNow,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test123',
          object: 'subscription_item',
          price: {
            id: 'price_test123',
            object: 'price',
            unit_amount: 2900,
            currency: 'usd',
          },
          quantity: 1,
          current_period_start: now,
          current_period_end: thirtyDaysFromNow,
        },
      ],
      has_more: false,
      url: '/v1/subscription_items',
    },
    latest_invoice: 'in_test123',
    cancel_at_period_end: false,
    canceled_at: null,
    created: now,
    livemode: false,
    metadata: {},
    ...overrides,
  } as unknown as Stripe.Subscription;
}

/**
 * Creates a mock Stripe checkout session
 */
export function createMockStripeCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: 'cs_test123',
    object: 'checkout.session',
    mode: 'subscription',
    customer: 'cus_test123',
    subscription: 'sub_test123',
    payment_status: 'paid',
    status: 'complete',
    url: 'https://checkout.stripe.com/c/pay/cs_test123',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
    metadata: {
      userId: 'test-user-123',
      tier: 'professional',
      billing: 'monthly',
    },
    amount_total: 2900,
    currency: 'usd',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

/**
 * Creates a mock Stripe invoice
 */
export function createMockStripeInvoice(
  overrides: Partial<Stripe.Invoice> = {},
): Stripe.Invoice {
  return {
    id: 'in_test123',
    object: 'invoice',
    customer: 'cus_test123',
    subscription: 'sub_test123',
    status: 'paid',
    amount_paid: 2900,
    amount_due: 2900,
    currency: 'usd',
    billing_reason: 'subscription_cycle',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    metadata: {},
    ...overrides,
  } as unknown as Stripe.Invoice;
}

/**
 * Creates a mock Stripe webhook event
 */
export function createMockStripeEvent<T extends Stripe.Event.Data.Object>(
  type: string,
  data: T,
  overrides: Partial<Stripe.Event> = {},
): Stripe.Event {
  return {
    id: 'evt_test123',
    object: 'event',
    type,
    data: {
      object: data,
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
    api_version: '2023-10-16',
    ...overrides,
  } as Stripe.Event;
}

/**
 * Creates a complete mock Stripe client
 */
export function createMockStripeClient() {
  return {
    customers: {
      create: jest.fn().mockResolvedValue(createMockStripeCustomer()),
      retrieve: jest.fn().mockResolvedValue(createMockStripeCustomer()),
      update: jest.fn().mockResolvedValue(createMockStripeCustomer()),
      del: jest.fn().mockResolvedValue({ id: 'cus_test123', deleted: true }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue(createMockStripeSubscription()),
      retrieve: jest.fn().mockResolvedValue(createMockStripeSubscription()),
      update: jest.fn().mockResolvedValue(createMockStripeSubscription()),
      cancel: jest.fn().mockResolvedValue({
        ...createMockStripeSubscription(),
        status: 'canceled',
      }),
      list: jest.fn().mockResolvedValue({ data: [] }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue(createMockStripeCheckoutSession()),
        retrieve: jest
          .fn()
          .mockResolvedValue(createMockStripeCheckoutSession()),
      },
    },
    invoices: {
      create: jest.fn().mockResolvedValue(createMockStripeInvoice()),
      retrieve: jest.fn().mockResolvedValue(createMockStripeInvoice()),
      list: jest.fn().mockResolvedValue({ data: [] }),
      pay: jest.fn().mockResolvedValue(createMockStripeInvoice()),
    },
    invoiceItems: {
      create: jest.fn().mockResolvedValue({ id: 'ii_test123' }),
    },
    prices: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'price_test123',
        unit_amount: 2900,
        currency: 'usd',
      }),
      list: jest.fn().mockResolvedValue({ data: [] }),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'bps_test123',
          url: 'https://billing.stripe.com/session/test',
        }),
      },
    },
  };
}

/**
 * Helper to create PAYG checkout session metadata
 */
export function createPaygCheckoutMetadata(
  userId: string,
  hours: number,
  credits: number,
) {
  return {
    userId,
    type: 'payg',
    hours: hours.toString(),
    credits: credits.toString(),
  };
}

/**
 * Helper to create subscription checkout session metadata
 */
export function createSubscriptionCheckoutMetadata(
  userId: string,
  tier: 'professional' | 'business',
  billing: 'monthly' | 'yearly',
) {
  return {
    userId,
    type: 'subscription',
    tier,
    billing,
  };
}
