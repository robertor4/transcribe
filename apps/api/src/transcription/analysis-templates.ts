import { AnalysisTemplate } from '@transcribe/shared';
import {
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

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL REQUIREMENTS:
1. Only include action items that were EXPLICITLY discussed or committed to
2. Keep task descriptions CONCISE (8-15 words maximum)

DO NOT include:
- General topics or ideas mentioned casually
- Vague statements like "we should think about X"
- Inferred or assumed tasks not explicitly stated
- Recommendations unless someone explicitly committed to doing them

CONCISENESS RULES:
- Task descriptions: 8-15 words MAXIMUM
- Lead with action verb (Send, Review, Call, Schedule, Create, Finalize, etc.)
- Focus on WHAT needs to be done, not WHY or HOW
- Put additional details in the "context" field, not the task
- Remove filler phrases: "in order to", "so that", "to ensure", "for the purpose of"
- Cut parenthetical explanations from the task - move them to context

EXAMPLES - Bad vs Good:
❌ TOO VAGUE: "Book it tomorrow"
❌ TOO WORDY: "Book the conference room for the Q1 planning meeting tomorrow at 2pm"
✅ CONCISE: "Book conference room for Q1 planning" (context: "Tomorrow 2pm")

❌ TOO WORDY: "Resolve the budget so there is a definitive budget before year-end (confirm assumptions and finalize numbers)"
✅ CONCISE: "Finalize Symmetric Incubator budget" (context: "Confirm assumptions before year-end")

❌ TOO WORDY: "Start the wind-down process for Olympia Tech (begin liquidation discussion) — discuss with Michael"
✅ CONCISE: "Start Olympia Tech wind-down" (context: "Discuss liquidation details with Michael")

❌ TOO WORDY: "Follow up with the design team about the homepage mockups and get their feedback"
✅ CONCISE: "Get design team feedback on homepage mockups"

For each action item, extract:
- task: Concise task description (8-15 words, action verb first)
- owner: Person's name if mentioned, or null
- deadline: Due date or timeframe if discussed, or null
- priority: "high", "medium", or "low"
- priorityReason: Brief explanation for priority (one sentence)
- context: Additional details, dependencies, or clarifications (use this for anything that would make the task too long)

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
      required: [
        'type',
        'immediateActions',
        'shortTermActions',
        'longTermActions',
      ],
    },
  }),

  // ============================================================
  // SPECIALIZED EMAIL TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'followUpEmail',
    name: 'Follow-Up Email',
    description:
      'Post-meeting email that recaps discussion, confirms decisions, and assigns action items',
    category: 'content',
    icon: 'Reply',
    color: 'blue',
    systemPrompt: `You are a professional meeting facilitator who writes clear, natural-sounding follow-up emails. Your emails:
- Sound like a real person wrote them, not a template
- Confirm what was discussed and decided
- Assign clear ownership to action items
- Are scannable and respect the reader's time
${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Transform this meeting/conversation transcript into a professional follow-up email.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL WRITING RULES:
- Write the body and meetingRecap as natural email prose
- Do NOT use labels like "Summary:", "Key points:", "Discussion:", etc. in the text
- The email should read like a human wrote it to colleagues
- Use conversational transitions, not bullet-point headers inline

BAD example: "Summary: We discussed the project. Key takeaway: We need more resources."
GOOD example: "Great discussion today on the project timeline. The main thing we aligned on is the need for additional resources before the Q2 launch."

Create a follow-up email that:
1. Opens with appreciation and brief meeting context (natural prose, no labels)
2. Recaps the key discussion points concisely in the meetingRecap field
3. Lists decisions in the decisionsConfirmed array (these render separately, so keep them as clean statements)
4. Assigns action items with clear owners and deadlines when mentioned
5. States what happens next

For action items, extract:
- task: What needs to be done (be specific)
- owner: Person's name if mentioned, or null
- deadline: Due date/timeframe if discussed, or null

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "followUpEmail",
  "subject": "string - action-oriented subject line",
  "greeting": "string - warm professional greeting",
  "meetingRecap": "string - 2-3 sentence natural summary of what was discussed (no labels)",
  "body": ["paragraph1", "paragraph2"] - natural prose without inline labels",
  "decisionsConfirmed": ["decision1", "decision2"],
  "actionItems": [{ "task": "string", "owner": "string|null", "deadline": "string|null" }],
  "nextSteps": "string - what happens next",
  "closing": "string - sign-off phrase ONLY, e.g. 'Best regards,' or 'Thanks,' - DO NOT include name, the system adds it automatically"
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    featured: true,
    order: 1,
    tags: ['email', 'follow-up', 'meeting', 'action-items'],
    targetRoles: ['project-manager', 'team-lead', 'consultant', 'founder'],
    templateGroup: 'email',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'followUpEmail' },
        subject: { type: 'string' },
        greeting: { type: 'string' },
        meetingRecap: { type: 'string' },
        body: SCHEMA_FRAGMENTS.stringArray,
        decisionsConfirmed: SCHEMA_FRAGMENTS.stringArray,
        actionItems: {
          type: 'array',
          items: SCHEMA_FRAGMENTS.emailActionItem,
        },
        nextSteps: { type: 'string' },
        closing: { type: 'string' },
      },
      required: [
        'type',
        'subject',
        'greeting',
        'meetingRecap',
        'body',
        'decisionsConfirmed',
        'actionItems',
        'nextSteps',
        'closing',
      ],
    },
  }),

  createStructuredTemplate({
    id: 'salesEmail',
    name: 'Sales Outreach Email',
    description:
      'Post-discovery call email that addresses pain points and proposes value with clear CTA',
    category: 'content',
    icon: 'TrendingUp',
    color: 'green',
    systemPrompt: `You are a sales enablement expert who crafts compelling, natural-sounding follow-up emails after discovery calls. Your emails:
