import { TrendingUp } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Sales Outreach Email template
 * Use case: Post-discovery call email that addresses pain points and proposes value with clear CTA
 */
export const salesEmailTemplate: OutputTemplate = {
  id: 'salesEmail',
  name: 'Sales Outreach',
  description: 'Post-discovery email with value proposition and CTA',
  icon: TrendingUp,
  example: 'Follow up on our discovery call with next steps',
  prompt: null, // Uses backend structured template
  category: 'output',
  status: 'reviewed',
};
