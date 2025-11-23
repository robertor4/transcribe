import { LucideIcon } from 'lucide-react';

/**
 * AI prompt configuration for generating outputs
 */
export interface PromptConfig {
  /** System prompt that defines the AI's role and behavior */
  system: string;

  /** User message template with placeholders for conversation content */
  userTemplate: string;

  /** Model temperature (0-1). Lower = more focused, higher = more creative */
  temperature?: number;

  /** Maximum tokens to generate in response */
  maxTokens?: number;
}

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

  /** AI prompt configuration for generating this output type */
  prompt: PromptConfig | null;

  /** Category for grouping templates in UI */
  category?: 'quick' | 'output';

  /** Indicates if this is a quick action (simplified template) */
  isQuickAction?: boolean;
}

/**
 * Type helper to extract template IDs as a union type
 */
export type OutputTemplateId = OutputTemplate['id'];
