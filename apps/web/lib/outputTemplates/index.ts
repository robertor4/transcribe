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
// Content templates
export { blogPostTemplate } from './blogPost';
export { linkedinPostTemplate } from './linkedinPost';
export { newsletterTemplate } from './newsletter';
export { caseStudyTemplate } from './caseStudy';
export { podcastShowNotesTemplate } from './podcastShowNotes';
export { videoScriptTemplate } from './videoScript';
export { pressReleaseTemplate } from './pressRelease';
export { twitterThreadTemplate } from './twitterThread';
// Analysis templates
export { actionItemsTemplate } from './actionItems';
export { communicationAnalysisTemplate } from './communicationAnalysis';
export { agileBacklogTemplate } from './agileBacklog';
// Professional templates
export { meetingMinutesTemplate } from './meetingMinutes';
export { oneOnOneNotesTemplate } from './oneOnOneNotes';
export { retrospectiveTemplate } from './retrospective';
export { decisionDocumentTemplate } from './decisionDocument';
export { workshopSynthesisTemplate } from './workshopSynthesis';
export { projectStatusTemplate } from './projectStatus';
export { sowTemplate } from './sow';
export { recommendationsMemoTemplate } from './recommendationsMemo';
export { coachingNotesTemplate } from './coachingNotes';
export { performanceReviewTemplate } from './performanceReview';
export { exitInterviewTemplate } from './exitInterview';
export { goalSettingTemplate } from './goalSetting';
// HR templates
export { interviewAssessmentTemplate } from './interviewAssessment';
// Product templates
export { prdTemplate } from './prd';
export { technicalDesignDocTemplate } from './technicalDesignDoc';
export { adrTemplate } from './adr';
export { bugReportTemplate } from './bugReport';
export { incidentPostmortemTemplate } from './incidentPostmortem';
// Sales templates
export { dealQualificationTemplate } from './dealQualification';
export { crmNotesTemplate } from './crmNotes';
export { objectionHandlerTemplate } from './objectionHandler';
export { competitiveIntelTemplate } from './competitiveIntel';
// Leadership templates
export { boardUpdateTemplate } from './boardUpdate';
export { investorUpdateTemplate } from './investorUpdate';
export { allHandsTalkingPointsTemplate } from './allHandsTalkingPoints';

// Import templates for registry
import { transcribeOnlyTemplate } from './transcribeOnly';
import { followUpEmailTemplate } from './followUpEmail';
import { salesEmailTemplate } from './salesEmail';
import { internalUpdateTemplate } from './internalUpdate';
import { clientProposalTemplate } from './clientProposal';
import { blogPostTemplate } from './blogPost';
import { linkedinPostTemplate } from './linkedinPost';
import { newsletterTemplate } from './newsletter';
import { caseStudyTemplate } from './caseStudy';
import { podcastShowNotesTemplate } from './podcastShowNotes';
import { videoScriptTemplate } from './videoScript';
import { pressReleaseTemplate } from './pressRelease';
import { twitterThreadTemplate } from './twitterThread';
import { actionItemsTemplate } from './actionItems';
import { communicationAnalysisTemplate } from './communicationAnalysis';
import { agileBacklogTemplate } from './agileBacklog';
import { meetingMinutesTemplate } from './meetingMinutes';
import { oneOnOneNotesTemplate } from './oneOnOneNotes';
import { retrospectiveTemplate } from './retrospective';
import { decisionDocumentTemplate } from './decisionDocument';
import { workshopSynthesisTemplate } from './workshopSynthesis';
import { projectStatusTemplate } from './projectStatus';
import { sowTemplate } from './sow';
import { recommendationsMemoTemplate } from './recommendationsMemo';
import { coachingNotesTemplate } from './coachingNotes';
import { performanceReviewTemplate } from './performanceReview';
import { exitInterviewTemplate } from './exitInterview';
import { goalSettingTemplate } from './goalSetting';
import { interviewAssessmentTemplate } from './interviewAssessment';
import { prdTemplate } from './prd';
import { technicalDesignDocTemplate } from './technicalDesignDoc';
import { adrTemplate } from './adr';
import { bugReportTemplate } from './bugReport';
import { incidentPostmortemTemplate } from './incidentPostmortem';
import { dealQualificationTemplate } from './dealQualification';
import { crmNotesTemplate } from './crmNotes';
import { objectionHandlerTemplate } from './objectionHandler';
import { competitiveIntelTemplate } from './competitiveIntel';
import { boardUpdateTemplate } from './boardUpdate';
import { investorUpdateTemplate } from './investorUpdate';
import { allHandsTalkingPointsTemplate } from './allHandsTalkingPoints';
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
  // Content templates
  blogPostTemplate,
  linkedinPostTemplate,
  newsletterTemplate,
  caseStudyTemplate,
  podcastShowNotesTemplate,
  videoScriptTemplate,
  pressReleaseTemplate,
  twitterThreadTemplate,
  // Analysis templates
  actionItemsTemplate,
  communicationAnalysisTemplate,
  agileBacklogTemplate,
  // Professional templates
  meetingMinutesTemplate,
  oneOnOneNotesTemplate,
  retrospectiveTemplate,
  decisionDocumentTemplate,
  workshopSynthesisTemplate,
  projectStatusTemplate,
  sowTemplate,
  recommendationsMemoTemplate,
  coachingNotesTemplate,
  performanceReviewTemplate,
  exitInterviewTemplate,
  goalSettingTemplate,
  // HR templates
  interviewAssessmentTemplate,
  // Product templates
  prdTemplate,
  technicalDesignDocTemplate,
  adrTemplate,
  bugReportTemplate,
  incidentPostmortemTemplate,
  // Sales templates
  dealQualificationTemplate,
  crmNotesTemplate,
  objectionHandlerTemplate,
  competitiveIntelTemplate,
  // Leadership templates
  boardUpdateTemplate,
  investorUpdateTemplate,
  allHandsTalkingPointsTemplate,
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
