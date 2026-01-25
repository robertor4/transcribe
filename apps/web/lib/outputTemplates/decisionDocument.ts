import { Scale } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Decision Document template - Record decisions
 * Use case: Document decisions with context, options, and rationale
 */
export const decisionDocumentTemplate: OutputTemplate = {
  id: 'decisionDocument',
  name: 'Decision Document',
  description: 'Record decisions with context, options, and rationale',
  icon: Scale,
  example: 'Document important decisions',
  prompt: null,
  category: 'output',
  status: 'beta',
};
