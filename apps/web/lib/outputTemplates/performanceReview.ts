import { Star } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Performance Review template - Structured review
 * Use case: Create performance review with ratings and development goals
 */
export const performanceReviewTemplate: OutputTemplate = {
  id: 'performanceReview',
  name: 'Performance Review',
  description: 'Structured review with ratings and development goals',
  icon: Star,
  example: 'Write performance reviews',
  prompt: null,
  category: 'output',
};
