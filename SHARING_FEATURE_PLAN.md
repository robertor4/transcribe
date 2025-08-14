# Transcript Sharing Feature Implementation Plan

## Overview
Implement a feature to share transcripts via unique shareable links that can be sent via email. Users will be able to generate a public link for their transcripts that others can view without authentication.

## Implementation Steps

### 1. Backend API Changes (NestJS)

#### a. Update Shared Types Package
- Add new fields to `Transcription` type for sharing functionality:
  - `shareToken?: string` - Unique token for public access
  - `shareSettings?: { enabled: boolean; expiresAt?: Date; viewCount?: number }`
  - `sharedAt?: Date`

#### b. Create Share Endpoints in TranscriptionController
- `POST /transcriptions/:id/share` - Generate share link
- `GET /transcriptions/shared/:shareToken` - Get shared transcript (no auth required)
- `DELETE /transcriptions/:id/share` - Revoke share link
- `PUT /transcriptions/:id/share-settings` - Update share settings (expiry, etc.)

#### c. Update TranscriptionService
- Add methods for generating unique share tokens (using crypto.randomBytes)
- Store share tokens in Firestore with the transcription
- Implement public access logic for shared transcripts
- Track view counts for shared links

#### d. Create Email Service with Resend
- Integrate with **Resend** as the email provider
- Install Resend SDK: `npm install resend`
- Create email templates for sharing transcripts
- Add endpoint: `POST /transcriptions/:id/share/email` to send share link via email
- Configure Resend API key in environment variables

### 2. Frontend Changes (Next.js)

#### a. Create Share Modal Component
- UI for generating/revoking share links
- Copy link to clipboard functionality
- Email sharing form with recipient input
- Display share settings (expiry date, view count)
- QR code generation for mobile sharing

#### b. Update TranscriptionList Component
- Add share button to each transcript item
- Show share status indicator (icon when shared)
- Quick copy link action for already shared items

#### c. Create Public Share View Page
- New route: `/[locale]/shared/[shareToken]`
- Read-only view of transcript without authentication
- Include transcript text, summary, and analysis
- Disable editing/commenting features
- Add branding/watermark for shared content

#### d. Update API Client
- Add methods for share endpoints
- Handle share token generation and revocation
- Implement email sending functionality

### 3. Security Considerations
- Generate cryptographically secure share tokens (32+ characters)
- Implement rate limiting for share link generation
- Add optional expiry dates for shared links
- Track and limit view counts if needed
- Ensure shared views don't expose user data
- Add CORS headers for shared endpoints

### 4. Database Changes
- Add composite index for shareToken field in Firestore
- Consider creating separate 'shares' collection for analytics

### 5. Internationalization
- Add translations for share UI elements
- Localize email templates
- Support for share page in all languages

### 6. Features to Include
- One-click share link generation
- Copy to clipboard with confirmation
- Email sharing with custom message
- QR code for mobile sharing
- Share link management (view all active shares)
- Analytics for shared links (view count, last accessed)
- Optional password protection for sensitive transcripts
- Embed widget for sharing on websites

## Files to Modify/Create

### Backend:
- `/packages/shared/src/types.ts` - Add share-related types
- `/apps/api/src/transcription/transcription.controller.ts` - Add share endpoints
- `/apps/api/src/transcription/transcription.service.ts` - Add share logic
- `/apps/api/src/email/email.module.ts` (NEW) - Email module
- `/apps/api/src/email/email.service.ts` (NEW) - Email service with Resend
- `/apps/api/src/email/templates/` (NEW) - Email templates

### Frontend:
- `/apps/web/components/ShareModal.tsx` (NEW) - Share UI component
- `/apps/web/components/TranscriptionList.tsx` - Add share buttons
- `/apps/web/app/[locale]/shared/[shareToken]/page.tsx` (NEW) - Public view page
- `/apps/web/lib/api.ts` - Add share API methods
- `/apps/web/messages/[locale].json` - Add translations

## Environment Variables to Add

### Backend (.env):
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

## Testing Strategy
- Unit tests for token generation
- E2E tests for share flow
- Security testing for unauthorized access
- Load testing for shared links
- Email delivery testing with Resend test mode

## Implementation Order
1. Update shared types package
2. Implement backend share endpoints
3. Set up Resend email service
4. Create frontend share modal
5. Build public share view page
6. Add share buttons to transcript list
7. Implement email sending
8. Add translations
9. Write tests
10. Deploy and monitor