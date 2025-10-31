# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Future Enhancements Documentation**: Created comprehensive backlog document for Transcript Correction feature
  - 16 enhancement categories covering UX, collaboration, AI, mobile, analytics, security
  - Prioritization matrix (high/low impact × high/low effort)
  - Recommended 4-quarter roadmap for 2026
  - Effort estimates and success criteria for each enhancement
  - Location: `docs/TRANSCRIPT_CORRECTION_FUTURE_ENHANCEMENTS.md`
- **Dark Mode Support for Transcript Correction Modal**: Added comprehensive dark mode styling to correction feature
  - Updated `TranscriptCorrectionModal` with dark mode classes for all UI elements
  - Updated `DiffViewer` component with dark mode support for diff display
  - Covers modal backdrop, headers, inputs, buttons, success/error/warning banners, and footer
  - Uses established dark mode patterns: `dark:bg-gray-800`, `dark:text-gray-100`, semantic colors with 30% opacity
  - All interactive elements (hover, focus states) properly styled for both light and dark modes
  - Locations: `apps/web/components/TranscriptCorrectionModal.tsx`, `apps/web/components/DiffViewer.tsx`
- **Re-run Core Analyses from Details Tab**: Added permanent UI button to regenerate core analyses at any time
  - New "Re-run Core Analyses" section at top of Details tab with explanation and button
  - Useful for users who skipped regeneration after transcript corrections or want to update analyses
  - Shows loading state during regeneration (~15-20 seconds)
  - Displays success/error messages with auto-dismiss (5 seconds for success)
  - Automatically refreshes parent component to show updated analyses in other tabs
  - Integrated with existing `POST /transcriptions/:id/regenerate-core-analyses` endpoint
  - Fully dark mode compatible
  - Locations: `apps/web/components/TranscriptionDetails.tsx`, `apps/web/components/AnalysisTabs.tsx:712-715`

### Fixed
- **Runtime Error in Full Transcript Tab**: Fixed `onTranscriptionUpdate is not defined` error when navigating to Full Transcript tab
  - Added `onTranscriptionUpdate` prop to `AnalysisTabs` interface
  - Created `handleTranscriptionUpdate()` callback in `TranscriptionList` component to refresh transcription after corrections
  - Properly passed callback to `AnalysisTabs` and `TranscriptTimeline` components
  - Fixed TypeScript error: `transcription.id` possibly undefined by using `transcriptionId` prop instead
  - Locations: `apps/web/components/AnalysisTabs.tsx:40,43,685-687`, `apps/web/components/TranscriptionList.tsx:435-447,869`
