import { Newspaper } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Press Release template - Standard press release
 * Use case: Create press release with quotes and boilerplate
 */
export const pressReleaseTemplate: OutputTemplate = {
  id: 'pressRelease',
  name: 'Press Release',
  description: 'Standard press release format with quotes and boilerplate',
  icon: Newspaper,
  example: 'Write press releases',
  prompt: null,
  category: 'output',
};
