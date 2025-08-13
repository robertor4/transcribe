import { AnalysisType } from '@transcribe/shared';

// Default Summary Prompt
const SUMMARIZATION_PROMPT = `Please analyze this conversation transcript and provide a comprehensive summary.

**CRITICAL FORMATTING RULES:**
1. START WITH A MAIN HEADING (using #) that is a clear, descriptive title showing what this conversation was about. This should be the specific subject matter and context. Do NOT use a generic label - make the heading itself BE the topic.
2. Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns.
3. If the transcript is in a non-English language, ALL headings and content must be in that same language.

Then provide a 1-2 sentence overview directly under the main heading that elaborates on the conversation's purpose and outcome. Wrap this overview paragraph in HTML: <p style="font-size: 1.4em;">Your overview text here</p>

Create sections for:
- Key discussion points (main points with brief explanations)
- Participants (roles and expertise, using generic descriptors when names are unclear)
- Conversation summary (pyramid principle: conclusion first, then supporting arguments, evidence, context)
- Decisions made (if any - concrete agreements reached)
- Action items (if any - what, who, when)
- Important details (if any - dates, tools, dependencies)
- Next steps (if any - immediate plans and future actions)

Note: Use natural section headings appropriate for the language of the transcript.`;

// Communication Styles Analysis Prompt
const COMMUNICATION_STYLES_PROMPT = `Analyze the communication effectiveness of this conversation using the following framework:

COMMUNICATION EFFECTIVENESS SCORE: Rate the overall communication quality (1-10) and provide a one-sentence summary of the primary communication strength and primary weakness.

CLARITY & STRUCTURE ANALYSIS:

Message clarity: Were ideas expressed clearly and unambiguously?
Logical flow: Did the conversation follow a coherent structure?
Information density: Was the right amount of detail provided without overwhelming or under-informing?

LISTENING & ENGAGEMENT PATTERNS:

Active listening indicators: Evidence of participants building on each other's ideas, asking clarifying questions, or acknowledging understanding
Interruption/overlap patterns: How well did participants manage turn-taking?
Engagement balance: Did all parties contribute meaningfully, or was it dominated by certain voices?

QUESTIONING & DISCOVERY EFFECTIVENESS:

Quality of questions asked: Were they open-ended, probing, or clarifying when appropriate?
Information extraction: How effectively did participants draw out relevant details?
Assumption checking: Did participants verify understanding rather than making assumptions?

EMOTIONAL INTELLIGENCE & TONE:

Tone appropriateness: Was the communication style suitable for the context and relationships?
Conflict navigation: How were disagreements or tensions handled?
Empathy and perspective-taking: Evidence of understanding others' viewpoints

DECISION-MAKING & CLOSURE:

Path to resolution: How efficiently did the conversation move toward conclusions?
Consensus building: Were decisions made collaboratively with buy-in?
Action clarity: Were next steps and responsibilities clearly established?

TOP 3 COMMUNICATION IMPROVEMENTS:
Provide specific, actionable recommendations that would most improve future conversations, such as:

Process improvements (e.g., "Start with agenda setting")
Behavioral changes (e.g., "Use more open-ended questions")
Structural modifications (e.g., "Summarize key points before moving to next topic")

COMMUNICATION STRENGTHS TO MAINTAIN:
Identify 2-3 effective communication behaviors demonstrated that should be continued.
CONTEXT CONSIDERATIONS:
Note any factors (time pressure, relationship dynamics, complexity of topic) that may have influenced communication effectiveness and should be considered when applying improvements.

Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Action Items Extraction Prompt
const ACTION_ITEMS_PROMPT = `Extract and organize all action items from this conversation. 

Create sections for different time horizons (only if items exist):
- Immediate actions (next 24-48 hours)
- Short-term actions (this week/next 1-2 weeks)
- Medium-term actions (next 2-4 weeks)
- Long-term actions (1+ months)
- Follow-up required (unclear items)
- Decision dependencies
- Recurring commitments
- Critical path items (mark with [CRITICAL])
- Accountability framework

For each action item include: Task description | Owner | Deadline | Dependencies (if any)

Requirements:
- Start items with action verbs
- Be specific about deliverables
- Include success criteria where mentioned
- Flag unclear items as [NEEDS CLARIFICATION]
- Note if deadlines are firm vs. targets
- Identify risks (unrealistic timelines, resource gaps)

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Emotional Intelligence Analysis Prompt
const EMOTIONAL_INTELLIGENCE_PROMPT = `Please analyze the emotional intelligence aspects of this conversation.

Analyze the following aspects:
- Emotional tone (climate, shifts, stress indicators)
- Empathy and understanding (empathetic responses, active listening)
- Conflict handling (disagreements, resolution strategies, effectiveness)
- Emotional regulation (self-control, reactions, stress management)
- Relationship building (rapport, trust, collaboration)
- Recommendations (areas for development, engagement strategies, team dynamics)

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Influence and Persuasion Analysis Prompt
const INFLUENCE_PERSUASION_PROMPT = `Please analyze influence and persuasion techniques used in this conversation.

