import { FileText } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Meeting Minutes template - Formal meeting record
 * Use case: Document meetings with agenda, decisions, and action items
 */
export const meetingMinutesTemplate: OutputTemplate = {
  id: 'meetingMinutes',
  name: 'Meeting Minutes',
  description: 'Formal meeting record with agenda, decisions, and action items',
  icon: FileText,
  example: 'Document formal meeting records',
  prompt: null, // Prompts handled by backend
  category: 'output',
};
