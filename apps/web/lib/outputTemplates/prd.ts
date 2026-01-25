import { ClipboardList } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * PRD template - Product Requirements Document
 * Use case: Create structured product requirements from conversations
 */
export const prdTemplate: OutputTemplate = {
  id: 'prd',
  name: 'Product Requirements Document',
  description: 'Structured PRD with problem, goals, and requirements',
  icon: ClipboardList,
  example: 'Document product requirements',
  prompt: null,
  category: 'output',
  status: 'beta',
};
