import { AnalysisType } from '@transcribe/shared';

// Default Summary Prompt
export const SUMMARIZATION_PROMPT = `Please analyze this conversation transcript and provide a comprehensive summary.

**CRITICAL FORMATTING RULES:**
1. START WITH A MAIN HEADING (using #) that is a clear, descriptive title showing what this conversation was about. This should be the specific subject matter and context. Do NOT use a generic label - make the heading itself BE the topic.
2. Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns.
3. If the transcript is in a non-English language, ALL headings and content must be in that same language.

Then provide a 1-2 sentence overview directly under the main heading that elaborates on the conversation's purpose and outcome. Wrap this overview paragraph in HTML: <p style="font-size: 1.4em;">Your overview text here</p>

## Key discussion points
List the main topics as bullet points with brief descriptions (one line each). Start each bullet point with **bold text** for the topic name/key phrase (2-4 words), followed by a brief description.

Example format:
- **Topic name:** Brief description of what was discussed
- **Another key point:** What this covered

## Detailed discussion
For EACH key discussion point listed above, write a dedicated paragraph that:
- Starts with the **topic in bold** (matching the bullet point from above)
- Provides specific examples and details from the conversation
- Includes relevant quotes or specific statements when impactful
- Explains what was proposed, debated, or explored
- Shows how participants approached or resolved the topic
- Uses concrete details (numbers, names, technical terms) mentioned in the conversation

Each paragraph should be substantial (3-5 sentences) and give readers a clear understanding of what was actually said, not just what was discussed. The bold topic at the start helps readers quickly scan and find specific discussion areas.

## Decisions made
Only include this section if concrete decisions were reached. List specific agreements or conclusions.

## Next steps
Only include if there are forward-looking elements that aren't captured as action items. Focus on strategic direction or future considerations.

Note: Use natural section headings appropriate for the language of the transcript.

Key guidance for the detailed discussion section:
- Be specific rather than generic - mention actual examples, tools, or solutions discussed
- Capture the nuance of different viewpoints if there were disagreements
- Include technical details, metrics, or specifications that were mentioned
- Show the evolution of thinking if ideas developed during the conversation
- Use the participants' actual terminology and frameworks
- Make each paragraph self-contained so readers understand that specific topic fully`;

// Communication Styles Analysis Prompt
export const COMMUNICATION_STYLES_PROMPT = `Analyze the communication effectiveness of this conversation.

# Write your key takeaway about communication effectiveness here: X/10

IMPORTANT: This should be a level 1 heading (use single #). Write a descriptive assessment that captures the essence of the communication quality. DO NOT include brackets. Examples of good H1 titles:
# Highly effective communication with excellent collaboration: 9/10
# Moderately effective discussion with room for improvement: 6/10
# Poor communication hindered by constant interruptions: 3/10
# Exceptional communication drove productive outcomes: 10/10
# Communication struggled due to unclear objectives: 4/10

The heading MUST be a level 1 heading (single #) with a complete, meaningful statement that immediately tells readers the communication quality level. DO NOT include square brackets [ ] in your title. DO NOT use ## (h2) for this main title.

Provide a 2-3 sentence explanation of the score, highlighting the most important strength and weakness. Wrap this brief explanation in HTML: <p style="font-size: 1.4em;">Your explanation text here</p>

IMPORTANT: For ALL sections below, write headers as key takeaway statements that describe what actually happened, not generic categories. For example, instead of "Clarity & structure analysis", write something like "Ideas were clearly expressed but conversation lacked logical flow" or "Well-structured discussion with occasional unclear explanations". Make headers scannable insights that readers can understand without reading the details.

## Write a key takeaway about clarity & structure here (e.g., "Messages were clear and followed a logical progression")

Analyze: Message clarity, logical flow, and information density. Was the conversation easy to follow? Did participants provide appropriate detail levels?

## Write a key takeaway about listening & engagement (e.g., "Active listening evident with balanced participation")

Analyze: How well did participants build on each other's ideas? Were there interruptions or good turn-taking? Did everyone contribute meaningfully?

## Write a key takeaway about questioning (e.g., "Strategic questions uncovered valuable insights")

Analyze: Were questions open-ended and probing? How effectively did participants extract information and verify understanding?

## Write a key takeaway about tone & emotional dynamics (e.g., "Professional tone maintained despite disagreements")

Analyze: Was the tone appropriate? How were conflicts handled? Did participants show empathy and understanding?

## Write a key takeaway about decisions & outcomes (e.g., "Clear decisions reached with defined next steps")

Analyze: How efficiently did the conversation reach conclusions? Were decisions collaborative? Were action items clear?

## Top 3 communication improvements needed
Provide specific, actionable recommendations that would most improve future conversations:
1. [Specific improvement]
2. [Specific improvement]  
3. [Specific improvement]

## Key strengths to maintain
Identify 2-3 effective communication behaviors that should continue.

## Context factors affecting communication
Note any circumstances (time pressure, relationships, complexity) that influenced the conversation.

Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Action Items Extraction Prompt
export const ACTION_ITEMS_PROMPT = `Extract and organize all action items from this conversation.

