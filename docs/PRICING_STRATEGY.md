# Neural Summary - Pricing Strategy

**Last Updated:** January 2025
**Status:** Draft - Starting Point for Discussion

---

## Executive Summary

This document outlines the recommended pricing strategy for Neural Summary, balancing competitive positioning, value delivery, and sustainable unit economics. The strategy focuses on a three-tier model with clear value differentiation and room for future expansion.

**Key Recommendations:**
- Launch with Free + Professional tiers ($29/month)
- Add Pay-As-You-Go option ($1.50/hour) for flexibility
- Expand to Business ($79/month) and Enterprise (Custom) tiers as product matures
- Target 70%+ gross margins with on-demand analysis system

---

## Cost Analysis

### Per-Transcription Variable Costs (Current System)

**Transcription (AssemblyAI):**
- Cost: ~$0.015-0.025 per minute
- 1-hour meeting: ~$0.90-1.50

**AI Analysis (GPT-5 + GPT-5-mini):**
- Current (6 analyses): ~$0.041 per transcription
- With on-demand system: ~$0.032 per transcription (22% savings)

**Storage (Firebase):**
- Cost: ~$0.001-0.005 per GB/month

**Total Variable Cost per Hour of Audio:** ~$1.00-1.50

### Fixed Infrastructure Costs

- **Server** (Hetzner VPS): ~$50-100/month
- **Firebase**: Pay-as-you-go (scales with usage)
- **Redis**: Included in server costs
- **Domain/SSL**: ~$15/year
- **Monitoring/Tools**: ~$20-50/month

**Total Fixed Costs:** ~$100-200/month

---

## Value Proposition

**Time Saved:** Users save **10+ hours per week** by automating:
- Manual note-taking during meetings
- Post-meeting recaps and summaries
- Action item extraction and tracking
- Documentation writing
- Translation services
- Meeting minutes formatting

**Value Calculation:**
- If user's time is worth $50/hour
- Savings: $500+/week → **$2,000+/month value delivered**
- Our pricing captures 1.5-4% of value delivered (extremely favorable to customer)

**Pain Points Solved:**
- Never miss important details
- Instant action item tracking
- Multilingual team collaboration
- Professional documentation in seconds
- Better communication through pattern analysis

---

## Recommended Pricing Tiers

### 🆓 Free Tier - "Try Before You Buy"

**Price:** $0/month

**Features & Limits:**
- 3 transcriptions per month
- Max 30 minutes per file
- Max 100MB file size
- Core analyses only:
  - ✅ Summary
  - ✅ Action Items
  - ✅ Communication Analysis
  - ✅ Full Transcript
  - ✅ Details Tab
- 2 on-demand analyses per month (from 15 templates)
- Basic sharing (7-day expiration, no password)
- No translation
- Standard processing speed
- Community support (email, 48hr response)

**Purpose:**
- Low-friction user acquisition
- Let users experience core value
- Target conversion to paid within 1-2 months
- Viral growth through sharing

**Unit Economics:**
- Cost: ~$3-5/month per active free user
- Purpose: Marketing/acquisition cost, not profit center

**Ideal For:**
- First-time users exploring the platform
- Occasional users with light needs
- Students and personal use

---

### 💼 Professional - "For Individual Contributors"

**Price:**
- **$29/month** (monthly billing)
- **$290/year** (annual billing - save 17%, equivalent to 2 months free)

**Features:**
- **60 hours** of audio per month (~15 meetings/week)
- Unlimited file size (up to 5GB)
- Unlimited file duration
- **All core analyses** (always generated)
- **Unlimited on-demand analyses** (access to all 15 templates)
- **Translation** to 15 languages (unlimited)
- **Advanced sharing:**
  - Password protection
  - Custom expiration dates
  - View limits
  - Share tracking
- **Email distribution** with recipient tracking
- **Batch upload** (up to 10 files)
- **Batch processing options** (merge or individual)
- Priority processing (2x faster than Free)
- Email support (24hr response)
- 30-day money-back guarantee

**Overage Pricing:**
- $0.50 per additional hour (auto-charged monthly)
- Significantly cheaper than Pay-As-You-Go ($1.50/hour)

**Unit Economics:**
- COGS: ~$5-8/month (at average usage of 20-40 hours)
- Gross margin: ~75-85%
- Customer Lifetime Value (24 months): ~$700
- Target CAC: <$100 (7:1 LTV:CAC ratio)

**Ideal For:**
- Consultants, coaches, therapists
- Sales professionals
- Researchers, journalists
- Solo entrepreneurs
- Executive assistants
- Freelancers
- Content creators

