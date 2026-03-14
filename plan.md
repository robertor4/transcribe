# Plan: Persona-Specific Landing Pages for Facebook Ads

## Overview

Create two persona-specific landing page variants that Facebook ads link to directly. Each page reuses the existing landing page architecture (sections, components, translations) but swaps messaging, hero copy, outputs, testimonials, and CTAs to speak directly to the ad's target persona.

**Routes:**
- `/[locale]/for/consultants` — Consultant persona landing page
- `/[locale]/for/product-leaders` — Product Leader persona landing page

## Neuromarketing Copy Framework

All copy is structured to hit three brain layers in sequence:

1. **Reptilian (survival)** — Open with threat, urgency, or competitive danger. This is the first thing the visitor reads.
2. **Limbic (emotion/identity)** — Resolve the threat with identity aspiration. "You could be the consultant who..." / "The PM who ships, not writes."
3. **Logical (proof/process)** — Close with verifiable proof, real testimonials, and a clear how-it-works process so the rational mind can justify the decision.

---

## Ad Personas & Copy

### Consultant Persona

**Core insight**: Consultants compete on speed of follow-up. The one who sends the proposal first wins.

#### Hero Section (Reptilian → Limbic)
- **Eyebrow**: `For consultants`
- **Headline**: "The client call ended 20 minutes ago. Your competitor already sent the **follow-up.**"
- **Subhead**: "They didn't type faster. They used a system. Neural Summary turns any recorded call into a follow-up email, proposal brief, and engagement summary — before you open your notes app."
- **CTA Primary**: "Try free for 14 days"
- **CTA Secondary**: "See how it works"

*Reptilian*: Competitive threat — someone else is winning your deal right now.
*Limbic*: Identity resolution — "a system" implies you can be that consultant too.

#### Outputs Section (Limbic — relief and identity)
- **Tag**: `What lands in their inbox`
- **Headline**: "Three deliverables. **Zero typing.**"
- **Body**: "Record the call. Neural Summary generates consultant-grade documents you can send immediately."
- **Cards** (each with emotional subtitle):
  - Follow-up email → "Quotes their exact words back to them"
  - Proposal brief → "Mirrors every concern raised in the call"
  - Engagement summary → "Clear next steps, nothing forgotten"
  - Custom template → "Build your own for any client workflow"

*Limbic*: Each subtitle describes the emotional impact on the client, not just the feature.

#### How It Works (Logical — process credibility)
- **Tag**: `How it works`
- **Headline**: "Record. Extract. **Send.**"
- **3 steps**:
  1. "Record your client call" — any device, any app
  2. "AI extracts structure" — identifies decisions, action items, concerns, quotes
  3. "Deliverables ready in minutes" — follow-up email, proposal brief, engagement summary

*Logical*: Simple 3-step process proves this isn't magic — it's a credible system.

#### Proof Section (Logical — real person, real numbers)
- **Stat**: "12 calls/week. **3-4 hours saved.**"
- **Testimonial**: "I run 12 client calls a week. I was losing 3-4 hours just on post-call writeups. Now that time goes back into actual client work."
- **Author**: Wouter Chompff, Founder · One Man Agency

*Logical*: Real person, specific numbers, verifiable claim.

#### Final CTA (Reptilian + Limbic)
- **Headline**: "Right now, someone faster is **closing your deal.**"
- **Body**: "The consultants winning more work aren't more talented. They just follow up faster. No credit card. No meeting bots. No installs."
- **CTA**: "Start free trial"

*Reptilian*: Urgency — it's happening right now.
*Limbic*: Identity — "winning more work" is who you want to be.

---

### Product Leader Persona

**Core insight**: PMs are the bottleneck between user research and shipping. They lose insights translating calls into specs manually.

#### Hero Section (Reptilian → Limbic)
- **Eyebrow**: `For product leaders`
- **Headline**: "Your team is waiting for the spec. You're still writing it **from your notes.**"
- **Subhead**: "The best PMs don't translate discovery calls into docs manually. They record the call and let Neural Summary generate the product spec, feature brief, and user insights — ready to ship from."
- **CTA Primary**: "Try free for 14 days"
- **CTA Secondary**: "See how it works"

