# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
