import { Eye } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Competitive Intelligence template - Competitor analysis
 * Use case: Extract competitor mentions and positioning insights
 */
export const competitiveIntelTemplate: OutputTemplate = {
  id: 'competitiveIntel',
  name: 'Competitive Intelligence',
  description: 'Extract competitor mentions and positioning insights',
  icon: Eye,
  example: 'Gather competitive insights',
  prompt: null,
  category: 'output',
  status: 'beta',
};
