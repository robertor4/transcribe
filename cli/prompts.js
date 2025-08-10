// Default Summary Prompt
const SUMMARIZATION_PROMPT = `Please analyze this conversation transcript and provide a comprehensive summary.

**CRITICAL FORMATTING RULES:**
1. START WITH A MAIN HEADING (using #) that is a clear, descriptive title showing what this conversation was about. This should be the specific subject matter and context (e.g., "# Technical Discussion: Implementing OAuth2 Authentication in React App" or "# Team Meeting: Q3 Product Roadmap and Resource Allocation"). Do NOT use a generic label like "Conversation Topic" - make the heading itself BE the topic.
2. Write ALL section headers in sentence case (European/Dutch style), capitalizing only the first word and proper nouns:
   - CORRECT: "## Key discussion topics"
   - WRONG: "## Key Discussion Topics"

Then provide a 1-2 sentence overview directly under the main heading that elaborates on the conversation's purpose and outcome.

## Key discussion topics
List the main topics discussed in bullet points, with brief explanations for each.

## Participants and roles
Note the number of participants and their general roles or areas of expertise based on the discussion. Do NOT attempt to identify specific names unless explicitly stated - use generic descriptors like "technical lead", "project manager", "developer", "stakeholder", etc.

## Technical issues and bugs discussed
- List any bugs, issues, or problems mentioned
- Include any error descriptions or symptoms
- Note the proposed solutions or workarounds

## Decisions made
List any concrete decisions or agreements reached during the conversation.

## Action items
Extract all action items mentioned, including:
- What needs to be done
- Who is responsible (if mentioned)
- Timeline or deadline (if specified)

## Important details
- Any critical dates, deadlines, or milestones mentioned
- Any tools, systems, or technologies discussed
- Any dependencies or blockers identified

## Next steps
Summarize the immediate next steps and future plans discussed.`;

// Communication Styles Analysis Prompt
const COMMUNICATION_STYLES_PROMPT = `Please analyze the communication styles and patterns in this conversation.

# Communication Styles Analysis

## Speaking patterns
- Identify dominant vs. passive speakers
- Note interruption patterns
- Analyze turn-taking dynamics
- Identify speaking pace and style variations

## Communication effectiveness
- Clarity of message delivery
- Active listening indicators
- Question-asking patterns
- Feedback giving/receiving styles

## Interaction dynamics
- Power dynamics in the conversation
- Collaboration vs. competition
- Support and encouragement patterns
- Conflict or tension points

## Recommendations for improvement
- Specific suggestions for each participant type
- Team communication enhancements
- Meeting effectiveness improvements`;

// Action Items Extraction Prompt
const ACTION_ITEMS_PROMPT = `Please extract and organize all action items from this conversation.

# Action Items and Tasks

## Immediate action items (Due within 1 week)
List each task with:
- Task description
- Responsible party (if mentioned)
- Deadline (if specified)
- Dependencies

## Short-term tasks (1-4 weeks)
List each task with the same format

## Long-term initiatives (1+ months)
List strategic initiatives and projects

## Follow-up items
- Questions that need answers
- Decisions pending
- Information to be gathered

## Blocked items
- Tasks waiting on dependencies
- Items needing clarification

## Meeting scheduling
- Proposed meetings
- Required participants
- Suggested timeframes`;

// Emotional Intelligence Analysis Prompt
const EMOTIONAL_INTELLIGENCE_PROMPT = `Please analyze the emotional intelligence aspects of this conversation.

# Emotional Intelligence Analysis

## Emotional tone
- Overall emotional climate
- Emotional shifts during conversation
- Stress or tension indicators

## Empathy and understanding
- Examples of empathetic responses
- Missed opportunities for empathy
- Active listening demonstrations

## Conflict handling
- Points of disagreement
- Conflict resolution strategies used
- Effectiveness of conflict management

## Emotional regulation
- Self-control demonstrations
- Emotional reactions to challenges
- Stress management indicators

## Relationship building
- Rapport-building behaviors
- Trust indicators
- Collaborative moments

## Recommendations
- Areas for emotional intelligence development
- Strategies for better emotional engagement
- Team dynamics improvements`;

