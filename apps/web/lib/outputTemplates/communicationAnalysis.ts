import { MessageSquareQuote } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Communication Analysis template - Score conversation on communication aspects
 * Use case: Evaluate communication effectiveness, identify strengths and areas for improvement
 */
export const communicationAnalysisTemplate: OutputTemplate = {
  id: 'communicationAnalysis',
  name: 'Communication Analysis',
  description: 'Score communication effectiveness',
  icon: MessageSquareQuote,
  example: 'Analyze communication patterns and provide scores',
  prompt: {
    system: `You are a communication coach and analyst. Your task is to evaluate conversations across multiple dimensions of effective communication. Provide constructive, actionable feedback with specific examples from the conversation. Be objective yet encouraging.`,
    userTemplate: `Analyze the following conversation transcript for communication effectiveness:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

Evaluate and score (0-100) the conversation across these dimensions:
- Clarity: How clearly were ideas expressed?
- Active Listening: Evidence of listening and building on others' ideas
- Empathy: Understanding and acknowledging others' perspectives
- Persuasiveness: Effectiveness in presenting arguments and influencing
- Collaboration: Working together towards shared understanding
- Conciseness: Getting to the point without unnecessary words

For each dimension:
1. Provide a score (0-100)
2. Highlight 1-2 specific strengths with examples
3. Suggest 1-2 areas for improvement with actionable advice

Include an overall assessment and key takeaway.`,
    temperature: 0.4,
    maxTokens: 1500,
  },
  status: 'reviewed',
};
