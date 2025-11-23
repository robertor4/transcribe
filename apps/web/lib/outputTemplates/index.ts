/**
 * Central registry for all output templates
 *
 * This file exports all available output templates and provides
 * convenience functions for template lookup and management.
 */

// Export types
export * from './types';

// Export individual templates
export { transcribeOnlyTemplate } from './transcribeOnly';
export { emailTemplate } from './email';
export { blogPostTemplate } from './blogPost';
export { linkedinPostTemplate } from './linkedinPost';
export { actionItemsTemplate } from './actionItems';
export { communicationAnalysisTemplate } from './communicationAnalysis';
export { userStoriesTemplate } from './userStories'; // Keep for future, not in core 5

// Import templates for registry
import { transcribeOnlyTemplate } from './transcribeOnly';
import { emailTemplate } from './email';
import { blogPostTemplate } from './blogPost';
import { linkedinPostTemplate } from './linkedinPost';
import { actionItemsTemplate } from './actionItems';
import { communicationAnalysisTemplate } from './communicationAnalysis';
import { OutputTemplate } from './types';

/**
 * Array of all output templates (6 types: 1 quick action + 5 output templates)
 * Use this for iteration in UI components
 */
export const allTemplates: readonly OutputTemplate[] = [
  transcribeOnlyTemplate, // Quick action first
  emailTemplate,
  blogPostTemplate,
  linkedinPostTemplate,
  actionItemsTemplate,
  communicationAnalysisTemplate,
] as const;

/**
 * Get a template by its ID
 * @param id - Template identifier
 * @returns The matching template, or undefined if not found
 */
export function getTemplateById(id: string): OutputTemplate | undefined {
  return allTemplates.find((template) => template.id === id);
}

/**
 * Type helper to extract all template IDs as a union type
 */
export type TemplateId = typeof allTemplates[number]['id'];
