import { Megaphone } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * All-Hands Talking Points template - Company-wide meeting prep
 * Use case: Prepare all-hands with announcements and Q&A
 */
export const allHandsTalkingPointsTemplate: OutputTemplate = {
  id: 'allHandsTalkingPoints',
  name: 'All-Hands Talking Points',
  description: 'Company-wide meeting prep with announcements and Q&A',
  icon: Megaphone,
  example: 'Prepare all-hands meetings',
  prompt: null,
  category: 'output',
};
