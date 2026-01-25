import { DoorOpen } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Exit Interview template - Departure analysis
 * Use case: Document departure insights with themes and suggestions
 */
export const exitInterviewTemplate: OutputTemplate = {
  id: 'exitInterview',
  name: 'Exit Interview Analysis',
  description: 'Structured departure insights with themes and suggestions',
  icon: DoorOpen,
  example: 'Analyze exit interviews',
  prompt: null,
  category: 'output',
  status: 'beta',
};
