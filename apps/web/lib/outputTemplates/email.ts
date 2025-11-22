import { Mail } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Email template - Professional email summary
 * Use case: Turn conversations into follow-up emails, meeting summaries, or client updates
 */
export const emailTemplate: OutputTemplate = {
  id: 'email',
  name: 'Email',
  description: 'Professional email summary',
  icon: Mail,
  example: 'Turn this conversation into a follow-up email',
  prompt: {
    system: `You are a professional email writer. Your task is to transform conversation transcripts into clear, concise, and professional emails. Focus on key points, action items, and next steps. Maintain a warm yet professional tone appropriate for business communication.`,
    userTemplate: `Based on the following conversation transcript, write a professional email summary:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

Format the email with:
- A clear subject line
- Professional greeting
- Concise summary of key points
- Action items or next steps
- Professional closing

Keep the email focused and easy to scan.`,
    temperature: 0.7,
    maxTokens: 800,
  },
};
