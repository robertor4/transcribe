import { Users } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * 1:1 Meeting Notes template - Manager-report conversations
 * Use case: Structure notes from 1:1 meetings
 */
export const oneOnOneNotesTemplate: OutputTemplate = {
  id: 'oneOnOneNotes',
  name: '1:1 Meeting Notes',
  description: 'Structured notes for manager-report conversations',
  icon: Users,
  example: 'Document 1:1 meeting discussions',
  prompt: null,
  category: 'output',
};
