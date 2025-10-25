# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **CRITICAL: Quota Enforcement on Upload**: Fixed quota checking to run AFTER file parsing
  - Free tier users can now properly be blocked from uploading files exceeding 30-minute duration limit
  - Free tier users can now be blocked from exceeding 3 transcriptions/month limit
  - Moved quota checks into controller methods (after FileInterceptor) instead of using guards
  - Root cause: Guards run BEFORE interceptors, so file wasn't parsed yet when guard ran
  - Previous approach using `SubscriptionGuard` failed silently because `request.file` was undefined
  - Both `/upload` and `/upload-batch` endpoints now check quotas after file validation
  - Added `estimateDuration()` method to controller for duration estimation
  - Fixes issue where 74-minute file was processed on free account that should have been rejected
  - Fixes issue where users could exceed transcription count limits (e.g., 5/3 transcriptions)
- **Quota Exceeded User Experience**: Replaced generic error messages with beautiful upgrade modals
  - Shows `QuotaExceededModal` when users hit any quota limit (transcriptions, duration, filesize, analyses)
  - Modal displays current usage, limit, tier-specific messaging, and direct link to pricing page
  - Integrated in `MoreAnalysesTab` for on-demand analysis quotas
  - Integrated in `FileUploader` for transcription upload quotas
  - All quota error codes properly detected and mapped to quota types
  - Fixed axios error interceptor to preserve original error structure (was transforming to plain objects)
  - Frontend now correctly detects HTTP 402 status and shows modal instead of generic "Upload failed"

### Changed
- **Landing Page Dark Mode Support**: Updated landing page to use shared PublicHeader component and added comprehensive dark mode styling
  - Replaced inline header with reusable PublicHeader component (consistent with pricing page)
  - Added dark mode variants to all major sections (Value Proposition, Benefits, How It Works, etc.)
  - Updated text colors, backgrounds, and gradients for proper dark mode contrast
  - Improved visual consistency across public-facing pages

### Fixed
- **ThemeToggle Hover Effect**: Fixed dark mode hover state for theme toggle button
  - Changed `dark:hover:bg-gray-800` to `dark:hover:bg-gray-700` to match UserProfileMenu
  - Hover effect now visible in dark mode (was same color as header background)

### Added
- **Account Deletion System**: Complete user account deletion with soft/hard delete options
  - **Soft Delete (Default)**: Marks user as deleted while preserving all data for potential recovery
    - Sets `isDeleted: true` and `deletedAt` timestamp in user document
    - Preserves transcriptions, analyses, storage files, and Stripe data
    - Allows account recovery by contacting support
  - **Hard Delete (Optional)**: Permanently removes all user data (GDPR-compliant)
    - Deletes all user transcriptions from Firestore
    - Deletes all generated analyses
    - Deletes all storage files from Firebase Storage
    - Deletes Firestore user document
    - Deletes Firebase Auth account
    - Returns statistics of deleted items (transcriptions, analyses, files)
  - **API Endpoint**: `DELETE /api/user/me?hardDelete=true` (requires authentication)
  - **Backend Services**:
    - `FirebaseService.softDeleteUser()` - Mark user as deleted
    - `FirebaseService.deleteUser()` - Hard delete user document
    - `FirebaseService.deleteUserTranscriptions()` - Batch delete transcriptions
    - `FirebaseService.deleteUserGeneratedAnalyses()` - Batch delete analyses
    - `FirebaseService.deleteUserStorageFiles()` - Delete all files in user's storage path
    - `UserService.deleteAccount()` - Orchestrates complete deletion process
  - **Type Updates**: Added `isDeleted` and `deletedAt` fields to User interface