- **AI-Powered Transcript Correction (Complete)**: Full-stack feature for fixing transcription errors using natural language instructions
  - **Backend (Phase 1 ✅)**:
    - New endpoint: `POST /transcriptions/:id/correct-transcript` with preview and apply modes
    - **Preview Mode** (`previewOnly: true`): Returns diff showing all proposed changes without saving
    - **Apply Mode** (`previewOnly: false`): Saves corrections, clears translations, and deletes custom analyses
    - **Iterative Workflow**: Users can refine instructions and preview multiple times before applying
    - Uses GPT-4o-mini for cost-efficient corrections (~$0.003 per 5K word transcript)
    - Preserves speaker segments, timestamps, and formatting structure
    - **New Types**: `CorrectTranscriptRequest`, `TranscriptDiff`, `CorrectionPreview`, `CorrectionApplyResponse`
    - **Rate Limiting**: 10 corrections per minute per user
    - **Tests**: Comprehensive unit test suite with 16 tests covering validation, preview/apply modes, OpenAI integration, and helper methods (all passing ✅)
    - Locations: `apps/api/src/transcription/transcription.controller.ts:472-508`, `apps/api/src/transcription/transcription.service.ts:2058-2276`, `apps/api/src/transcription/prompts.ts:339-369`, `apps/api/src/firebase/firebase.service.ts:937-959`, `packages/shared/src/types.ts:640-670`, `apps/api/src/transcription/transcript-correction.spec.ts`
  - **Frontend (Phase 2 ✅)**:
    - **TranscriptCorrectionModal**: Full-featured modal with iterative preview workflow
      - Natural language instruction input with character counter (max 2000 chars)
      - Preview button generates diff without saving
      - "Preview Again" button allows refining instructions
      - Confirmation dialog warns about deleted translations/analyses
      - Apply button saves changes and triggers onSuccess callback
    - **DiffViewer Component**: Color-coded diff display
      - Collapsible/expandable segments
      - Red background for removed text (strikethrough)
      - Green background for added text
      - Shows speaker tag, timestamp, and change summary
      - "Expand All" / "Collapse All" toggle
    - **UI Integration**: "Fix" button added to transcript views
      - Added to `TranscriptTimeline` component (primary transcript view)
      - Added to `TranscriptWithSpeakers` component
      - Brand-colored button (pink #cc3399) with pencil icon
      - Positioned next to search bar for easy access
    - **API Client**: New method `transcriptionApi.correctTranscript(id, instructions, previewOnly)`
    - Locations: `apps/web/components/TranscriptCorrectionModal.tsx`, `apps/web/components/DiffViewer.tsx`, `apps/web/components/TranscriptTimeline.tsx:4-5,27,220-226,391-401`, `apps/web/components/TranscriptWithSpeakers.tsx:5-6,13,25,124-130,214-224`, `apps/web/components/AnalysisTabs.tsx:683-687`, `apps/web/lib/api.ts:3-11,238-248`
  - **Re-run Core Analyses (Phase 3 ✅)**:
    - **Backend Endpoint**: `POST /transcriptions/:id/regenerate-core-analyses`
      - Regenerates Summary, Action Items, and Communication analyses using corrected transcript
      - Validates transcription ownership and completion status
      - Uses existing `generateCoreAnalyses()` method with detected language
      - **Rate Limiting**: 5 regenerations per minute per user
      - Locations: `apps/api/src/transcription/transcription.controller.ts:512-529`, `apps/api/src/transcription/transcription.service.ts:2278-2325`
    - **Success Screen in Modal**: After correction is applied
      - Green success banner showing deleted analyses and cleared translations count
      - Prominent "🔄 Re-run Analyses Now" button to regenerate core analyses
      - "Skip for Now" option for users who want to regenerate later
      - Loading state during regeneration (15-20 seconds)
      - Success alert on completion with auto-close
      - Automatically refreshes parent component to show updated analyses
    - **API Client**: New method `transcriptionApi.regenerateCoreAnalyses(id)`
    - **Complete User Flow**: Fix transcript → Preview → Apply → Re-run analyses → See updated Summary/Action Items/Communication
    - Locations: `apps/web/components/TranscriptCorrectionModal.tsx:28-32,112-154,180-233`, `apps/web/lib/api.ts:250-252`

### Changed

### Fixed

### Security

### Removed

---

## [2.0.0] - 2025-10-31

### Changed
- **README.md Comprehensive Update**: Updated README to reflect all major features and recent changes
  - Updated Core Features section to highlight on-demand analyses system (15+ templates)
  - Added parallel job processing and WebSocket resilience features
  - Updated Translation & Collaboration section with preference persistence and auto-shared translations
  - Enhanced Security & Compliance section with security hardening details
  - Added Subscription & Billing feature section
  - Updated Tech Stack sections (Backend, Infrastructure) with current architecture
  - Added comprehensive API endpoint documentation (40+ endpoints across 7 categories)
  - Added Subscription Tiers & Limits section with Free/Professional/PAYG details
  - Enhanced Translation Support section with new features
  - Expanded Troubleshooting section with production diagnostics
  - Added processing configuration to environment variables
  - Updated "How It Works" section to reflect current workflow
  - Location: `README.md`

### Fixed
- **New User Usage Display**: Fixed infinite spinner and missing usage information for newly registered users
  - Backend now automatically creates user profile with default free tier stats when fetching usage data
  - Modified `/user/usage-stats` endpoint to call `getUserProfile()` first, ensuring Firestore user document exists
  - Added default free tier fallback stats in UsageContext when API fails (0/3 transcriptions, 0/1 hours, 0/3 analyses)
  - Improved UsageBadge loading state to differentiate between loading and error states
  - Updated UserProfileMenu to reliably show usage section for non-admin users with fallback data
  - New users now immediately see "0/3 transcriptions (Free)" instead of infinite loading spinner
  - Locations: `apps/api/src/user/user.controller.ts:127-128`, `apps/web/contexts/UsageContext.tsx:106-126,131-151`, `apps/web/components/UsageBadge.tsx:14-26`, `apps/web/components/UserProfileMenu.tsx:163`
- **Stripe 100% Discount Coupon Payment Collection**: Fixed Stripe checkout requiring credit card details even when using 100% discount founding member coupons
  - Added `payment_method_collection: 'if_required'` to checkout session configuration
  - Stripe now skips payment collection when total is $0 after applying coupon
  - Founding members can now subscribe without entering payment details
  - Regular subscriptions still collect payment method normally
  - Location: `apps/api/src/stripe/stripe.service.ts:126`

### Added
- **Cost Estimation Feature Planning Document**: Comprehensive implementation plan for AI API cost tracking and admin analytics
  - Detailed plan for capturing token usage from OpenAI API (GPT-5, GPT-5-mini, Whisper)
  - Cost calculator service design with current pricing models ($1.25/1M input, $10/1M output for GPT-5)
  - Admin panel design with cost dashboard, transcriptions table, and detailed breakdowns
  - Migration strategy for backfilling historical transcription costs
  - 4-phase implementation roadmap with 8-12 hour estimate
  - Location: `docs/PLAN_COST_ESTIMATION_FEATURE.md`
- **Last Login Tracking for Admin Panel**: Added automatic tracking and display of user login timestamps
  - Added `lastLogin?: Date` field to User interface for recording authentication timestamps
  - Implemented automatic login tracking in Firebase auth guard with 1-hour throttling to minimize Firestore writes
  - Added "Last Login" column to admin panel user table with relative time display (e.g., "2h ago", "3d ago")
  - Shows "Never" for users who haven't logged in since feature deployment or for invalid dates
  - Tooltip displays full timestamp on hover for precise login time
  - Fixed Firebase Timestamp conversion in `getUser()`, `getAllUsers()`, and `getUsersByTier()` methods
  - Locations: `packages/shared/src/types.ts:38-39`, `apps/api/src/auth/firebase-auth.guard.ts:11-83`, `apps/api/src/firebase/firebase.service.ts:566-567,765-767,804-806`, `apps/web/app/[locale]/admin/page.tsx:17-51,212-214,289-291`
- **Translations in Shared Transcripts**: Shared transcripts now automatically include all available translations
  - All translations automatically included when creating share link (zero configuration needed)
  - Recipients see transcript in sender's preferred language by default
  - Recipients can switch between available translations via language dropdown (read-only mode)
  - No translation API calls from recipients - translations pre-loaded in shared view
  - Added `translations` and `preferredTranslationLanguage` fields to `SharedTranscriptionView` type
  - Backend automatically includes all translations when serving shared transcripts
  - Frontend uses read-only translation mode in shared pages (no re-translation allowed)
  - Locations: `packages/shared/src/types.ts:373-374`, `apps/api/src/transcription/transcription.service.ts:1559-1562`, `apps/web/components/AnalysisTabs.tsx:39,128-145,600-621`, `apps/web/app/s/[shareCode]/page.tsx:275-276`, `apps/web/app/[locale]/shared/[shareToken]/page.tsx:244-245`
  - Tests: `apps/api/test/translation.e2e-spec.ts:625-701`
- **Translation Language Preference Persistence**: System now remembers user's preferred translation language per transcription
  - Added `preferredTranslationLanguage` field to Transcription model for storing user's language preference
  - Backend automatically saves preference when user translates to any language
  - Frontend auto-loads preferred language when reopening a transcription
  - Added PATCH `/transcriptions/:id/translation-preference` endpoint for explicit preference updates
  - Preference persists across browser sessions and applies per-transcription (not global)
  - Works seamlessly with existing translations (no re-translation needed when switching languages)
  - Locations: `packages/shared/src/types.ts:193`, `apps/api/src/transcription/transcription.service.ts:1870,2037-2059`, `apps/api/src/transcription/transcription.controller.ts:627-644`, `apps/web/components/AnalysisTabs.tsx:122-200,218-238`, `apps/web/lib/api.ts:209-211`
  - Tests: `apps/api/test/translation.e2e-spec.ts:548-623`
- **Context-Aware Copy for Timeline View**: Copy button in Full Transcript tab now formats output based on current view mode
  - Timeline mode: Copies formatted markdown-style text with timestamps, speaker tags, and durations
  - Raw mode: Copies plain transcript text (original behavior)
  - Format example: `0:00 Speaker A (1m 4s)\n[transcript text]`
  - Locations: `apps/web/components/AnalysisTabs.tsx:66-120` (formatter), `:587-590` (copy logic)
- **Parallel Transcription Job Processing**: Enabled configurable concurrent job processing for faster batch transcription
  - Added `TRANSCRIPTION_CONCURRENCY` environment variable (default: 2 jobs simultaneously)
  - Increased Redis memory from 256MB to 512MB to support parallel processing
  - Added job-level logging with job ID tracking for monitoring concurrent execution
  - Benefits: 2-3x faster batch file processing, better resource utilization
  - Configuration: Set `TRANSCRIPTION_CONCURRENCY=1` for sequential (original behavior) or higher for parallel
  - Locations: `apps/api/src/transcription/transcription.processor.ts:34-36`, `.env.example:26-29`, `.env.production.example:45-49`, `docker-compose.prod.yml:47`
  - Documentation: `CLAUDE.md:132-136`
- **Traefik Certificate Diagnostic Tool**: Added comprehensive diagnostic script for SSL certificate troubleshooting
  - Checks ACME_EMAIL configuration in .env.production
  - Verifies Traefik container status and certificate volume
  - Analyzes acme.json file size and permissions
  - Scans logs for ACME errors
  - Tests DNS resolution and port 80 accessibility
  - Validates current SSL certificate issuer (Let's Encrypt vs default)
  - Checks dashboard security (port 8080 should not be exposed)
  - Provides actionable recommendations for certificate issues
  - Location: `scripts/check-traefik-certs.sh`
- **ACME_EMAIL Environment Variable**: Added required Let's Encrypt email configuration
  - Added to `.env.production.example` with documentation
  - Documented in `DEPLOYMENT.md` as required configuration
  - Added comprehensive troubleshooting guide in `CLAUDE.md`
  - Email used for Let's Encrypt certificate registration and renewal notifications
  - Locations: `.env.production.example:51-55`, `DEPLOYMENT.md:77-78`, `CLAUDE.md:415-478`

### Changed
- **Enhanced AI Service Logging**: Improved log messages to show which AI models and services are being used
  - Transcription logs now specify "AssemblyAI (speaker diarization + language detection)" or "OpenAI Whisper API (with auto-chunking)"
  - Analysis logs show GPT model selection: "GPT-5 (summary) + GPT-5/GPT-5-mini (secondary)" with quality mode
  - Translation logs specify "using GPT-5-mini" for clarity
  - Fallback logs explicitly mention "OpenAI Whisper API" when AssemblyAI fails
  - Locations: `apps/api/src/transcription/transcription.service.ts:359-361,447-449,685-687,1783-1785`
- **Auto-generated Transcription Titles**: Optimized for better scanning and readability
  - Changed auto-generated titles from long descriptive headings to concise 5-7 word titles
  - Added `generateShortTitle()` method using gpt-5-mini to intelligently condense extracted H1 headings
  - Skips API call if heading is already 7 words or less (cost optimization)
  - Falls back to smart truncation (first 7 words + ellipsis) if API fails
  - Preserves original language for multi-language support
  - Cost impact: ~$0.000006 per transcription (negligible)
  - Locations: `apps/api/src/transcription/transcription.service.ts:925-975`, `apps/api/src/transcription/transcription.processor.ts:122-137`
- **Traefik Security Hardening**: Removed insecure dashboard exposure
  - Removed `--api.insecure=true` flag from Traefik configuration
  - Removed port 8080 public exposure (dashboard no longer accessible)
  - Prevents exposure of internal routing configuration and service health status
  - Location: `docker-compose.prod.yml:18-30`
- **SSL Certificate Troubleshooting Documentation**: Enhanced deployment and project documentation
  - Added step-by-step SSL troubleshooting to `DEPLOYMENT.md` with reference to diagnostic script
  - Added detailed Traefik certificate troubleshooting section to `CLAUDE.md` covering common issues and fixes
  - Documented rate limiting workarounds using Let's Encrypt staging environment
  - Locations: `DEPLOYMENT.md:200-223`, `CLAUDE.md:415-478`
- **Shared Transcript UI Simplification**: Removed Details and More Analyses tabs from shared transcripts
  - Details tab (processing information) only relevant to transcript author, not recipients
  - More Analyses tab (on-demand generation) requires authentication and shouldn't be exposed in public shares
  - Both tabs now hidden when `readOnlyMode={true}` is set on AnalysisTabs component
  - Locations: `apps/web/components/AnalysisTabs.tsx:430,448,706,722`

### Fixed
- **Shared Transcript Details Tab Error**: Fixed runtime error "Cannot read properties of undefined (reading 'charAt')" on shared transcript Details tab
  - Made Status field conditional since SharedTranscriptionView type doesn't include status field
  - Details tab now gracefully handles missing status for shared/read-only transcriptions
  - Location: `apps/web/components/TranscriptionDetails.tsx:40`
  - Note: Details tab subsequently removed entirely from shared views (see Changed section above)
- **Timeline View UI Spacing Issues**: Fixed margin and padding issues in transcript timeline view
  - Added proper bottom spacing (`mb-6`) between consecutive speaker cards for better visual separation
  - Increased speaker card padding from `p-3` to `p-4` for better content breathing room
  - Fixed text content too close to bottom border by adding `mb-2` to transcript text container
  - Made dark mode background transparent to blend with page background
  - Locations: `apps/web/components/TranscriptTimeline.tsx:187`, `:307`, `:321`, `:351`, `:367`
- **Multiple File Upload UI State Management**: Resolved confusing UI behavior during batch file uploads
  - Issue: When uploading 3+ files individually, UI initially showed incorrect filenames, duplicate progress updates, and flickering cards before eventually correcting itself
  - Root cause: Synchronous rapid-fire state updates causing race conditions between API fetches, WebSocket events, and UI re-renders
  - Solution:
    - Added 150ms sequential delays between upload callbacks to prevent cascade of simultaneous state updates
    - Implemented 300ms debounce on `lastCompletedId` updates to consolidate multiple API calls into one
    - Added progress validation to ensure WebSocket updates only affect correct transcription cards
    - Added subscription tracking to prevent duplicate WebSocket subscriptions
  - Impact: Each file now displays correct filename immediately, progress bars update independently per file, no flickering or multiple re-renders
  - Locations: `apps/web/components/FileUploader.tsx:187-195`, `apps/web/app/[locale]/dashboard/page.tsx:164-191`, `apps/web/components/TranscriptionList.tsx:291-309`, `apps/web/lib/websocket.ts:221-237`
- **Traefik Default Certificate Issue**: Resolved self-signed certificate problem
  - Root cause: Missing ACME_EMAIL environment variable prevented Let's Encrypt registration
  - Solution: Added ACME_EMAIL configuration requirement to all documentation
  - Added diagnostic script to quickly identify and fix certificate issues
  - Removed insecure dashboard that could expose misconfiguration details

### Changed
- **Share Feature: On-Demand Analyses Support**: Updated share functionality to support new core/on-demand analyses structure
  - Removed obsolete analysis checkboxes (Emotional Intelligence, Influence & Persuasion, Personal Development, Custom)
  - Added single "On-Demand Analyses" toggle to include all user-generated analyses in shared links
  - Updated "Complete Analysis" preset to include core analyses + all on-demand analyses
  - Backend now fetches on-demand analyses from `generatedAnalyses` collection when sharing
  - Shared view page displays on-demand analyses as separate tabs with metadata (model, generation time, tokens)
  - Updated all 5 translation files (en, nl, de, fr, es) with new "includeOnDemandAnalyses" key
  - Locations: `packages/shared/src/types.ts:325-336,359-372`, `apps/api/src/transcription/transcription.service.ts:1249-1261,1423-1484`, `apps/web/components/ShareModal.tsx:69-79,169-205,488-500,597-656`, `apps/web/app/s/[shareCode]/page.tsx:267-275`, `apps/web/components/AnalysisTabs.tsx:24,32-41,287-310,601-647`

### Added
- **Subscription Management UI**: Users can now view and manage their subscriptions from the settings page
  - Enabled subscription menu item in settings navigation (previously disabled as "Coming soon")
  - Page displays current plan (Free/Professional/PAYG) with comprehensive subscription details
  - Shows subscription status (Active/Trialing/etc) with color-coded badges
  - Displays billing cycle information: period start date and renewal date
  - Shows usage statistics with visual progress bars for hours/transcriptions
  - Displays billing history with invoice download links
  - Allows Professional users to cancel subscriptions (cancels at period end)
  - Added PAYG credit purchase link for pay-as-you-go users
  - **Integrated with Settings layout** - shares same navigation and layout as other settings pages
  - Moved from `/dashboard/settings/subscription` to `/settings/subscription` for consistency
  - Location: `apps/web/app/[locale]/settings/layout.tsx:73-78`, `apps/web/app/[locale]/settings/subscription/page.tsx`
- **Critical Firebase Documentation**: Added comprehensive guide distinguishing Firebase Auth vs Firestore user data
  - Documents `getUserById()` (Auth only - no subscription data) vs `getUser()` (full Firestore document)
  - Explains common bug pattern where wrong method causes silent failures
  - Provides code examples showing correct vs incorrect usage
  - Lists files that commonly need `getUser()` for subscription checks
  - Location: `CLAUDE.md:142-178`

### Fixed
- **CRITICAL: Subscription Data Retrieval Bug**: Fixed 6 instances where Stripe controller used wrong Firebase method
  - Changed `getUserById()` (Auth only) to `getUser()` (Firestore with subscription data)
  - Affected endpoints: create-checkout-session, create-payg-session, cancel-subscription, update-subscription, subscription, billing-history
  - Bug caused subscription page to show "Free" tier even for paying Professional users
  - Location: `apps/api/src/stripe/stripe.controller.ts:50,102,141,181,229,274`
- **Stripe Subscription Period Dates**: Fixed billing period dates not displaying on subscription page
  - Modern Stripe subscriptions store `current_period_start` and `current_period_end` in `items.data[0]`, not at root level
  - Updated controller to extract dates from subscription items with fallback to start_date/billing_cycle_anchor
  - Now correctly displays billing period start and renewal dates for all subscription types
  - Implemented consistent date formatting (dd-MMM-yyyy format, e.g., "26-Oct-2025") across subscription page and billing history
  - Location: `apps/api/src/stripe/stripe.controller.ts:245-249`, `apps/web/app/[locale]/dashboard/settings/subscription/page.tsx:60-67,235,247,408`
- **Subscription Page API Integration**: Fixed incorrect API endpoint path
  - Changed `/usage/stats` to `/user/usage-stats` (the actual endpoint)
  - Added null-safe handling with optional chaining for all usage stats properties
  - Fixed API response wrapper handling: `setUsageStats(usageData.data || usageData)`
  - Location: `apps/web/app/[locale]/dashboard/settings/subscription/page.tsx:78,97`
- **Translation Keys**: Added 13 missing translation keys for subscription management
  - Added: usageThisMonth, hoursUsed, transcriptionsUsed, buyMoreCredits, noBillingHistory
  - Added: downloadInvoice, overageWarning, overageCharge, upgrade, hours, nextBilling, status, billingPeriodStart
  - Fixed incorrect translation key references: `currentPlan` → `currentPlan.title`, `billingHistory` → `billingHistory.title`
  - Location: `apps/web/messages/en.json:1375-1394`, `apps/web/app/[locale]/dashboard/settings/subscription/page.tsx:162,331`
- **Date Formatting**: Fixed "Invalid Date" error when subscription details unavailable
  - Added null check for `currentPeriodEnd` before rendering date
  - Prevents date rendering when Stripe API returns fallback data
  - Location: `apps/web/app/[locale]/dashboard/settings/subscription/page.tsx:199`
- **Stripe API Error Handling**: Gracefully handle Stripe API failures without breaking subscription page
  - Changed from throwing 400 BadRequest to returning fallback data with warnings
  - Handles cases where test subscriptions exist in Firestore but can't be retrieved with live Stripe keys
  - Subscription endpoint returns tier from Firestore even if Stripe API fails
  - Billing history endpoint returns empty array instead of error
  - Frontend checks response status and handles failures gracefully with console warnings
  - Location: `apps/api/src/stripe/stripe.controller.ts:257-268,307-317`, `apps/web/app/[locale]/dashboard/settings/subscription/page.tsx:86-112`

### Added
- **Admin Usage Bypass**: Admin users can now bypass all subscription and usage restrictions
  - Admins skip file size limits, duration limits, transcription counts, and on-demand analysis quotas
  - Implemented at both guard level (SubscriptionGuard, OnDemandAnalysisGuard) and service level (UsageService)
  - Provides defense-in-depth security with dual bypass checks
  - All admin bypass actions are logged for audit trail
  - Locations: `apps/api/src/guards/subscription.guard.ts:34-41,135-142`, `apps/api/src/usage/usage.service.ts:30-36,211-217`
- **Security Test Suite**: Comprehensive e2e security tests verifying all security fixes
  - Rate limiting enforcement tests (verified: 10 req/sec limit working)
  - Password validation tests (verified: 6/6 weak passwords rejected)
  - NoSQL injection protection tests (verified: malicious pagination blocked)
  - XSS protection tests (verified: HTML sanitization implemented)
  - Error sanitization tests (verified: sensitive data removed from errors)
  - Location: `apps/api/test/security.e2e-spec.ts`
- **Test Results Documentation**: Detailed security and performance testing report
  - Documents all 8 security fixes with verification results
  - Includes risk assessment (95% reduction in critical risks)
  - Provides deployment recommendations and monitoring guidance
  - Location: `docs/SECURITY_PERFORMANCE_TEST_RESULTS.md`
- **Production Monitoring System**: Security event logging and monitoring tools
  - Security logging interceptor for tracking rate limits, validation errors, auth failures
  - Comprehensive monitoring guide with log analysis, alerting, and incident response
  - Example scripts for daily security reports and automated monitoring
  - Location: `apps/api/src/common/interceptors/logging.interceptor.ts`, `docs/PRODUCTION_MONITORING_GUIDE.md`

### Fixed
- **Test Configuration**: Added global ValidationPipe to e2e tests to match production configuration
  - Fixed pagination type transformation for query parameters in tests
  - Ensures DTOs properly validate and transform input in test environment
  - Location: `apps/api/test/translation.e2e-spec.ts:2,71-80`, `apps/api/test/app.e2e-spec.ts:2-3,16-26`
- **API Endpoint Test**: Fixed incorrect endpoint path in translation test
  - Changed `/transcriptions/:id/analysis` to `/transcriptions/:id/analyses` (plural)
  - Added response structure validation for API wrapper objects
  - Location: `apps/api/test/translation.e2e-spec.ts:460,467-469`

### Security
- **CRITICAL: Command Injection Protection**: Fixed potential command injection vulnerability in audio file processing
  - Added `sanitizePath()` method to validate and sanitize all file paths before FFmpeg operations
  - Blocks shell metacharacters (`;`, `&`, `|`, `` ` ``, `$`, `(`, `)`, `\`, `<`, `>`)
  - Prevents path traversal attacks (`..` sequences)
  - Applied to all FFmpeg operations: chunk extraction, audio merging, file list creation
  - Location: `apps/api/src/utils/audio-splitter.ts:42-64,216-222,324-325,340,370,391`
  - **CVSS Score**: 9.8 (Critical)

- **CRITICAL: Comprehensive Rate Limiting**: Implemented application-wide rate limiting to prevent abuse
  - Configured `@nestjs/throttler` with three-tier limits (short/medium/long)
  - Global limits: 10 req/s, 100 req/min, 1000 req/hr
  - Endpoint-specific limits:
    - Signup: 3/minute
    - Email verification: 5/5 minutes
    - Verification resend: 3/10 minutes
    - File upload: 5/minute
    - Batch upload: 2/minute
    - Share email: 10/hour
    - Public share views: 30/minute
  - Location: `apps/api/src/app.module.ts:4-5,24-41,72-75`, auth/transcription controllers
  - **CVSS Score**: 8.6 (Critical)

- **CRITICAL: Secure Verification Code Hashing**: Replaced weak SHA-256 with bcrypt for email verification codes
  - Changed from fast SHA-256 (vulnerable to brute force) to bcrypt with 12 salt rounds
  - Implements constant-time comparison to prevent timing attacks
  - Added async hashing (`hashCode()`) and verification (`verifyCodeHash()`)
  - Rate limit checks before hash verification to prevent enumeration
  - Location: `apps/api/src/auth/email-verification.service.ts:4,19,36,93,183-195`
  - **CVSS Score**: 8.1 (Critical)

- **HIGH: NoSQL Injection Protection**: Added comprehensive input validation with DTOs
  - Created `PaginationDto` with strict bounds (page: 1-10000, pageSize: 1-100)
  - Created `AddCommentDto` and `UpdateCommentDto` with length limits (5000 chars)
  - Created `CommentPositionDto` for type-safe position validation
  - Enforces `class-validator` decorators on all user inputs
  - Location: `apps/api/src/transcription/dto/pagination.dto.ts`, `add-comment.dto.ts`
  - **CVSS Score**: 7.5 (High)

- **HIGH: Strong Password Validation**: Enforced password complexity for share links
  - Minimum 8 characters with uppercase, lowercase, number, and special character
  - Created `CreateShareLinkDto` and `UpdateShareSettingsDto` with regex validation
  - Passwords hashed with bcrypt (10 rounds) before storage
  - Email validation with regex pattern
  - Location: `apps/api/src/transcription/dto/share-link.dto.ts:6-16,473-481,520-525`
  - **CVSS Score**: 7.3 (High)

- **HIGH: XSS Protection**: Sanitized all user-generated content to prevent cross-site scripting
  - Integrated `isomorphic-dompurify` for HTML sanitization
  - All comment content stripped of HTML tags before storage
  - Sanitization applied on both add and update operations
  - Defense-in-depth: validation + sanitization
  - Location: `apps/api/src/transcription/transcription.controller.ts:30-31,360-364,407-413`
  - **CVSS Score**: 7.1 (High)

- **HIGH: Strengthened CORS Configuration**: Replaced environment-based with whitelist-based CORS
  - Strict origin whitelist (neuralsummary.com domains)
  - Development origins only in non-production
  - Origin validation callback with logging of blocked requests
  - Added explicit methods, headers, and credentials configuration
  - 1-hour preflight caching
  - Location: `apps/api/src/main.ts:42-84`
  - **CVSS Score**: 6.8 (High)

- **HIGH: Global Exception Filter**: Implemented secure error handling to prevent information disclosure
  - Created `AllExceptionsFilter` to sanitize error messages in production
  - Removes file paths, IP addresses, API keys, emails from error responses
  - Stack traces only shown in development
  - Structured error format with timestamp and path
  - Location: `apps/api/src/common/filters/http-exception.filter.ts`, `main.ts:6,89`
  - **CVSS Score**: 6.5 (High)

- **Security Headers**: Added Helmet middleware for comprehensive HTTP security headers
  - Content Security Policy (CSP) with restrictive directives
  - HTTP Strict Transport Security (HSTS) with 1-year max-age
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection enabled
  - Referrer-Policy: strict-origin-when-cross-origin
  - Location: `apps/api/src/main.ts:5,17-39`

- **Enhanced Validation**: Strengthened global ValidationPipe configuration
  - `whitelist: true` - strips unknown properties
  - `forbidNonWhitelisted: true` - rejects requests with extra fields
  - `transform: true` - auto-transforms query params to correct types
  - `enableImplicitConversion: true` - type coercion for DTOs
  - Location: `apps/api/src/main.ts:92-100`

### Fixed
- **Usage Stats Internal Server Error**: Fixed missing PAYG tier definition causing API crashes
  - **Root Cause**: `SUBSCRIPTION_TIERS` was missing the `payg` tier, causing undefined errors when accessing tier limits
  - Added complete PAYG tier configuration with 5GB file limit and credit-based usage
  - Updated `SubscriptionTier` interface to include `'payg'` in the id union type
  - Location: `packages/shared/src/types.ts:470,540-560`

### Added
- **Password Visibility Toggle**: Added show/hide password buttons to all password fields for improved UX
  - **Eye/EyeOff Icons**: Toggle button on the right side of all password inputs
  - **Locations**:
    - Login form (1 field): `apps/web/components/LoginForm.tsx`
    - Signup form (2 fields): `apps/web/components/SignupForm.tsx`
    - Reset password form (2 fields): `apps/web/components/ResetPasswordForm.tsx`
    - Account settings (4 fields): `apps/web/app/[locale]/settings/account/page.tsx`
    - Share modal (1 field): `apps/web/components/ShareModal.tsx`
    - Share access pages (2 fields): `apps/web/app/s/[shareCode]/page.tsx`, `apps/web/app/[locale]/shared/[shareToken]/page.tsx`
  - **Total**: 12 password fields enhanced across 7 files
  - **Accessibility**: Proper aria-labels for screen readers
  - **Translations**: Added `showPassword` and `hidePassword` keys to `auth`, `accountPage`, `share`, and `shared` translation namespaces
  - **Dark Mode**: Fully compatible with dark theme

### Fixed
- **Google Profile Pictures Not Loading**: Fixed broken Google OAuth profile pictures in UserProfileMenu
  - **Root Cause**: Missing CORS/referrer configuration for external Google image URLs
  - Added `referrerPolicy="no-referrer"` and `crossOrigin="anonymous"` to img tags
  - Added `Referrer-Policy: no-referrer-when-downgrade` header in Next.js config
  - Added Google domains (*.googleusercontent.com) to Next.js image remote patterns
  - Location: `apps/web/components/UserProfileMenu.tsx:141-142,172-173`, `apps/web/next.config.ts:12-41`
- **Preferences Page Translation Error**: Fixed malformed ICU message format in `days` translation
  - Changed from `{{count}}` (double braces) to `{count}` (single braces) for next-intl compatibility
  - Resolved "INVALID_MESSAGE: MALFORMED_ARGUMENT" console errors on settings/preferences page
  - Location: `apps/web/messages/en.json`
- **Profile Picture Not Updating**: Fixed profile picture and display name not reflecting in UI after updates
  - **Root Cause**: Profile updates only saved to Firestore, not Firebase Auth
  - **Backend Fix**: `updateUserProfile()` now updates both Firestore AND Firebase Auth (`apps/api/src/user/user.service.ts:94-106`)
  - **Frontend Fix**: Added `authUser.reload()` after profile save to refresh Auth state (`apps/web/app/[locale]/settings/profile/page.tsx:63-65`)
  - **Impact**: Profile changes now immediately reflect in UserProfileMenu and all components using Auth context

### Added
- **Stripe Customer Name Capture**: User display names now appear in Stripe customer records
  - Retrieves `displayName` from Firebase Auth during checkout
  - Passes name to Stripe when creating customer records
  - Applied to both subscription and PAYG checkout flows
  - Works for both email signup (user-entered name) and Google OAuth (Google display name)
  - Location: `apps/api/src/stripe/stripe.controller.ts`, `apps/api/src/stripe/stripe.service.ts`
- **Queue Health Monitoring**: Automatic stale job detection and recovery on application restart
  - **QueueHealthService**: New service that runs on app initialization to check for stale jobs
  - **Stale Job Detection**: Identifies transcriptions marked as PROCESSING in Firestore but not in Redis queue
  - **Automatic Recovery**: Notifies users when their jobs resume after server restart
  - **Queue Statistics**: Logs detailed queue metrics (waiting, active, completed, failed, delayed jobs)
  - **Health Check API**: `getQueueHealth()` method for monitoring endpoints
  - **Location**: `apps/api/src/queue/queue-health.service.ts`
- **Job Cleanup Configuration**: Automatic removal of old jobs to prevent Redis memory bloat
  - **Completed Jobs**: Retained for 24 hours or max 1000 jobs (whichever limit is reached first)
  - **Failed Jobs**: Retained for 7 days or max 5000 jobs (for debugging)
  - **Configurable Retention**: Optional environment variables for custom retention policies
  - **Global Defaults**: Applied at Bull queue initialization in `app.module.ts`
  - **Per-Job Override**: Cleanup options specified when adding jobs to queue
- **Queue Configuration Variables**: Optional environment variables for job retention tuning
  - `QUEUE_COMPLETED_JOB_AGE`: How long to keep completed jobs (seconds, default: 86400 = 24h)
  - `QUEUE_COMPLETED_JOB_COUNT`: Max completed jobs to retain (default: 1000)
  - `QUEUE_FAILED_JOB_AGE`: How long to keep failed jobs (seconds, default: 604800 = 7 days)
  - `QUEUE_FAILED_JOB_COUNT`: Max failed jobs to retain (default: 5000)

### Changed
- **User Account Deletion - Stripe Cleanup**: Fixed hard delete to properly clean up Stripe data
  - **CRITICAL FIX**: Implemented actual Stripe subscription cancellation and customer deletion
  - **Previously**: Stripe cleanup was commented out (placeholder code), leaving orphaned customers in Stripe
  - **Now**: Hard delete properly cancels subscriptions immediately and deletes Stripe customer records
  - Added `deleteCustomer()` method to `StripeService` for safe, idempotent customer deletion
  - Injected `StripeService` into `UserService` and added `StripeModule` to `UserModule` imports
  - Error handling: Continues deletion even if Stripe operations fail (logs warnings for monitoring)
  - Location: `apps/api/src/user/user.service.ts:273-308`, `apps/api/src/stripe/stripe.service.ts:238-256`
- **Comprehensive Translation System**: Implemented full translation support for both core and on-demand analyses
  - **Architecture**: Store translations in each `GeneratedAnalysis` document for clean data locality
  - **Backend**: Enhanced `translateTranscription()` to fetch and translate all on-demand analyses
  - **Types**: Added `translations?: { [languageCode: string]: string }` field to `GeneratedAnalysis` interface
  - **Frontend**: Updated `MoreAnalysesTab` to display translated content when language is switched
  - **Parallel Translation**: All on-demand analyses translated in parallel for efficiency
  - **Skip Logic**: Avoids re-translating already translated analyses
  - **Error Handling**: Individual analysis translation failures don't block other translations
  - **User Experience**: Language switching now works seamlessly across all analysis types (core + on-demand)
  - **Data Lifecycle**: Translations automatically cleaned up when analysis is deleted
  - **Testing**: Comprehensive e2e test suite (`apps/api/test/translation.e2e-spec.ts`) verifies full translation flow
- **Stripe Subscription Flow**: Simplified to webhook-only approach for both development and production
  - **REMOVED** manual sync endpoint (`/stripe/sync-subscription`) - eliminated potential security risk
  - **REMOVED** frontend manual sync logic from checkout success page
  - Development now uses Stripe CLI for webhook forwarding (identical to production workflow)
  - Created comprehensive setup guide: `docs/STRIPE_CLI_SETUP.md`
  - Updated subscription flow documentation to reflect webhook-only approach
  - Eliminates code path divergence between dev and production
  - Prevents quota gaming vulnerability from repeated manual syncs
  - Production-ready with no workarounds or temporary solutions

### Fixed
- **Translation Missing Analyses**: Fixed translations returning empty analyses object
  - Translation code was looking for `transcription.analyses` but current structure uses `transcription.coreAnalyses`
  - Updated to check for `coreAnalyses` first, then fall back to `analyses` (for backwards compatibility)
  - Now correctly translates summary, action items, communication styles, and other analyses
  - Fixes issue where translated transcriptions showed no summary or analysis content
- **Stripe Webhook Raw Body Configuration**: Fixed "Missing raw body for webhook verification" error
  - Enabled NestJS `rawBody: true` option to preserve raw body for all requests
  - Raw body stored in `req.rawBody` for Stripe signature verification
  - Uses built-in NestJS feature (not custom Express middleware) to avoid conflicts
  - Fixes issue preventing webhooks from working in development and production
  - Critical for Stripe CLI webhook forwarding and production webhook endpoints
- **UserProfileMenu Upgrade Button Visibility**: Fixed upgrade button not showing for new free tier users
  - Changed condition from `percentUsed >= 70 && tier === 'free'` to just `tier === 'free'`
  - Upgrade button now always visible for free tier users, not just when approaching quota limits
  - Makes upgrade path more discoverable for users with low usage
- **Usage Reset on Subscription Upgrade**: Fixed usage not resetting when upgrading to paid subscription
  - When user upgrades from free to paid tier, usage now resets to 0 (hours, transcriptions, analyses)
  - Reset date is set to today's date instead of keeping the old free tier reset date
  - Applied via webhook handler (`checkout.session.completed`)
  - Fixes issue where users saw incorrect usage carryover and future reset dates after upgrading
- **Usage Reset Date Format**: Changed date format from ambiguous MM/DD/YYYY to clear dd-MMM-yyyy format
  - Example: "11/1/2025" now displays as "01-Nov-2025"
  - Improves clarity for international users and eliminates confusion between US and European date formats
  - Applied to UserProfileMenu usage stats display
- **Stripe Checkout Tax Configuration**: Enabled automatic tax calculation in all environments
  - Configured business address and tax registrations in Stripe dashboard (test mode)
  - Automatic tax now enabled for both test and production environments
  - Added `customer_update.address: 'auto'` to save customer address from checkout
  - Applied to both subscription and PAYG checkout sessions
  - Test environment now matches production for accurate tax testing
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

### Added
- **Stripe Subscription Flow Documentation**: Comprehensive technical documentation for subscription system
  - Created `docs/STRIPE_SUBSCRIPTION_FLOW.md` with complete subscription lifecycle diagrams
  - 4 detailed Mermaid sequence diagrams covering all subscription scenarios
  - In-depth comparison of webhook (production) vs manual sync (development) approaches
  - Production readiness analysis with identified issues and mitigation strategies
  - Pre-deployment and post-deployment checklists for production launch
  - Covers: initial checkout, monthly billing, cancellations, plan changes, error handling

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
