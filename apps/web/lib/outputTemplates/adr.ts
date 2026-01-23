import { GitBranch } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * ADR template - Architecture Decision Record
 * Use case: Document architectural decisions with context and consequences
 */
export const adrTemplate: OutputTemplate = {
  id: 'adr',
  name: 'Architecture Decision Record',
  description: 'Formal ADR with context, decision, and consequences',
  icon: GitBranch,
  example: 'Document architecture decisions',
  prompt: null,
  category: 'output',
};
