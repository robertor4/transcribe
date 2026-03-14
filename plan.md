# Plan: Persona-Specific Landing Pages for Facebook Ads

## Overview

Create two persona-specific landing page variants that Facebook ads link to directly. Each page reuses the existing landing page architecture (sections, components, translations) but swaps messaging, hero copy, outputs, testimonials, and CTAs to speak directly to the ad's target persona.

**Routes:**
- `/[locale]/for/consultants` — Consultant persona landing page
- `/[locale]/for/product-leaders` — Product Leader persona landing page

## Ad Personas (from `tools/fb-ad-creatives.html`)

### Consultant Persona
- **Pain**: Spending hours writing up client call notes, follow-ups, proposals
- **Promise**: Walk out of calls with 3 deliverables already done (follow-up email, proposal brief, engagement summary)
- **Angles**: Aspirational provocation ("Top consultants don't write meeting notes") and competitive loss aversion ("Your competitor's follow-up arrived 2 hours ago")

### Product Leader Persona
- **Pain**: Writing specs from scratch, losing insights between discovery calls and documents
- **Promise**: Turn discovery calls into product specs, feature briefs, user insights, sprint notes automatically
- **Angles**: Aspirational provocation ("The best PMs don't write specs from scratch") and proof/results ("40% faster to ship")

---

## Implementation Steps

### Step 1: Create Route Structure

Create the directory structure for persona pages:

```
apps/web/app/[locale]/for/
├── consultants/
│   ├── page.tsx          # Consultant landing page (server component)
│   └── layout.tsx        # SEO metadata for consultant page
└── product-leaders/
    ├── page.tsx          # Product Leader landing page (server component)
    └── layout.tsx        # SEO metadata for product leader page
```

### Step 2: Add Persona Translation Keys

Add persona-specific translation entries to each locale file (`apps/web/messages/{locale}.json`) under a new `personas` namespace:

```json
{
  "personas": {
    "consultants": {
      "hero": {
        "eyebrow": "For consultants",
        "headline1": "Stop writing ",
        "headlineEm": "meeting notes.",
        "headline2": " Start delivering.",
        "body": "Record your client calls. Walk out with the follow-up email, proposal brief, and engagement summary — already done.",
        "ctaPrimary": "Try free for 14 days",
        "ctaSecondary": "See how it works"
      },
      "outputs": {
        "tag": "Your deliverables, automated",
        "headline1": "One client call. ",
        "headlineEm": "Three deliverables.",
        "body": "Neural Summary listens to your recording and generates consultant-grade documents you can send immediately.",
        "items": {
          "followUp": { "title": "Follow-up email", "description": "Personalized email referencing exact client quotes and next steps" },
          "proposal": { "title": "Proposal brief", "description": "Structured brief that mirrors every concern raised in the call" },
          "engagement": { "title": "Engagement summary", "description": "Comprehensive summary with key decisions and action items" },
          "custom": { "title": "Custom template", "description": "Build your own output template for any deliverable type" }
        }
      },
      "proof": {
        "stat": "3-4",
        "statLabel": "hours saved per week",
        "quote": "I run 12 client calls a week. I was losing 3-4 hours just on post-call writeups. Now that time goes back into actual client work.",
        "author": "Wouter Chompff",
        "role": "Founder · One Man Agency"
      },
      "finalCta": {
        "headline1": "Your competitor already ",
        "headlineEm": "sent the follow-up.",
        "body": "The difference isn't talent. It's the system. Start turning every client call into deliverables.",
        "ctaPrimary": "Start free trial"
      }
    },
    "productLeaders": {
      "hero": {
        "eyebrow": "For product leaders",
        "headline1": "Stop writing specs ",
        "headlineEm": "from scratch.",
        "body": "Record discovery calls and let AI turn them into product specs, feature briefs, user insight reports, and sprint notes. Automatically.",
        "ctaPrimary": "Try free for 14 days",
        "ctaSecondary": "See how it works"
      },
      "outputs": {
        "tag": "Your deliverables, automated",
        "headline1": "One discovery call. ",
        "headlineEm": "Four ready deliverables.",
        "body": "No more playing telephone between what users said and what ends up in the spec.",
        "items": {
          "spec": { "title": "Product spec", "description": "Structured PRD generated from your discovery conversation" },
          "brief": { "title": "Feature brief", "description": "Clear feature definition with requirements and scope" },
          "insights": { "title": "User insights", "description": "Key themes, pain points, and quotes from user research calls" },
          "sprint": { "title": "Sprint notes", "description": "Ready-to-import notes for your next sprint planning" }
        }
      },
      "proof": {
        "stat": "40%",
        "statLabel": "faster to ship",
        "quote": "Zero meeting notes written. Every insight captured. Every decision documented.",
        "author": "",
        "role": ""
      },
      "finalCta": {
        "headline1": "The best PMs don't write specs. ",
        "headlineEm": "They speak them.",
        "body": "Turn discovery calls into product specs. Capture every insight. Ship faster.",
        "ctaPrimary": "Start free trial"
      }
    }
  }
}
```