// Influence and Persuasion Analysis Prompt
const INFLUENCE_PERSUASION_PROMPT = `Please analyze influence and persuasion techniques used in this conversation.

# Influence and Persuasion Analysis

## Persuasion techniques identified
- Logical arguments used
- Emotional appeals
- Credibility establishment
- Social proof references

## Argumentation patterns
- Claim-evidence structures
- Counter-argument handling
- Concession and rebuttal strategies

## Influence dynamics
- Who influenced whom
- Successful persuasion moments
- Resistance points

## Negotiation elements
- Positions taken
- Compromises offered
- Win-win solutions proposed

## Decision-making influence
- How decisions were shaped
- Key influencing factors
- Consensus building efforts

## Effectiveness assessment
- Most effective techniques
- Missed opportunities
- Recommendations for improvement`;

// Personal Development Analysis Prompt
const PERSONAL_DEVELOPMENT_PROMPT = `Please provide personal development insights based on this conversation.

# Personal Development Analysis

## Strengths demonstrated
- Communication strengths
- Leadership qualities
- Technical expertise shown
- Collaborative abilities

## Areas for improvement
- Communication gaps
- Knowledge areas to develop
- Soft skills to enhance
- Technical skills needed

## Learning opportunities
- Topics requiring deeper understanding
- Skills mentioned but not demonstrated
- Industry knowledge gaps

## Recommended training/development
- Specific courses or training programs
- Books or resources to explore
- Mentoring opportunities
- Practice exercises

## Professional growth strategies
- Short-term development goals
- Long-term career considerations
- Networking opportunities identified

## Behavioral patterns to address
- Limiting behaviors observed
- Opportunities for behavior change
- Positive patterns to reinforce`;

// Custom Analysis Prompt (uses context as instructions)
const CUSTOM_ANALYSIS_PROMPT = `Please analyze this conversation according to the specific instructions provided in the context.`;

// Legacy prompts for backward compatibility
const TECHNICAL_MEETING_PROMPT = `You are analyzing a technical meeting transcript. Focus on:
- Technical architecture decisions
- Code implementation details
- Bug fixes and troubleshooting approaches
- Development timelines
- Testing strategies
- Deployment plans`;

const GENERAL_CONVERSATION_PROMPT = `Provide a clear, structured summary focusing on:
- Main topics and themes
- Key points made by participants
- Any conclusions or outcomes
- Follow-up items or questions raised`;

// Analysis type constants (matching backend AnalysisType enum)
const ANALYSIS_TYPES = {
  SUMMARY: 'summary',
  COMMUNICATION_STYLES: 'communication_styles',
  ACTION_ITEMS: 'action_items',
  EMOTIONAL_INTELLIGENCE: 'emotional_intelligence',
  INFLUENCE_PERSUASION: 'influence_persuasion',
  PERSONAL_DEVELOPMENT: 'personal_development',
  CUSTOM: 'custom'
};

// Map analysis types to their prompts
const ANALYSIS_PROMPTS = {
  [ANALYSIS_TYPES.SUMMARY]: SUMMARIZATION_PROMPT,
  [ANALYSIS_TYPES.COMMUNICATION_STYLES]: COMMUNICATION_STYLES_PROMPT,
  [ANALYSIS_TYPES.ACTION_ITEMS]: ACTION_ITEMS_PROMPT,
  [ANALYSIS_TYPES.EMOTIONAL_INTELLIGENCE]: EMOTIONAL_INTELLIGENCE_PROMPT,
  [ANALYSIS_TYPES.INFLUENCE_PERSUASION]: INFLUENCE_PERSUASION_PROMPT,
  [ANALYSIS_TYPES.PERSONAL_DEVELOPMENT]: PERSONAL_DEVELOPMENT_PROMPT,
  [ANALYSIS_TYPES.CUSTOM]: CUSTOM_ANALYSIS_PROMPT
};

