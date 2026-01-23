import { Trophy } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Case Study template - Customer success story
 * Use case: Document customer success with challenge, solution, results
 */
export const caseStudyTemplate: OutputTemplate = {
  id: 'caseStudy',
  name: 'Case Study',
  description: 'Customer success story with challenge, solution, results',
  icon: Trophy,
  example: 'Create case studies',
  prompt: null,
  category: 'output',
};
