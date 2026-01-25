import { AlertTriangle } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Incident Postmortem template - Blameless incident analysis
 * Use case: Document incident analysis with timeline and action items
 */
export const incidentPostmortemTemplate: OutputTemplate = {
  id: 'incidentPostmortem',
  name: 'Incident Postmortem',
  description: 'Blameless incident analysis with timeline and action items',
  icon: AlertTriangle,
  example: 'Document incident postmortems',
  prompt: null,
  category: 'output',
  status: 'beta',
};
