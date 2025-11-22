import { FileText } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * User Stories template - Product requirements
 * Use case: Generate user stories for development from product discussions
 */
export const userStoriesTemplate: OutputTemplate = {
  id: 'userStories',
  name: 'User Stories',
  description: 'Product requirements',
  icon: FileText,
  example: 'Generate user stories for development',
};
