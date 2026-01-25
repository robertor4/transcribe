import { Lightbulb } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Workshop Synthesis template - Workshop outcomes
 * Use case: Capture workshop outcomes, insights, and action items
 */
export const workshopSynthesisTemplate: OutputTemplate = {
  id: 'workshopSynthesis',
  name: 'Workshop Synthesis',
  description: 'Capture workshop outcomes, insights, and action items',
  icon: Lightbulb,
  example: 'Synthesize workshop discussions',
  prompt: null,
  category: 'output',
  status: 'beta',
};
