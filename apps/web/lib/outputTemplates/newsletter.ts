import { Mail } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Newsletter template - Email newsletter
 * Use case: Create email newsletter with sections and CTAs
 */
export const newsletterTemplate: OutputTemplate = {
  id: 'newsletter',
  name: 'Newsletter',
  description: 'Email newsletter with sections and CTAs',
  icon: Mail,
  example: 'Create newsletters',
  prompt: null,
  category: 'output',
  status: 'beta',
};
