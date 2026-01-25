import { Shield } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Objection Handler template - Sales objection analysis
 * Use case: Extract objections with response strategies
 */
export const objectionHandlerTemplate: OutputTemplate = {
  id: 'objectionHandler',
  name: 'Objection Handler',
  description: 'Extract objections with response strategies',
  icon: Shield,
  example: 'Analyze sales objections',
  prompt: null,
  category: 'output',
  status: 'beta',
};