**Marketing Angle:**
> "Less than the cost of one hour with a virtual assistant. Get unlimited AI-powered transcription and analysis for all your meetings."

---

### 🏢 Business - "For Teams & Heavy Users"

**Price:**
- **$79/month** (monthly billing)
- **$790/year** (annual billing - save 17%)

**Features:**
- **200 hours** of audio per month (~50 meetings/week)
- Everything in Professional, plus:

**Team Features:**
- 5 team member seats included
- Additional seats: $15/month per user
- Shared workspace
- Team analytics dashboard
- Usage reporting by team member
- Centralized billing and administration
- Role-based access control

**Advanced Features:**
- API access (10,000 requests/month)
- SSO (SAML/OAuth) integration
- Advanced security features:
  - Audit logs
  - IP whitelisting
  - Custom data retention policies
- White-label sharing pages (remove Neural Summary branding)
- Custom analysis templates (coming soon)
- Webhook integrations
- Export to common formats (PDF, DOCX, JSON)

**Support:**
- Priority support (2hr response time)
- Phone support (business hours)
- Dedicated account manager (annual plans only)
- Onboarding call (30 min)

**Overage Pricing:**
- $0.40 per additional hour (discounted vs Professional)

**Unit Economics:**
- COGS: ~$15-25/month (at average usage of 80-120 hours)
- Gross margin: ~70-80%
- Expansion revenue from additional seats
- Customer Lifetime Value (36 months): ~$2,800
- Target CAC: <$250 (11:1 LTV:CAC ratio)

**Ideal For:**
- Small-medium businesses (5-50 employees)
- Consulting firms
- Legal practices
- Medical practices
- Research teams
- Marketing agencies
- Sales teams
- Customer success teams

**Marketing Angle:**
> "Everything your team needs to stay aligned. Centralized transcription, analysis, and collaboration for growing businesses."

---

### 🏆 Enterprise - "For Organizations"

**Price:** Custom (starts at $499/month)

**Features:**
- **Unlimited** audio processing
- **Unlimited** team members
- Everything in Business, plus:

**Enterprise Features:**
- Dedicated infrastructure (optional)
- Custom integrations:
  - Zoom, Microsoft Teams, Google Meet
  - Salesforce, HubSpot
  - Slack, Microsoft Teams notifications
  - Custom API integrations
- Custom AI models and prompts
- On-premise deployment option
- SLA (99.9% uptime guarantee)
- HIPAA compliance
- SOC 2 Type II compliance
- Data residency options (EU, US, custom)
- Custom contracts and terms
- Volume discounts
- Multi-year agreements

**Support:**
- Dedicated customer success manager
- White-glove onboarding (custom training)
- 24/7 priority support
- Quarterly business reviews
- Direct engineering support for integrations

**Unit Economics:**
- COGS: Variable based on usage (~$50-200/month typical)
- Gross margin: ~65-75%
- Customer Lifetime Value: $20K-100K+ (multi-year contracts)
- Sales cycle: 3-6 months

**Ideal For:**
- Large corporations (500+ employees)
- Healthcare systems
- Law firms (50+ attorneys)
- Government agencies
- Financial services
- Pharmaceutical companies
- Universities and research institutions

**Sales Process:**
- Custom demo and POC (proof of concept)
- Security review and compliance documentation
- Custom pricing based on volume and features
- Annual or multi-year contracts

---

## Alternative Pricing Option

### Pay-As-You-Go - "No Commitment"

**Price:** $1.50 per hour of audio processed

**Features:**
- No monthly subscription required
- All features included (same as Professional tier)
- No feature restrictions
- Credits never expire
- Minimum purchase: $15 (10 hours)
- Available in increments: $15, $30, $50, $100, $250

**Unit Economics:**
- COGS: ~$1.00-1.50 per hour
- Gross margin: 0-33% (lower than subscription)
- Purpose: Capture occasional users, gateway to subscription

**Ideal For:**
- Very occasional users (1-2 transcriptions per month)
- Users testing before committing to subscription
- Seasonal businesses
- Project-based consultants

**Conversion Strategy:**
- Show cost comparison: "Used 20 hours this month? Save $1/hour with Professional at $29/month!"
- Prompt after 3rd purchase: "Upgrade to Professional and save 67%"

---

## Add-Ons & Expansion Revenue

### For Professional & Business Tiers

**Extra Hours:**
- Professional: $0.50/hour overage (auto-charged)
- Business: $0.40/hour overage (auto-charged)
- Prepaid packs available:
  - 30 hours: $15 (Professional)
  - 100 hours: $40 (Business)

