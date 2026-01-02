import { Share2 } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * LinkedIn Post template - Engaging social media content
 * Use case: Create professional LinkedIn updates from conversations
 */
export const linkedinPostTemplate: OutputTemplate = {
  id: 'linkedin',
  name: 'LinkedIn Post',
  description: 'Engaging social media content',
  icon: Share2,
  example: 'Create a professional LinkedIn update',
  prompt: {
    system: `You are a social media content creator specializing in LinkedIn posts. Create engaging, professional posts that spark conversation and provide value. Use authentic voice, clear insights, and strategic formatting with line breaks and emojis when appropriate.`,
    userTemplate: `Create an engaging LinkedIn post based on this conversation:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

Guidelines:
- Start with a hook that grabs attention
- Share 1-2 key insights or learnings
- Use short paragraphs with line breaks for readability
- Include a call-to-action or question to encourage engagement
- Keep it concise (ideal: 150-300 words)
- Professional yet conversational tone
- Use emojis sparingly and strategically

Make it authentic and engaging for LinkedIn's professional audience.`,
    temperature: 0.8,
    maxTokens: 500,
  },
};
