import { CheckSquare } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Action Items template - Structured task list
 * Use case: Extract actionable next steps from conversations
 */
export const actionItemsTemplate: OutputTemplate = {
  id: 'actionItems',
  name: 'Action Items',
  description: 'Structured task list',
  icon: CheckSquare,
  example: 'Extract actionable next steps',
};
