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
  // PROFESSIONAL ANALYSIS TEMPLATES
  // ============================================================
  createTemplate({
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
    systemPrompt: prompts.getSystemPromptByType(
      AnalysisType.INFLUENCE_PERSUASION,
    ),
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
    systemPrompt: prompts.getSystemPromptByType(
      AnalysisType.PERSONAL_DEVELOPMENT,
    ),
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
    targetRoles: [
      'executive-assistant',
      'project-manager',
      'secretary',
      'team-lead',
    ],
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
    targetRoles: [
      'product-manager',
      'support',
      'content-creator',
      'knowledge-manager',
    ],
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
    tags: [
      'customer-feedback',
      'product-feedback',
      'feature-requests',
      'voice-of-customer',
    ],
    targetRoles: [
      'product-manager',
      'customer-success',
      'founder',
      'ux-researcher',
    ],
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
