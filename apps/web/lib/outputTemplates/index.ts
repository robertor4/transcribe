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
// Specialized email templates (replaced generic email)
export { followUpEmailTemplate } from './followUpEmail';
export { salesEmailTemplate } from './salesEmail';
export { internalUpdateTemplate } from './internalUpdate';
export { clientProposalTemplate } from './clientProposal';
// Other templates
export { blogPostTemplate } from './blogPost';
export { linkedinPostTemplate } from './linkedinPost';
export { actionItemsTemplate } from './actionItems';
export { communicationAnalysisTemplate } from './communicationAnalysis';
export { userStoriesTemplate } from './userStories'; // Keep for future, not in core 5

// Import templates for registry
import { transcribeOnlyTemplate } from './transcribeOnly';
import { followUpEmailTemplate } from './followUpEmail';
import { salesEmailTemplate } from './salesEmail';
import { internalUpdateTemplate } from './internalUpdate';
import { clientProposalTemplate } from './clientProposal';
import { blogPostTemplate } from './blogPost';
import { linkedinPostTemplate } from './linkedinPost';
import { actionItemsTemplate } from './actionItems';
import { communicationAnalysisTemplate } from './communicationAnalysis';
import { OutputTemplate } from './types';

/**
 * Array of all output templates
 * Use this for iteration in UI components
 */
export const allTemplates: readonly OutputTemplate[] = [
  transcribeOnlyTemplate, // Quick action first
  // Specialized email templates
  followUpEmailTemplate,
  salesEmailTemplate,
  internalUpdateTemplate,
  clientProposalTemplate,
  // Other templates
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
export type TemplateId = (typeof allTemplates)[number]['id'];
