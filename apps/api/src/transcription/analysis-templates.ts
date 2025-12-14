import { AnalysisTemplate, AnalysisType } from '@transcribe/shared';
import * as prompts from './prompts';
import {
  createTemplate,
  createStructuredTemplate,
  PROMPT_INSTRUCTIONS,
  SCHEMA_FRAGMENTS,
} from './template-helpers';

/**
 * System-defined analysis templates
 * These templates are used for on-demand analysis generation
 */
export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  // ============================================================
  // V2 OUTPUT TEMPLATES (matching frontend template IDs)
  // ============================================================
  createStructuredTemplate({
    id: 'actionItems',
    name: 'Action Items',
    description: 'Extract actionable tasks from conversations',
    category: 'professional',
    icon: 'CheckSquare',
    color: 'green',
    systemPrompt: `You are a critical project manager. Only extract GENUINE action items that were EXPLICITLY discussed or committed to. Never fabricate or infer tasks. Quality over quantity. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Extract actionable tasks from this conversation and return as JSON.

CRITICAL REQUIREMENTS:
1. Only include action items that were EXPLICITLY discussed or committed to
2. Each action item must be SMART-formatted: Specific, Measurable, with clear context

DO NOT include:
- General topics or ideas mentioned casually
- Vague statements like "we should think about X"
- Inferred or assumed tasks not explicitly stated
- Recommendations unless someone explicitly committed to doing them

Each action item MUST be SMART:
- SPECIFIC: Include WHAT needs to be done and any relevant details (who, where, how)
- MEASURABLE: Clear completion criteria when possible
- ACTION-ORIENTED: Start with a clear verb (send, schedule, create, review, call, etc.)
- COMPLETE: Include enough context that someone reading it later understands the full task

EXAMPLES of good vs bad action items:
❌ BAD: "Book it tomorrow" (Book what? Where? For whom?)
✅ GOOD: "Book the conference room for the Q1 planning meeting tomorrow at 2pm"

❌ BAD: "Send the thing" (What thing? To whom?)
✅ GOOD: "Send the updated proposal to Sarah at Acme Corp"

❌ BAD: "Follow up" (On what? With whom?)
✅ GOOD: "Follow up with the design team about the homepage mockups"

For each action item, extract:
- task: Complete, specific task description with full context (SMART format)
- owner: Person's name if mentioned, or null
- deadline: Due date or timeframe if discussed, or null
- priority: "high", "medium", or "low"
- priorityReason: One sentence explaining WHY this priority level
- context: Any dependencies or additional context (optional)

Priority guidelines:
- HIGH: Explicitly urgent, blocking other work, or has immediate deadline (this week)
- MEDIUM: Important but flexible timeline, mentioned as "needed soon"
- LOW: Nice-to-have, no urgency expressed, or "when time permits"

Group items by timeframe:
- immediateActions: Tasks for this week
- shortTermActions: Tasks for this month
- longTermActions: Tasks beyond this month

IMPORTANT: If there are NO genuine, explicit action items in the conversation, return empty arrays. Quality over quantity - it's better to return nothing than to fabricate vague tasks.

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "actionItems",
  "immediateActions": [{ "task": "string", "owner": "string|null", "deadline": "string|null", "priority": "high|medium|low", "priorityReason": "string", "context": "string" }],
  "shortTermActions": [{ "task": "string", "owner": "string|null", "deadline": "string|null", "priority": "high|medium|low", "priorityReason": "string", "context": "string" }],
  "longTermActions": [{ "task": "string", "owner": "string|null", "deadline": "string|null", "priority": "high|medium|low", "priorityReason": "string", "context": "string" }]
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    featured: true,
    order: 0,
    tags: ['action-items', 'tasks', 'productivity', 'project-management'],
    targetRoles: ['project-manager', 'team-lead', 'founder'],
    templateGroup: 'action-items',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'actionItems' },
        immediateActions: { type: 'array', items: SCHEMA_FRAGMENTS.actionItem },
        shortTermActions: { type: 'array', items: SCHEMA_FRAGMENTS.actionItem },
        longTermActions: { type: 'array', items: SCHEMA_FRAGMENTS.actionItem },
      },
      required: ['type', 'immediateActions', 'shortTermActions', 'longTermActions'],
    },
  }),

  createStructuredTemplate({
    id: 'email',
    name: 'Email Summary',
    description: 'Transform conversations into professional follow-up emails',
    category: 'content',
    icon: 'Mail',
    color: 'blue',
    systemPrompt: `You are an expert email writer. Transform conversation transcripts into clear, concise emails. Adapt your tone based on context — professional for business, casual for friends, formal for executives, etc. Default to professional when no tone is specified. Focus on key points, action items, and next steps. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Based on this conversation transcript, write an email summary and return as JSON.

IMPORTANT: If context is provided above, USE IT to customize the email:
- Tailor the greeting to the specified recipient (use their name if provided)
- Match the tone to what's specified (casual, friendly, formal, etc.) — default to professional only if no tone is indicated
- Include any specific instructions from the context (e.g., "focus on pricing", "mention next steps")
- Reference any mentioned deadlines, project names, or company details

Extract and structure:
- subject: Clear, actionable subject line
- greeting: Greeting appropriate to the tone and recipient
- body: Array of paragraphs summarizing the key points
- keyPoints: Array of bullet points highlighting main takeaways
- actionItems: Array of next steps or actions required
- closing: Closing appropriate to the tone

Keep the email focused and easy to scan.
${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "email",
  "subject": "string",
  "greeting": "string",
  "body": ["paragraph1", "paragraph2"],
  "keyPoints": ["point1", "point2"],
  "actionItems": ["action1", "action2"],
  "closing": "string"
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    featured: true,
    order: 0,
    tags: ['email', 'communication', 'follow-up', 'business'],
    targetRoles: ['sales', 'account-manager', 'founder', 'consultant'],
    templateGroup: 'email',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'email' },
        subject: { type: 'string' },
        greeting: { type: 'string' },
        body: SCHEMA_FRAGMENTS.stringArray,
        keyPoints: SCHEMA_FRAGMENTS.stringArray,
        actionItems: SCHEMA_FRAGMENTS.stringArray,
        closing: { type: 'string' },
      },
      required: ['type', 'subject', 'greeting', 'body', 'keyPoints', 'actionItems', 'closing'],
    },
  }),

  createStructuredTemplate({
    id: 'blogPost',
    name: 'Blog Post',
    description: 'Transform conversation insights into compelling blog content',
    category: 'content',
    icon: 'FileEdit',
    color: 'purple',
    systemPrompt: `You are an experienced content writer specializing in creating engaging, publish-ready blog posts. Transform conversation transcripts into compelling narratives that educate, inspire, and engage readers. Use storytelling techniques, clear structure, and authentic voice. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Transform this conversation into a compelling blog post and return as JSON.

Create a structured blog post with:
- headline: Engaging, SEO-friendly headline
- subheading: Optional subtitle that adds context
- hook: Opening paragraph that captures attention
- sections: Array of content sections, each with:
  - heading: Section title (sentence case)
  - paragraphs: Array of body paragraphs
  - bulletPoints: Optional array of key points
  - quotes: Optional array of quotes with attribution
- callToAction: Compelling closing statement
- metadata: Word count, target audience, tone

Make it publish-ready and engaging for readers.
${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "blogPost",
  "headline": "string",
  "subheading": "string (optional)",
  "hook": "string",
  "sections": [{ "heading": "string", "paragraphs": ["string"], "bulletPoints": ["string"], "quotes": [{ "text": "string", "attribution": "string" }] }],
  "callToAction": "string",
  "metadata": { "wordCount": number, "targetAudience": "string", "tone": "string" }
}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 0,
    tags: ['blog', 'content-creation', 'writing', 'thought-leadership'],
    targetRoles: ['content-creator', 'founder', 'marketing', 'thought-leader'],
    templateGroup: 'blog',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'blogPost' },
        headline: { type: 'string' },
        subheading: { type: 'string' },
        hook: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string' },
              paragraphs: SCHEMA_FRAGMENTS.stringArray,
              bulletPoints: SCHEMA_FRAGMENTS.stringArray,
              quotes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    attribution: { type: 'string' },
                  },
                  required: ['text', 'attribution'],
                },
              },
            },
            required: ['heading', 'paragraphs'],
          },
        },
        callToAction: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            wordCount: { type: 'number' },
            targetAudience: { type: 'string' },
            tone: { type: 'string' },
          },
          required: ['wordCount', 'tone'],
        },
      },
      required: ['type', 'headline', 'hook', 'sections', 'callToAction', 'metadata'],
    },
  }),

  createStructuredTemplate({
    id: 'linkedin',
    name: 'LinkedIn Post',
    description: 'Create engaging professional LinkedIn updates',
    category: 'content',
    icon: 'Share2',
    color: 'indigo',
    systemPrompt: `You are a social media content creator specializing in LinkedIn posts. Create engaging, professional posts that spark conversation and provide value. Use authentic voice, clear insights, and strategic formatting with line breaks and emojis when appropriate. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create an engaging LinkedIn post based on this conversation and return as JSON.

Structure the post with:
- hook: Opening line that grabs attention (question or bold statement)
- content: Main body with key insights (use \\n for line breaks, emojis sparingly)
- hashtags: 3-5 relevant hashtags (without # symbol)
- callToAction: Closing question or CTA to encourage engagement
- characterCount: Total character count (aim for 150-300 words)

Make it authentic and engaging for LinkedIn's professional audience.
${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "linkedin",
  "hook": "string",
  "content": "string",
  "hashtags": ["tag1", "tag2"],
  "callToAction": "string",
  "characterCount": number
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    order: 0,
    tags: ['linkedin', 'social-media', 'professional-networking', 'thought-leadership'],
    targetRoles: ['founder', 'content-creator', 'sales', 'thought-leader'],
    templateGroup: 'linkedin',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'linkedin' },
        hook: { type: 'string' },
        content: { type: 'string' },
        hashtags: SCHEMA_FRAGMENTS.stringArray,
        callToAction: { type: 'string' },
        characterCount: { type: 'number' },
      },
      required: ['type', 'hook', 'content', 'hashtags', 'callToAction', 'characterCount'],
    },
  }),

  createStructuredTemplate({
    id: 'communicationAnalysis',
    name: 'Communication Analysis',
    description: 'Score conversation on communication effectiveness',
    category: 'professional',
    icon: 'MessageSquare',
    color: 'teal',
    systemPrompt: `You are a communication coach and analyst. Your task is to evaluate conversations across multiple dimensions of effective communication. Provide constructive, actionable feedback with specific examples from the conversation. Be objective yet encouraging. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Analyze this conversation transcript for communication effectiveness and return as JSON.

Evaluate and score (0-100) the conversation across these 6 dimensions:
1. Clarity - How clearly were ideas expressed?
2. Active Listening - Evidence of listening and building on others' ideas
3. Empathy - Understanding and acknowledging others' perspectives
4. Persuasiveness - Effectiveness in presenting arguments and influencing
5. Collaboration - Working together towards shared understanding
6. Conciseness - Getting to the point without unnecessary words

For each dimension, provide:
- name: The dimension name
- score: Number from 0-100
- strengths: 1-2 specific examples of what was done well
- improvements: 1-2 actionable suggestions for improvement

Also provide:
- overallScore: Weighted average of all dimensions
- overallAssessment: 2-3 sentence summary of communication quality
- keyTakeaway: Single most important insight

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "communicationAnalysis",
  "overallScore": number,
  "dimensions": [{ "name": "string", "score": number, "strengths": ["string"], "improvements": ["string"] }],
  "overallAssessment": "string",
  "keyTakeaway": "string"
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 0,
    tags: ['communication', 'feedback', 'coaching', 'soft-skills'],
    targetRoles: ['manager', 'coach', 'hr', 'team-lead'],
    templateGroup: 'communication-analysis',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'communicationAnalysis' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              strengths: SCHEMA_FRAGMENTS.stringArray,
              improvements: SCHEMA_FRAGMENTS.stringArray,
            },
            required: ['name', 'score', 'strengths', 'improvements'],
          },
        },
        overallAssessment: { type: 'string' },
        keyTakeaway: { type: 'string' },
      },
      required: ['type', 'overallScore', 'dimensions', 'overallAssessment', 'keyTakeaway'],
    },
  }),

  // ============================================================
  // PROFESSIONAL ANALYSIS TEMPLATES
  // ============================================================
  createTemplate({
    id: 'system-emotional-iq',
    name: 'Emotional Intelligence',
    description: 'Analyze emotional tone, empathy, and interpersonal dynamics',
    category: 'professional',
    icon: 'Brain',
    color: 'pink',
    systemPrompt: prompts.getSystemPromptByType(AnalysisType.EMOTIONAL_INTELLIGENCE),
    userPrompt: prompts.getPromptByType(AnalysisType.EMOTIONAL_INTELLIGENCE),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 1,
    tags: ['emotional-intelligence', 'empathy', 'interpersonal', 'psychology'],
    targetRoles: ['manager', 'coach', 'hr', 'therapist'],
    templateGroup: 'emotional-intelligence',
  }),

  createTemplate({
    id: 'system-influence',
    name: 'Influence & Persuasion',
    description: 'Identify persuasion techniques and influence patterns',
    category: 'professional',
    icon: 'Target',
    color: 'orange',
    systemPrompt: prompts.getSystemPromptByType(AnalysisType.INFLUENCE_PERSUASION),
    userPrompt: prompts.getPromptByType(AnalysisType.INFLUENCE_PERSUASION),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 2,
    tags: ['persuasion', 'influence', 'negotiation', 'sales'],
    targetRoles: ['sales', 'founder', 'negotiator', 'consultant'],
    templateGroup: 'influence',
  }),

  createTemplate({
    id: 'system-development',
    name: 'Personal Development',
    description: 'Identify growth opportunities and skill development areas',
    category: 'professional',
    icon: 'TrendingUp',
    color: 'teal',
    systemPrompt: prompts.getSystemPromptByType(AnalysisType.PERSONAL_DEVELOPMENT),
    userPrompt: prompts.getPromptByType(AnalysisType.PERSONAL_DEVELOPMENT),
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 3,
    tags: ['personal-development', 'growth', 'coaching', 'feedback'],
    targetRoles: ['coach', 'manager', 'hr', 'individual-contributor'],
    templateGroup: 'personal-development',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 11,
    tags: ['risk-management', 'mitigation', 'project-management', 'strategy'],
    targetRoles: ['project-manager', 'product-manager', 'founder', 'executive'],
    templateGroup: 'risk-assessment',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 14,
    tags: ['conflict-resolution', 'mediation', 'negotiation', 'team-dynamics'],
    targetRoles: ['manager', 'hr', 'mediator', 'team-lead'],
    templateGroup: 'conflict-analysis',
  }),

  // ============================================================
  // CONTENT CREATION TEMPLATES
  // ============================================================
  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 4,
    tags: ['blog', 'content-creation', 'writing', 'marketing'],
    targetRoles: ['content-creator', 'marketing', 'founder', 'thought-leader'],
    templateGroup: 'blog',
  }),

  createTemplate({
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

**Context (2-3 sentences):**
Briefly explain why this conversation happened and who was involved.

**Key Decisions & Outcomes:**
List the most important decisions/outcomes with brief rationale.

**Risks & Considerations (if applicable):**
Flag anything that could derail success or requires leadership awareness.

**Action Items:**
Present as clear commitments, not vague intentions.
Format: "[Name] will [specific action] by [date] to [outcome/goal]"

**Next Milestone/Decision Point (if applicable):**
When will the next update come? What's the next key decision point?

**Closing (1 sentence, if needed):**
Only include if there's a specific ask or important context.

**Quality Checklist:**
✓ BLUF captures the most important point immediately
✓ Business impact is clear
✓ Decisions include rationale
✓ Numbers and dates are specific
✓ Risks are flagged proactively
✓ Actions have clear owners and deadlines
✓ Length: 200-300 words

**Critical Language Requirement:**
${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: true,
    order: 4,
    tags: ['executive-brief', 'leadership', 'strategy', 'decision-making'],
    targetRoles: ['executive', 'founder', 'chief-of-staff', 'board-member'],
    templateGroup: 'executive-brief',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 6,
    tags: ['linkedin', 'social-media', 'professional-networking'],
    targetRoles: ['founder', 'content-creator', 'sales', 'marketing'],
    templateGroup: 'linkedin',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 25,
    order: 7,
    tags: ['meeting-minutes', 'documentation', 'formal', 'records'],
    targetRoles: ['executive-assistant', 'project-manager', 'secretary', 'team-lead'],
    templateGroup: 'meeting-minutes',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 13,
    tags: ['faq', 'knowledge-base', 'documentation', 'support'],
    targetRoles: ['product-manager', 'support', 'content-creator', 'knowledge-manager'],
    templateGroup: 'faq',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 15,
    tags: ['training', 'education', 'learning', 'instructional-design'],
    targetRoles: ['trainer', 'hr', 'learning-designer', 'team-lead'],
    templateGroup: 'training',
  }),

  // ============================================================
  // SPECIALIZED TEMPLATES
  // ============================================================
  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 8,
    tags: ['executive-briefing', 'leadership', 'strategy', 'summary'],
    targetRoles: ['executive', 'founder', 'chief-of-staff', 'consultant'],
    templateGroup: 'executive-brief',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 9,
    tags: ['sales', 'call-analysis', 'objections', 'opportunity'],
    targetRoles: ['sales', 'sales-manager', 'account-executive', 'founder'],
    templateGroup: 'sales-analysis',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 25,
    order: 10,
    tags: ['customer-feedback', 'product-feedback', 'feature-requests', 'voice-of-customer'],
    targetRoles: ['product-manager', 'customer-success', 'founder', 'ux-researcher'],
    templateGroup: 'customer-feedback',
  }),

  createTemplate({
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

${PROMPT_INSTRUCTIONS.languageAndHeaders}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 12,
    tags: ['technical-docs', 'engineering', 'architecture', 'documentation'],
    targetRoles: ['engineer', 'technical-writer', 'architect', 'team-lead'],
    templateGroup: 'technical-docs',
  }),
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
