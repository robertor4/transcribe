import { Database } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * CRM Notes template - Salesforce/HubSpot ready notes
 * Use case: Generate CRM-ready call notes
 */
export const crmNotesTemplate: OutputTemplate = {
  id: 'crmNotes',
  name: 'CRM Notes',
  description: 'Salesforce/HubSpot-ready call notes',
  icon: Database,
  example: 'Create CRM call notes',
  prompt: null,
  category: 'output',
};
