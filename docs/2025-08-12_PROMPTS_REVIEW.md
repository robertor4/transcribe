# Prompts Review Document

This document contains all prompts found in the codebase for review purposes.

## Location: `/cli/prompts.js`

### 1. Default Summary Prompt
```javascript
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
Summarize the immediate next steps and future plans discussed.`
```

### 2. Communication Styles Analysis Prompt
```javascript
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
- Meeting effectiveness improvements`
```

### 3. Action Items Extraction Prompt
```javascript
const ACTION_ITEMS_PROMPT = `Extract and organize all action items from this conversation using the following structure. Only include section headers if there are actual action items for that category:
## Immediate actions (next 24-48 hours):

Task description | Owner | Specific deadline | Dependencies (if any)

## Short-term actions (this week/next 1-2 weeks):

Task description | Owner | Specific deadline | Dependencies (if any)

## Medium-term actions (next 2-4 weeks):

Task description | Owner | Specific deadline | Dependencies (if any)

## Long-term actions (1+ months):

Task description | Owner | Specific deadline | Dependencies (if any)

## Follow-up required:

Items needing additional clarification or confirmation
Tasks mentioned but lacking clear ownership assignment
Deadlines that were discussed but not firmly established

## Decision dependencies:

Actions that cannot proceed until other decisions are made
Items waiting on external approvals or inputs

## Recurring/ongoing commitments:

Regular check-ins, reporting, or monitoring tasks established
Process changes or new responsibilities assigned

## Critical path items:

Actions that will block or delay other work if not completed on time
Mark with [CRITICAL] designation

## Accountability framework:

Who will track overall progress?
When/how will status be reported?
What format will updates take?

Formatting requirements:

Use action verbs to start each item (Create, Review, Send, Schedule, etc.)
Be specific about deliverables (what exactly will be produced?)
Include success criteria where mentioned
Flag any items with unclear scope as [NEEDS CLARIFICATION]
Note if deadlines are firm commitments vs. target dates

Risk flags:

Items with unrealistic timelines
Tasks assigned to unavailable/overloaded people
Actions lacking necessary resources or authority`
```

### 4. Emotional Intelligence Analysis Prompt
```javascript
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
- Team dynamics improvements`
```

### 5. Influence and Persuasion Analysis Prompt
```javascript
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
- Recommendations for improvement`
```

### 6. Personal Development Analysis Prompt
```javascript
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
- Positive patterns to reinforce`
```

### 7. Custom Analysis Prompt
```javascript
const CUSTOM_ANALYSIS_PROMPT = `Please analyze this conversation according to the specific instructions provided in the context.`
```

### 8. Legacy Prompts for Backward Compatibility

#### Technical Meeting Prompt
```javascript
const TECHNICAL_MEETING_PROMPT = `You are analyzing a technical meeting transcript. Focus on:
- Technical architecture decisions
- Code implementation details
- Bug fixes and troubleshooting approaches
- Development timelines
- Testing strategies
- Deployment plans`
```

#### General Conversation Prompt
```javascript
const GENERAL_CONVERSATION_PROMPT = `Provide a clear, structured summary focusing on:
- Main topics and themes
- Key points made by participants
- Any conclusions or outcomes
- Follow-up items or questions raised`
```

## System Prompts for Each Analysis Type

### Summary System Prompt
```javascript
'You are a helpful assistant that creates structured summaries of meeting transcripts and conversations. You are skilled at analyzing communication patterns and group dynamics.'
```

### Communication Styles System Prompt
```javascript
'You are an expert communication analyst who identifies and analyzes communication patterns, speaking styles, and interaction dynamics in conversations.'
```

### Action Items System Prompt
```javascript
'You are a project management expert who extracts, organizes, and prioritizes action items, tasks, and deliverables from conversations.'
```

### Emotional Intelligence System Prompt
```javascript
'You are an emotional intelligence expert who analyzes emotional tone, empathy levels, conflict handling, and interpersonal dynamics in conversations.'
```

### Influence and Persuasion System Prompt
```javascript
'You are a persuasion and influence expert who identifies persuasion techniques, argumentation patterns, and influence strategies used in conversations.'
```

### Personal Development System Prompt
```javascript
'You are a professional development coach who identifies areas for improvement, learning opportunities, and provides constructive feedback based on conversation analysis.'
```

### Custom Analysis System Prompt
```javascript
'You are a versatile AI assistant who can analyze conversations based on specific user instructions.'
```

## Additional System Prompt Modifiers

### Base Instruction Added to All System Prompts
```javascript
'Important: Do NOT attempt to guess or identify specific individuals by name - instead use generic role descriptors and focus on behavioral patterns and communication styles.'
```

### Language-Specific Instructions
When a language is specified, the following is added:
```javascript
'IMPORTANT: The transcription is in ${language}. Please generate the output in ${language} as well. Use appropriate formatting and conventions for ${language}.'
```

## Prompt Building Functions

### Context Integration
When context is provided, it's integrated as follows:
```javascript
`## Context
The following context information is provided about this conversation:
${context}

Please use this context to better understand references, participants, technical terms, and the overall discussion.

---

${basePrompt}`
```

### Language Instructions
Language-specific instructions are prepended to prompts:
```javascript
`IMPORTANT: The transcription is in ${language}. Please generate the output in ${language} as well. Use appropriate formatting and conventions for ${language}.

${fullPrompt}`
```

### Feedback-Based Regeneration Prompt
When regenerating summaries with user feedback:
```javascript
`Please regenerate the ${analysisTypeName} for this conversation transcript, taking into account the user feedback provided below.

## User Feedback and Comments:
[Comments listed here]

## Additional Instructions:
${instructions}

## Requirements:
Please create a comprehensive ${analysisTypeName}, addressing the feedback above.

${context ? `## Context:\n${context}\n\n` : ''}

---
TRANSCRIPT:
${transcription}`
```

## Usage in TranscriptionService

The prompts are used in the `TranscriptionService` (apps/api/src/transcription/transcription.service.ts) with the following pattern:

1. System prompts are retrieved and modified with base instructions
2. User prompts are built with the appropriate analysis type, context, and language
3. The OpenAI API is called with both system and user prompts
4. Temperature is set to 0.3 for consistency
5. Max tokens is set to 4000 for comprehensive responses

## Notes

- All prompts emphasize not identifying specific individuals by name
- Prompts support multiple languages with appropriate formatting conventions
- The system includes feedback mechanisms for iterative improvement
- Custom analysis type allows for user-defined analysis instructions
- All prompts follow a structured format with clear sections and subsections