# Action items overview

Provide a comprehensive overview of all action items and deliverables identified in this conversation. Wrap this overview paragraph in HTML: <p style="font-size: 1.4em;">Your overview text here</p>

## Action items

List all action items as a numbered list with the following format:

1. Task description | Owner | Deadline | Timeline | Dependencies
2. Task description | Owner | Deadline | Timeline | Dependencies

CRITICAL FORMATTING RULES:
- Only provide the VALUES themselves, never include field labels
- CORRECT: "Review document | John Smith | 2024-03-01 | Short-term | None"
- WRONG: "Review document | Owner: John Smith | Deadline: 2024-03-01 | Timeline: Short-term | Dependencies: None"
- WRONG: "Review document | Eigenaar: John Smith | Deadline: 2024-03-01 | Tijdlijn: Short-term | Afhankelijkheden: None"

Timeline should be: Short-term, Mid-term, or Long-term (always use these English terms for consistency)

Requirements:
- Use numbered list (1., 2., 3., etc.)
- Start task descriptions with action verbs
- Be specific about deliverables
- Include success criteria where mentioned
- Flag unclear items with [NEEDS CLARIFICATION] ONLY in the task description field, never in other fields
- Mark critical path items with (CRITICAL) in the task description field only
- For missing deadlines, use a hyphen (-) - do NOT use [NEEDS CLARIFICATION] in the deadline field
- Note if deadlines are firm vs. targets
- For dependencies, use a hyphen (-) if there are no dependencies
- Timeline classification:
  * Short-term: Within 1-2 weeks
  * Mid-term: Within 1-3 months
  * Long-term: Beyond 3 months