- Sound like a real person wrote them, not a sales template
- Reference specific pain points the prospect mentioned
- Propose clear value without being pushy
- Include a single, clear call-to-action
${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Transform this sales/discovery call transcript into a persuasive follow-up email.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL WRITING RULES:
- Write the body as natural email prose that flows conversationally
- Do NOT use labels like "Challenge:", "Solution:", "Value:", "Next step:" inline
- The email should read like a thoughtful human follow-up, not a fill-in-the-blanks template
- Pain points, value proposition, and CTA have their own structured fields - don't duplicate them with labels in the body

BAD example: "Challenge: You mentioned scaling issues. Solution: Our platform handles this."
GOOD example: "When you mentioned the scaling challenges with your current setup, it really resonated - we've helped several teams in similar situations."

Create a sales follow-up email that:
1. Opens by referencing something specific from the conversation (shows you listened)
2. Flows naturally into the value you can provide
3. Pain points go in the painPointsAddressed array (rendered separately)
4. Value proposition goes in its own field (rendered separately)
5. Includes one clear, low-friction call-to-action in the callToAction field
6. Optionally creates subtle urgency if there's a natural reason

The tone should be helpful and consultative, not pushy or salesy.

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "salesEmail",
  "subject": "string - personalized, not salesy subject line",
  "greeting": "string - warm, personal greeting",
  "body": ["paragraph1", "paragraph2"] - natural prose that connects the conversation to value, no inline labels",
  "painPointsAddressed": ["pain point 1", "pain point 2"] - these render in their own section",
  "valueProposition": "string - how you solve their problems (renders separately)",
  "callToAction": "string - single clear next step (renders separately)",
  "urgencyHook": "string (optional) - time-sensitive element if natural",
  "closing": "string - sign-off phrase ONLY, e.g. 'Best,' or 'Looking forward,' - DO NOT include name, the system adds it automatically"
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    featured: true,
    order: 2,
    tags: ['email', 'sales', 'outreach', 'discovery', 'follow-up'],
    targetRoles: [
      'sales',
      'account-executive',
      'founder',
      'business-development',
    ],
    templateGroup: 'email',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'salesEmail' },
        subject: { type: 'string' },
        greeting: { type: 'string' },
        body: SCHEMA_FRAGMENTS.stringArray,
        painPointsAddressed: SCHEMA_FRAGMENTS.stringArray,
        valueProposition: { type: 'string' },
        callToAction: { type: 'string' },
        urgencyHook: { type: 'string' },
        closing: { type: 'string' },
      },
      required: [
        'type',
        'subject',
        'greeting',
        'body',
        'painPointsAddressed',
        'valueProposition',
        'callToAction',
        'closing',
      ],
    },
  }),

  createStructuredTemplate({
    id: 'internalUpdate',
    name: 'Internal Update Email',
    description:
      'Stakeholder brief with TLDR, key decisions, blockers, and next milestone',
    category: 'professional',
    icon: 'Users',
    color: 'amber',
    systemPrompt: `You are a chief of staff who writes concise, natural-sounding stakeholder updates. Your updates:
- Sound like a real person wrote them, not a template
- Lead with the most important information
- Are direct but conversational in tone
- Respect busy executives' time
${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Transform this conversation into a concise internal update email for stakeholders.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL WRITING RULES:
- Write the body as natural email prose, NOT with labels like "Context:", "High-level ask:", "Background:", etc.
- The email should read like a human wrote it to colleagues
- Start directly with what matters - no preamble labels
- Use conversational transitions between ideas, not bullet-point headers in paragraphs

BAD example (too robotic):
"Context: We had a meeting. High-level ask: We need to do X."

GOOD example (natural):
"Following our meeting yesterday, we've aligned on the key priorities for year-end. The immediate focus is X, and we'll tackle Y in January."

Create an internal update that:
1. Opens with natural prose that sets context and states the key message
2. Flows conversationally - no inline labels or headers in the body text
3. Lists key decisions that were made (these go in the structured keyDecisions field, not inline)
4. Flags any blockers or risks if present (these go in the structured blockers field)
5. States the next milestone or checkpoint

Keep it scannable - busy executives should get the full picture in 30 seconds.

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "internalUpdate",
  "subject": "string - clear subject indicating update type and topic",
  "greeting": "string - brief, appropriate greeting",
  "tldr": "string - one-sentence bottom line (this appears in a separate TL;DR box, so write it as a standalone statement)",
  "body": ["paragraph1", "paragraph2"] - MUST be natural prose without labels like 'Context:' or 'Ask:'",
  "keyDecisions": ["decision1", "decision2"],
  "blockers": ["blocker1", "blocker2"] (optional - only if blockers exist),
  "nextMilestone": "string - next checkpoint or deliverable",
  "closing": "string - sign-off phrase ONLY, e.g. 'Thanks,' or 'Cheers,' - DO NOT include name, the system adds it automatically"
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    featured: true,
    order: 3,
    tags: ['email', 'internal', 'update', 'stakeholder', 'status'],
    targetRoles: ['project-manager', 'chief-of-staff', 'team-lead', 'founder'],
    templateGroup: 'email',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'internalUpdate' },
        subject: { type: 'string' },
        greeting: { type: 'string' },
        tldr: { type: 'string' },
        body: SCHEMA_FRAGMENTS.stringArray,
        keyDecisions: SCHEMA_FRAGMENTS.stringArray,
        blockers: SCHEMA_FRAGMENTS.stringArray,
        nextMilestone: { type: 'string' },
        closing: { type: 'string' },
      },
      required: [
        'type',
        'subject',
        'greeting',
        'tldr',
        'body',
        'keyDecisions',
        'nextMilestone',
        'closing',
      ],
    },
  }),

  createStructuredTemplate({
    id: 'clientProposal',
    name: 'Client Proposal Email',
    description:
      'Formal proposal email with requirements summary, solution overview, and next steps',
    category: 'content',
    icon: 'FileSignature',
    color: 'indigo',
    systemPrompt: `You are a solutions architect who crafts professional, natural-sounding proposal emails. Your proposals:
- Sound like a real person wrote them, not a boilerplate template
- Summarize client requirements clearly
- Present solutions that directly address their needs
- Include clear next steps to move forward
${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Transform this client conversation into a professional proposal email.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL WRITING RULES:
- Write the body as natural email prose that flows professionally
- Do NOT use labels like "Background:", "Scope:", "Deliverables:", "Investment:" inline in body text
- The email should read like a thoughtful proposal from a trusted advisor, not a template
- Requirements, solution, timeline, and next steps have their own structured fields - keep the body focused on context and relationship

BAD example: "Background: You need help with X. Scope: We will do Y. Timeline: 4 weeks."
GOOD example: "Based on our conversation, it's clear that streamlining your portfolio operations is the priority. We've put together an approach that addresses the immediate year-end needs while setting up the structure you'll need going forward."

Create a client proposal email that:
1. Opens with natural context that shows you understood their situation
2. The executiveSummary field contains the high-level proposal overview (rendered separately)
3. Requirements go in the requirementsSummary array (rendered separately as a list)
4. Proposed solution goes in its own field (rendered separately)
5. Timeline goes in timelineEstimate if discussed
6. Next steps go in nextStepsToEngage (rendered separately)

The tone should be professional, confident, and client-focused.

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this exact schema:
{
  "type": "clientProposal",
  "subject": "string - professional subject indicating proposal",
  "greeting": "string - formal greeting",
  "executiveSummary": "string - brief overview of what you're proposing (renders in its own box)",
  "body": ["paragraph1", "paragraph2"] - natural prose providing context, no inline labels",
  "requirementsSummary": ["requirement1", "requirement2"] - renders as a separate list",
  "proposedSolution": "string - description of your solution (renders separately)",
  "timelineEstimate": "string (optional) - timeline if discussed (renders separately)",
  "nextStepsToEngage": ["step1", "step2", "step3"] - array of next steps, each as a separate string (rendered as numbered list)",
  "closing": "string - sign-off phrase ONLY, e.g. 'Best regards,' or 'Warm regards,' - DO NOT include name, the system adds it automatically"
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    featured: true,
    order: 4,
    tags: ['email', 'proposal', 'client', 'business', 'sales'],
    targetRoles: ['consultant', 'sales', 'founder', 'account-manager'],
    templateGroup: 'email',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'clientProposal' },
        subject: { type: 'string' },
        greeting: { type: 'string' },
        executiveSummary: { type: 'string' },
        body: SCHEMA_FRAGMENTS.stringArray,
        requirementsSummary: SCHEMA_FRAGMENTS.stringArray,
        proposedSolution: { type: 'string' },
        timelineEstimate: { type: 'string' },
        nextStepsToEngage: SCHEMA_FRAGMENTS.stringArray,
        closing: { type: 'string' },
      },
      required: [
        'type',
        'subject',
        'greeting',
        'executiveSummary',
        'body',
        'requirementsSummary',
        'proposedSolution',
        'nextStepsToEngage',
        'closing',
      ],
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

${PROMPT_INSTRUCTIONS.useContext}
Additionally for blog posts:
- Target the specified audience if mentioned
- Adopt the writing style or angle if specified
- Focus on themes or topics highlighted in context

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
      required: [
        'type',
        'headline',
        'hook',
        'sections',
        'callToAction',
        'metadata',
      ],
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

${PROMPT_INSTRUCTIONS.useContext}
Additionally for LinkedIn:
- Align with the professional brand or persona if specified
- Focus on insights relevant to the target network

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
    tags: [
      'linkedin',
      'social-media',
      'professional-networking',
      'thought-leadership',
    ],
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
      required: [
        'type',
        'hook',
        'content',
        'hashtags',
        'callToAction',
        'characterCount',
      ],
    },
  }),

  createStructuredTemplate({
    id: 'communicationAnalysis',
    name: 'Communication Analysis',
    description: 'Score conversation on communication effectiveness',
    category: 'professional',
    icon: 'MessageSquare',
    color: 'teal',
    systemPrompt: `You are a communication coach who gives sharp, actionable feedback. Be direct and specific. Every word must earn its place. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Analyze this conversation for communication effectiveness. Return concise, punchy feedback.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL: BREVITY IS MANDATORY
- Strengths/improvements: MAX 15 words each. One clear point per bullet.
- overallAssessment: MAX 2 sentences, ~40 words total
- keyTakeaway: ONE sentence, actionable, under 25 words

BAD (too wordy):
"The chair invited input from multiple people (e.g., asking Jeroen, Marlene, Roberto, Sophia) and paused to get confirmations and clarifications."

GOOD (punchy):
"Chair actively sought input from all participants and confirmed understanding."

BAD: "There were moments where colleagues responded with concrete updates (e.g., Marlene confirming documentation readiness, Roberto and Art planning follow-ups), showing two-way information flow."
GOOD: "Team responded with concrete updates, showing two-way dialogue."

Score (0-100) these 4 dimensions:
1. Clarity - Were ideas expressed clearly?
2. Active Listening - Did people build on each other's ideas?
3. Empathy - Were others' perspectives acknowledged?
4. Persuasiveness - Were arguments effective?

For each dimension:
- name: Dimension name
- score: 0-100
- strengths: 1-2 bullet points (MAX 15 words each, no examples in parentheses)
- improvements: 1-2 bullet points (MAX 15 words each, actionable)

Also provide:
- overallScore: Weighted average
- overallAssessment: 2 sentences MAX summarizing quality (~40 words)
- keyTakeaway: Single actionable insight (under 25 words)

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
      required: [
        'type',
        'overallScore',
        'dimensions',
        'overallAssessment',
        'keyTakeaway',
      ],
    },
  }),

  createStructuredTemplate({
    id: 'agileBacklog',
    name: 'Agile Backlog',
    description: 'Extract epics and user stories with acceptance criteria',
    category: 'professional',
    icon: 'Layers',
    color: 'indigo',
    systemPrompt: `You are a senior product manager and Agile coach. Extract product features from conversations into well-structured epics and user stories. Follow these principles:

1. ONLY extract features that were EXPLICITLY discussed - never invent or assume features
2. Group related stories under epics when there's a clear theme (3+ related stories)
3. Keep standalone stories for isolated features
4. Write acceptance criteria that are testable and specific
5. Include technical details ONLY when explicitly mentioned in the conversation
6. Never estimate effort - focus purely on requirements

${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Extract product requirements from this conversation into an Agile backlog.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL REQUIREMENTS:
1. Only include features EXPLICITLY discussed - do not invent requirements
2. Use standard user story format: "As a [role], I want [feature], so that [benefit]"
3. Extract acceptance criteria only from what was discussed or clearly implied
4. Include technical details ONLY when they were explicitly mentioned
5. Group related stories (3+) under an epic; keep isolated features as standalone stories

USER STORY FORMAT:
- id: Sequential ID (US-001, US-002, etc.)
- title: Brief, descriptive name (e.g., "Password Reset Flow")
- statement: The COMPLETE user story as a single sentence IN THE SAME LANGUAGE as the transcript. Use markdown **bold** for the keywords to emphasize the pattern. Examples:
  - English: "**As a** user, **I want** to reset my password, **so that** I can access my account"
  - Dutch: "**Als** gebruiker **wil ik** mijn wachtwoord resetten, **zodat** ik toegang krijg"
  - German: "**Als** Benutzer **möchte ich** mein Passwort zurücksetzen, **damit** ich Zugang bekomme"
  - French: "**En tant que** utilisateur, **je veux** réinitialiser mon mot de passe, **afin que** je puisse accéder"
  - Spanish: "**Como** usuario, **quiero** restablecer mi contraseña, **para que** pueda acceder"

ACCEPTANCE CRITERIA:
- Write testable, specific criteria based on what was discussed
- Use simple format: "User can see a confirmation message after reset"
- Only use Given-When-Then format if the conversation used that language
- Include edge cases only if they were explicitly mentioned

TECHNICAL NOTES (optional):
- Only include if technical implementation details were discussed
- Examples: API requirements, database changes, third-party integrations
- Do NOT infer technical details - only extract what was said

PRIORITY (optional, only if discussed):
- must-have: Critical for launch, explicitly marked as essential
- should-have: Important but not blocking
- could-have: Nice to have, mentioned as optional
- wont-have: Explicitly deferred or rejected

EPIC FORMAT:
- id: Sequential ID (EP-001, EP-002, etc.)
- title: Theme name (e.g., "User Authentication")
- description: What this epic covers
- stories: Array of related user stories

${PROMPT_INSTRUCTIONS.languageConsistency}

Return JSON matching this schema:
{
  "type": "agileBacklog",
  "summary": "Brief 1-2 sentence overview of the backlog",
  "epics": [{
    "id": "EP-001",
    "title": "Epic title",
    "description": "What this epic covers",
    "stories": [{
      "id": "US-001",
      "title": "Story title",
      "statement": "As a user, I want to do something, so that I get benefit",
      "acceptanceCriteria": [{ "criterion": "testable statement", "type": "simple" }],
      "technicalNotes": ["only if discussed"],
      "priority": "must-have",
      "dependencies": ["US-002"]
    }]
  }],
  "standaloneStories": [{ ...same structure as stories above }]
}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 5,
    tags: ['agile', 'user-stories', 'epics', 'product-management', 'backlog'],
    targetRoles: [
      'product-manager',
      'founder',
      'engineering-lead',
      'scrum-master',
    ],
    templateGroup: 'agile-backlog',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'agileBacklog' },
        summary: { type: 'string' },
        epics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              stories: { type: 'array', items: SCHEMA_FRAGMENTS.userStory },
            },
            required: ['id', 'title', 'description', 'stories'],
          },
        },
        standaloneStories: { type: 'array', items: SCHEMA_FRAGMENTS.userStory },
      },
      required: ['type', 'epics', 'standaloneStories'],
    },
  }),

  // ============================================================
  // PRIORITY 1: MEETING & DOCUMENTATION TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'meetingMinutes',
    name: 'Meeting Minutes',
    description: 'Formal meeting record with agenda, decisions, and action items',
    category: 'professional',
    icon: 'FileText',
    color: 'gray',
    systemPrompt: `You are an expert executive assistant who creates comprehensive, professional meeting minutes. You capture decisions and accountability while filtering out tangential discussion. Quality over quantity. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create formal meeting minutes from this conversation.

${PROMPT_INSTRUCTIONS.useContext}

CRITICAL: You MUST populate ALL sections. This is a structured meeting minutes document - empty sections make it useless.

REQUIRED OUTPUT STRUCTURE:

1. **title** (REQUIRED): Descriptive meeting title derived from main topics discussed. NOT generic titles like "Team Meeting" or "Weekly Sync". Example: "Q1 Product Roadmap Review" or "AI Investment Strategy Discussion"

2. **date** (REQUIRED if mentioned): Extract date from conversation. If not explicitly stated, leave as empty string.

3. **attendees** (REQUIRED): List ALL participants mentioned. Use speaker labels (Speaker A, Speaker B) if no names given. NEVER leave empty - every meeting has attendees.

4. **agendaItems** (REQUIRED - THIS IS THE CORE CONTENT):
   Group the conversation into logical topics. For EACH topic:
   - topic: Clear topic title (e.g., "Budget Allocation", "Timeline Discussion")
   - discussion: Array of 2-5 key discussion points as bullet strings. Capture WHAT was discussed, different viewpoints, and conclusions.
   - decisions: Array of any decisions made on this topic (can be empty if no decisions)

   MINIMUM: Create at least 2-3 agenda items from any meaningful conversation. If the conversation is short, still identify the main topics discussed.

5. **decisions** (REQUIRED): Consolidate ALL decisions from the meeting into this top-level array. Include decisions from agendaItems plus any general decisions. Write as declarative statements: "Launch date set for March 1st" not "It was discussed that March might work."

6. **actionItems** (REQUIRED): Extract EXPLICIT commitments only. For each:
   - task: What needs to be done (start with verb)
   - owner: Who is responsible (use name or speaker label)
   - deadline: When it's due (if mentioned, otherwise omit)

   If NO explicit action items exist, look for implied follow-ups like "I'll send that over" or "Let me check on that."

7. **nextMeeting** (optional): Include if a follow-up meeting was scheduled or discussed.

QUALITY STANDARDS:
- Discussion points: 1-2 sentences each, focus on substance not filler
- Decisions: Declarative statements, MAX 20 words each
- Action items: Verb-first, MAX 15 words each

EXAMPLE OUTPUT STRUCTURE:
{
  "type": "meetingMinutes",
  "title": "Q1 Investment Committee Review",
  "date": "22 January 2026",
  "attendees": ["Maurits", "Michael", "Ivo", "Jeroen"],
  "agendaItems": [
    {
      "topic": "AI-FinTech Portfolio Review",
      "discussion": [
        "Reviewed current portfolio allocation across AI-FinTech investments",
        "Discussed risk exposure in current market conditions",
        "Evaluated performance metrics against Q4 benchmarks"
      ],
      "decisions": ["Maintain current allocation with quarterly review"]
    },
    {
      "topic": "New Investment Opportunities",
      "discussion": [
        "Presented three new deal opportunities in the pipeline",
        "Discussed due diligence requirements for each"
      ],
      "decisions": ["Proceed with due diligence on Telly investment"]
    }
  ],
  "decisions": [
    "Security/compliance priority confirmed for AI-FinTech mandate",
    "Scorecard to be developed for business-critical criteria",
    "Small investment in Telly approved"
  ],
  "actionItems": [
    {"task": "Draft scorecard for business-critical evaluation", "owner": "Investment Team", "deadline": "Next meeting"},
    {"task": "Finalize KPI addendum with NRG", "owner": "Maurits", "deadline": "Before tranche decision"}
  ],
  "nextMeeting": "Q4 reporting session to be scheduled"
}

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 10,
    tags: ['meeting-minutes', 'documentation', 'formal', 'records'],
    targetRoles: ['executive-assistant', 'project-manager', 'team-lead'],
    templateGroup: 'meeting-minutes',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'meetingMinutes' },
        title: { type: 'string' },
        date: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
        agendaItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              discussion: { type: 'array', items: { type: 'string' } },
              decisions: { type: 'array', items: { type: 'string' } },
            },
            required: ['topic', 'discussion'],
          },
        },
        decisions: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: SCHEMA_FRAGMENTS.emailActionItem },
        nextMeeting: { type: 'string' },
      },
      required: ['type', 'title', 'attendees', 'agendaItems', 'decisions', 'actionItems'],
    },
  }),

  createStructuredTemplate({
    id: 'oneOnOneNotes',
    name: '1:1 Meeting Notes',
    description: 'Structured notes for manager-report conversations',
    category: 'professional',
    icon: 'Users',
    color: 'blue',
    systemPrompt: `You are an expert in management practices who captures meaningful 1:1 conversations. You document topics, feedback, blockers, and commitments to enable continuity between meetings. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create structured 1:1 meeting notes from this conversation.

