import { AnalysisTemplate, AnalysisType } from '@transcribe/shared';
import * as prompts from './prompts';

/**
 * System-defined analysis templates
 * These templates are used for on-demand analysis generation
 */
export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  // ============================================================
  // PROFESSIONAL ANALYSIS TEMPLATES
  // ============================================================
  {
    id: 'system-emotional-iq',
    name: 'Emotional Intelligence',
    description: 'Analyze emotional tone, empathy, and interpersonal dynamics',
    category: 'professional',
    icon: 'Brain',
    color: 'pink',
    systemPrompt: prompts.getSystemPromptByType(
      AnalysisType.EMOTIONAL_INTELLIGENCE,
    ),
    userPrompt: prompts.getPromptByType(AnalysisType.EMOTIONAL_INTELLIGENCE),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-influence',
    name: 'Influence & Persuasion',
    description: 'Identify persuasion techniques and influence patterns',
    category: 'professional',
    icon: 'Target',
    color: 'orange',
    systemPrompt: prompts.getSystemPromptByType(
      AnalysisType.INFLUENCE_PERSUASION,
    ),
    userPrompt: prompts.getPromptByType(AnalysisType.INFLUENCE_PERSUASION),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-development',
    name: 'Personal Development',
    description: 'Identify growth opportunities and skill development areas',
    category: 'professional',
    icon: 'TrendingUp',
    color: 'teal',
    systemPrompt: prompts.getSystemPromptByType(
      AnalysisType.PERSONAL_DEVELOPMENT,
    ),
    userPrompt: prompts.getPromptByType(AnalysisType.PERSONAL_DEVELOPMENT),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-risk-assessment',
    name: 'Risk Assessment',
    description: 'Identify risks and mitigation strategies',
    category: 'professional',
    icon: 'ShieldAlert',
    color: 'red',
    systemPrompt:
      'You are a risk management expert who identifies potential risks, assesses their impact and likelihood, and recommends mitigation strategies based on conversation analysis.',
    userPrompt: `Conduct a comprehensive risk assessment of this discussion.

## Identified Risks

For each risk, analyze:

### [Risk Category]: [Specific Risk]
- **Description:** What is the risk?
- **Likelihood:** High / Medium / Low
- **Impact:** Critical / High / Medium / Low
- **Risk Score:** [Likelihood × Impact]
- **Indicators:** Warning signs mentioned
- **Mitigation:** Proposed or recommended strategies
- **Owner:** Who should manage this risk

Categories to consider:
- Technical risks
- Business risks
- Timeline/schedule risks
- Resource/budget risks
- Market/competitive risks
- Regulatory/compliance risks

## Risk Matrix
[Prioritize risks by score]

## Immediate Actions Required
[Critical risks needing immediate attention]

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-conflict-analysis',
    name: 'Conflict Analysis',
    description: 'Identify disagreements and resolution paths',
    category: 'professional',
    icon: 'AlertTriangle',
    color: 'orange',
    systemPrompt:
      'You are a conflict resolution expert who analyzes disagreements, identifies root causes, and recommends constructive resolution strategies.',
    userPrompt: `Analyze all disagreements and conflicts in this conversation.

## Conflicts Identified

For each conflict:

### Conflict [#]: [Topic of Disagreement]

**Parties Involved:** [Speaker identifiers]

**Positions:**
- Party A's position: [What they argued for]
- Party B's position: [What they argued for]

**Root Cause:**
What's the underlying disagreement? (values, priorities, information gap, etc.)

**Arguments Presented:**
- Key points raised by each side
- Evidence or reasoning used

**Emotional Tone:**
- How heated did it get?
- Signs of frustration or defensiveness

**Resolution:**
- Was it resolved? How?
- Compromise reached?
- Agreement to revisit later?

**Remaining Tensions:**
- Unresolved aspects
- Lingering disagreements

## Conflict Resolution Assessment
- What worked in resolving conflicts?
- What could have been handled better?
- Recommendations for future disagreements

## Action Items from Conflicts
[Specific next steps to address unresolved issues]

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ============================================================
  // CONTENT CREATION TEMPLATES
  // ============================================================
  {
    id: 'system-blog-post',
    name: 'Blog Post Draft',
    description: 'Transform conversation into an engaging blog post',
    category: 'content',
    icon: 'FileEdit',
    color: 'purple',
    systemPrompt:
      'You are a skilled content writer who transforms conversations into engaging, well-structured blog posts suitable for professional audiences.',
    userPrompt: `Convert this conversation into a well-structured blog post.

Requirements:
- Engaging headline that captures the main topic
- Hook opening paragraph
- 3-5 main sections with descriptive headings
- Use conversational yet professional tone
- Include specific examples and quotes from the discussion
- Conclude with key takeaways
- Add relevant subheadings for scannability

Write in an accessible style suitable for a professional blog audience.

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-email-summary',
    name: 'Executive Brief',
    description:
      'Transform conversations into executive-ready briefs that highlight decisions, risks, and business impact',
    category: 'professional',
    icon: 'Briefcase',
    color: 'indigo',
    systemPrompt:
      'You are a senior executive communications advisor who has spent 15+ years crafting briefings for C-suite leaders at Fortune 500 companies. You understand what executives care about: decisions, risks, business impact, and clear next steps. You write with confidence and clarity, cutting through noise to deliver strategic intelligence. Your briefs are known for being crisp, insightful, and action-oriented.',
    userPrompt: `You are transforming this conversation into a boardroom-ready brief for senior leadership.

**Your Goal:**
Write a strategic brief that respects the reader's time while providing complete context for decision-making. Senior leaders need to understand decisions, risks, and required actions - without meeting minutiae.

**Tone & Style:**
- Confident and authoritative, not tentative
- Direct and concise - every word earns its place
- Strategic focus - emphasize business impact, not process details
- Professional polish - zero typos, perfect grammar, clear structure
- Active voice - "The team decided" not "It was decided"

**Structure:**

**Subject:** [Action-oriented subject that signals priority and topic]
Examples: "Decision Required: Q3 Budget Allocation" or "Update: Product Launch Timeline Shifted" or "Key Outcomes: Client Strategy Session"

**Opening Line (BLUF - Bottom Line Up Front):**
Immediately state the most important insight, decision, or outcome in 1-2 sentences.
Examples:
- "We've decided to accelerate the product launch by 6 weeks, requiring an additional $200K investment."
- "The client committed to a $500K expansion, pending legal review by March 15."
- "Three critical risks were identified that could delay the Q2 release."

**Context (2-3 sentences):**
Briefly explain why this conversation happened and who was involved. Only include context that helps understanding - skip the obvious.

**Key Decisions & Outcomes:**
List the most important decisions/outcomes with brief rationale:
- Use bullet points for 3+ items, integrate into prose for 1-2 items
- Include the "why" when it provides strategic insight
- Format: "[Decision/Outcome] to [achieve business goal/mitigate risk]"
- Quantify when possible (dates, $$$, metrics, percentages)

**Risks & Considerations (if applicable):**
Flag anything that could derail success or requires leadership awareness:
- Dependencies on other teams/systems
- Resource constraints or budget concerns
- Timeline pressures or competing priorities
- External factors (regulatory, competitive, market)

**Action Items:**
Present as clear commitments, not vague intentions:
- Format: "[Name] will [specific action] by [date] to [outcome/goal]"
- Only include actions that matter at the executive level
- Flag critical path items or cross-functional dependencies

**Next Milestone/Decision Point (if applicable):**
When will the next update come? What's the next key decision point?
Examples: "Next review: March 15 board meeting" or "Decision required by: EOW Friday on vendor selection"

**Closing (1 sentence, if needed):**
Only include if there's a specific ask, invitation for input, or important context.
Examples:
- "Please confirm budget approval by EOD Thursday."
- "Let me know if you have concerns about the timeline shift."
- "Happy to discuss any of these points in more detail."

**Quality Checklist:**
✓ BLUF captures the most important point immediately
✓ Business impact is clear (revenue, risk, strategic alignment, efficiency)
✓ Decisions include rationale, not just "what"
✓ Numbers and dates are specific, not vague
✓ Risks are flagged proactively
✓ Actions have clear owners and deadlines
✓ Length: 200-300 words (longer for complex strategic discussions, shorter for updates)
✓ Zero jargon unless it's standard business terminology
✓ Sounds like it came from a senior leader or their trusted advisor

**What to Omit:**
- Detailed back-and-forth or process discussions
- Tactical minutiae (unless it reveals strategic risk)
- Generic platitudes ("had a productive discussion")
- Obvious context the executive already knows
- Verbose explanations - be crisp

**Critical Language Requirement:**
If the transcript is in a non-English language, write the entire brief (subject and body) in that same language, maintaining the same professional executive tone.

**Remember:** You're writing for someone who has 2 minutes to read this and needs to make a decision or understand the strategic situation. Make every sentence count.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: true,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-linkedin-post',
    name: 'LinkedIn Post',
    description: 'Create a LinkedIn post highlighting key insights',
    category: 'content',
    icon: 'Share2',
    color: 'indigo',
    systemPrompt:
      'You are a social media content creator who transforms professional insights into engaging LinkedIn posts.',
    userPrompt: `Transform this conversation into an engaging LinkedIn post.

Requirements:
- Hook opening (question or bold statement)
- 3-5 key insights or takeaways
- Use short paragraphs for mobile reading
- Professional yet conversational tone
- Include 3-5 relevant hashtags
- Call to action or question for engagement
- Keep under 200 words

Focus on insights that would interest your professional network.

If the transcript is in a non-English language, the entire post (including hashtags) must be in that same language.`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: false,
    order: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-meeting-minutes',
    name: 'Meeting Minutes (Formal)',
    description: 'Generate formal meeting minutes with sections',
    category: 'content',
    icon: 'FileText',
    color: 'gray',
    systemPrompt:
      'You are a professional secretary who creates formal, well-structured meeting minutes.',
    userPrompt: `Create formal meeting minutes from this conversation.

Structure:
# Meeting Minutes - [Extract Topic]

**Date:** [Extract or indicate unknown]
**Attendees:** [List speakers/participants]

## Agenda Items
[List topics discussed]

## Discussion Summary
For each agenda item:
- Key points raised
- Different viewpoints
- Relevant details

## Decisions Made
[Bullet list of concrete decisions]

## Action Items
| Task | Owner | Deadline |
|------|-------|----------|
[Table format]

## Next Meeting
[Date/topics if mentioned]

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 25,
    featured: false,
    order: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-faq',
    name: 'FAQ Generator',
    description: 'Extract common questions and answers',
    category: 'content',
    icon: 'HelpCircle',
    color: 'yellow',
    systemPrompt:
      'You are a knowledge management expert who creates comprehensive FAQ documents from discussions.',
    userPrompt: `Extract all questions discussed and create a comprehensive FAQ.

Format each Q&A pair:

## [Category Name]

**Q: [Question in user's words]**
A: [Clear, concise answer based on discussion. Include specific details, examples, or caveats mentioned.]

Requirements:
- Group related questions by category
- Write questions as actual user questions
- Keep answers clear and actionable
- Include relevant context/examples
- Note if question wasn't fully answered

Categories might include:
- Getting Started
- Features & Functionality
- Troubleshooting
- Pricing & Plans
- Technical Details
- Best Practices

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: false,
    order: 13,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-training',
    name: 'Training Material',
    description: 'Convert conversation into training content',
    category: 'content',
    icon: 'GraduationCap',
    color: 'teal',
    systemPrompt:
      'You are an instructional designer who creates effective training materials from expert discussions.',
    userPrompt: `Convert this conversation into structured training material.

# Training Module: [Extract Topic]

## Learning Objectives
After completing this training, learners will be able to:
- [Objective 1 - specific and measurable]
- [Objective 2]
- [Objective 3]

## Prerequisites
- What learners should know before starting
- Required skills or background

## Key Concepts

### Concept 1: [Name]
- **Definition:** Clear explanation
- **Why It Matters:** Importance/context
- **Example:** Real example from discussion
- **Common Mistakes:** Pitfalls to avoid

[Repeat for each concept]

## Step-by-Step Guide
1. [First step with details]
2. [Second step with details]
[Continue...]

## Practice Exercises
- Exercise 1: [Hands-on activity]
- Exercise 2: [Scenario-based question]

## Summary
Key takeaways in bullet points

## Additional Resources
- [Resources mentioned in discussion]
- [Recommended reading/tools]

## Assessment
- How will learners know they've mastered this?
- Self-check questions

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ============================================================
  // SPECIALIZED TEMPLATES
  // ============================================================
  {
    id: 'system-executive-briefing',
    name: 'Executive Briefing',
    description: 'One-page executive summary for leadership',
    category: 'specialized',
    icon: 'Briefcase',
    color: 'slate',
    systemPrompt:
      'You are an executive communication specialist who creates concise, high-impact briefings for senior leadership.',
    userPrompt: `Create a one-page executive briefing suitable for senior leadership.

Structure:

# Executive Briefing: [Topic]

## Situation
What's happening? (2-3 sentences)

## Key Findings
- Finding 1 with impact
- Finding 2 with impact
- Finding 3 with impact

## Recommendations
1. Primary recommendation with rationale
2. Secondary recommendation
3. Alternative if applicable

## Risk Assessment
- Critical risks and likelihood
- Mitigation strategies

## Resource Requirements
Budget, timeline, personnel needed

## Decision Required
What leadership needs to decide

Keep it scannable - use bold for key terms, limit to 1 page.

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-sales-analysis',
    name: 'Sales Call Analysis',
    description: 'Analyze sales calls for objections and opportunities',
    category: 'specialized',
    icon: 'TrendingUp',
    color: 'green',
    systemPrompt:
      'You are a sales enablement expert who analyzes sales conversations to identify opportunities, objections, and strategies for improvement.',
    userPrompt: `Analyze this sales conversation comprehensively.

## Customer Profile
- Key pain points mentioned
- Current situation/challenges
- Budget indicators
- Decision-making authority

## Objections Raised
For each objection:
- What was said
- Underlying concern
- How it was handled
- Recommended response

## Buying Signals
- Positive indicators
- Questions about implementation
- Timeline discussions

## Competitor Mentions
- Alternatives being considered
- Comparison points raised

## Next Steps
- Agreed actions
- Follow-up timeline
- Documents to send

## Win Probability
- Assessment (high/medium/low)
- Key factors influencing outcome
- What could move the needle

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-customer-feedback',
    name: 'Customer Feedback Extraction',
    description: 'Extract product feedback and feature requests',
    category: 'specialized',
    icon: 'MessageCircle',
    color: 'blue',
    systemPrompt:
      'You are a product manager who excels at extracting and organizing customer feedback from conversations.',
    userPrompt: `Extract all product feedback from this customer conversation.

## Feature Requests
- [Feature]: Description, why they need it, priority indicated

## Reported Issues
- [Issue]: What's broken, impact, workaround if mentioned

## Positive Feedback
- What's working well
- Favorite features
- Praise quotes

## Improvement Suggestions
- What could be better
- Usability concerns
- Missing capabilities

## Pain Points
- Current frustrations
- Workflow blockers
- Competitor advantages mentioned

## Priority Assessment
Rate each item: Critical / High / Medium / Low

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 25,
    featured: false,
    order: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-tech-docs',
    name: 'Technical Documentation',
    description: 'Create technical documentation from discussions',
    category: 'specialized',
    icon: 'Code',
    color: 'purple',
    systemPrompt:
      'You are a technical writer who creates clear, comprehensive documentation from engineering discussions.',
    userPrompt: `Create technical documentation from this engineering discussion.

# Technical Documentation: [Extract Topic]

## Overview
Brief description of what's being built/decided

## Architecture Decisions
- **Decision:** What was chosen
- **Rationale:** Why this approach
- **Alternatives Considered:** Other options discussed
- **Trade-offs:** Pros and cons

## Technical Specifications
- Technologies/frameworks mentioned
- Key components
- Data structures
- APIs/integrations

## Implementation Details
- Setup requirements
- Configuration needed
- Dependencies
- Code patterns to follow

## Known Issues & Limitations
- Current limitations
- Technical debt incurred
- Future improvements needed

## Testing Strategy
- How to test
- Edge cases to cover

## Deployment Notes
- Deployment process
- Environment requirements
- Rollback procedures

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: false,
    order: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Helper to get template by ID
export function getTemplateById(id: string): AnalysisTemplate | undefined {
  return ANALYSIS_TEMPLATES.find((t) => t.id === id);
}

// Helper to get templates by category
export function getTemplatesByCategory(category: string): AnalysisTemplate[] {
  return ANALYSIS_TEMPLATES.filter((t) => t.category === category);
}

// Helper to get featured templates
export function getFeaturedTemplates(): AnalysisTemplate[] {
  return ANALYSIS_TEMPLATES.filter((t) => t.featured).sort(
    (a, b) => a.order - b.order,
  );
}

// Helper to get all templates sorted by order
export function getAllTemplates(): AnalysisTemplate[] {
  return [...ANALYSIS_TEMPLATES].sort((a, b) => a.order - b.order);
}
