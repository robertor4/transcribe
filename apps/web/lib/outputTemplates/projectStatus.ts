import { BarChart3 } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Project Status Report template - Formal status updates
 * Use case: Create project status with RAG rating and milestones
 */
export const projectStatusTemplate: OutputTemplate = {
  id: 'projectStatus',
  name: 'Project Status Report',
  description: 'Formal project status with RAG rating and milestones',
  icon: BarChart3,
  example: 'Report project status',
  prompt: null,
  category: 'output',
};