${PROMPT_INSTRUCTIONS.useContext}

PARTICIPANT IDENTIFICATION:
- Identify who is the manager and who is the direct report based on context clues
- If unclear, use speaker labels and note uncertainty
- Manager typically asks about projects, blockers, development; report provides updates

TOPIC CAPTURE:
For each topic discussed, capture:
- topic: Brief title (e.g., "Q1 project status", "Career development")
- notes: Key points discussed (2-4 sentences max)
- followUp: If something needs to be revisited, note it here

TOPIC CATEGORIES TO LISTEN FOR:
- Work updates and project status
- Blockers and challenges needing support
- Feedback (both directions)
- Career growth and development
- Personal/wellbeing check-ins
- Strategic alignment and priorities

FEEDBACK CAPTURE:
Separate feedback given (manager → report) from feedback received (report → manager):
- Be specific: "Praised handling of customer escalation" not "positive feedback"
- Capture constructive feedback without softening: "Documentation needs improvement" not "maybe could work on docs"

ACTION ITEMS:
Only capture EXPLICIT commitments with clear ownership:
- task: What needs to be done
- owner: Who committed (manager or report name)
- deadline: When, if stated

BAD action item: "Will think about career path"
GOOD action item: "Sarah to draft 6-month development goals by Friday"

CONTINUITY:
Note items to revisit in next 1:1 to maintain accountability across meetings.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 11,
    tags: ['1-on-1', 'management', 'feedback', 'career-development'],
    targetRoles: ['manager', 'team-lead', 'hr'],
    templateGroup: 'one-on-one',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'oneOnOneNotes' },
        participants: {
          type: 'object',
          properties: {
            manager: { type: 'string' },
            report: { type: 'string' },
          },
          required: ['manager', 'report'],
        },
        date: { type: 'string' },
        topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              notes: { type: 'string' },
              followUp: { type: 'string' },
            },
            required: ['topic', 'notes'],
          },
        },
        feedback: {
          type: 'object',
          properties: {
            given: { type: 'array', items: { type: 'string' } },
            received: { type: 'array', items: { type: 'string' } },
          },
        },
        actionItems: { type: 'array', items: SCHEMA_FRAGMENTS.emailActionItem },
        nextMeeting: { type: 'string' },
      },
      required: ['type', 'participants', 'topics', 'actionItems'],
    },
  }),

  createStructuredTemplate({
    id: 'interviewAssessment',
    name: 'Interview Assessment',
    description: 'Structured candidate evaluation with competency scoring',
    category: 'professional',
    icon: 'UserCheck',
    color: 'green',
    systemPrompt: `You are an experienced hiring manager trained in structured interviewing and behavioral assessment. You evaluate candidates using evidence-based scoring with zero inference beyond what was explicitly demonstrated. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a structured interview assessment from this conversation.

${PROMPT_INSTRUCTIONS.useContext}

EVIDENCE-BASED SCORING (1-5 scale):
5 = Exceptional - Multiple strong examples with measurable impact
4 = Strong - Clear examples with positive outcomes demonstrated
3 = Meets expectations - Adequate examples, some depth
2 = Below expectations - Vague examples, lacks specifics or impact
1 = Insufficient - No relevant examples or concerning responses

SCORING RULES:
- ONLY score competencies that were actually assessed in the interview
- Each score MUST have specific evidence from what the candidate said
- Use STAR format to capture evidence: Situation, Task, Action, Result
- If candidate gave vague answers without specifics, that's a 2 or below
- No inference - don't assume skills that weren't demonstrated

EVIDENCE QUALITY EXAMPLES:

BAD evidence (vague): "Candidate mentioned they led a team project."
GOOD evidence (STAR): "Led 8-person team to deliver CRM migration 2 weeks early (Situation/Task). Instituted daily standups and blocker removal process (Action). Reduced customer churn 15% post-launch (Result)."

BAD evidence: "Seems collaborative."
GOOD evidence: "Described mediating conflict between engineering and sales by creating shared metrics dashboard; both teams now attend joint weekly reviews."

COMPETENCIES TO ASSESS (only those discussed):
- Technical/Functional Skills
- Problem Solving
- Leadership/Influence
- Communication
- Collaboration/Teamwork
- Drive/Initiative
- Adaptability
- Domain Expertise

RECOMMENDATION CRITERIA:
- strong-hire: Multiple 4-5 scores, no 2s or below, clear culture fit
- hire: Mostly 3-4 scores, no concerns below 2, adequate culture fit
- no-hire: Multiple 2s or any 1s, or significant culture concerns
- strong-no-hire: Pattern of 1-2 scores, red flags, or serious concerns

CULTURE FIT ASSESSMENT:
Focus on values alignment, working style compatibility, and team dynamics. Avoid bias - assess fit with the role requirements, not personal similarity.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    featured: true,
    order: 12,
    tags: ['interview', 'hiring', 'assessment', 'hr'],
    targetRoles: ['hiring-manager', 'recruiter', 'hr'],
    templateGroup: 'interview',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'interviewAssessment' },
        candidate: { type: 'string' },
        role: { type: 'string' },
        date: { type: 'string' },
        overallScore: { type: 'number', minimum: 1, maximum: 5 },
        recommendation: { type: 'string', enum: ['strong-hire', 'hire', 'no-hire', 'strong-no-hire'] },
        competencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competency: { type: 'string' },
              score: { type: 'number', minimum: 1, maximum: 5 },
              evidence: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
            },
            required: ['competency', 'score', 'evidence'],
          },
        },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        cultureFit: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'candidate', 'role', 'overallScore', 'recommendation', 'competencies', 'strengths', 'concerns', 'cultureFit', 'nextSteps'],
    },
  }),

  createStructuredTemplate({
    id: 'prd',
    name: 'Product Requirements Document',
    description: 'Structured PRD with problem, goals, and requirements',
    category: 'professional',
    icon: 'ClipboardList',
    color: 'purple',
    systemPrompt: `You are a senior product manager who creates clear, actionable PRDs. You prioritize problem clarity over solution specifics, and ensure requirements are testable. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a Product Requirements Document (PRD) from this conversation.

${PROMPT_INSTRUCTIONS.useContext}

PROBLEM STATEMENT QUALITY:
The problem statement is the most important part. A good problem statement:
- Describes WHO is affected
- Explains WHAT pain or friction they experience
- Quantifies the IMPACT (time wasted, revenue lost, errors caused)
- Does NOT prescribe a solution

BAD problem statement: "We need to add a dashboard."
GOOD problem statement: "Sales managers spend 2+ hours weekly manually compiling rep performance data from 3 different systems. This delays coaching conversations and causes 15% of underperformance to go unaddressed until it's too late."

GOALS vs NON-GOALS:
- Goals: Outcomes we're trying to achieve (measurable when possible)
- Non-goals: What we're explicitly NOT doing to prevent scope creep
- If something is "out of scope for v1" that's a non-goal

USER STORIES:
Format: "As a [role], I want [capability], so that [benefit]"
- Only include stories explicitly discussed
- Each story should represent a distinct user need

REQUIREMENTS WITH MoSCoW:
- must-have: Required for launch, core value proposition
- should-have: Important but launch possible without
- could-have: Desirable if time permits
- wont-have: Explicitly out of scope (move to non-goals or future consideration)

For each requirement:
- id: Unique identifier (REQ-001, REQ-002, etc.)
- requirement: Clear, testable statement
- priority: MoSCoW category
- rationale: Why this priority? (especially for must-haves)

SUCCESS METRICS:
Quantifiable measures that indicate the feature is working:
- Leading indicators: Early signals (adoption rate, usage frequency)
- Lagging indicators: Business outcomes (revenue impact, churn reduction)

OPEN QUESTIONS:
Decisions that still need to be made. Flag these clearly - they're blockers.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    featured: true,
    order: 13,
    tags: ['prd', 'product-management', 'requirements', 'specification'],
    targetRoles: ['product-manager', 'founder', 'engineering-lead'],
    templateGroup: 'prd',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'prd' },
        title: { type: 'string' },
        owner: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'review', 'approved'] },
        problemStatement: { type: 'string' },
        goals: { type: 'array', items: { type: 'string' } },
        nonGoals: { type: 'array', items: { type: 'string' } },
        userStories: { type: 'array', items: { type: 'string' } },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              requirement: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
              rationale: { type: 'string' },
            },
            required: ['id', 'requirement', 'priority'],
          },
        },
        successMetrics: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'string' },
      },
      required: ['type', 'title', 'status', 'problemStatement', 'goals', 'userStories', 'requirements', 'successMetrics'],
    },
  }),

  createStructuredTemplate({
    id: 'retrospective',
    name: 'Retrospective Summary',
    description: 'Sprint or project retrospective with insights and actions',
    category: 'professional',
    icon: 'RotateCcw',
    color: 'orange',
    systemPrompt: `You are an agile coach who facilitates effective retrospectives. You help teams reflect on what went well, what could improve, and commit to actionable improvements. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a retrospective summary from this conversation.

Capture:
1. Sprint/period being reviewed
2. What went well - successes and wins
3. What could improve - challenges and frustrations
4. Action items - specific improvements to implement
5. Shoutouts - team member recognition
6. Overall team mood/sentiment

Focus on actionable takeaways that will improve the next iteration.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    featured: true,
    order: 14,
    tags: ['retrospective', 'agile', 'scrum', 'team-improvement'],
    targetRoles: ['scrum-master', 'team-lead', 'project-manager'],
    templateGroup: 'retrospective',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'retrospective' },
        sprintOrPeriod: { type: 'string' },
        team: { type: 'string' },
        wentWell: { type: 'array', items: { type: 'string' } },
        toImprove: { type: 'array', items: { type: 'string' } },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
            },
            required: ['action'],
          },
        },
        shoutouts: { type: 'array', items: { type: 'string' } },
        teamMood: { type: 'string' },
      },
      required: ['type', 'sprintOrPeriod', 'wentWell', 'toImprove', 'actionItems'],
    },
  }),

  createStructuredTemplate({
    id: 'decisionDocument',
    name: 'Decision Document',
    description: 'Record decisions with context, options, and rationale',
    category: 'professional',
    icon: 'Scale',
    color: 'indigo',
    systemPrompt: `You are a strategic advisor who helps document important decisions. You capture the context, alternatives considered, and rationale to create a clear record for future reference. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a decision document from this conversation.

Document:
1. Decision title - what was decided
2. Decision makers involved
3. Status of the decision
4. Context - why this decision was needed
5. Options considered with pros and cons
6. The decision made
7. Rationale - why this option was chosen
8. Consequences and implications
9. Review date if applicable

Ensure the document provides enough context for someone reading it later.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 15,
    tags: ['decision-record', 'governance', 'documentation', 'strategy'],
    targetRoles: ['executive', 'product-manager', 'team-lead', 'architect'],
    templateGroup: 'decision-document',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'decisionDocument' },
        title: { type: 'string' },
        date: { type: 'string' },
        decisionMakers: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['proposed', 'decided', 'implemented', 'deprecated'] },
        context: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
            },
            required: ['option', 'pros', 'cons'],
          },
        },
        decision: { type: 'string' },
        rationale: { type: 'string' },
        consequences: { type: 'array', items: { type: 'string' } },
        reviewDate: { type: 'string' },
      },
      required: ['type', 'title', 'decisionMakers', 'status', 'context', 'options', 'decision', 'rationale', 'consequences'],
    },
  }),

  // ============================================================
  // PRIORITY 2: SALES TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'dealQualification',
    name: 'Deal Qualification',
    description: 'MEDDIC/BANT scorecard for sales opportunities',
    category: 'specialized',
    icon: 'Target',
    color: 'green',
    systemPrompt: `You are a sales operations expert trained in MEDDIC qualification methodology. You provide rigorous, evidence-based deal assessments that help sales teams focus on winnable opportunities. Be direct about weak qualification - false optimism wastes resources. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Analyze this sales conversation using the MEDDIC qualification framework.

${PROMPT_INSTRUCTIONS.useContext}

MEDDIC CRITERIA (evaluate each):

1. METRICS - Quantified business impact
   - What specific metrics will improve? (revenue, cost, time, risk)
   - Do they know their current baseline?
   - Have they quantified the value of solving this problem?

2. ECONOMIC BUYER - Person with budget authority
   - Have we identified who controls the budget?
   - Have we engaged with them directly?
   - Do they have a compelling event driving the purchase?

3. DECISION CRITERIA - How they'll evaluate solutions
   - What are their must-haves vs nice-to-haves?
   - How do we compare on their criteria?
   - Are the criteria favorable or do we need to reshape them?

4. DECISION PROCESS - How they'll make the decision
   - What are the steps to get to a signed contract?
   - Who else needs to approve?
   - What's the typical procurement timeline?

5. IDENTIFY PAIN - Business problem driving urgency
   - What's the pain at the organization level?
   - What's the pain for our contact personally?
   - What happens if they do nothing?

6. CHAMPION - Internal advocate
   - Do we have someone actively selling internally for us?
   - Do they have influence and access to power?
   - What's in it for them personally?

SCORING EACH CRITERION:
- qualified: Clear evidence, strong position
- partially-qualified: Some info but gaps or concerns
- not-qualified: Evidence suggests weak position
- unknown: Not yet discovered - needs investigation

OVERALL QUALIFICATION:
- 90-100 (highly-qualified): Strong on all 6 criteria
- 70-89 (qualified): Strong on 4+, no critical gaps
- 50-69 (needs-work): Gaps in 2+ criteria, but addressable
- 0-49 (disqualified): Critical gaps unlikely to close

RISK FACTORS TO FLAG:
- No access to Economic Buyer
- Competing against incumbent with switching costs
- No clear compelling event or timeline
- Champion lacks influence
- Decision criteria favor competitor

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 20,
    tags: ['sales', 'qualification', 'bant', 'meddic', 'pipeline'],
    targetRoles: ['sales', 'account-executive', 'sales-manager'],
    templateGroup: 'sales-qualification',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'dealQualification' },
        prospect: { type: 'string' },
        dealValue: { type: 'string' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualification: { type: 'string', enum: ['highly-qualified', 'qualified', 'needs-work', 'disqualified'] },
        meddic: {
          type: 'object',
          properties: {
            metrics: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['qualified', 'partially-qualified', 'not-qualified', 'unknown'] },
                evidence: { type: 'string' },
                quantifiedValue: { type: 'string' },
              },
              required: ['status', 'evidence'],
            },
            economicBuyer: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['qualified', 'partially-qualified', 'not-qualified', 'unknown'] },
                evidence: { type: 'string' },
                identified: { type: 'string' },
                engaged: { type: 'boolean' },
              },
              required: ['status', 'evidence'],
            },
            decisionCriteria: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['qualified', 'partially-qualified', 'not-qualified', 'unknown'] },
                evidence: { type: 'string' },
                mustHaves: { type: 'array', items: { type: 'string' } },
                ourPosition: { type: 'string' },
              },
              required: ['status', 'evidence'],
            },
            decisionProcess: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['qualified', 'partially-qualified', 'not-qualified', 'unknown'] },
                evidence: { type: 'string' },
                steps: { type: 'array', items: { type: 'string' } },
                timeline: { type: 'string' },
              },
              required: ['status', 'evidence'],
            },
            identifiedPain: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['qualified', 'partially-qualified', 'not-qualified', 'unknown'] },
                evidence: { type: 'string' },
                organizationalPain: { type: 'string' },
                personalPain: { type: 'string' },
              },
              required: ['status', 'evidence'],
            },
            champion: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['qualified', 'partially-qualified', 'not-qualified', 'unknown'] },
                evidence: { type: 'string' },
                name: { type: 'string' },
                influence: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
              },
              required: ['status', 'evidence'],
            },
          },
          required: ['metrics', 'economicBuyer', 'decisionCriteria', 'decisionProcess', 'identifiedPain', 'champion'],
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        riskFactors: { type: 'array', items: { type: 'string' } },
        competitiveThreats: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'prospect', 'overallScore', 'qualification', 'meddic', 'nextSteps', 'riskFactors'],
    },
  }),

  createStructuredTemplate({
    id: 'crmNotes',
    name: 'CRM Notes',
    description: 'Salesforce/HubSpot-ready call notes',
    category: 'specialized',
    icon: 'Database',
    color: 'blue',
    systemPrompt: `You are a sales enablement specialist who creates concise, CRM-ready call notes. Your notes are optimized for quick entry into Salesforce, HubSpot, or similar systems. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create CRM-ready notes from this sales conversation.

