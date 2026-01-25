import { FileText } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Statement of Work template - SOW draft
 * Use case: Draft SOW with scope, deliverables, and assumptions
 */
export const sowTemplate: OutputTemplate = {
  id: 'sow',
  name: 'Statement of Work',
  description: 'Draft SOW with scope, deliverables, and assumptions',
  icon: FileText,
  example: 'Draft a statement of work',
  prompt: null,
  category: 'output',
  status: 'beta',
};