- **Admin System**: Complete admin panel for user management
  - **Admin Role**: Added `ADMIN` role to UserRole enum (existing: `USER`)
  - **Admin Guard**: Backend guard to restrict endpoints to admin users only
  - **Admin Endpoints** (`/api/admin/*` - requires authentication + admin role):
    - `GET /admin/users` - List all users in the system
    - `GET /admin/users/tier/:tier` - Filter users by subscription tier
    - `GET /admin/users/:userId` - Get detailed user information
    - `DELETE /admin/users/:userId?hardDelete=true` - Delete any user (soft/hard)
  - **Admin Panel UI** (`/admin` route):
    - User list table with sorting and filtering
    - Statistics dashboard (total users, tier breakdown, deleted count)
    - Soft delete (preserve data) and hard delete (permanent) actions
    - Visual indicators for deleted users and admin accounts
    - Protection against deleting admin accounts
    - Accessible from user profile menu (Shield icon, only visible to admins)
  - **User Profile Menu**: Added "Admin Panel" link with Shield icon (only visible to admin users)
  - **Admin Scripts**:
    - `scripts/set-admin.js` - Promote users to admin role
    - `scripts/sync-auth-users.js` - Sync Firebase Auth users to Firestore (fixes missing users in admin panel)
    - `scripts/migrate-to-subscription-tiers.js` - Safe migration to new subscription tier system (backward compatible)
  - **Current Admin**: Set `dreamone4@gmail.com` as system administrator
- **Subscription Tier Migration**: Migrated all users to new subscription system
  - Added `subscriptionTier` field to all 11 users (set to 'free')
  - Added `usageThisMonth` tracking object to all users
  - Backward compatible: Old `subscription.type` field preserved for production
  - No breaking changes: Production code continues working with old fields

### Fixed
- **User Creation Error**: Fixed Firestore validation error when creating users with undefined fields
  - Filter out undefined values (e.g., `photoURL`) before saving to Firestore
  - Prevents error: "Cannot use undefined as a Firestore value"
  - Affects email/password signups where some profile fields are not provided
- **Admin Panel Date Display**: Fixed "Invalid Date" error in admin panel user list
  - Convert Firestore Timestamps to JavaScript Date objects in `getAllUsers()` and `getUsersByTier()`
  - Properly serialize dates (createdAt, updatedAt, deletedAt, subscription dates) for JSON response
- **Missing Users in Admin Panel**: Fixed admin panel showing only 9 of 12 users
  - Created `scripts/sync-auth-users.js` to sync Firebase Auth users to Firestore
  - Synced 3 missing users: atmo.sharmaine@gmail.com, dreamone4+test@gmail.com, test-unverified-1755698574137@example.com
  - Admin panel now shows all 12 users from Firebase Auth
- **Admin Panel UX Improvements**: Enhanced navigation and visual hierarchy
  - Moved "Back to Dashboard" button to top-right corner (next to Refresh)
  - Clean, uncluttered title area with proper visual hierarchy
  - Full dark mode support for all admin panel components (stats, table, badges, buttons)
  - Responsive design: button text hides on mobile for both action buttons
- **User Profile Menu Spacing**: Fixed inconsistent padding/margins in menu items
  - Admin Panel button now has proper bottom padding and margin matching other items
  - Added rounded hover states (`rounded-md`) to all menu buttons for better visual feedback
  - Wrapped Admin Panel in container div with border-bottom for proper separation
- **File Uploader Dark Mode**: Fixed poor contrast and visibility in dark mode
  - Error messages: Added dark variants (`dark:bg-red-900/20`, `dark:border-red-800`, `dark:text-red-300`)
  - Selected file cards: Changed from white to dark gray (`dark:bg-gray-700`, `dark:border-gray-600`)
  - File names: Light colored text in dark mode (`dark:text-gray-100`)
  - "Add more files" dropzone: Dark background with proper contrast (`dark:bg-gray-700`)
  - Processing mode buttons: Dark backgrounds and borders (`dark:bg-gray-800`, `dark:border-gray-600`)
  - Context textarea: Dark background and proper text/placeholder colors
  - Upload button disabled state: Dark gray background (`dark:bg-gray-600`)
  - Merge info box: Dark blue variant (`dark:bg-blue-900/20`, `dark:border-blue-800`)

