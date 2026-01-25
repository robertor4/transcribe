import { RotateCcw } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Retrospective template - Sprint/project retrospective
 * Use case: Document retrospective insights and action items
 */
export const retrospectiveTemplate: OutputTemplate = {
  id: 'retrospective',
  name: 'Retrospective Summary',
  description: 'Sprint or project retrospective with insights and actions',
  icon: RotateCcw,
  example: 'Summarize team retrospectives',
  prompt: null,
  category: 'output',
  status: 'beta',
};
