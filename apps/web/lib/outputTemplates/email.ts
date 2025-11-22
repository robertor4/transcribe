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
};
