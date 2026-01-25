import { Compass } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Coaching Notes template - Coaching session documentation
 * Use case: Document coaching sessions with insights and actions
 */
export const coachingNotesTemplate: OutputTemplate = {
  id: 'coachingNotes',
  name: 'Coaching Session Notes',
  description: 'Structured coaching documentation with insights and actions',
  icon: Compass,
  example: 'Document coaching sessions',
  prompt: null,
  category: 'output',
  status: 'beta',
};