### Changed
- **Pricing Page Polish**: Refinements based on user feedback for better UX and clarity
  - **Billing Toggle**: Redesigned as iOS-style switch (pink knob on gray track), defaults to Annual for better value proposition
  - **Professional Card**: Removed "RECOMMENDED" badge (kept "Most Popular" only to reduce visual clutter), removed pulse animation for cleaner look
  - **Professional Pricing**: Shows per-month price even for annual ($21.75/month with "Billed annually ($261/year)" note) for better clarity
  - **Hero Spacing**: Increased top padding to pt-32 for better separation from header
  - **Comparison Table**: Changed API access from X marks to "Coming soon" text to communicate future roadmap
  - **Navigation**: Removed "View detailed comparison" scroll button (users naturally scroll to see cards)
  - **Trust Badges Removed**: Removed all three trust badges from pricing page hero (misleading since credit card IS required for paid tiers)
  - **Professional CTA**: Changed "Start Free Trial" to "Get Started" (no trial system implemented yet)
  - **EUR Pricing**: Added automatic EUR pricing for non-English locales (nl, de, fr, es) - Professional: €27/month or €20/month annual, PAYG: €1.40/hour
  - **File Size Fix**: Corrected Professional tier max file size from 3GB to 5GB (matches actual system limits)
  - **Analysis Types**: Updated "All 6 analysis types" to "All analysis types" (future-proof, system has 8+ types)

### Added
- **Pricing Page Enhancements**: Complete UI/UX overhaul for improved conversion rates (estimated +15-30%)
  - **Billing Toggle**: Annual/monthly billing cycle switcher with "Save 25%" badge
  - **Trust Badges**: Three trust indicators in hero section (no credit card, 14-day trial, 10,000+ users)
  - **Enhanced Navigation**: Added Features and FAQ links to header with smooth scroll behavior
  - **Professional Card Prominence**: Increased scale (110%), gradient "Most Popular" badge, ring effect
  - **Money-Back Guarantee**: 30-day guarantee badge on Professional tier
  - **Improved CTA Hierarchy**: Free tier (primary pink), Professional (gradient), PAYG (outlined) with arrow icons and hover animations
  - **Standardized Features**: All tiers show same 10 features with icons, organized by categories (Transcription, Analysis, Collaboration, Support)
  - **Feature Icons**: Clock, FileText, Package, Zap, Globe, Share2, Headphones icons from lucide-react
  - **Currency Notice Relocation**: Moved to hero section with globe icon for better visibility
  - **Component Architecture**: New reusable components: BillingToggle, TrustBadges, FeatureIcon

