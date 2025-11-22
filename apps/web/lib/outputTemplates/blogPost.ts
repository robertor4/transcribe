import { Edit3 } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Blog Post template - Publish-ready article
 * Use case: Transform conversation insights into compelling blog content
 */
export const blogPostTemplate: OutputTemplate = {
  id: 'blogPost',
  name: 'Blog Post',
  description: 'Publish-ready article',
  icon: Edit3,
  example: 'Transform insights into a compelling blog post',
};
