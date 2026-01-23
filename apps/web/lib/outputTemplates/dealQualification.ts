import { Target } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Deal Qualification template - Sales opportunity scoring
 * Use case: MEDDIC/BANT scorecard for sales opportunities
 */
export const dealQualificationTemplate: OutputTemplate = {
  id: 'dealQualification',
  name: 'Deal Qualification',
  description: 'MEDDIC/BANT scorecard for sales opportunities',
  icon: Target,
  example: 'Qualify sales deals',
  prompt: null,
  category: 'output',
};
