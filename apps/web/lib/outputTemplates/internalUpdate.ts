import { Users } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Internal Update Email template
 * Use case: Stakeholder brief with TLDR, key decisions, blockers, and next milestone
 */
export const internalUpdateTemplate: OutputTemplate = {
  id: 'internalUpdate',
  name: 'Internal Update',
  description: 'Stakeholder brief with TLDR and key decisions',
  icon: Users,
  example: 'Update stakeholders on project status',
  prompt: null, // Uses backend structured template
  category: 'output',
};