// System prompts for each analysis type
const SYSTEM_PROMPTS = {
  [ANALYSIS_TYPES.SUMMARY]: 'You are a helpful assistant that creates structured summaries of meeting transcripts and conversations. You are skilled at analyzing communication patterns and group dynamics.',
  [ANALYSIS_TYPES.COMMUNICATION_STYLES]: 'You are an expert communication analyst who identifies and analyzes communication patterns, speaking styles, and interaction dynamics in conversations.',
  [ANALYSIS_TYPES.ACTION_ITEMS]: 'You are a project management expert who extracts, organizes, and prioritizes action items, tasks, and deliverables from conversations.',
  [ANALYSIS_TYPES.EMOTIONAL_INTELLIGENCE]: 'You are an emotional intelligence expert who analyzes emotional tone, empathy levels, conflict handling, and interpersonal dynamics in conversations.',
  [ANALYSIS_TYPES.INFLUENCE_PERSUASION]: 'You are a persuasion and influence expert who identifies persuasion techniques, argumentation patterns, and influence strategies used in conversations.',
  [ANALYSIS_TYPES.PERSONAL_DEVELOPMENT]: 'You are a professional development coach who identifies areas for improvement, learning opportunities, and provides constructive feedback based on conversation analysis.',
  [ANALYSIS_TYPES.CUSTOM]: 'You are a versatile AI assistant who can analyze conversations based on specific user instructions.'
};

module.exports = {
  // Export all prompts
  SUMMARIZATION_PROMPT,
  COMMUNICATION_STYLES_PROMPT,
  ACTION_ITEMS_PROMPT,
  EMOTIONAL_INTELLIGENCE_PROMPT,
  INFLUENCE_PERSUASION_PROMPT,
  PERSONAL_DEVELOPMENT_PROMPT,
  CUSTOM_ANALYSIS_PROMPT,
  TECHNICAL_MEETING_PROMPT,
  GENERAL_CONVERSATION_PROMPT,
  
  // Export constants
  ANALYSIS_TYPES,
  ANALYSIS_PROMPTS,
  SYSTEM_PROMPTS,
  
  // Helper function to get prompt by analysis type
  getPromptByType: (analysisType = ANALYSIS_TYPES.SUMMARY) => {
    return ANALYSIS_PROMPTS[analysisType] || SUMMARIZATION_PROMPT;
  },
  
  // Helper function to get system prompt by analysis type
  getSystemPromptByType: (analysisType = ANALYSIS_TYPES.SUMMARY) => {
    return SYSTEM_PROMPTS[analysisType] || SYSTEM_PROMPTS[ANALYSIS_TYPES.SUMMARY];
  },
  
  // Build complete prompt with context and language support
  buildAnalysisPrompt: (transcription, analysisType = ANALYSIS_TYPES.SUMMARY, context = '', language = '') => {
    let basePrompt = ANALYSIS_PROMPTS[analysisType] || SUMMARIZATION_PROMPT;
    
    // For custom analysis, context becomes the instructions
    if (analysisType === ANALYSIS_TYPES.CUSTOM && context) {
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
      fullPrompt = `IMPORTANT: The transcription is in ${language}. Please generate the output in ${language} as well. Use appropriate formatting and conventions for ${language}.

${fullPrompt}`;
    }
    
    return `${fullPrompt}\n\n---\nTRANSCRIPT:\n${transcription}`;
  },
  
  // Legacy function for backward compatibility
  getSummarizationPrompt: (transcription, context = '', promptType = 'default') => {
    let basePrompt = SUMMARIZATION_PROMPT;
    
    if (promptType === 'technical') {
      basePrompt = TECHNICAL_MEETING_PROMPT + '\n\n' + SUMMARIZATION_PROMPT;
    } else if (promptType === 'general') {
      basePrompt = GENERAL_CONVERSATION_PROMPT + '\n\n' + SUMMARIZATION_PROMPT;
    }
    
    let fullPrompt = basePrompt;
    
    if (context) {
      fullPrompt = `## Context
The following context information is provided about this conversation:
${context}

Please use this context to better understand references, participants, technical terms, and the overall discussion.

---

${basePrompt}`;
    }
    
    return `${fullPrompt}\n\n---\nTRANSCRIPT:\n${transcription}`;
  }
};