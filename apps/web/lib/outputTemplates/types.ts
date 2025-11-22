import { LucideIcon } from 'lucide-react';

/**
 * Base interface for all output templates
 * Each template defines how a conversation should be transformed into a specific output format
 */
export interface OutputTemplate {
  /** Unique identifier for the template */
  id: string;

  /** Display name shown in UI */
  name: string;

  /** Brief description of what this output type does */
  description: string;

  /** Lucide icon component for visual representation */
  icon: LucideIcon;

  /** Example use case or prompt shown to users */
  example: string;
}

/**
 * Type helper to extract template IDs as a union type
 */
export type OutputTemplateId = OutputTemplate['id'];