### Added (Previous)
- **Phase 1 MVP Pricing Strategy**: Complete pricing infrastructure implementation (feature branch: `feature/pricing-mvp-phase1`)
  - **Three-tier pricing model**:
    - Free: 3 transcriptions/month, 30min max, 100MB max, 2 on-demand analyses/month
    - Professional: $29/month, 60 hours/month, unlimited transcriptions, overage at $0.50/hour
    - Pay-As-You-Go: $1.50/hour, no subscription, credits never expire
  - **Backend Infrastructure** (`apps/api/`):
    - Stripe Integration Module: Full Stripe API integration with multi-currency support (15+ currencies)
      - Checkout sessions for subscriptions and PAYG
      - Webhook handling (6 event types: checkout complete, subscription updates, payment success/failure)
      - Customer management, subscription lifecycle, overage billing
      - 8 REST endpoints: `/stripe/create-checkout-session`, `/stripe/create-payg-session`, `/stripe/cancel-subscription`, `/stripe/update-subscription`, `/stripe/subscription`, `/stripe/billing-history`, `/stripe/currencies`, `/stripe/webhook`
    - Usage Tracking Service: Comprehensive quota enforcement and analytics
      - Pre-flight quota checks with tier-specific limits
      - Post-processing usage tracking with actual duration
      - PAYG credit deduction
      - Overage calculation ($0.50/hour for Professional)
      - Usage statistics with warnings at 80% quota
    - Automated Schedulers (4 cron jobs):
      - Monthly usage reset (1st at 00:00 UTC)
      - Daily overage checks (02:00 UTC)
      - Daily usage warnings (10:00 UTC)
      - Monthly usage record cleanup (15th at 03:00 UTC)
    - Subscription Guards: Paywall enforcement before transcription/analysis
    - Custom Exception: `PaymentRequiredException` (HTTP 402) with error codes
    - Firebase Extensions: User CRUD with subscription tracking, Stripe customer lookups
  - **Frontend Implementation** (`apps/web/`):
    - Pricing Page (`/pricing`): Full pricing page with tier comparison
      - 3 pricing cards (Free, Professional, PAYG)
      - Feature comparison table
      - FAQ section (6 questions)
      - Multi-currency support notice
      - Dark mode support
    - Checkout Flow (`/checkout/*`):
      - Dynamic checkout page with Stripe integration
      - Success page with next steps
      - Cancel page with helpful guidance
      - Loading states and error handling
    - Components: `PricingCard`, `FeatureComparisonTable`, `PricingFAQ`
  - **Type System Extensions** (`packages/shared/`):
    - Extended `User` interface with subscription fields (tier, Stripe IDs, usage tracking, PAYG credits)
    - New types: `SubscriptionTier`, `UsageRecord`, `OverageCharge`
    - `SUBSCRIPTION_TIERS` constant with all tier definitions
  - **Multi-Currency Support**:
    - 15+ currencies: USD, EUR, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN
    - Automatic currency conversion via Stripe Adaptive Pricing
    - Locale-aware checkout (en, nl, de, fr, es)
    - Automatic VAT/sales tax calculation
  - **Complete Usage Pipeline**:
    1. SubscriptionGuard checks quota before processing
    2. Transcription processes with AssemblyAI/Whisper
    3. Duration extracted from result
    4. UsageService tracks actual usage after completion
    5. User monthly counters updated
    6. PAYG credits deducted if applicable
    7. Usage records created for analytics
  - **Frontend Subscription Management** (`apps/web/`):
    - Subscription Management Page (`/dashboard/settings/subscription`):
      - Current plan display with tier badge (Free/Professional/PAYG)
      - Usage visualization with progress bars and color-coded warnings
      - Billing history with downloadable invoices
      - Cancel subscription with feedback modal
      - PAYG credit display with "buy more" link
      - Overage warnings with cost calculation
    - Paywall Components (4 reusable components):
      - `QuotaExceededModal`: Modal shown when limits reached (5 quota types)
      - `UsageIndicator`: Progress bar with color-coded warnings (80% orange, 100% red)
      - `UpgradePrompt`: 3 variants (banner, card, inline) for CTAs throughout app
      - `PlanBadge`: Visual tier indicator with icons (Award, Crown, Zap)
    - Dark mode support for all new components
  - **Landing Page Enhancements**:
    - Pricing teaser section with 3-card overview (Free, Professional, PAYG)
    - "Pricing" link in header navigation
    - "View full pricing details" CTA link
    - Pricing link in footer (Product section)
  - **Internationalization (i18n)**:
    - Comprehensive English translation keys for all new features
    - Pricing page translations (`pricing.*`): hero, tiers, comparison, FAQ, CTA
    - Checkout flow translations (`checkout.*`): success, cancel, error states
    - Subscription management translations (`subscription.*`): plan details, usage, billing history, cancel modal
    - Paywall translations (`paywall.*`): quota exceeded modals, usage indicators, upgrade prompts
    - 150+ new translation keys added to `apps/web/messages/en.json`
  - **Documentation**:
    - Comprehensive implementation plan (`docs/2025-10-24_PRICING_MVP_IMPLEMENTATION_PLAN.md`)
    - Stripe setup guide (`docs/2025-10-24_STRIPE_SETUP_GUIDE.md`) - 30-minute configuration walkthrough
    - Launch checklist (`docs/2025-10-24_PRICING_MVP_LAUNCH_CHECKLIST.md`) - 6-phase launch plan
    - Deployment checklist (`docs/2025-10-24_PRICING_MVP_DEPLOYMENT_CHECKLIST.md`) - Production deployment guide with rollback procedures