- Identify risks (unrealistic timelines, resource gaps)
- Do NOT add field labels like "Owner:", "Deadline:", etc. in any language

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Emotional Intelligence Analysis Prompt
export const EMOTIONAL_INTELLIGENCE_PROMPT = `Please analyze the emotional intelligence aspects of this conversation.

# Write your key emotional intelligence takeaway here

IMPORTANT: This should be a level 1 heading (use single #). Write the MOST CRITICAL emotional intelligence insight from this conversation. This should be the one thing someone needs to know about the emotional dynamics. DO NOT include brackets. Examples of good H1 titles:
- High emotional intelligence fostered trust and collaboration
- Lack of empathy created unnecessary tension
- Exceptional emotional awareness prevented conflict escalation
- Poor emotional regulation derailed productive discussion
- Strong interpersonal skills built team cohesion
- Unaddressed frustrations undermined team morale
- Emotional maturity enabled difficult conversations

The heading should capture the essence of the emotional dynamics - what really mattered emotionally in this conversation. DO NOT include square brackets [ ] in your title.

Provide a 2-3 sentence explanation of the emotional dynamics, highlighting the most significant interpersonal strength and area for improvement. Wrap this explanation in HTML: <p style="font-size: 1.4em;">Your explanation text here</p>

IMPORTANT: For ALL sections below, write headers as key takeaway statements that describe what actually happened, not generic categories. For example, instead of "Emotional tone", write something like "Positive atmosphere maintained despite challenging topics" or "Tension escalated when discussing deadlines". Make headers scannable insights that readers can understand without reading the details.

## Write a key takeaway about emotional tone (e.g., "Collaborative atmosphere with occasional stress during technical discussions")
Analyze climate, shifts, and stress indicators. What was the overall emotional temperature? How did it change throughout the conversation?

## Write a key takeaway about empathy (e.g., "Strong empathetic responses built trust between participants")
Examine empathetic responses and active listening. Did participants validate each other's feelings? Were emotions acknowledged appropriately?

## Write a key takeaway about conflict (e.g., "Disagreements resolved constructively through compromise")
Assess disagreements, resolution strategies, and effectiveness. How were tensions handled? Were conflicts productive or destructive?

## Write a key takeaway about emotional regulation (e.g., "Participants maintained composure under pressure")
Evaluate self-control, reactions, and stress management. Did anyone lose their temper? How were frustrations expressed?

## Write a key takeaway about relationships (e.g., "Trust strengthened through open communication")
Analyze rapport, trust, and collaboration. Did the conversation strengthen or weaken relationships?

## Recommendations for emotional intelligence development
Provide specific areas for improvement, engagement strategies, and team dynamics insights

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Influence and Persuasion Analysis Prompt
export const INFLUENCE_PERSUASION_PROMPT = `Please analyze influence and persuasion techniques used in this conversation.

# Write your key influence and persuasion takeaway here

