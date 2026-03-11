import { Compass } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Vision Document template - Strategic vision planning
 * Use case: Transform conversations into structured vision documents with pillars, objectives, and milestones
 */
export const visionDocumentTemplate: OutputTemplate = {
  id: 'visionDocument',
  name: 'Vision Document',
  description: 'Strategic vision with pillars, objectives, and milestones',
  icon: Compass,
  example: 'Create a strategic vision document',
  prompt: null,
  category: 'output',
  status: 'reviewed',
};
