# Firebase Analytics Implementation

## Overview
Neural Summary now includes Firebase Analytics (Google Analytics for Firebase) to track user behavior, feature usage, and performance metrics. This implementation is privacy-focused and GDPR compliant.

## Architecture

### Components
1. **Firebase Analytics** (`/apps/web/lib/firebase.ts`)
   - Integrated with existing Firebase configuration
   - Initializes only in browser environment
   - Uses measurement ID from environment variables

2. **Analytics Context** (`/apps/web/contexts/AnalyticsContext.tsx`)
   - Centralized event tracking
   - User consent management
   - Event enrichment with timestamps and user info
   - Debug logging in development

3. **Page Tracking Hook** (`/apps/web/hooks/usePageTracking.ts`)
   - Automatic page view tracking
   - Extracts locale and page information
   - Tracks special pages (landing, dashboard, pricing)

4. **Cookie Consent** (`/apps/web/components/CookieConsent.tsx`)
   - GDPR-compliant consent banner
   - Expandable privacy details
   - Persistent consent storage in localStorage

## Events Tracked

### User Journey Events
- `signup_started` - User begins registration
- `signup_completed` - Successful account creation
- `login` - User authentication (email/Google)
- `logout` - User signs out
- `email_verified` - Email verification completed
- `password_reset_requested` - Password reset initiated
- `password_reset_completed` - Password successfully reset

### Core Feature Events
- `audio_uploaded` - File uploaded for transcription
- `transcription_started` - Processing begins
- `transcription_completed` - Successful transcription
- `transcription_failed` - Processing error
- `summary_generated` - AI summary created
- `custom_analysis_requested` - Custom prompt used
- `speaker_detection_enabled` - Diarization activated

### Engagement Events
- `transcript_shared` - Share link created
- `transcript_downloaded` - File downloaded
- `transcript_deleted` - Content removed
- `share_link_accessed` - Public link viewed

### Page View Events
- `page_view` - All page navigation
- `landing_page_viewed` - Marketing page views
- `dashboard_viewed` - User dashboard access
- `pricing_viewed` - Pricing page views

## User Properties
- `email_verified` - Email verification status
- `provider` - Authentication method (email/google)
- `subscription_tier` - User plan level
- `preferred_language` - UI language preference

## Privacy & Compliance

### Data Collection
**We collect:**
- Page views and navigation patterns
- Feature usage metrics
- Performance and error data
- Device and browser information

**We DON'T collect:**
- Audio file contents
- Transcription text
- Personal data without consent
- Data for advertising

### Consent Management
- Cookie consent banner on first visit
- Opt-in/out functionality
- Consent stored in localStorage
- Analytics disabled by default until consent

## Configuration

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Testing Analytics
1. Enable debug mode in browser console:
```javascript
localStorage.setItem('analytics_consent', 'true');
```

2. View events in Firebase Console:
   - Go to Firebase Console > Analytics > DebugView
   - Events appear in real-time during development

3. Check browser console for event logs (development only)

## Implementation Locations

### Event Tracking Added To:
- `/apps/web/app/[locale]/dashboard/page.tsx` - Dashboard navigation
- `/apps/web/components/FileUploader.tsx` - Upload and transcription events
- `/apps/web/components/LoginForm.tsx` - Authentication events
- `/apps/web/components/SignupForm.tsx` - Registration events

### Analytics Provider Hierarchy:
```tsx
<AuthProvider>
  <AnalyticsProvider>
    <PageTracker />
    {children}
    <CookieConsent />
  </AnalyticsProvider>
</AuthProvider>
```

## Adding New Events

To track a new event:

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleAction = () => {
    trackEvent('my_custom_event', {
      parameter1: 'value1',
      parameter2: 123
    });
  };
}
```

Add the event type to `AnalyticsEventName` in `AnalyticsContext.tsx` for type safety.

## Dashboard & Reporting

Access analytics data:
1. Firebase Console > Analytics > Dashboard
2. View real-time data in Realtime view
3. Create custom audiences and funnels
4. Export to BigQuery for advanced analysis

## Best Practices

1. **Event Naming**: Use snake_case and descriptive names
2. **Parameters**: Include relevant context but avoid PII
3. **Timing**: Track events at the moment of user action
4. **Error Tracking**: Always track failures with error details
5. **Performance**: Batch events when possible

## Troubleshooting

### Events Not Appearing
1. Check consent status: `localStorage.getItem('analytics_consent')`
2. Verify Firebase configuration in browser console
3. Check network tab for analytics requests
4. Enable DebugView in Firebase Console

### Common Issues
- **Ad blockers**: May block Firebase Analytics
- **Browser privacy**: Strict settings may prevent tracking
- **Consent**: Analytics disabled without user consent