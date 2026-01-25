import { Bug } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Bug Report template - Structured bug documentation
 * Use case: Document bugs with reproduction steps
 */
export const bugReportTemplate: OutputTemplate = {
  id: 'bugReport',
  name: 'Bug Report',
  description: 'Structured bug documentation with reproduction steps',
  icon: Bug,
  example: 'Document bug reports',
  prompt: null,
  category: 'output',
  status: 'beta',
};