### Fixed
- **Share Page Analysis Display**: Fixed share screen only showing "Full Transcript" tab without analyses
  - Made `AnalysisTabs` component work with both authenticated and unauthenticated contexts
  - Conditionally hide "More Analyses" tab on public share pages (requires authentication)
  - Conditionally hide translation feature on share pages (requires auth tokens)
  - Fixed backend `getSharedTranscription` to support both old format (`analyses`) and new format (`coreAnalyses`)
  - Share pages now correctly display all included analyses (Summary, Action Items, Communication Styles, etc.)
- **Next.js 15 Hydration Error**: Fixed `lang` attribute mismatch in share page layout
  - Root cause: Share page layout dynamically sets `lang` attribute based on `Accept-Language` header
  - Server-side language detection (from header) can differ from client-side, causing hydration mismatch
  - Applied `suppressHydrationWarning` to share layout `<html>` tag to suppress expected mismatch
  - Also applied to root layout per Next.js 15 recommendations
  - Fixed date rendering: moved `new Date().getFullYear()` to client-side useEffect
  - Added `mounted` state check to prevent rendering dates before client hydration
  - Fixed date formatting to ensure consistent output between server and client

### Added
- **On-Demand Analysis System**: Revolutionary new analysis workflow that reduces costs and improves UX
  - 15 analysis templates across 3 categories (Professional, Content Creation, Specialized)
  - Featured templates: Emotional Intelligence, Influence & Persuasion, Personal Development
  - Content templates: Blog Post, Email, LinkedIn, Meeting Minutes, FAQ, Training
  - Specialized templates: Executive Briefing, Sales Analysis, Customer Feedback, Risk Assessment, Tech Docs, Conflict Analysis
  - "More Analyses" tab with template catalog and generated analysis management
  - On-demand generation allows users to only pay for analyses they need
  - Template metadata: category, icon, estimated time, model preference
  - Individual analysis deletion capability
- New shared TypeScript types: `AnalysisTemplate`, `GeneratedAnalysis`, `CoreAnalyses`
- New backend services: `AnalysisTemplateService` (read-only), `OnDemandAnalysisService` (CRUD)
- 6 new Firebase methods for generated analyses collection (CRUD operations)
- 4 new API endpoints:
  - `GET /transcriptions/analysis-templates` - List all available templates
  - `POST /transcriptions/:id/generate-analysis` - Generate analysis from template
  - `GET /transcriptions/:id/analyses` - List user's generated analyses
  - `DELETE /transcriptions/:id/analyses/:analysisId` - Delete generated analysis
- Frontend API methods: `getAnalysisTemplates`, `generateAnalysis`, `getUserAnalyses`, `deleteAnalysis`
- `MoreAnalysesTab` React component with template catalog and analysis viewer
- Horizontal scrollable tab navigation with chevron arrows and scroll indicators
- `.scrollbar-hide` CSS utility for cross-browser scrollbar hiding
- Backward compatibility adapter for old transcriptions with `analyses` field
- CHANGELOG.md file to track all project changes
- Changelog maintenance process documentation
- Context information display in Details tab showing user-provided context from upload

### Changed
- **Core Analyses Reduction**: New transcriptions now generate only 4 core analyses (down from 6)
  - Always generated: Summary (GPT-5), Action Items (GPT-5-mini), Communication (GPT-5-mini), Transcript
  - Removed from auto-generation: Emotional IQ, Influence, Personal Development (now on-demand)
  - Cost savings: 22% reduction per transcription (~$0.032 vs ~$0.041)
- **"Email Summary" → "Executive Brief" Template Enhancement**: Transformed generic email template into showcase feature
  - New name: "Executive Brief" (showcases AI sophistication)
  - Professional category and featured status (high visibility)
  - Upgraded to GPT-5 for premium quality
  - Comprehensive executive communications prompt with BLUF structure
  - Strategic tone focused on decisions, risks, and business impact
  - Demonstrates template system's power for future custom templates
