import { Video } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Video Script template - Scene-by-scene video script
 * Use case: Create video script with visuals and narration
 */
export const videoScriptTemplate: OutputTemplate = {
  id: 'videoScript',
  name: 'Video Script',
  description: 'Scene-by-scene video script with visuals and narration',
  icon: Video,
  example: 'Write video scripts',
  prompt: null,
  category: 'output',
  status: 'beta',
};
