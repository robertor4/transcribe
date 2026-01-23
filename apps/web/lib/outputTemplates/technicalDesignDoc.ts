import { Code2 } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Technical Design Document template - Architecture documentation
 * Use case: Document architecture and design decisions with alternatives
 */
export const technicalDesignDocTemplate: OutputTemplate = {
  id: 'technicalDesignDoc',
  name: 'Technical Design Document',
  description: 'Architecture and design decisions with alternatives',
  icon: Code2,
  example: 'Document technical designs',
  prompt: null,
  category: 'output',
};