Analyze the following aspects:
- Persuasion techniques (logical arguments, emotional appeals, credibility, social proof)
- Argumentation patterns (claim-evidence, counter-arguments, rebuttals)
- Influence dynamics (who influenced whom, successful moments, resistance)
- Negotiation elements (positions, compromises, win-win solutions)
- Decision-making influence (how decisions were shaped, key factors, consensus)
- Effectiveness assessment (successful techniques, missed opportunities, improvements)

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Personal Development Analysis Prompt
const PERSONAL_DEVELOPMENT_PROMPT = `Please provide personal development insights based on this conversation.

Analyze the following aspects:
- Strengths demonstrated (communication, leadership, technical expertise, collaboration)
- Areas for improvement (knowledge gaps, skills to develop)
- Learning opportunities (topics to explore, skills to acquire)
- Recommended training/development (courses, resources, mentoring)
- Professional growth strategies (short-term goals, long-term career plans)
- Behavioral patterns (limiting behaviors, opportunities for change, positive patterns)

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Custom Analysis Prompt (uses context as instructions)
const CUSTOM_ANALYSIS_PROMPT = `Please analyze this conversation according to the specific instructions provided in the context.`;

// Map analysis types to their prompts
const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  [AnalysisType.SUMMARY]: SUMMARIZATION_PROMPT,
  [AnalysisType.COMMUNICATION_STYLES]: COMMUNICATION_STYLES_PROMPT,
  [AnalysisType.ACTION_ITEMS]: ACTION_ITEMS_PROMPT,
  [AnalysisType.EMOTIONAL_INTELLIGENCE]: EMOTIONAL_INTELLIGENCE_PROMPT,
  [AnalysisType.INFLUENCE_PERSUASION]: INFLUENCE_PERSUASION_PROMPT,
  [AnalysisType.PERSONAL_DEVELOPMENT]: PERSONAL_DEVELOPMENT_PROMPT,
  [AnalysisType.CUSTOM]: CUSTOM_ANALYSIS_PROMPT,
};

// System prompts for each analysis type
const SYSTEM_PROMPTS: Record<AnalysisType, string> = {
  [AnalysisType.SUMMARY]: 'You are a helpful assistant that creates structured summaries of meeting transcripts and conversations. You are skilled at analyzing communication patterns and group dynamics.',
  [AnalysisType.COMMUNICATION_STYLES]: 'You are an expert communication analyst who identifies and analyzes communication patterns, speaking styles, and interaction dynamics in conversations.',
  [AnalysisType.ACTION_ITEMS]: 'You are a project management expert who extracts, organizes, and prioritizes action items, tasks, and deliverables from conversations.',
  [AnalysisType.EMOTIONAL_INTELLIGENCE]: 'You are an emotional intelligence expert who analyzes emotional tone, empathy levels, conflict handling, and interpersonal dynamics in conversations.',
  [AnalysisType.INFLUENCE_PERSUASION]: 'You are a persuasion and influence expert who identifies persuasion techniques, argumentation patterns, and influence strategies used in conversations.',
  [AnalysisType.PERSONAL_DEVELOPMENT]: 'You are a professional development coach who identifies areas for improvement, learning opportunities, and provides constructive feedback based on conversation analysis.',
  [AnalysisType.CUSTOM]: 'You are a versatile AI assistant who can analyze conversations based on specific user instructions.',
};

// Helper function to get prompt by analysis type
export function getPromptByType(analysisType: AnalysisType = AnalysisType.SUMMARY): string {
  return ANALYSIS_PROMPTS[analysisType] || SUMMARIZATION_PROMPT;
}

// Helper function to get system prompt by analysis type
export function getSystemPromptByType(analysisType: AnalysisType = AnalysisType.SUMMARY): string {
  return SYSTEM_PROMPTS[analysisType] || SYSTEM_PROMPTS[AnalysisType.SUMMARY];
}

// Build complete prompt with context and language support
export function buildAnalysisPrompt(
  transcription: string,
  analysisType: AnalysisType = AnalysisType.SUMMARY,
  context = '',
  language = '',
): string {
  let basePrompt = ANALYSIS_PROMPTS[analysisType] || SUMMARIZATION_PROMPT;
  
  // For custom analysis, context becomes the instructions
  if (analysisType === AnalysisType.CUSTOM && context) {
    return `${context}\n\nTranscript:\n${transcription}`;
  }
  
  let fullPrompt = basePrompt;
  
  // Add context if provided
  if (context) {
    fullPrompt = `## Context
The following context information is provided about this conversation:
${context}

Please use this context to better understand references, participants, technical terms, and the overall discussion.

---

${basePrompt}`;
  }
  
  // Add language instructions if specified
  if (language && language !== 'english') {
    fullPrompt = `CRITICAL LANGUAGE REQUIREMENT: 
- The transcription is in ${language}
- You MUST generate ALL output text in ${language}
- This includes ALL section headings, titles, labels, and content
- Translate every English heading to ${language} (e.g., "Key discussion points" → Dutch: "Belangrijkste discussiepunten", "Participants" → "Deelnemers", "Action items" → "Actiepunten", etc.)
- Only keep English for: proper nouns, company names, and technical terms without standard translations
- Use appropriate formatting and conventions for ${language}
- DO NOT leave any headings or structural text in English

${fullPrompt}`;
  }
  
  return `${fullPrompt}\n\n---\nTRANSCRIPT:\n${transcription}`;
}