IMPORTANT: This should be a level 1 heading (use single #). DO NOT use ## (h2) for this main title.

Provide a 2-3 sentence explanation of the influence dynamics, highlighting the most effective persuasion technique used and the key missed opportunity. Wrap this explanation in HTML: <p style="font-size: 1.4em;">Your explanation text here</p>

IMPORTANT: For ALL sections below, write headers as key takeaway statements that describe what actually happened, not generic categories. For example, instead of "Persuasion techniques", write something like "Data-driven arguments proved most convincing" or "Emotional appeals fell flat with technical audience". Make headers scannable insights that readers can understand without reading the details.

## Write a key takeaway about persuasion techniques (e.g., "Logic and evidence dominated over emotional appeals")
Analyze logical arguments, emotional appeals, credibility, and social proof. Which approaches resonated most? What fell flat?

## Write a key takeaway about argumentation (e.g., "Strong evidence backing but weak counter-argument handling")
Examine claim-evidence structures, counter-arguments, and rebuttals. How well-structured were the arguments?

## Write a key takeaway about influence flow (e.g., "Senior stakeholder's opinion shifted group consensus")
Identify who influenced whom, successful moments, and resistance. Who had the most sway? Where did influence attempts fail?

## Write a key takeaway about negotiation (e.g., "Compromise reached through incremental concessions")
Assess positions, compromises, and win-win solutions. Were there clear winners/losers or mutual benefit?

## Write a key takeaway about decision shaping (e.g., "Risk concerns ultimately drove the final decision")
Analyze how decisions were shaped, key factors, and consensus building. What tipped the scales?

## Effectiveness assessment and improvements
Evaluate successful techniques, missed opportunities, and specific recommendations for future influence attempts

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Personal Development Analysis Prompt
export const PERSONAL_DEVELOPMENT_PROMPT = `Please provide personal development insights based on this conversation.

# Write your key personal development insight here

IMPORTANT: This should be a level 1 heading (use single #). DO NOT use ## (h2) for this main title.

Provide a 2-3 sentence explanation of the development opportunities, highlighting the most significant strength demonstrated and the primary growth area identified. Wrap this explanation in HTML: <p style="font-size: 1.4em;">Your explanation text here</p>

IMPORTANT: For ALL sections below, write headers as key takeaway statements that describe what actually happened, not generic categories. For example, instead of "Strengths demonstrated", write something like "Strong technical expertise evident in problem-solving approach" or "Natural leadership emerged during crisis discussion". Make headers scannable insights that readers can understand without reading the details.

## Write a key takeaway about strengths (e.g., "Clear communication and strategic thinking drove productive outcomes")
Analyze communication, leadership, technical expertise, and collaboration. What capabilities stood out? How were they applied?

## Write a key takeaway about improvement areas (e.g., "Delegation skills need development to prevent bottlenecks")
Identify knowledge gaps and skills to develop. What specific weaknesses emerged? Where did limitations show?

## Write a key takeaway about learning needs (e.g., "Project management methodology would enhance execution")
Highlight topics to explore and skills to acquire. What knowledge would have helped? What skills gaps were evident?

## Recommended training and development resources
Suggest specific courses, resources, and mentoring opportunities based on observed needs

## Write a key takeaway about growth strategy (e.g., "Focus on stakeholder management for next career level")
Outline short-term goals and long-term career development paths based on demonstrated capabilities and gaps

## Write a key takeaway about behaviors (e.g., "Interrupting pattern limiting team collaboration")
Examine limiting behaviors, opportunities for change, and positive patterns to reinforce

Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`;

// Custom Analysis Prompt (uses context as instructions)
export const CUSTOM_ANALYSIS_PROMPT = `Please analyze this conversation according to the specific instructions provided in the context.`;

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
  [AnalysisType.SUMMARY]:
    'You are a helpful assistant that creates structured summaries of meeting transcripts and conversations. You are skilled at analyzing communication patterns and group dynamics.',
  [AnalysisType.COMMUNICATION_STYLES]:
    'You are an expert communication analyst who identifies and analyzes communication patterns, speaking styles, and interaction dynamics in conversations.',
  [AnalysisType.ACTION_ITEMS]:
    'You are a project management expert who extracts, organizes, and prioritizes action items, tasks, and deliverables from conversations.',
  [AnalysisType.EMOTIONAL_INTELLIGENCE]:
    'You are an emotional intelligence expert who analyzes emotional tone, empathy levels, conflict handling, and interpersonal dynamics in conversations.',
  [AnalysisType.INFLUENCE_PERSUASION]:
    'You are a persuasion and influence expert who identifies persuasion techniques, argumentation patterns, and influence strategies used in conversations.',
  [AnalysisType.PERSONAL_DEVELOPMENT]:
    'You are a professional development coach who identifies areas for improvement, learning opportunities, and provides constructive feedback based on conversation analysis.',
  [AnalysisType.CUSTOM]:
    'You are a versatile AI assistant who can analyze conversations based on specific user instructions.',
};

// Helper function to get prompt by analysis type
export function getPromptByType(
  analysisType: AnalysisType = AnalysisType.SUMMARY,
): string {
  return ANALYSIS_PROMPTS[analysisType] || SUMMARIZATION_PROMPT;
}

// Helper function to get system prompt by analysis type
export function getSystemPromptByType(
  analysisType: AnalysisType = AnalysisType.SUMMARY,
): string {
  return SYSTEM_PROMPTS[analysisType] || SYSTEM_PROMPTS[AnalysisType.SUMMARY];
}

// Build complete prompt with context and language support
export function buildAnalysisPrompt(
  transcription: string,
  analysisType: AnalysisType = AnalysisType.SUMMARY,
  context = '',
  language = '',
): string {
  const basePrompt = ANALYSIS_PROMPTS[analysisType] || SUMMARIZATION_PROMPT;

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
- Translate every English heading to ${language} (e.g., "Key discussion points" → Dutch: "Belangrijkste discussiepunten", "Action items" → "Actiepunten", etc.)
- Only keep English for: proper nouns, company names, and technical terms without standard translations
- Use appropriate formatting and conventions for ${language}
- DO NOT leave any headings or structural text in English

${fullPrompt}`;
  }

  return `${fullPrompt}\n\n---\nTRANSCRIPT:\n${transcription}`;
}
