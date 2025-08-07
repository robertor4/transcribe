const SUMMARIZATION_PROMPT = `Please analyze this conversation transcript and provide a comprehensive summary with the following structure:

## Executive Summary
Provide a 2-3 sentence overview of the entire conversation, highlighting the main purpose and outcome.

## Key Discussion Topics
List the main topics discussed in bullet points, with brief explanations for each.

## Participants and Roles
If identifiable, list the participants and their apparent roles or areas of expertise.

## Technical Issues and Bugs Discussed
- List any bugs, issues, or problems mentioned
- Include any error descriptions or symptoms
- Note the proposed solutions or workarounds

## Decisions Made
List any concrete decisions or agreements reached during the conversation.

## Action Items
Extract all action items mentioned, including:
- What needs to be done
- Who is responsible (if mentioned)
- Timeline or deadline (if specified)

## Important Details
- Any critical dates, deadlines, or milestones mentioned
- Any tools, systems, or technologies discussed
- Any dependencies or blockers identified

## Next Steps
Summarize the immediate next steps and future plans discussed.

---
Format your response in clean markdown with proper headers and bullet points. Be specific and include relevant details while keeping each section concise.`;

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

module.exports = {
  SUMMARIZATION_PROMPT,
  TECHNICAL_MEETING_PROMPT,
  GENERAL_CONVERSATION_PROMPT,
  
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