**Additional Team Members (Business only):**
- $15/month per additional seat
- Volume discounts for 20+ seats

**API Access (Professional users):**
- $20/month for 10,000 requests
- $50/month for 50,000 requests
- Enterprise: Custom pricing

**White-Label Branding:**
- $50/month to remove Neural Summary branding from:
  - Shared transcription pages
  - Email notifications
  - Exported documents

**Premium Support (Professional users):**
- $30/month for Business-tier support (2hr response, phone)

**Custom Analysis Templates:**
- Coming soon (on-demand analysis system Phase 2)
- Pricing TBD: Likely $10-20/month per custom template

---

## Competitive Positioning

### Market Comparison

| Feature | Neural Summary (Pro) | Otter.ai (Pro) | Fireflies.ai (Pro) | Rev.ai | Descript (Pro) |
|---------|---------------------|----------------|-------------------|--------|----------------|
| **Price** | $29/month | $16.99/month | $10/seat | $0.25/min | $24/month |
| **Hours Included** | 60 hours | 1,200 min (20h) | Unlimited | Pay per use | Unlimited |
| **Cost per Hour** | $0.48 | $0.85 | $10 | $15 | $24+ |
| **AI Analysis Types** | 15+ templates | Basic summary | Basic notes | None | Basic |
| **Translation** | 15 languages | Limited | None | None | None |
| **Batch Upload** | ✅ 10 files | ❌ | ✅ | ❌ | Limited |
| **API Access** | Add-on | ❌ | Business tier | ✅ | ❌ |
| **White-Label** | Add-on | ❌ | ❌ | ❌ | ❌ |
| **Target Market** | Professional | General | Sales teams | Enterprise | Creators |

### Differentiation Strategy

**Why Choose Neural Summary:**

1. **More Sophisticated AI Analysis**
   - 15 specialized templates vs basic summaries
   - Professional-grade outputs (blog posts, meeting minutes, executive briefings)
   - Context-aware processing for better accuracy

2. **Better Translation**
   - 15 languages with full analysis translation
   - Competitors offer limited or no translation

3. **Professional Focus**
   - Built for legal, medical, consulting, executive use cases
   - HIPAA-ready, SOC 2 compliance path
   - Advanced security features

4. **Better Value at Scale**
   - 60 hours at $29 = $0.48/hour
   - Otter Pro: 20 hours at $17 = $0.85/hour
   - Rev: $15/hour

5. **Flexibility**
   - Subscription or Pay-As-You-Go
   - No lock-in, cancel anytime
   - Free tier with real value (not just a trial)

**Positioning Statement:**
> "Professional-grade AI transcription and analysis for a fraction of the cost. Where others stop at basic transcripts, we deliver actionable insights, multilingual support, and enterprise security."

---

## Pricing Psychology & Optimization

### 1. Anchoring Strategy

**Pricing Page Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Free        Professional      Business        │
│   $0          $29/month        $79/month       │
│               ⭐ MOST POPULAR                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Show Business tier first (anchor high)
- Highlight Professional as "Most Popular"
- Makes $29 feel like excellent value
- Free tier shows we're generous/confident

### 2. Value Metric Clarity

"**Hours of audio**" is the unit:
- Clear and relatable (users know how many meetings they have)
- Easy to predict needs (4 meetings/week × 1 hour = 16 hours/month)
- Scales with value delivered (more hours = more value)