*Reptilian*: Bottleneck fear — your team is blocked because of you.
*Limbic*: Identity — "the best PMs" do it differently.

#### Outputs Section (Limbic — the "I ship, not write" identity)
- **Tag**: `From one discovery call`
- **Headline**: "Speak the spec. **Ship the spec.**"
- **Body**: "No more playing telephone between what users said and what ends up in the backlog."
- **Cards** (each with emotional subtitle):
  - Product spec → "Structured PRD from your own words"
  - Feature brief → "Scope and requirements, already defined"
  - User insights → "Every quote, pain point, and theme — captured"
  - Sprint notes → "Ready for your next planning session"

*Limbic*: "Speak the spec. Ship the spec." — this is the identity PMs want.

#### How It Works (Logical — process credibility)
- **Tag**: `How it works`
- **Headline**: "Record. Extract. **Ship.**"
- **3 steps**:
  1. "Record your discovery call" — user interviews, stakeholder syncs, brainstorms
  2. "AI structures every insight" — pain points, feature requests, decisions, quotes
  3. "Four deliverables, under 3 minutes" — product spec, feature brief, user insights, sprint notes

*Logical*: Specific time claim (under 3 minutes) gives the rational brain something to verify.

#### Proof Section (Logical — process as proof)
- **Stat**: "30 min call → **4 deliverables**"
- **Body**: "Record a 30-minute discovery call. Get a product spec, feature brief, user insights report, and sprint notes — in under 3 minutes. Every insight captured. Every decision documented."
- **No fabricated testimonial** — use the process itself as proof (it's verifiable by trying the free trial).

*Logical*: No invented stats. The process is the proof. Free trial is the verification mechanism.

#### Final CTA (Reptilian + Limbic)
- **Headline**: "Every call you don't record is insights you **lose forever.**"
- **Body**: "User research is expensive. Don't let it evaporate into half-remembered notes. Capture everything. Ship from everything."
- **CTA**: "Start free trial"

*Reptilian*: Loss aversion — insights are disappearing right now.
*Limbic*: Responsibility — "user research is expensive" appeals to the PM's stewardship identity.

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
        "headline1": "The client call ended 20 minutes ago. Your competitor already sent the ",
        "headlineEm": "follow-up.",
        "body": "They didn't type faster. They used a system. Neural Summary turns any recorded call into a follow-up email, proposal brief, and engagement summary — before you open your notes app.",
        "ctaPrimary": "Try free for 14 days",
        "ctaSecondary": "See how it works"
      },
      "outputs": {
        "tag": "What lands in their inbox",
        "headline1": "Three deliverables. ",
        "headlineEm": "Zero typing.",
        "body": "Record the call. Neural Summary generates consultant-grade documents you can send immediately.",
        "items": {
          "followUp": { "title": "Follow-up email", "description": "Quotes their exact words back to them" },
          "proposal": { "title": "Proposal brief", "description": "Mirrors every concern raised in the call" },
          "engagement": { "title": "Engagement summary", "description": "Clear next steps, nothing forgotten" },
          "custom": { "title": "Custom template", "description": "Build your own for any client workflow" }
        }
      },
      "howItWorks": {
        "tag": "How it works",
        "headline1": "Record. Extract. ",
        "headlineEm": "Send.",
        "steps": {
          "record": { "title": "Record your client call", "description": "Any device, any app" },
          "extract": { "title": "AI extracts structure", "description": "Identifies decisions, action items, concerns, and quotes" },
          "deliver": { "title": "Deliverables ready in minutes", "description": "Follow-up email, proposal brief, engagement summary" }
        }
      },
      "proof": {
        "stat": "12",
        "statLabel": "calls/week. 3-4 hours saved.",
        "quote": "I run 12 client calls a week. I was losing 3-4 hours just on post-call writeups. Now that time goes back into actual client work.",
        "author": "Wouter Chompff",
        "role": "Founder · One Man Agency"
      },
      "finalCta": {
        "headline1": "Right now, someone faster is ",
        "headlineEm": "closing your deal.",
        "body": "The consultants winning more work aren't more talented. They just follow up faster. No credit card. No meeting bots. No installs.",
        "ctaPrimary": "Start free trial"
      }
    },
    "productLeaders": {
      "hero": {
        "eyebrow": "For product leaders",
        "headline1": "Your team is waiting for the spec. You're still writing it ",
        "headlineEm": "from your notes.",
        "body": "The best PMs don't translate discovery calls into docs manually. They record the call and let Neural Summary generate the product spec, feature brief, and user insights — ready to ship from.",
        "ctaPrimary": "Try free for 14 days",
        "ctaSecondary": "See how it works"
      },
      "outputs": {
        "tag": "From one discovery call",
        "headline1": "Speak the spec. ",
        "headlineEm": "Ship the spec.",
        "body": "No more playing telephone between what users said and what ends up in the backlog.",
        "items": {
          "spec": { "title": "Product spec", "description": "Structured PRD from your own words" },
          "brief": { "title": "Feature brief", "description": "Scope and requirements, already defined" },
          "insights": { "title": "User insights", "description": "Every quote, pain point, and theme — captured" },
          "sprint": { "title": "Sprint notes", "description": "Ready for your next planning session" }
        }
      },
      "howItWorks": {
        "tag": "How it works",
        "headline1": "Record. Extract. ",
        "headlineEm": "Ship.",
        "steps": {
          "record": { "title": "Record your discovery call", "description": "User interviews, stakeholder syncs, brainstorms" },
          "extract": { "title": "AI structures every insight", "description": "Pain points, feature requests, decisions, and quotes" },
          "deliver": { "title": "Four deliverables, under 3 minutes", "description": "Product spec, feature brief, user insights, sprint notes" }
        }
      },
      "proof": {
        "stat": "30",
        "statLabel": "min call → 4 deliverables",
        "body": "Record a 30-minute discovery call. Get a product spec, feature brief, user insights report, and sprint notes — in under 3 minutes. Every insight captured. Every decision documented."
      },
      "finalCta": {
        "headline1": "Every call you don't record is insights you ",
        "headlineEm": "lose forever.",
        "body": "User research is expensive. Don't let it evaporate into half-remembered notes. Capture everything. Ship from everything.",
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
- Replaces generic headline/body with persona-specific copy (reptilian headline → limbic subhead)
- Shows a persona-specific eyebrow tag (e.g., "For consultants")
- Keeps the same CTA buttons with persona-tuned labels
- Same `HeroTranscriptCard` component but showing a persona-relevant transcript snippet

### Step 4: Create Persona Outputs Section Component

Create `apps/web/components/landing/sections/PersonaOutputsSection.tsx`:

- 4-card grid with persona-specific deliverables
- Each card has an emotional subtitle (limbic) not just feature name
- **Consultants**: Follow-up email, Proposal brief, Engagement summary, Custom template
- **Product Leaders**: Product spec, Feature brief, User insights, Sprint notes
- Uses the same card styling (`landing-output-card`) with persona-relevant icons

### Step 5: Create Persona How It Works Section Component

Create `apps/web/components/landing/sections/PersonaHowItWorksSection.tsx`:

- Simple 3-step horizontal layout: Record → Extract → Send/Ship
- Gives the logical brain a credible process to evaluate
- Reuses numbered step styling pattern from existing landing page

### Step 6: Create Persona Proof Section Component

Create `apps/web/components/landing/sections/PersonaProofSection.tsx`:

- Big stat prominently displayed (reuses `AnimatedCounter` styling)
- **Consultants**: Real testimonial from Wouter Chompff with specific numbers
- **Product Leaders**: Process-as-proof (30 min call → 4 deliverables in 3 min) — no fabricated stats
- Testimonial card styling matches existing `TestimonialsSection`

### Step 7: Create Persona Page Components

**`apps/web/app/[locale]/for/consultants/page.tsx`** and **`apps/web/app/[locale]/for/product-leaders/page.tsx`**:

Each page composes a focused subset of sections (shorter than the main landing page — 8 sections vs 11):

1. **PersonaHeroSection** — Reptilian threat → Limbic identity resolution
2. **PersonaOutputsSection** — Deliverables with emotional subtitles
3. **PersonaHowItWorksSection** — 3-step process for logical credibility
4. **AskAnythingSection** — Reused as-is (AI Q&A is universally valuable)
5. **PersonaProofSection** — Real stat + testimonial (or process-as-proof)
6. **SecuritySection** — Reused as-is (trust signals for logical brain)
7. **PricingSection** — Reused as-is (same pricing for all)
8. **PersonaFinalCtaSection** — Reptilian urgency + Limbic identity close

Wraps with `PublicHeader`, `PublicFooter`, `AmbientGradient`, and `WaveDivider` — same as main landing page.

### Step 8: SEO Metadata per Persona

Each persona layout (`layout.tsx`) exports metadata with:
- Consultant: "Neural Summary for Consultants — Turn Client Calls into Deliverables"
- Product Leader: "Neural Summary for Product Leaders — Turn Discovery Calls into Product Specs"
- Persona-specific OpenGraph descriptions that echo the ad copy
- Structured data (JSON-LD) with SoftwareApplication schema tailored to persona
- Canonical URL pointing to the persona page

### Step 9: UTM Parameter Handling

Add UTM parameter pass-through so CTA buttons preserve ad attribution:
- Read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` from the URL
- Append them to signup/CTA links (e.g., `/signup?utm_source=facebook&utm_campaign=consultants`)
- Use a small client component (`UTMLink`) or handle in `getAppUrl()` helper

### Step 10: Update CHANGELOG.md

Add entry under `[Unreleased]` documenting the new persona landing pages.

---

## Files Created/Modified

**New files (10):**
- `apps/web/app/[locale]/for/consultants/page.tsx`
- `apps/web/app/[locale]/for/consultants/layout.tsx`
- `apps/web/app/[locale]/for/product-leaders/page.tsx`
- `apps/web/app/[locale]/for/product-leaders/layout.tsx`
- `apps/web/components/landing/sections/PersonaHeroSection.tsx`
- `apps/web/components/landing/sections/PersonaOutputsSection.tsx`
- `apps/web/components/landing/sections/PersonaHowItWorksSection.tsx`
- `apps/web/components/landing/sections/PersonaProofSection.tsx`
- `apps/web/components/landing/sections/PersonaFinalCtaSection.tsx`
- `apps/web/components/landing/shared/UTMLink.tsx`

**Modified files (6):**
- `apps/web/messages/en.json` — add `personas` namespace
- `apps/web/messages/nl.json` — add `personas` namespace
- `apps/web/messages/de.json` — add `personas` namespace
- `apps/web/messages/fr.json` — add `personas` namespace
- `apps/web/messages/es.json` — add `personas` namespace
- `CHANGELOG.md` — document new persona landing pages

## Design Principles

- **Reptilian → Limbic → Logical**: Every page follows this sequence. Hook with threat, resolve with identity, close with proof.
- **Ad continuity**: Visitors who clicked "Your competitor's follow-up arrived 2 hours ago" land on a page opening with the same competitive urgency. Zero cognitive disconnect.
- **Shorter than main page**: ~8 sections vs 11. Remove generic sections (CompatibilitySection, IntegrationsSection, SocialProofBar) that dilute the persona message.
- **No fabricated proof**: Only use verifiable claims. Real testimonials with names, or process-as-proof that visitors can verify via free trial.
- **Reuse over duplication**: Shared sections (pricing, security, ask-anything) are imported directly. Only hero, outputs, how-it-works, proof, and final CTA are persona-specific.
- **Server-rendered**: All pages are server components for SEO (matching main landing page pattern).
- **Same visual identity**: Same dark theme, typography, gradients, and component library. Only the copy and content focus changes.
