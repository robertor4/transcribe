import { Podcast } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Podcast Show Notes template - Episode notes
 * Use case: Create episode notes with timestamps and key takeaways
 */
export const podcastShowNotesTemplate: OutputTemplate = {
  id: 'podcastShowNotes',
  name: 'Podcast Show Notes',
  description: 'Episode notes with timestamps and key takeaways',
  icon: Podcast,
  example: 'Create podcast show notes',
  prompt: null,
  category: 'output',
};