Alternative metrics considered but rejected:
- ❌ Per-minute pricing (feels like watching the meter)
- ❌ Per-transcription (files vary wildly in length)
- ❌ Per-user (doesn't match individual use case)

### 3. Good-Better-Best Framework

**Target Distribution:**
- 60% choose Professional (sweet spot)
- 30% choose Business (power users)
- 10% choose Enterprise (custom needs)

**Why This Works:**
- Professional tier has best value per dollar
- Business tier offers clear upgrade path
- Enterprise is aspirational/exclusive

### 4. Annual Discount

**17% savings = 2 months free**

Benefits:
- Improves cash flow
- Reduces churn (sunk cost)
- Shows commitment to long-term value
- Industry standard discount level

**Marketing:**
- "Save $58/year with annual billing"
- "Get 2 months free"
- "Lock in this price for 12 months"

### 5. Usage Safety Net

**"Never Run Out" Messaging:**

Professional tier (60 hours/month):
- Overage: Just $0.50/hour (vs $1.50 PAYG)
- No surprise bills - email alert at 80% usage
- Option to upgrade to Business tier mid-month (prorated)

**Psychology:**
- Reduces anxiety about overages
- Overage price is fair (cheaper than PAYG)
- Encourages upgrade to Business tier

### 6. Social Proof & Defaults

**On Pricing Page:**
- "Join 500+ professionals who trust Neural Summary"
- "Most Popular" badge on Professional tier
- Testimonials from target personas
- Trust badges (SOC 2 in progress, GDPR compliant)

**Defaults:**
- Monthly billing selected by default (lower barrier)
- Annual billing shown with savings (tempting alternative)
- Professional tier visually highlighted

### 7. Transparent Pricing

**No Hidden Fees:**
- "What you see is what you pay"
- Clear overage pricing shown upfront
- No setup fees, no transaction fees
- Cancel anytime, no penalties

**Builds Trust:**
- Professional market expects transparency
- Reduces sales friction
- Positive word-of-mouth

---

## Revenue Projections

### Year 1 - Foundation (Conservative)

**User Distribution:**
- 500 Free users
- 200 Professional users ($29/month)
- 30 Business users ($79/month)
- 2 Enterprise users ($500/month average)

**Monthly Recurring Revenue (MRR):**
- Free: $0
- Professional: 200 × $29 = $5,800
- Business: 30 × $79 = $2,370
- Enterprise: 2 × $500 = $1,000
- **Total MRR: $9,170**

**Annual Recurring Revenue (ARR):** $110,000

**Costs:**
- Variable (COGS): ~$2,500/month (27% of revenue)
- Fixed: ~$150/month
- **Total Costs: ~$2,650/month**

**Gross Margin:** 73%
**Net Margin (before marketing/salary):** 62%

**Break-Even Analysis:**
- Fixed costs: $150/month
- Need ~30 Professional users to break even
- Target achieved by Month 3

---

### Year 2 - Growth (Moderate)

**User Distribution:**
- 2,000 Free users (4x growth)
- 800 Professional users (4x growth)
- 150 Business users (5x growth)
- 10 Enterprise users (5x growth)

**Monthly Recurring Revenue (MRR):**
- Professional: 800 × $29 = $23,200
- Business: 150 × $79 = $11,850
- Enterprise: 10 × $600 = $6,000
- Add-ons & Overages: ~$1,500
- **Total MRR: $42,550**

**Annual Recurring Revenue (ARR):** $510,000

**Costs:**
- Variable (COGS): ~$10,000/month (23% of revenue)
- Fixed: ~$500/month (servers, tools scaled up)
- **Total Costs: ~$10,500/month**

**Gross Margin:** 75%
**Net Margin (before marketing/salary):** 65%

**Efficiency Gains:**
- On-demand analysis system reduces COGS by 22%
- Server costs scale sub-linearly
- Support efficiency improves with better docs/FAQs

---

### Year 3 - Scale (Aggressive)

**User Distribution:**
- 5,000 Free users
- 2,000 Professional users
- 400 Business users
- 30 Enterprise users

**Monthly Recurring Revenue (MRR):**
- Professional: 2,000 × $29 = $58,000
- Business: 400 × $79 = $31,600
- Enterprise: 30 × $750 = $22,500
- Add-ons & Overages: ~$5,000
- API Revenue: ~$2,000
- **Total MRR: $119,100**

**Annual Recurring Revenue (ARR):** $1.43M

**Costs:**
- Variable (COGS): ~$25,000/month (21% of revenue)
- Fixed: ~$2,000/month (team expansion, infra)
- **Total Costs: ~$27,000/month**

**Gross Margin:** 77%
**Net Margin (before marketing/salary):** 70%

---

## Go-To-Market Strategy by Phase

### Phase 1: MVP Launch (Months 1-3)

**Tiers Available:**
- ✅ Free Tier
- ✅ Professional Tier ($29/month)
- ✅ Pay-As-You-Go ($1.50/hour)

**Focus:**
- Product-market fit validation
- Core user experience refinement
- Convert free users to paid

**Pricing Tactics:**
- Introductory offer: 50% off first 3 months ($14.50/month)
- Limited to first 100 customers
- Creates urgency and lowers barrier

**Success Metrics:**
- 50 paying customers
- 10% free-to-paid conversion rate
- <5% churn rate
- NPS >40

**Marketing Channels:**
- Product Hunt launch
- LinkedIn thought leadership
- Direct outreach to consultants/coaches
- SEO (transcription + AI analysis keywords)

---

### Phase 2: Market Expansion (Months 4-6)

**Tiers Available:**
- ✅ Free
- ✅ Professional
- ✅ Business ($79/month) - NEW
- ✅ Pay-As-You-Go

**New Features:**
- Team collaboration
- Basic analytics dashboard
- API access (add-on)

**Focus:**
- Expand to team use cases
- Increase ARPU (Average Revenue Per User)
- Test annual billing

**Pricing Tactics:**
- Annual billing launch (17% discount)
- "Bring Your Team" promotion (first 2 seats free)
- Referral program (both parties get $20 credit)

**Success Metrics:**
- $10K MRR
- 15% of users on Business tier
- 30% choose annual billing
- 3:1 LTV:CAC ratio

**Marketing Channels:**
- Case studies from early customers
- Content marketing (comparison articles)
- Paid ads (Google, LinkedIn)
- Partnership with Zoom, Calendly

---

### Phase 3: Enterprise Ready (Months 7-12)

**Tiers Available:**
- ✅ Free
- ✅ Professional
- ✅ Business
- ✅ Enterprise (Custom) - NEW

**New Features:**
- SSO/SAML integration
- Advanced security (audit logs)
- Custom integrations
- On-premise option

**Focus:**
- Move upmarket to enterprise
- Land & expand strategy
- Compliance certifications (SOC 2, HIPAA)

**Pricing Tactics:**
- Enterprise pilot program (3-month trial)
- Volume discounts for large teams
- Multi-year contracts (10% discount)

**Success Metrics:**
- $25K MRR
- 3-5 enterprise customers
- 40% revenue from Business+ tiers
- <3% monthly churn

**Marketing Channels:**
- Enterprise sales team (1-2 AEs)
- Industry conferences
- G2, Capterra reviews
- Enterprise partnerships

---

## Special Pricing Programs

### 1. Introductory Launch Pricing

**Offer:** 50% off first 3 months

**Tiers:**
- Professional: $14.50/month → $29/month after
- Business: $39.50/month → $79/month after

**Eligibility:**
- First 100 customers (or first 3 months of launch)
- Must sign up with credit card
- Automatically renews at full price

**Purpose:**
- Lower barrier to entry
- Create early adopter community
- Generate testimonials and case studies
- Build momentum for launch

**Expected Results:**
- 2-3x higher conversion rate during promo
- 60-70% retention after price increase
- Word-of-mouth from early adopters

---

### 2. Non-Profit & Education Discount

**Offer:** 40% off all tiers

**Pricing:**
- Professional: $17/month (vs $29)
- Business: $47/month (vs $79)

**Eligibility:**
- Verified 501(c)(3) non-profits
- Accredited educational institutions (.edu email)
- Students with valid student ID

**Purpose:**
- Social responsibility
- Word-of-mouth in academia
- Training ground for future paying customers
- PR/brand building

**Application Process:**
- Submit application with proof
- Manual review (1-2 business days)
- Annual renewal required

---

### 3. Startup Program

**Offer:** 50% off Business tier for 12 months

**Pricing:**
- Business: $39.50/month (vs $79) for first year

**Eligibility:**
- <2 years old
- <$1M annual revenue
- <10 employees
- Must be venture-backed OR part of recognized accelerator

**Purpose:**
- Build relationships with fast-growing companies
- Land & expand as they scale
- Testimonials from innovative companies

**Partner With:**
- Y Combinator
- Techstars
- 500 Global
- Product Hunt (Startup Program)

---

### 4. Affiliate Program

**Commission:** 20% recurring for 12 months

**Example:**
- Refer someone to Professional ($29/month)
- Earn $5.80/month for 12 months = $69.60 total per referral

**Ideal Affiliates:**
- Business coaches
- Productivity consultants
- Virtual assistant agencies
- Podcasters/YouTubers (productivity niche)

**Resources Provided:**
- Affiliate dashboard
- Marketing materials (banners, email templates)
- Dedicated landing pages
- Real-time tracking

**Payout:**
- Monthly via PayPal or Stripe
- Minimum $50 threshold
- Net-30 payment terms

---

### 5. Referral Program (Customer)

**Offer:** Both parties get $20 credit

**How It Works:**
- Existing customer shares referral link
- New customer signs up for Professional or Business
- Both receive $20 credit (1 month Professional)

**Limits:**
- Unlimited referrals
- Credits can be stacked
- Credits never expire
- Cannot be redeemed for cash

**Purpose:**
- Viral growth mechanism
- Reward loyal customers
- Lower CAC through word-of-mouth

---

### 6. Annual Prepay Discount

**Standard:** 17% off (2 months free)

**Extra Incentive:** Add 1 additional month for upfront annual payment

**Pricing:**
- Professional: $290/year → $270/year (prepaid = 3 months free)
- Business: $790/year → $730/year (prepaid = 3 months free)

**Purpose:**
- Improve cash flow significantly
- Reduce churn (sunk cost psychology)
- Show confidence in long-term value

---

## Pricing Experiments & A/B Tests

### Test 1: Price Point Optimization (Month 2-3)

**Hypothesis:** $29 is at the low end of willingness to pay. We can charge more.

**Test:**
- Control: $29/month (current)
- Variant A: $39/month
- Variant B: $49/month

**Metrics:**
- Conversion rate
- Free-to-paid rate
- Revenue per customer
- Churn rate

**Decision Criteria:**
- If Variant A has >10% higher revenue with <15% conversion drop → switch
- Run test for 4 weeks, 500+ visitors per variant

---

### Test 2: Annual vs Monthly Default (Month 4)

**Hypothesis:** Defaulting to annual billing increases annual subscriptions.

**Test:**
- Control: Monthly selected by default
- Variant: Annual selected by default (with savings message)

**Metrics:**
- % choosing annual
- Total revenue per customer
- Time to churn

**Expected Result:**
- 15-20% increase in annual subscriptions
- No impact on overall conversion rate

---

### Test 3: Hour Limits (Month 5-6)

**Hypothesis:** 60 hours is too generous. We can reduce to 40 hours without hurting conversion.

**Test:**
- Control: 60 hours at $29/month
- Variant A: 40 hours at $29/month
- Variant B: 50 hours at $29/month

**Metrics:**
- Conversion rate
- Overage usage
- Churn rate
- Customer satisfaction

**Decision Criteria:**
- If no significant conversion impact, reduce to 40-50 hours
- Improves margins by 20-30%

---

### Test 4: Free Tier Limits (Month 7)

**Hypothesis:** 3 transcriptions/month is too generous. Can reduce to 2 without hurting conversion.

**Test:**
- Control: 3 transcriptions/month
- Variant: 2 transcriptions/month

**Metrics:**
- Free-to-paid conversion rate
- Time to conversion
- Free user activation rate

**Expected Result:**
- Slight increase in conversion rate (more urgency)
- 30% reduction in free tier costs

---

## Key Metrics to Track

### North Star Metric

**Monthly Recurring Revenue (MRR)**
- Primary business health indicator
- Target: 20% MoM growth in Year 1
- Target: 10% MoM growth in Year 2

### Acquisition Metrics

**Customer Acquisition Cost (CAC):**
- Total marketing + sales spend / new customers
- Target: <$100 (Year 1), <$150 (Year 2)
- By channel tracking

**Free-to-Paid Conversion Rate:**
- % of free users who upgrade within 90 days
- Target: 5-10%
- Optimize through in-app prompts, email nurture

**Time to First Value:**
- Hours from signup to first transcription
- Target: <24 hours
- Optimize through onboarding flow

---

### Engagement Metrics

**Monthly Active Users (MAU):**
- Users who upload at least 1 file per month
- Target: >60% of total user base

**Transcriptions per User per Month:**
- Professional: Target 8-12 transcriptions/month
- Business: Target 15-25 transcriptions/month

**Feature Adoption:**
- % using on-demand analyses
- % using translation
- % using sharing features
- Identify power users and upsell opportunities

---

### Revenue Metrics

**Average Revenue Per User (ARPU):**
- Total MRR / total paying customers
- Target: $35-40 (blend of Professional and Business)

**Expansion MRR:**
- Revenue from upgrades, add-ons, overages
- Target: 10-15% of MRR

**Annual Contract Value (ACV):**
- For Enterprise customers
- Target: $10K-50K average

---

### Retention Metrics

**Monthly Churn Rate:**
- % of customers who cancel in a month
- Target: <5% monthly (Professional)
- Target: <3% monthly (Business)

**Net Revenue Retention:**
- (Starting MRR + Expansion - Churn) / Starting MRR
- Target: >100% (expansion > churn)

**Lifetime Value (LTV):**
- Average revenue per customer over lifetime
- Professional: Target 24 months = $696
- Business: Target 36 months = $2,844

**LTV:CAC Ratio:**
- Target: 3:1 minimum, 5:1 ideal
- Indicates sustainable growth

---

### Unit Economics

**Gross Margin:**
- (Revenue - COGS) / Revenue
- Target: 70-75% blended
- On-demand system helps achieve this

**Payback Period:**
- Months to recover CAC
- Target: <12 months
- <6 months with annual prepay

**Customer Profitability:**
- Track cohort profitability over time
- All cohorts should be profitable by Month 12

---

## Pricing Communication & Messaging

### Homepage Hero Section

**Headline:**
> "Turn hours of audio into actionable insights — in seconds"

**Subheadline:**
> "Professional AI transcription and analysis starting at $29/month. No commitment, cancel anytime."

**CTA:**
- Primary: "Start Free Trial" (Free tier)
- Secondary: "See Pricing"

---

### Pricing Page Headline

**Option A (Value-Focused):**
> "Professional transcription for the price of lunch"

**Option B (Time-Saving):**
> "Save 10+ hours every week for less than $1/day"

**Option C (Comparison):**
> "Everything you need. Half the price of competitors."

---

### Feature Comparison Table

Show on pricing page to drive Professional tier selection:

| Feature | Free | Professional | Business |
|---------|------|--------------|----------|
| Transcriptions | 3/month | 60 hours/month | 200 hours/month |
| File Size | 100MB | 5GB | 5GB |
| Core Analyses | ✅ | ✅ | ✅ |
| On-Demand Templates | 2/month | Unlimited | Unlimited |
| Translation | ❌ | 15 languages | 15 languages |
| Batch Upload | ❌ | ✅ 10 files | ✅ 10 files |
| Sharing | Basic | Advanced | Advanced |
| Team Seats | 1 | 1 | 5 included |
| API Access | ❌ | Add-on | ✅ Included |
| Support | Community | Email 24hr | Priority 2hr |
| Price | $0 | $29/mo | $79/mo |

---

### FAQ Content

**"How much does Neural Summary cost?"**
> Neural Summary offers a free tier with 3 transcriptions per month, perfect for trying the platform. Our Professional plan is $29/month for 60 hours of audio, and our Business plan is $79/month for teams. We also offer flexible Pay-As-You-Go pricing at $1.50/hour.

**"What happens if I exceed my monthly hours?"**
> No worries! Overages are automatically charged at $0.50/hour for Professional users and $0.40/hour for Business users. You'll receive an email notification when you reach 80% of your monthly limit. You can also upgrade your plan anytime.

**"Can I switch plans anytime?"**
> Yes! You can upgrade, downgrade, or cancel anytime. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle. There are no cancellation fees.

**"Do you offer refunds?"**
> Yes, we offer a 30-day money-back guarantee on your first payment. If you're not satisfied, contact us for a full refund.

**"Do you offer discounts for non-profits or students?"**
> Yes! We offer 40% off all plans for verified non-profits and educational institutions. Apply through our education/non-profit program page.

**"What payment methods do you accept?"**
> We accept all major credit cards (Visa, Mastercard, American Express, Discover) via Stripe. Enterprise customers can also pay via wire transfer or invoice.

---

## Implementation Roadmap

### Month 1: Foundation

**Setup:**
- ✅ Implement Stripe billing integration
- ✅ Create pricing page
- ✅ Set up plan tiers in database
- ✅ Usage tracking system
- ✅ Overage calculation logic
- ✅ Email notifications (usage alerts, billing)

**Testing:**
- Staging environment testing
- Billing edge cases (prorating, refunds, upgrades)
- Load testing for concurrent transactions

**Launch:**
- Soft launch to waitlist (100 users)
- Monitor for issues
- Gather feedback

---

### Month 2-3: Optimization

**Focus:**
- Monitor conversion rates by tier
- Run A/B tests (price points, messaging)
- Improve onboarding flow
- Add social proof (testimonials, usage stats)

**Features:**
- Usage dashboard for customers
- Upgrade prompts in-app
- Annual billing option

**Marketing:**
- Launch introductory pricing (50% off)
- Content marketing (comparison articles)
- Case studies from early customers

---

### Month 4-6: Expansion

**Launch:**
- Business tier
- Team collaboration features
- Annual billing
- Referral program

**Focus:**
- Move upmarket
- Increase ARPU
- Reduce churn through better engagement

**Features:**
- Team analytics dashboard
- API access (add-on)
- White-label option

---

### Month 7-12: Enterprise

**Launch:**
- Enterprise tier
- SSO/SAML integration
- Advanced security features
- Custom contracts

**Focus:**
- Enterprise sales process
- Compliance certifications
- Custom integrations

**Team:**
- Hire 1-2 enterprise AEs
- Dedicated customer success
- Technical account management

---

## Risk Mitigation

### Risk 1: Price Too Low

**Indicator:**
- High conversion rate (>20%)
- Low churn (<2%)
- Customers not using full allocation

**Mitigation:**
- Run price increase tests
- Grandfather existing customers
- Add premium features to justify increase

---

### Risk 2: Free Tier Abuse

**Indicator:**
- Free users creating multiple accounts
- High free tier costs
- Low conversion rate

**Mitigation:**
- Require phone verification
- Limit by IP address
- Reduce free tier limits
- Add friction (manual approval)

---

### Risk 3: High Churn

**Indicator:**
- Monthly churn >5%
- Customers cite price as reason

**Mitigation:**
- Improve product value (features)
- Better onboarding/activation
- Win-back campaigns
- Exit surveys to understand reasons
- Offer pause/downgrade options

---

### Risk 4: Low Conversion

**Indicator:**
- Free-to-paid <3%
- High drop-off at payment step

**Mitigation:**
- Improve free tier value (more features, not more limits)
- Better upgrade prompts
- Add social proof
- Offer extended trial (7 days Professional free)
- Payment plan flexibility

---

## Next Steps & Decision Points

### Immediate (Before Launch)

1. **Finalize Initial Pricing:**
   - ✅ Free: 3 transcriptions/month, 30 min max
   - ✅ Professional: $29/month, 60 hours
   - ✅ Pay-As-You-Go: $1.50/hour
   - Decision: Approve or modify?

2. **Build Billing System:**
   - Set up Stripe integration
   - Implement usage tracking
   - Create customer portal
   - Timeline: 2-3 weeks

3. **Create Pricing Page:**
   - Design mockups
   - Write copy
   - Add testimonials (from beta)
   - Timeline: 1 week

4. **Launch Strategy:**
   - Start with Free + Professional only
   - Add Business tier at Month 4
   - Add Enterprise at Month 9
   - Decision: Approve timeline?

---

### Short Term (Months 1-3)

1. **Introductory Offer:**
   - 50% off first 3 months
   - Limited to first 100 customers
   - Decision: Approve offer?

2. **Metrics Dashboard:**
   - Track CAC, LTV, churn
   - Cohort analysis
   - Automated reporting

3. **A/B Testing:**
   - Test price points ($29 vs $39)
   - Test messaging variants
   - Test annual discount levels

---

### Medium Term (Months 4-6)

1. **Business Tier Launch:**
   - Team features ready
   - Pricing: $79/month
   - Decision: Approve feature set?

2. **Annual Billing:**
   - 17% discount (2 months free)
   - Prepay bonus (1 extra month)
   - Decision: Approve discount level?

3. **Referral Program:**
   - $20 credit for both parties
   - Unlimited referrals
   - Decision: Approve program structure?

---

### Long Term (Months 7-12)

1. **Enterprise Tier:**
   - Custom pricing (starts at $499)
   - Sales process defined
   - Decision: When to launch?

2. **Pricing Model Evolution:**
   - Consider usage-based pricing
   - Consider feature-based add-ons
   - Consider freemium vs free trial

3. **Market Expansion:**
   - International pricing (EUR, GBP)
   - Regional discounts (PPP-adjusted)
   - Currency flexibility

---

## Appendix

### Glossary

- **MRR (Monthly Recurring Revenue):** Predictable monthly revenue from subscriptions
- **ARR (Annual Recurring Revenue):** MRR × 12
- **ARPU (Average Revenue Per User):** Total revenue / total customers
- **CAC (Customer Acquisition Cost):** Marketing + sales spend / new customers
- **LTV (Lifetime Value):** Average revenue per customer over lifetime
- **Churn Rate:** % of customers who cancel in a period
- **NRR (Net Revenue Retention):** Expansion revenue minus churn
- **COGS (Cost of Goods Sold):** Direct variable costs per transaction
- **Gross Margin:** (Revenue - COGS) / Revenue

### Further Reading

- **Pricing Books:**
  - "Monetizing Innovation" by Madhavan Ramanujam
  - "The SaaS Playbook" by Rob Walling
  - "Predictable Revenue" by Aaron Ross

- **Pricing Resources:**
  - Price Intelligently blog
  - SaaS Capital blog on unit economics
  - Patrick Campbell (ProfitWell) on pricing strategy

### Contact

For questions about this pricing strategy:
- **Product/Business:** [Your Contact]
- **Finance:** [Finance Contact]
- **Sales (Enterprise):** [Sales Contact]

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Status:** Draft for team review
**Next Review:** After MVP launch (Month 3)