Extract:
1. Contact name and company
2. Call type (discovery, demo, follow-up, negotiation, other)
3. Brief summary (2-3 sentences)
4. Key points discussed
5. Pain points identified
6. Next steps with dates if mentioned
7. Deal stage recommendation
8. Competitors mentioned

Keep notes concise and actionable - these go directly into CRM.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 15,
    order: 21,
    tags: ['crm', 'sales', 'call-notes', 'salesforce', 'hubspot'],
    targetRoles: ['sales', 'sdr', 'account-executive'],
    templateGroup: 'crm-notes',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'crmNotes' },
        contact: { type: 'string' },
        company: { type: 'string' },
        callType: { type: 'string', enum: ['discovery', 'demo', 'follow-up', 'negotiation', 'other'] },
        date: { type: 'string' },
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        dealStage: { type: 'string' },
        competitorsMentioned: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'contact', 'callType', 'summary', 'keyPoints', 'painPoints', 'nextSteps'],
    },
  }),

  createStructuredTemplate({
    id: 'objectionHandler',
    name: 'Objection Handler',
    description: 'Extract objections with response strategies',
    category: 'specialized',
    icon: 'Shield',
    color: 'orange',
    systemPrompt: `You are a sales trainer who helps reps handle objections effectively. You identify objections, categorize them, and provide proven response strategies. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Analyze this sales conversation for objections and create response strategies.

For each objection identified:
1. The exact objection raised
2. Category (price, timing, competition, authority, need, trust, other)
3. Recommended response strategy
4. Proof points or evidence to support the response

Also provide:
- Overall strategy for handling this prospect's concerns
- Follow-up actions to address unresolved objections

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 22,
    tags: ['sales', 'objections', 'training', 'responses'],
    targetRoles: ['sales', 'sales-manager', 'sales-enablement'],
    templateGroup: 'objection-handler',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'objectionHandler' },
        prospect: { type: 'string' },
        objections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objection: { type: 'string' },
              category: { type: 'string', enum: ['price', 'timing', 'competition', 'authority', 'need', 'trust', 'other'] },
              response: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } },
            },
            required: ['objection', 'category', 'response'],
          },
        },
        overallStrategy: { type: 'string' },
        followUpActions: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'objections', 'overallStrategy', 'followUpActions'],
    },
  }),

  createStructuredTemplate({
    id: 'competitiveIntel',
    name: 'Competitive Intelligence',
    description: 'Extract competitor mentions and positioning insights',
    category: 'specialized',
    icon: 'Eye',
    color: 'red',
    systemPrompt: `You are a competitive intelligence analyst who extracts and analyzes competitor mentions from conversations. You identify positioning opportunities and competitive threats. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Analyze this conversation for competitive intelligence.

For each competitor mentioned:
1. Competitor name
2. What was said about them (direct quotes if possible)
3. Perceived strengths
4. Perceived weaknesses
5. How they're positioned against us

Also provide:
- Our key advantages based on this conversation
- Threat assessment
- Recommended actions to improve competitive position

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 23,
    tags: ['competitive-intelligence', 'sales', 'strategy', 'positioning'],
    targetRoles: ['product-manager', 'sales', 'marketing', 'strategy'],
    templateGroup: 'competitive-intel',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'competitiveIntel' },
        source: { type: 'string' },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              mentions: { type: 'array', items: { type: 'string' } },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              positioning: { type: 'string' },
            },
            required: ['competitor', 'mentions', 'positioning'],
          },
        },
        ourAdvantages: { type: 'array', items: { type: 'string' } },
        threatAssessment: { type: 'string' },
        recommendedActions: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'competitors', 'ourAdvantages', 'threatAssessment', 'recommendedActions'],
    },
  }),

  // ============================================================
  // PRIORITY 3: CONSULTING TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'workshopSynthesis',
    name: 'Workshop Synthesis',
    description: 'Capture workshop outcomes, insights, and action items',
    category: 'professional',
    icon: 'Lightbulb',
    color: 'yellow',
    systemPrompt: `You are an expert facilitator who synthesizes workshop outcomes into actionable documentation. You capture insights, decisions, and next steps clearly. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a workshop synthesis from this conversation.

Capture:
1. Workshop title and objectives
2. Participants and facilitator
3. Outcomes by topic with insights, decisions, and open items
4. Action items with owners and due dates
5. Parking lot items (topics deferred for later)
6. Next steps

Focus on capturing the value created during the workshop.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 30,
    tags: ['workshop', 'facilitation', 'consulting', 'synthesis'],
    targetRoles: ['consultant', 'facilitator', 'project-manager'],
    templateGroup: 'workshop',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'workshopSynthesis' },
        title: { type: 'string' },
        date: { type: 'string' },
        facilitator: { type: 'string' },
        participants: { type: 'array', items: { type: 'string' } },
        objectives: { type: 'array', items: { type: 'string' } },
        outcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              insights: { type: 'array', items: { type: 'string' } },
              decisions: { type: 'array', items: { type: 'string' } },
              openItems: { type: 'array', items: { type: 'string' } },
            },
            required: ['topic', 'insights'],
          },
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
            },
            required: ['action'],
          },
        },
        parkingLot: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'participants', 'objectives', 'outcomes', 'actionItems', 'nextSteps'],
    },
  }),

  createStructuredTemplate({
    id: 'projectStatus',
    name: 'Project Status Report',
    description: 'Formal project status with RAG rating and milestones',
    category: 'professional',
    icon: 'BarChart3',
    color: 'blue',
    systemPrompt: `You are a project manager who creates clear, executive-ready status reports. You assess project health objectively and highlight risks and accomplishments. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a project status report from this conversation.

