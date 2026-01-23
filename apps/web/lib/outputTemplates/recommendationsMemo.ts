import { FileCheck } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Recommendations Memo template - Findings and recommendations
 * Use case: Create memo with findings and executive summary
 */
export const recommendationsMemoTemplate: OutputTemplate = {
  id: 'recommendationsMemo',
  name: 'Recommendations Memo',
  description: 'Findings and recommendations with executive summary',
  icon: FileCheck,
  example: 'Document recommendations',
  prompt: null,
  category: 'output',
};