Translate these keys for all 5 locales (en, nl, de, fr, es).

### Step 3: Create Persona Hero Section Component

Create `apps/web/components/landing/sections/PersonaHeroSection.tsx`:

- Reuses the same layout as `HeroSection.tsx` (left/right grid, mascot image, background)
- Replaces generic headline/body with persona-specific copy from translations
- Shows a persona-specific eyebrow tag (e.g., "For consultants")
- Keeps the same CTA buttons (sign up / see how it works) but with persona-tuned labels
- Same `HeroTranscriptCard` component but showing a persona-relevant transcript snippet (e.g., consultant call for consultants, discovery call for PMs)

### Step 4: Create Persona Outputs Section Component

Create `apps/web/components/landing/sections/PersonaOutputsSection.tsx`:

- Replaces the generic 4-category grid (Sales, Marketing, Product, Tech) with persona-specific deliverables
- **Consultants**: Follow-up email, Proposal brief, Engagement summary, Custom template
- **Product Leaders**: Product spec, Feature brief, User insights, Sprint notes
- Uses the same card styling (`landing-output-card`) but with persona-relevant icons and descriptions

### Step 5: Create Persona Proof Section Component

Create `apps/web/components/landing/sections/PersonaProofSection.tsx`:

- Combines the big stat (from ad creative 4) with a testimonial
- Shows the key metric prominently (e.g., "3-4 hours saved per week" for consultants, "40% faster to ship" for PMs)
- Includes relevant testimonial quote
- Reuses `AnimatedCounter` styling from `InfrastructureSection`

### Step 6: Create Persona Page Components

**`apps/web/app/[locale]/for/consultants/page.tsx`** and **`apps/web/app/[locale]/for/product-leaders/page.tsx`**:

Each page composes a focused subset of sections (shorter than the main landing page):

1. **PersonaHeroSection** — Persona-specific hero with targeted messaging
2. **PersonaOutputsSection** — The 3-4 deliverables this persona gets
3. **AskAnythingSection** — Reused as-is (AI Q&A is universally valuable)
4. **PersonaProofSection** — Stat + testimonial tailored to persona
5. **SecuritySection** — Reused as-is (trust signals)
6. **PricingSection** — Reused as-is (same pricing for all)
7. **FinalCtaSection** — Persona-specific closing CTA with urgency copy from ads

Wraps with `PublicHeader`, `PublicFooter`, `AmbientGradient`, and `WaveDivider` — same as main landing page.

### Step 7: SEO Metadata per Persona

Each persona layout (`layout.tsx`) exports metadata with:
- Title: "Neural Summary for Consultants — Turn Client Calls into Deliverables"
- Title: "Neural Summary for Product Leaders — Turn Discovery Calls into Product Specs"
- Persona-specific OpenGraph descriptions
- Structured data (JSON-LD) with SoftwareApplication schema tailored to persona
- Canonical URL pointing to the persona page

### Step 8: UTM Parameter Handling

Add UTM parameter pass-through so CTA buttons preserve ad attribution:
- Read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` from the URL
- Append them to signup/CTA links (e.g., `/signup?utm_source=facebook&utm_campaign=consultants`)
- Use a small client component (`UTMLink`) or handle in `getAppUrl()` helper

### Step 9: Update CHANGELOG.md

Add entry under `[Unreleased]` documenting the new persona landing pages.

---

## Files Created/Modified

**New files (8):**
- `apps/web/app/[locale]/for/consultants/page.tsx`
- `apps/web/app/[locale]/for/consultants/layout.tsx`
- `apps/web/app/[locale]/for/product-leaders/page.tsx`
- `apps/web/app/[locale]/for/product-leaders/layout.tsx`
- `apps/web/components/landing/sections/PersonaHeroSection.tsx`
- `apps/web/components/landing/sections/PersonaOutputsSection.tsx`
- `apps/web/components/landing/sections/PersonaProofSection.tsx`
- `apps/web/components/landing/shared/UTMLink.tsx`

**Modified files (6):**
- `apps/web/messages/en.json` — add `personas` namespace
- `apps/web/messages/nl.json` — add `personas` namespace
- `apps/web/messages/de.json` — add `personas` namespace
- `apps/web/messages/fr.json` — add `personas` namespace
- `apps/web/messages/es.json` — add `personas` namespace
- `CHANGELOG.md` — document new persona landing pages

## Design Principles

- **Continuity**: Visitors who clicked a consultant-focused ad land on a page that immediately echoes the same language and deliverables. No cognitive disconnect.
- **Shorter than main page**: ~7 sections vs 11. Remove generic sections (CompatibilitySection, IntegrationsSection, SocialProofBar) that dilute the persona message.
- **Reuse over duplication**: Shared sections (pricing, security, ask-anything) are imported directly. Only hero, outputs, proof, and final CTA are persona-specific.
- **Server-rendered**: All pages are server components for SEO (matching main landing page pattern).
- **Same visual identity**: Same dark theme, typography, gradients, and component library. Only the copy and content focus changes.