Include:
1. Project name and reporting period
2. Overall status (green/yellow/red) with justification
3. Summary of current state
4. Accomplishments this period
5. Milestones with status
6. Risks with mitigation strategies and severity
7. Blockers if any
8. Goals for next period
9. Budget status if discussed

Be objective and highlight both progress and concerns.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 31,
    tags: ['project-management', 'status-report', 'consulting', 'governance'],
    targetRoles: ['project-manager', 'consultant', 'program-manager'],
    templateGroup: 'project-status',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'projectStatus' },
        projectName: { type: 'string' },
        reportingPeriod: { type: 'string' },
        overallStatus: { type: 'string', enum: ['green', 'yellow', 'red'] },
        summary: { type: 'string' },
        accomplishments: { type: 'array', items: { type: 'string' } },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'on-track', 'at-risk', 'delayed'] },
              date: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['milestone', 'status'],
          },
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['risk', 'mitigation', 'severity'],
          },
        },
        blockers: { type: 'array', items: { type: 'string' } },
        nextPeriodGoals: { type: 'array', items: { type: 'string' } },
        budgetStatus: { type: 'string' },
      },
      required: ['type', 'projectName', 'reportingPeriod', 'overallStatus', 'summary', 'accomplishments', 'milestones', 'risks', 'nextPeriodGoals'],
    },
  }),

  createStructuredTemplate({
    id: 'sow',
    name: 'Statement of Work',
    description: 'Draft SOW with scope, deliverables, and assumptions',
    category: 'professional',
    icon: 'FileContract',
    color: 'indigo',
    systemPrompt: `You are a consulting engagement manager who creates clear, comprehensive Statements of Work. You define scope, deliverables, and assumptions precisely to set proper expectations. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a Statement of Work (SOW) from this conversation.

Include:
1. Project title and client
2. Background and context
3. Objectives
4. Scope (in-scope and out-of-scope)
5. Deliverables with descriptions and acceptance criteria
6. Timeline if discussed
7. Assumptions
8. Dependencies
9. Terms if mentioned

Be precise about scope boundaries to prevent scope creep.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 32,
    tags: ['sow', 'consulting', 'contract', 'scope'],
    targetRoles: ['consultant', 'sales', 'engagement-manager'],
    templateGroup: 'sow',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'sow' },
        projectTitle: { type: 'string' },
        client: { type: 'string' },
        preparedBy: { type: 'string' },
        date: { type: 'string' },
        background: { type: 'string' },
        objectives: { type: 'array', items: { type: 'string' } },
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } },
          },
          required: ['inScope', 'outOfScope'],
        },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
            },
            required: ['deliverable', 'description'],
          },
        },
        timeline: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        terms: { type: 'string' },
      },
      required: ['type', 'projectTitle', 'background', 'objectives', 'scope', 'deliverables', 'assumptions'],
    },
  }),

  createStructuredTemplate({
    id: 'recommendationsMemo',
    name: 'Recommendations Memo',
    description: 'Findings and recommendations with executive summary',
    category: 'professional',
    icon: 'FileCheck',
    color: 'teal',
    systemPrompt: `You are a senior consultant who writes compelling recommendations memos. You structure findings logically and prioritize recommendations by impact. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a recommendations memo from this conversation.

Include:
1. Title and recipients
2. Executive summary (key message in 2-3 sentences)
3. Background and context
4. Key findings
5. Recommendations with priority, rationale, impact, and effort
6. Next steps
7. Appendix items if relevant

Prioritize recommendations by business impact.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 33,
    tags: ['recommendations', 'consulting', 'advisory', 'memo'],
    targetRoles: ['consultant', 'analyst', 'advisor'],
    templateGroup: 'recommendations',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'recommendationsMemo' },
        title: { type: 'string' },
        to: { type: 'string' },
        from: { type: 'string' },
        date: { type: 'string' },
        executiveSummary: { type: 'string' },
        background: { type: 'string' },
        findings: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['recommendation', 'priority', 'rationale', 'impact'],
          },
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        appendix: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'executiveSummary', 'background', 'findings', 'recommendations', 'nextSteps'],
    },
  }),

  // ============================================================
  // PRIORITY 4: EXECUTIVE TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'boardUpdate',
    name: 'Board Update',
    description: 'Board meeting prep with metrics and strategic updates',
    category: 'specialized',
    icon: 'Building2',
    color: 'slate',
    systemPrompt: `You are a chief of staff who prepares board-ready updates. You present information clearly with appropriate context for board-level discussions. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a board update from this conversation.

Include:
1. Period covered
2. Executive summary (key message)
3. Business highlights
4. Key metrics with trends
5. Challenges and how they're being addressed
6. Strategic updates
7. Financial summary if discussed
8. Asks from the board
9. Upcoming milestones

Keep it high-level and focused on governance-relevant information.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 40,
    tags: ['board', 'executive', 'governance', 'reporting'],
    targetRoles: ['executive', 'founder', 'cfo', 'chief-of-staff'],
    templateGroup: 'board-update',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'boardUpdate' },
        company: { type: 'string' },
        period: { type: 'string' },
        executiveSummary: { type: 'string' },
        highlights: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
              trend: { type: 'string', enum: ['up', 'down', 'flat'] },
              context: { type: 'string' },
            },
            required: ['metric', 'value', 'trend'],
          },
        },
        challenges: { type: 'array', items: { type: 'string' } },
        strategicUpdates: { type: 'array', items: { type: 'string' } },
        financialSummary: { type: 'string' },
        asks: { type: 'array', items: { type: 'string' } },
        upcomingMilestones: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'period', 'executiveSummary', 'highlights', 'metrics', 'challenges', 'strategicUpdates', 'upcomingMilestones'],
    },
  }),

  createStructuredTemplate({
    id: 'investorUpdate',
    name: 'Investor Update',
    description: 'Monthly/quarterly investor memo with traction and asks',
    category: 'specialized',
    icon: 'TrendingUp',
    color: 'green',
    systemPrompt: `You are a founder who writes compelling investor updates. You balance transparency about challenges with enthusiasm about progress and opportunities. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create an investor update from this conversation.

