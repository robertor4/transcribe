import { Reply } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Follow-up Email template
 * Use case: Post-meeting email that recaps discussion, confirms decisions, and assigns action items
 */
export const followUpEmailTemplate: OutputTemplate = {
  id: 'followUpEmail',
  name: 'Follow-up Email',
  description: 'Post-meeting recap with decisions and action items',
  icon: Reply,
  example: 'Recap our meeting and assign action items',
  prompt: null, // Uses backend structured template
  category: 'output',
  status: 'reviewed',
};
