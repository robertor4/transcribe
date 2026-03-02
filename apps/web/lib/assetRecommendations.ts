import type { ConversationCategory } from '@transcribe/shared';
import type { GeneratedAnalysis } from '@transcribe/shared';

/**
 * Maps each conversation category to a ranked list of recommended template IDs.
 * First entries are the most relevant for that category.
 */
const CATEGORY_RECOMMENDATIONS: Record<ConversationCategory, string[]> = {
  'sales-call': ['followUpEmail', 'dealQualification', 'crmNotes', 'objectionHandler', 'salesEmail', 'competitiveIntel'],
  'business-meeting': ['meetingMinutes', 'actionItems', 'decisionDocument', 'internalUpdate', 'projectStatus'],
  'one-on-one': ['oneOnOneNotes', 'coachingNotes', 'goalSetting', 'actionItems', 'performanceReview'],
  'interview': ['interviewAssessment', 'oneOnOneNotes', 'coachingNotes', 'blogPost'],
  'brainstorm': ['actionItems', 'prd', 'technicalDesignDoc', 'decisionDocument', 'workshopSynthesis'],
  'solo-recording': ['blogPost', 'linkedin', 'newsletter', 'actionItems', 'prd'],
  'presentation': ['meetingMinutes', 'blogPost', 'podcastShowNotes', 'internalUpdate', 'linkedin'],
  'workshop': ['workshopSynthesis', 'actionItems', 'retrospective', 'decisionDocument', 'meetingMinutes'],
  'support-call': ['followUpEmail', 'actionItems', 'bugReport', 'crmNotes', 'incidentPostmortem'],
  'general': ['actionItems', 'meetingMinutes', 'followUpEmail', 'blogPost', 'linkedin'],
};

/**
 * Default recommendations when no category is available.
 */
const DEFAULT_RECOMMENDATIONS = ['actionItems', 'meetingMinutes', 'followUpEmail', 'blogPost'];

export interface AssetRecommendation {
  templateId: string;
}

/**
 * Get recommended AI asset template IDs for a conversation.
 * Filters out templates that have already been generated, returns top 3.
 *
 * @param category - The AI-detected conversation category (may be undefined for legacy)
 * @param existingAssets - Assets already generated for this conversation
 * @param maxCount - Maximum recommendations to return (default 3)
 */
export function getAssetRecommendations(
  category: ConversationCategory | undefined,
  existingAssets: GeneratedAnalysis[],
  maxCount = 3,
): AssetRecommendation[] {
  const recommendations = category
    ? CATEGORY_RECOMMENDATIONS[category] || DEFAULT_RECOMMENDATIONS
    : DEFAULT_RECOMMENDATIONS;

  // Get IDs of already-generated templates
  const existingTemplateIds = new Set(existingAssets.map(a => a.templateId));

  // Filter out already generated and return top N
  return recommendations
    .filter(templateId => !existingTemplateIds.has(templateId))
    .slice(0, maxCount)
    .map(templateId => ({ templateId }));
}