Include:
1. Period covered
2. Headline (most important update)
3. Highlights and wins
4. Key metrics with trends
5. Product updates
6. Team updates
7. Financials (revenue, burn, etc.)
8. Runway
9. Asks (introductions, advice, etc.)
10. Next milestones

Be honest about challenges while maintaining investor confidence.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 41,
    tags: ['investor', 'fundraising', 'startup', 'update'],
    targetRoles: ['founder', 'ceo', 'cfo'],
    templateGroup: 'investor-update',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'investorUpdate' },
        company: { type: 'string' },
        period: { type: 'string' },
        headline: { type: 'string' },
        highlights: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
              trend: { type: 'string', enum: ['up', 'down', 'flat'] },
              context: { type: 'string' },
            },
            required: ['metric', 'value', 'trend'],
          },
        },
        productUpdates: { type: 'array', items: { type: 'string' } },
        teamUpdates: { type: 'array', items: { type: 'string' } },
        financials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['metric', 'value'],
          },
        },
        runway: { type: 'string' },
        asks: { type: 'array', items: { type: 'string' } },
        nextMilestones: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'period', 'headline', 'highlights', 'metrics', 'productUpdates', 'nextMilestones'],
    },
  }),

  createStructuredTemplate({
    id: 'allHandsTalkingPoints',
    name: 'All-Hands Talking Points',
    description: 'Company-wide meeting prep with announcements and Q&A',
    category: 'specialized',
    icon: 'Megaphone',
    color: 'purple',
    systemPrompt: `You are an internal communications expert who prepares executive talking points for all-hands meetings. You balance transparency with appropriate messaging. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create all-hands talking points from this conversation.

Include:
1. Opening remarks
2. Company updates
3. Team wins and recognition
4. Announcements
5. Upcoming priorities
6. Q&A topics to address proactively
7. Closing remarks

Keep the tone motivating while being honest about challenges.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 42,
    tags: ['all-hands', 'internal-comms', 'executive', 'meeting'],
    targetRoles: ['executive', 'hr', 'chief-of-staff'],
    templateGroup: 'all-hands',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'allHandsTalkingPoints' },
        title: { type: 'string' },
        date: { type: 'string' },
        openingRemarks: { type: 'string' },
        companyUpdates: { type: 'array', items: { type: 'string' } },
        teamWins: { type: 'array', items: { type: 'string' } },
        announcements: { type: 'array', items: { type: 'string' } },
        upcomingPriorities: { type: 'array', items: { type: 'string' } },
        qaTopics: { type: 'array', items: { type: 'string' } },
        closingRemarks: { type: 'string' },
      },
      required: ['type', 'openingRemarks', 'companyUpdates', 'teamWins', 'announcements', 'upcomingPriorities', 'closingRemarks'],
    },
  }),

  // ============================================================
  // PRIORITY 5: ENGINEERING TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'technicalDesignDoc',
    name: 'Technical Design Document',
    description: 'Architecture and design decisions with alternatives',
    category: 'specialized',
    icon: 'Code2',
    color: 'purple',
    systemPrompt: `You are a senior software architect who creates clear, thorough technical design documents. You document decisions, alternatives, and trade-offs for future reference. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a technical design document from this conversation.

Include:
1. Title and status
2. Overview of what's being built
3. Goals and non-goals
4. Background context
5. Proposed solution
6. Alternatives considered with pros/cons and rejection reasons
7. Technical details
8. Security considerations
9. Testing strategy
10. Rollout plan
11. Open questions

Be thorough enough that another engineer could implement from this doc.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 50,
    tags: ['technical-design', 'architecture', 'engineering', 'documentation'],
    targetRoles: ['engineer', 'architect', 'tech-lead'],
    templateGroup: 'tech-design',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'technicalDesignDoc' },
        title: { type: 'string' },
        author: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'review', 'approved', 'implemented'] },
        date: { type: 'string' },
        overview: { type: 'string' },
        goals: { type: 'array', items: { type: 'string' } },
        nonGoals: { type: 'array', items: { type: 'string' } },
        background: { type: 'string' },
        proposedSolution: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              rejected: { type: 'boolean' },
              rejectionReason: { type: 'string' },
            },
            required: ['approach', 'pros', 'cons'],
          },
        },
        technicalDetails: { type: 'array', items: { type: 'string' } },
        securityConsiderations: { type: 'array', items: { type: 'string' } },
        testingStrategy: { type: 'string' },
        rolloutPlan: { type: 'string' },
        openQuestions: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'status', 'overview', 'goals', 'proposedSolution', 'alternatives', 'technicalDetails'],
    },
  }),

  createStructuredTemplate({
    id: 'incidentPostmortem',
    name: 'Incident Postmortem',
    description: 'Blameless incident analysis with timeline and action items',
    category: 'specialized',
    icon: 'AlertTriangle',
    color: 'red',
    systemPrompt: `You are an SRE expert who conducts blameless postmortems. You focus on systemic issues rather than individuals, and drive meaningful improvements. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create an incident postmortem from this conversation.

Include:
1. Incident title and severity
2. Date and duration
3. Impact summary
4. Timeline of events
5. Root cause
6. Contributing factors
7. What went well
8. What went poorly
9. Action items with owners, due dates, and priority
10. Lessons learned

Be blameless - focus on systems and processes, not individuals.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 51,
    tags: ['postmortem', 'incident', 'sre', 'reliability'],
    targetRoles: ['sre', 'devops', 'engineering-manager'],
    templateGroup: 'postmortem',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'incidentPostmortem' },
        title: { type: 'string' },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        date: { type: 'string' },
        duration: { type: 'string' },
        impactSummary: { type: 'string' },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              event: { type: 'string' },
              actor: { type: 'string' },
            },
            required: ['timestamp', 'event'],
          },
        },
        rootCause: { type: 'string' },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        whatWentWell: { type: 'array', items: { type: 'string' } },
        whatWentPoorly: { type: 'array', items: { type: 'string' } },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['action', 'priority'],
          },
        },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'severity', 'date', 'impactSummary', 'timeline', 'rootCause', 'contributingFactors', 'whatWentWell', 'whatWentPoorly', 'actionItems', 'lessonsLearned'],
    },
  }),

  createStructuredTemplate({
    id: 'bugReport',
    name: 'Bug Report',
    description: 'Structured bug documentation with reproduction steps',
    category: 'specialized',
    icon: 'Bug',
    color: 'red',
    systemPrompt: `You are a QA engineer who writes clear, actionable bug reports. You capture all information needed to reproduce and fix issues. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a bug report from this conversation.

Include:
1. Title (descriptive but concise)
2. Severity and priority
3. Summary
4. Steps to reproduce
5. Expected behavior
6. Actual behavior
7. Environment details
8. Possible cause if discussed
9. Suggested fix if discussed
10. Workaround if available

Be specific enough that a developer can reproduce the issue.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 52,
    tags: ['bug', 'qa', 'testing', 'issue'],
    targetRoles: ['qa', 'engineer', 'support'],
    templateGroup: 'bug-report',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'bugReport' },
        title: { type: 'string' },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
        reportedBy: { type: 'string' },
        date: { type: 'string' },
        summary: { type: 'string' },
        stepsToReproduce: { type: 'array', items: { type: 'string' } },
        expectedBehavior: { type: 'string' },
        actualBehavior: { type: 'string' },
        environment: { type: 'string' },
        possibleCause: { type: 'string' },
        suggestedFix: { type: 'string' },
        workaround: { type: 'string' },
        attachments: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'severity', 'priority', 'summary', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior'],
    },
  }),

  createStructuredTemplate({
    id: 'adr',
    name: 'Architecture Decision Record',
    description: 'Formal ADR with context, decision, and consequences',
    category: 'specialized',
    icon: 'GitBranch',
    color: 'indigo',
    systemPrompt: `You are a software architect who creates clear Architecture Decision Records (ADRs). You document the context, decision, and consequences for future reference. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create an Architecture Decision Record (ADR) from this conversation.

Include:
1. Title (the decision in brief)
2. Status (proposed, accepted, deprecated, superseded)
3. Context (why is this decision needed?)
4. Decision (what was decided)
5. Consequences (positive, negative, and neutral)
6. Alternatives considered with reasons for rejection
7. Related decisions if any

Follow the standard ADR format for consistency.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 53,
    tags: ['adr', 'architecture', 'decision', 'documentation'],
    targetRoles: ['architect', 'tech-lead', 'engineer'],
    templateGroup: 'adr',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'adr' },
        id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['proposed', 'accepted', 'deprecated', 'superseded'] },
        date: { type: 'string' },
        deciders: { type: 'array', items: { type: 'string' } },
        context: { type: 'string' },
        decision: { type: 'string' },
        consequences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
              consequence: { type: 'string' },
            },
            required: ['type', 'consequence'],
          },
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['alternative', 'reason'],
          },
        },
        relatedDecisions: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'status', 'context', 'decision', 'consequences', 'alternatives'],
    },
  }),

  // ============================================================
  // PRIORITY 6: CONTENT & MARKETING TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter with sections and CTAs',
    category: 'content',
    icon: 'Mail',
    color: 'blue',
    systemPrompt: `You are a content marketer who creates engaging email newsletters. You balance information with entertainment while driving action. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a newsletter from this conversation.

Include:
1. Subject line (compelling and specific)
2. Preheader text
3. Greeting
4. Introduction paragraph
5. Content sections with headings and optional CTAs
6. Closing CTA
7. Sign-off

Keep it scannable and value-focused.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 60,
    tags: ['newsletter', 'email', 'marketing', 'content'],
    targetRoles: ['marketing', 'content-creator', 'founder'],
    templateGroup: 'newsletter',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'newsletter' },
        subject: { type: 'string' },
        preheader: { type: 'string' },
        greeting: { type: 'string' },
        intro: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string' },
              content: { type: 'string' },
              cta: { type: 'string' },
            },
            required: ['heading', 'content'],
          },
        },
        closingCta: { type: 'string' },
        closing: { type: 'string' },
      },
      required: ['type', 'subject', 'greeting', 'intro', 'sections', 'closingCta', 'closing'],
    },
  }),

  createStructuredTemplate({
    id: 'caseStudy',
    name: 'Case Study',
    description: 'Customer success story with challenge, solution, results',
    category: 'content',
    icon: 'Trophy',
    color: 'gold',
    systemPrompt: `You are a content strategist who creates compelling case studies. You tell customer success stories that demonstrate value and build trust. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a case study from this conversation.

Include:
1. Title (customer name + key result)
2. Customer and industry
3. Challenge they faced
4. Solution provided
5. Implementation details
6. Results with metrics (before/after when possible)
7. Customer testimonial if available
8. Key takeaways

Focus on concrete results and quantifiable outcomes.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 61,
    tags: ['case-study', 'customer-success', 'marketing', 'social-proof'],
    targetRoles: ['marketing', 'customer-success', 'sales'],
    templateGroup: 'case-study',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'caseStudy' },
        title: { type: 'string' },
        customer: { type: 'string' },
        industry: { type: 'string' },
        challenge: { type: 'string' },
        solution: { type: 'string' },
        implementation: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              before: { type: 'string' },
              after: { type: 'string' },
              improvement: { type: 'string' },
            },
            required: ['metric', 'after'],
          },
        },
        testimonial: {
          type: 'object',
          properties: {
            quote: { type: 'string' },
            attribution: { type: 'string' },
          },
          required: ['quote', 'attribution'],
        },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
      },
      required: ['type', 'title', 'customer', 'challenge', 'solution', 'results', 'keyTakeaways'],
    },
  }),

  createStructuredTemplate({
    id: 'podcastShowNotes',
    name: 'Podcast Show Notes',
    description: 'Episode notes with timestamps and key takeaways',
    category: 'content',
    icon: 'Podcast',
    color: 'purple',
    systemPrompt: `You are a podcast producer who creates comprehensive show notes. You make episodes discoverable and provide value even for those who don't listen. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create podcast show notes from this conversation.

Include:
1. Episode title
2. Episode number and date
3. Hosts and guests
4. Summary (what the episode is about)
5. Segments with timestamps, topics, notes, and notable quotes
6. Key takeaways
7. Resources mentioned
8. Call to action

Make it useful for listeners and SEO-friendly.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 25,
    order: 62,
    tags: ['podcast', 'show-notes', 'content', 'audio'],
    targetRoles: ['content-creator', 'podcaster', 'marketing'],
    templateGroup: 'podcast',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'podcastShowNotes' },
        episodeTitle: { type: 'string' },
        episodeNumber: { type: 'string' },
        date: { type: 'string' },
        hosts: { type: 'array', items: { type: 'string' } },
        guests: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              topic: { type: 'string' },
              notes: { type: 'array', items: { type: 'string' } },
              quotes: { type: 'array', items: { type: 'string' } },
            },
            required: ['timestamp', 'topic', 'notes'],
          },
        },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
            },
            required: ['title'],
          },
        },
        callToAction: { type: 'string' },
      },
      required: ['type', 'episodeTitle', 'summary', 'segments', 'keyTakeaways'],
    },
  }),

  createStructuredTemplate({
    id: 'videoScript',
    name: 'Video Script',
    description: 'Scene-by-scene video script with visuals and narration',
    category: 'content',
    icon: 'Video',
    color: 'red',
    systemPrompt: `You are a video producer who creates compelling video scripts. You structure content for visual storytelling with clear direction for production. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a video script from this conversation.

Include:
1. Title
2. Duration estimate
3. Target audience
4. Hook (opening that grabs attention)
5. Scenes with scene number, visual description, narration, and notes
6. Call to action
7. End screen suggestions

Make it production-ready with clear visual direction.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 30,
    order: 63,
    tags: ['video', 'script', 'content', 'production'],
    targetRoles: ['content-creator', 'marketing', 'video-producer'],
    templateGroup: 'video',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'videoScript' },
        title: { type: 'string' },
        duration: { type: 'string' },
        targetAudience: { type: 'string' },
        hook: { type: 'string' },
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sceneNumber: { type: 'number' },
              duration: { type: 'string' },
              visual: { type: 'string' },
              narration: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['sceneNumber', 'visual', 'narration'],
          },
        },
        callToAction: { type: 'string' },
        endScreen: { type: 'string' },
      },
      required: ['type', 'title', 'hook', 'scenes', 'callToAction'],
    },
  }),

  createStructuredTemplate({
    id: 'pressRelease',
    name: 'Press Release',
    description: 'Standard press release format with quotes and boilerplate',
    category: 'content',
    icon: 'Newspaper',
    color: 'gray',
    systemPrompt: `You are a PR professional who writes effective press releases. You follow AP style and standard press release structure. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a press release from this conversation.

Include:
1. Headline (newsworthy and specific)
2. Subheadline if needed
3. Dateline (city, date)
4. Lead paragraph (who, what, when, where, why)
5. Body paragraphs
6. Quotes from key stakeholders
7. Boilerplate (about the company)
8. Contact information

Follow standard press release format and AP style.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 64,
    tags: ['press-release', 'pr', 'media', 'announcement'],
    targetRoles: ['pr', 'marketing', 'communications'],
    templateGroup: 'press-release',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'pressRelease' },
        headline: { type: 'string' },
        subheadline: { type: 'string' },
        dateline: { type: 'string' },
        lead: { type: 'string' },
        body: { type: 'array', items: { type: 'string' } },
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              attribution: { type: 'string' },
              title: { type: 'string' },
            },
            required: ['quote', 'attribution'],
          },
        },
        boilerplate: { type: 'string' },
        contactInfo: { type: 'string' },
      },
      required: ['type', 'headline', 'dateline', 'lead', 'body', 'quotes', 'boilerplate'],
    },
  }),

  createStructuredTemplate({
    id: 'twitterThread',
    name: 'Twitter/X Thread',
    description: 'Multi-tweet thread with hook and engagement',
    category: 'content',
    icon: 'Twitter',
    color: 'sky',
    systemPrompt: `You are a social media expert who creates engaging Twitter threads. You hook readers, deliver value, and drive engagement within character limits. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a Twitter/X thread from this conversation.

Include:
1. Hook tweet (first tweet that grabs attention)
2. Individual tweets (each under 280 characters)
3. Character count for each tweet
4. Call to action (engagement driver)

Make it valuable, engaging, and shareable.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 65,
    tags: ['twitter', 'social-media', 'thread', 'content'],
    targetRoles: ['content-creator', 'founder', 'marketing'],
    templateGroup: 'twitter',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'twitterThread' },
        hook: { type: 'string' },
        tweets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tweetNumber: { type: 'number' },
              content: { type: 'string' },
              characterCount: { type: 'number' },
            },
            required: ['tweetNumber', 'content', 'characterCount'],
          },
        },
        totalTweets: { type: 'number' },
        callToAction: { type: 'string' },
      },
      required: ['type', 'hook', 'tweets', 'totalTweets'],
    },
  }),

  // ============================================================
  // PRIORITY 7: HR & COACHING TEMPLATES
  // ============================================================

  createStructuredTemplate({
    id: 'coachingNotes',
    name: 'Coaching Session Notes',
    description: 'Structured coaching documentation with insights and actions',
    category: 'professional',
    icon: 'Compass',
    color: 'teal',
    systemPrompt: `You are an executive coach who documents coaching sessions effectively. You capture insights, track progress, and maintain accountability. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create coaching session notes from this conversation.

Include:
1. Client and coach names
2. Session focus
3. Insights discussed (topic, insight, related action)
4. Progress on previous actions
5. New action items with due dates
6. Focus for next session

Capture the developmental journey and commitments made.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 70,
    tags: ['coaching', 'development', 'executive', 'mentoring'],
    targetRoles: ['coach', 'mentor', 'hr'],
    templateGroup: 'coaching',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'coachingNotes' },
        client: { type: 'string' },
        coach: { type: 'string' },
        sessionNumber: { type: 'number' },
        date: { type: 'string' },
        focus: { type: 'string' },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              insight: { type: 'string' },
              actionItem: { type: 'string' },
            },
            required: ['topic', 'insight'],
          },
        },
        progressOnPreviousActions: { type: 'array', items: { type: 'string' } },
        newActionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              dueDate: { type: 'string' },
            },
            required: ['action'],
          },
        },
        nextSessionFocus: { type: 'string' },
      },
      required: ['type', 'focus', 'insights', 'progressOnPreviousActions', 'newActionItems'],
    },
  }),

  createStructuredTemplate({
    id: 'performanceReview',
    name: 'Performance Review',
    description: 'Structured review with ratings and development goals',
    category: 'professional',
    icon: 'Star',
    color: 'yellow',
    systemPrompt: `You are an HR professional trained in fair, evidence-based performance evaluation. You document performance objectively, avoid common biases, and focus on development. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a performance review from this conversation.

${PROMPT_INSTRUCTIONS.useContext}

RATING SCALE (1-5):
5 = Exceptional - Consistently exceeds expectations, role model for others
4 = Exceeds Expectations - Often surpasses requirements, strong contributor
3 = Meets Expectations - Reliably delivers on requirements
2 = Below Expectations - Inconsistent delivery, improvement needed
1 = Unsatisfactory - Significant gaps, performance concern

BIAS PREVENTION RULES:
- Cover the FULL review period, not just recent events (avoid recency bias)
- Assess against job requirements, not personality (avoid halo/horn effect)
- Use specific examples, not general impressions
- If conversation only discusses recent events, note this limitation

EVIDENCE REQUIREMENTS:
Each rating category MUST include:
- Specific behavioral examples (what they did, not who they are)
- Impact or outcome when possible
- Time period the examples cover

BAD comment (vague): "Great team player, always helpful."
GOOD comment (specific): "Led 3 cross-functional projects in Q3-Q4. On the API integration project, proactively identified dependency conflict that would have delayed launch 2 weeks."

BAD comment (personality): "Has a positive attitude."
GOOD comment (behavioral): "During service outage in October, remained calm and coordinated 4-person response team. Post-incident survey showed 95% customer satisfaction with communication."

CATEGORY STRUCTURE:
For each rating category discussed:
- category: Name of competency area
- rating: 1-5 score
- comments: 2-3 sentences with specific examples and impact

DEVELOPMENT FOCUS:
- Growth areas should be actionable, not character judgments
- Goals should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Connect growth areas to career aspirations if discussed

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 71,
    tags: ['performance', 'review', 'hr', 'development'],
    targetRoles: ['manager', 'hr'],
    templateGroup: 'performance-review',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'performanceReview' },
        employeeName: { type: 'string' },
        reviewerName: { type: 'string' },
        reviewPeriod: { type: 'string' },
        overallRating: { type: 'number', minimum: 1, maximum: 5 },
        ratings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              rating: { type: 'number', minimum: 1, maximum: 5 },
              comments: { type: 'string' },
            },
            required: ['category', 'rating', 'comments'],
          },
        },
        accomplishments: { type: 'array', items: { type: 'string' } },
        areasForGrowth: { type: 'array', items: { type: 'string' } },
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              timeline: { type: 'string' },
            },
            required: ['goal'],
          },
        },
        additionalComments: { type: 'string' },
      },
      required: ['type', 'employeeName', 'reviewPeriod', 'overallRating', 'ratings', 'accomplishments', 'areasForGrowth', 'goals'],
    },
  }),

  createStructuredTemplate({
    id: 'exitInterview',
    name: 'Exit Interview Analysis',
    description: 'Structured departure insights with themes and suggestions',
    category: 'professional',
    icon: 'DoorOpen',
    color: 'gray',
    systemPrompt: `You are an HR analyst who extracts actionable insights from exit interviews. You identify patterns and recommendations for improving retention. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Analyze this exit interview conversation.

Extract:
1. Employee information (department, tenure)
2. Primary reason for leaving
3. Themes with sentiment and details
4. What worked well
5. What could improve
6. Specific suggestions
7. Would recommend/return indicators

Be objective and focus on actionable insights for the organization.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5',
    estimatedSeconds: 25,
    order: 72,
    tags: ['exit-interview', 'hr', 'retention', 'feedback'],
    targetRoles: ['hr', 'people-ops'],
    templateGroup: 'exit-interview',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'exitInterview' },
        employee: { type: 'string' },
        department: { type: 'string' },
        tenure: { type: 'string' },
        date: { type: 'string' },
        reasonForLeaving: { type: 'string' },
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
              details: { type: 'array', items: { type: 'string' } },
            },
            required: ['theme', 'sentiment', 'details'],
          },
        },
        whatWorkedWell: { type: 'array', items: { type: 'string' } },
        whatCouldImprove: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } },
        wouldRecommend: { type: ['boolean', 'null'] },
        wouldReturn: { type: ['boolean', 'null'] },
      },
      required: ['type', 'reasonForLeaving', 'themes', 'whatWorkedWell', 'whatCouldImprove', 'suggestions'],
    },
  }),

  createStructuredTemplate({
    id: 'goalSetting',
    name: 'Goal Setting Document',
    description: 'SMART goals with milestones and support needed',
    category: 'professional',
    icon: 'Target',
    color: 'green',
    systemPrompt: `You are a goal-setting facilitator who helps people create clear, achievable SMART goals. You ensure goals are specific, measurable, achievable, relevant, and time-bound. ${PROMPT_INSTRUCTIONS.jsonRequirement}`,
    userPrompt: `Create a goal setting document from this conversation.

Include:
1. Participant and period
2. Vision statement if discussed
3. SMART goals with all components (specific, measurable, achievable, relevant, time-bound)
4. Milestones for each goal
5. Potential obstacles
6. Support needed
7. Check-in schedule

Make goals actionable and trackable.

${PROMPT_INSTRUCTIONS.languageConsistency}`,
    modelPreference: 'gpt-5-mini',
    estimatedSeconds: 20,
    order: 73,
    tags: ['goals', 'okr', 'development', 'planning'],
    targetRoles: ['manager', 'coach', 'hr'],
    templateGroup: 'goal-setting',
    jsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'goalSetting' },
        participant: { type: 'string' },
        period: { type: 'string' },
        date: { type: 'string' },
        vision: { type: 'string' },
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              specific: { type: 'string' },
              measurable: { type: 'string' },
              achievable: { type: 'string' },
              relevant: { type: 'string' },
              timeBound: { type: 'string' },
              milestones: { type: 'array', items: { type: 'string' } },
            },
            required: ['goal', 'specific', 'measurable', 'achievable', 'relevant', 'timeBound'],
          },
        },
        potentialObstacles: { type: 'array', items: { type: 'string' } },
        supportNeeded: { type: 'array', items: { type: 'string' } },
        checkInSchedule: { type: 'string' },
      },
      required: ['type', 'goals', 'potentialObstacles', 'supportNeeded'],
    },
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