- **More Analyses Tab - Comprehensive UI/UX Enhancement**: Professional polish with 10 major improvements
  - Category badges now have proper dark mode variants with 30% opacity backgrounds
  - Selected analysis cards increased to 40% opacity with pink shadow for better visibility
  - Analysis content area styled with subtle background, rounded corners, and "Copy to Clipboard" button
  - Timestamp formatting improved with icons (Clock, CPU, Zap) and compact display format
  - Visual separators added between template categories for better scanning
  - Generate buttons globally disabled during processing with pulse animation on active card
  - Template cards enhanced with hover effects (shadow, transform, dark mode glow)
  - "Your Analyses" section visually separated with background shade and padding
  - Empty state redesigned with gradient background, CTA button for featured template, and animated Sparkles icon
  - Mobile responsive tabs implemented (Templates/Your Analyses switcher) for better small-screen UX
- `TranscriptionService.generateAllAnalyses()` deprecated, replaced with `generateCoreAnalyses()`
- `TranscriptionService.generateSummaryWithModel()` now accepts custom prompts for template support
- Transcription processor updated to use `coreAnalyses` field instead of `analyses`
- Transcription data model: added `coreAnalyses` and `generatedAnalysisIds` fields
- `AnalysisTabs` component now supports dynamic "More Analyses" tab with horizontal scrollable navigation
- Tab navigation redesigned with horizontal scrolling, arrow buttons, and auto-scroll to active tab
- Tab order optimized: core analyses first, "More Analyses" before "Details" for better information hierarchy
- `TranscriptionList` component updated to handle both old and new data formats seamlessly
- Landing page converted to client component to support authentication checks
- Header navigation now shows "Go to Dashboard" button for authenticated users instead of "Login/Get Started"
- Mobile navigation updated to show "Go to Dashboard" link for authenticated users

### Fixed
- **NestJS route ordering issue**: Moved analysis-templates routes before `:id` route to prevent path collision
  - Fixed 400 error when accessing `/transcriptions/analysis-templates`
  - Specific routes now correctly prioritized over parameterized routes
- **On-demand analysis generation bug**: Fixed custom prompts not including transcript text
  - Template-based analyses now correctly receive the full transcript
  - Added proper context and language instruction handling for custom prompts
  - Matches the same prompt structure used by core analyses

### Removed

---

## [Previous Changes - October 2024]

### Added
- Gmail SMTP email service with domain alias support for sharing transcripts
- WebSocket resilience features with automatic polling fallback
- Extended WebSocket timeout from 5 to 10 minutes for long transcriptions
- Disk space management tools and documentation
- Redis health check diagnostic tools
- Comprehensive deployment documentation with GitHub Actions workflows

### Changed
- Upgraded from GPT-4o to GPT-5 for AI analysis (50% cost reduction on input tokens)
- Consolidated content rendering into AnalysisContentRenderer component
- Firebase Storage bucket format to new `.firebasestorage.app` standard
- Model selection strategy: GPT-5 for primary summaries, GPT-5-mini for secondary analyses

### Fixed
- All ESLint errors across the codebase
- TypeScript build errors in AnalysisTabs and ShareModal components
- Redis connectivity issues with improved health checks
- WebSocket connection stability with automatic reconnection logic

---

## How to Use This Changelog

### For Developers
When making changes to the codebase, always update the `[Unreleased]` section with:
- **Added**: New features, files, or capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes and error resolutions
- **Removed**: Deprecated or deleted features

### Changelog Entry Format
```markdown
- Brief description of change [Component/File affected if relevant]
```

### Before Release
When preparing a release:
1. Move items from `[Unreleased]` to a new version section
2. Add version number and release date: `## [1.0.0] - 2024-10-23`
3. Create fresh `[Unreleased]` section for next changes

### Commit Messages
Reference changelog in commits when appropriate:
```
git commit -m "feat: Add user profile settings (see CHANGELOG.md)"
```
