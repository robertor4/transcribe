import { UserCheck } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Interview Assessment template - Candidate evaluation
 * Use case: Structured candidate assessment with competency scoring
 */
export const interviewAssessmentTemplate: OutputTemplate = {
  id: 'interviewAssessment',
  name: 'Interview Assessment',
  description: 'Structured candidate evaluation with competency scoring',
  icon: UserCheck,
  example: 'Evaluate interview candidates',
  prompt: null,
  category: 'output',
};
