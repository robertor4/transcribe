import { FileSignature } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Client Proposal Email template
 * Use case: Formal proposal email with requirements summary, solution overview, and next steps
 */
export const clientProposalTemplate: OutputTemplate = {
  id: 'clientProposal',
  name: 'Client Proposal',
  description: 'Formal proposal with requirements and solution',
  icon: FileSignature,
  example: 'Draft a proposal based on client requirements',
  prompt: null, // Uses backend structured template
  category: 'output',
};
