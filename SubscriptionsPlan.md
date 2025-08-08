# Subscription System Implementation Plan

## Tier Structure & Pricing

### Free Tier ($0/month)
- 3 transcriptions per month
- Max file size: 25MB (no splitting)
- Max duration: 30 minutes
- Basic email summary (text only)
- No sharing features
- No audio summaries

### Pro Tier ($19/month)
- 50 transcriptions per month
- Max file size: 250MB (with splitting)
- Max duration: 2 hours
- Advanced email summaries (HTML formatted)
- Share via public link (7-day expiry)
- 10 audio summaries per month
- Priority processing
- Export to PDF/DOCX

### Business Tier ($49/month)
- Unlimited transcriptions
- Max file size: 500MB (with splitting)
- Max duration: 4 hours
- Premium email summaries with branding
- Unlimited sharing with custom expiry
- Unlimited audio summaries
- Highest priority processing
- API access
- Team collaboration (up to 5 users)
- Custom vocabulary support

## Implementation Steps

### 1. Database Schema Updates
- Add subscription collection with plan details, payment info
- Add usage_tracking collection for monthly limits
- Update user model with subscription reference
- Add payment_history collection

### 2. PayPal Integration
- Implement PayPal Subscriptions SDK
- Create subscription plans in PayPal
- Handle webhooks for payment events
- Implement subscription management endpoints

### 3. Usage Tracking System
- Track transcriptions per user per month
- Track audio summary generations
- Implement quota checks before processing
- Reset counters monthly via cron job

### 4. Email Summary Feature
- Integrate SendGrid/Resend for email delivery
- Create HTML email templates
- Add email endpoint to transcription API
- Store email history

### 5. Share Summary Feature
- Generate shareable links with UUID
- Create public view page (no auth required)
- Implement link expiration logic
- Track share analytics

### 6. Audio Summary Generation
- Integrate OpenAI TTS API
- Generate MP3 from summary text
- Store in Firebase Storage
- Add download endpoint

### 7. Subscription Management UI
- Create pricing page
- Build subscription dashboard
- Add upgrade/downgrade flows
- Payment method management
- Usage statistics display

### 8. API Updates
- Add subscription validation middleware
- Implement rate limiting per tier
- Update upload endpoint with quota checks
- Add subscription status to user endpoints

## Technical Details

### Payment Processing
- PayPal REST SDK for Node.js
- Subscription management via PayPal Subscriptions API
- Webhook handling for payment events

### Email Service
- SendGrid or Resend for transactional emails
- HTML email templates with responsive design
- Email tracking and analytics

### Audio Generation
- OpenAI TTS API for audio generation
- MP3 format output
- Configurable voice options per tier

### Infrastructure
- Bull queue priorities based on subscription tier
- Redis for usage tracking cache
- Firestore composite indexes for usage queries

## Security Considerations

- Secure PayPal webhook verification
- Rate limiting on all endpoints
- Signed URLs for shared content
- Email verification for sharing
- Audit logs for subscription changes
- PCI compliance for payment handling

## Database Models

### Subscription Collection
```typescript
interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  paypalSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Usage Tracking Collection
```typescript
interface UsageTracking {
  id: string;
  userId: string;
  month: string; // YYYY-MM format
  transcriptionCount: number;
  audioSummaryCount: number;
  emailCount: number;
  shareCount: number;
  totalFileSize: number;
  totalDuration: number;
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment History Collection
```typescript
interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  paypalPaymentId: string;
  invoiceUrl?: string;
  createdAt: Date;
}
```

### Shared Link Collection
```typescript
interface SharedLink {
  id: string;
  transcriptionId: string;
  userId: string;
  shareId: string; // UUID for public access
  expiresAt: Date;
  accessCount: number;
  password?: string; // Optional password protection
  createdAt: Date;
}
```

## API Endpoints

### Subscription Management
- `GET /api/subscription/plans` - Get available plans
- `GET /api/subscription/current` - Get user's current subscription
- `POST /api/subscription/create` - Create new subscription
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/upgrade` - Upgrade plan
- `POST /api/subscription/downgrade` - Downgrade plan

### Usage Tracking
- `GET /api/usage/current` - Get current month usage
- `GET /api/usage/history` - Get usage history

### Sharing
- `POST /api/transcriptions/:id/share` - Create share link
- `GET /api/share/:shareId` - Access shared transcription (public)
- `DELETE /api/transcriptions/:id/share` - Revoke share link

### Email & Audio
- `POST /api/transcriptions/:id/email` - Send email summary
- `POST /api/transcriptions/:id/audio` - Generate audio summary
- `GET /api/transcriptions/:id/audio` - Download audio summary

## UI Components

### Pricing Page
- Plan comparison table
- Feature highlights
- FAQ section
- Testimonials
- Call-to-action buttons

### Subscription Dashboard
- Current plan details
- Usage statistics with progress bars
- Billing history
- Payment method management
- Upgrade/downgrade buttons

### Share Modal
- Link generation
- Expiry date picker
- Password protection option
- Copy link button
- QR code generation

## Implementation Timeline

### Phase 1 (Week 1-2)
- Database schema updates
- Basic subscription model
- Usage tracking implementation

### Phase 2 (Week 3-4)
- PayPal integration
- Payment processing
- Webhook handling

### Phase 3 (Week 5-6)
- Email summary feature
- Share functionality
- Public view pages

### Phase 4 (Week 7-8)
- Audio summary generation
- UI components
- Subscription management dashboard

### Phase 5 (Week 9-10)
- Testing and optimization
- Documentation
- Launch preparation