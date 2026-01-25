import { Twitter } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Twitter/X Thread template - Multi-tweet thread
 * Use case: Create engaging thread with hook and engagement
 */
export const twitterThreadTemplate: OutputTemplate = {
  id: 'twitterThread',
  name: 'Twitter/X Thread',
  description: 'Multi-tweet thread with hook and engagement',
  icon: Twitter,
  example: 'Create Twitter threads',
  prompt: null,
  category: 'output',
  status: 'beta',
};
