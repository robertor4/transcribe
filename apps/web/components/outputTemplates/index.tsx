'use client';

import React from 'react';
import type {
  StructuredOutput,
  ActionItemsOutput,
  FollowUpEmailOutput,
  SalesEmailOutput,
  InternalUpdateOutput,
  ClientProposalOutput,
  BlogPostOutput,
  LinkedInOutput,
  CommunicationAnalysisOutput,
  AgileBacklogOutput,
  // Priority 1: Meeting & Documentation
  MeetingMinutesOutput,
  OneOnOneNotesOutput,
  InterviewAssessmentOutput,
  PRDOutput,
  RetrospectiveOutput,
  DecisionDocumentOutput,
  // Priority 2: Sales
  DealQualificationOutput,
  CRMNotesOutput,
  ObjectionHandlerOutput,
  CompetitiveIntelOutput,
  // Priority 3: Consulting
  WorkshopSynthesisOutput,
  ProjectStatusOutput,
  SOWOutput,
  RecommendationsMemoOutput,
  // Priority 4: Executive
  BoardUpdateOutput,
  InvestorUpdateOutput,
  AllHandsTalkingPointsOutput,
  // Priority 5: Engineering
  TechnicalDesignDocOutput,
  IncidentPostmortemOutput,
  BugReportOutput,
  ADROutput,
  // Priority 6: Content & Marketing
  NewsletterOutput,
  CaseStudyOutput,
  PodcastShowNotesOutput,
  VideoScriptOutput,
  PressReleaseOutput,
  TwitterThreadOutput,
  // Priority 7: HR & Coaching
  CoachingNotesOutput,
  PerformanceReviewOutput,
  ExitInterviewOutput,
  GoalSettingOutput,
} from '@transcribe/shared';

// Legacy templates
import { ActionItemsTemplate } from './ActionItemsTemplate';
import { EmailTemplate } from './EmailTemplate';
import { BlogPostTemplate } from './BlogPostTemplate';
import { LinkedInTemplate } from './LinkedInTemplate';
import { CommunicationAnalysisTemplate } from './CommunicationAnalysisTemplate';
import { AgileBacklogTemplate } from './AgileBacklogTemplate';

// Priority 1: Meeting & Documentation
import { MeetingMinutesTemplate } from './MeetingMinutesTemplate';
import { OneOnOneTemplate } from './OneOnOneTemplate';
import { InterviewAssessmentTemplate } from './InterviewAssessmentTemplate';
import { PRDTemplate } from './PRDTemplate';
import { RetrospectiveTemplate } from './RetrospectiveTemplate';
import { DecisionDocumentTemplate } from './DecisionDocumentTemplate';

// Priority 2: Sales
import { DealQualificationTemplate } from './DealQualificationTemplate';
import { CRMNotesTemplate } from './CRMNotesTemplate';
import { ObjectionHandlerTemplate } from './ObjectionHandlerTemplate';
import { CompetitiveIntelTemplate } from './CompetitiveIntelTemplate';

// Priority 3: Consulting
import { WorkshopSynthesisTemplate } from './WorkshopSynthesisTemplate';
import { ProjectStatusTemplate } from './ProjectStatusTemplate';
import { SOWTemplate } from './SOWTemplate';
import { RecommendationsMemoTemplate } from './RecommendationsMemoTemplate';

// Priority 4: Executive
import { BoardUpdateTemplate } from './BoardUpdateTemplate';
import { InvestorUpdateTemplate } from './InvestorUpdateTemplate';
import { AllHandsTalkingPointsTemplate } from './AllHandsTalkingPointsTemplate';

// Priority 5: Engineering
import { TechnicalDesignDocTemplate } from './TechnicalDesignDocTemplate';
import { IncidentPostmortemTemplate } from './IncidentPostmortemTemplate';
import { BugReportTemplate } from './BugReportTemplate';
import { ADRTemplate } from './ADRTemplate';

// Priority 6: Content & Marketing
import { NewsletterTemplate } from './NewsletterTemplate';
import { CaseStudyTemplate } from './CaseStudyTemplate';
import { PodcastShowNotesTemplate } from './PodcastShowNotesTemplate';
import { VideoScriptTemplate } from './VideoScriptTemplate';
import { PressReleaseTemplate } from './PressReleaseTemplate';
import { TwitterThreadTemplate } from './TwitterThreadTemplate';

// Priority 7: HR & Coaching
import { CoachingNotesTemplate } from './CoachingNotesTemplate';
import { PerformanceReviewTemplate } from './PerformanceReviewTemplate';
import { ExitInterviewTemplate } from './ExitInterviewTemplate';
import { GoalSettingTemplate } from './GoalSettingTemplate';

import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Re-export individual templates - Legacy
export { ActionItemsTemplate } from './ActionItemsTemplate';
export { EmailTemplate } from './EmailTemplate';
export { BlogPostTemplate } from './BlogPostTemplate';
export { LinkedInTemplate } from './LinkedInTemplate';
export { CommunicationAnalysisTemplate } from './CommunicationAnalysisTemplate';
export { AgileBacklogTemplate } from './AgileBacklogTemplate';

// Re-export - Priority 1: Meeting & Documentation
export { MeetingMinutesTemplate } from './MeetingMinutesTemplate';
export { OneOnOneTemplate } from './OneOnOneTemplate';
export { InterviewAssessmentTemplate } from './InterviewAssessmentTemplate';
export { PRDTemplate } from './PRDTemplate';
export { RetrospectiveTemplate } from './RetrospectiveTemplate';
export { DecisionDocumentTemplate } from './DecisionDocumentTemplate';

// Re-export - Priority 2: Sales
export { DealQualificationTemplate } from './DealQualificationTemplate';
export { CRMNotesTemplate } from './CRMNotesTemplate';
export { ObjectionHandlerTemplate } from './ObjectionHandlerTemplate';
export { CompetitiveIntelTemplate } from './CompetitiveIntelTemplate';

// Re-export - Priority 3: Consulting
export { WorkshopSynthesisTemplate } from './WorkshopSynthesisTemplate';
export { ProjectStatusTemplate } from './ProjectStatusTemplate';
export { SOWTemplate } from './SOWTemplate';
export { RecommendationsMemoTemplate } from './RecommendationsMemoTemplate';

// Re-export - Priority 4: Executive
export { BoardUpdateTemplate } from './BoardUpdateTemplate';
export { InvestorUpdateTemplate } from './InvestorUpdateTemplate';
export { AllHandsTalkingPointsTemplate } from './AllHandsTalkingPointsTemplate';

// Re-export - Priority 5: Engineering
export { TechnicalDesignDocTemplate } from './TechnicalDesignDocTemplate';
export { IncidentPostmortemTemplate } from './IncidentPostmortemTemplate';
export { BugReportTemplate } from './BugReportTemplate';
export { ADRTemplate } from './ADRTemplate';

// Re-export - Priority 6: Content & Marketing
export { NewsletterTemplate } from './NewsletterTemplate';
export { CaseStudyTemplate } from './CaseStudyTemplate';
export { PodcastShowNotesTemplate } from './PodcastShowNotesTemplate';
export { VideoScriptTemplate } from './VideoScriptTemplate';
export { PressReleaseTemplate } from './PressReleaseTemplate';
export { TwitterThreadTemplate } from './TwitterThreadTemplate';

// Re-export - Priority 7: HR & Coaching
export { CoachingNotesTemplate } from './CoachingNotesTemplate';
export { PerformanceReviewTemplate } from './PerformanceReviewTemplate';
export { ExitInterviewTemplate } from './ExitInterviewTemplate';
export { GoalSettingTemplate } from './GoalSettingTemplate';

/**
 * Template component registry - add new templates here
 * This eliminates the need for a switch statement when adding new template types
 */
const TEMPLATE_COMPONENTS: Record<
  string,
  React.ComponentType<{ data: unknown; analysisId?: string }>
> = {
  // Legacy templates
  actionItems: ActionItemsTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  followUpEmail: EmailTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  salesEmail: EmailTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  internalUpdate: EmailTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  clientProposal: EmailTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  blogPost: BlogPostTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  linkedin: LinkedInTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  communicationAnalysis: CommunicationAnalysisTemplate as React.ComponentType<{
    data: unknown;
    analysisId?: string;
  }>,
  agileBacklog: AgileBacklogTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 1: Meeting & Documentation
  meetingMinutes: MeetingMinutesTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  oneOnOneNotes: OneOnOneTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  interviewAssessment: InterviewAssessmentTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  prd: PRDTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  retrospective: RetrospectiveTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  decisionDocument: DecisionDocumentTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 2: Sales
  dealQualification: DealQualificationTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  crmNotes: CRMNotesTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  objectionHandler: ObjectionHandlerTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  competitiveIntel: CompetitiveIntelTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 3: Consulting
  workshopSynthesis: WorkshopSynthesisTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  projectStatus: ProjectStatusTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  sow: SOWTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  recommendationsMemo: RecommendationsMemoTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 4: Executive
  boardUpdate: BoardUpdateTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  investorUpdate: InvestorUpdateTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  allHandsTalkingPoints: AllHandsTalkingPointsTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 5: Engineering
  technicalDesignDoc: TechnicalDesignDocTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  incidentPostmortem: IncidentPostmortemTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  bugReport: BugReportTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  adr: ADRTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 6: Content & Marketing
  newsletter: NewsletterTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  caseStudy: CaseStudyTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  podcastShowNotes: PodcastShowNotesTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  videoScript: VideoScriptTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  pressRelease: PressReleaseTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  twitterThread: TwitterThreadTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,

  // Priority 7: HR & Coaching
  coachingNotes: CoachingNotesTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  performanceReview: PerformanceReviewTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  exitInterview: ExitInterviewTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
  goalSetting: GoalSettingTemplate as React.ComponentType<{ data: unknown; analysisId?: string }>,
};

interface OutputRendererProps {
  content: string | StructuredOutput;
  contentType?: 'markdown' | 'structured';
  templateId?: string;
  /** Unique ID for this output - used for persisting state like checkmarks */
  analysisId?: string;
}

/**
 * Smart output renderer that automatically selects the appropriate template
 * based on content type and structure.
 */
export function OutputRenderer({ content, contentType, analysisId }: OutputRendererProps) {
  // Handle empty content - show error state
  if (!content || (typeof content === 'string' && content.trim().length === 0)) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Content unavailable
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          This output couldn&apos;t be generated properly. Please try regenerating it.
        </p>
      </div>
    );
  }

  // If contentType is explicitly markdown or content is a string, render as markdown
  if (contentType === 'markdown' || typeof content === 'string') {
    return (
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <ReactMarkdown>{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</ReactMarkdown>
      </div>
    );
  }

  // Handle structured content
  if (typeof content === 'object' && content !== null) {
    const structuredContent = content as StructuredOutput;
    const Component = TEMPLATE_COMPONENTS[structuredContent.type];

    if (Component) {
      return <Component data={structuredContent} analysisId={analysisId} />;
    }

    // Unknown structured type - render as JSON
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Structured Output</span>
        </div>
        <pre className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-auto text-sm">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  }

  // Fallback for unexpected content
  return (
    <div className="text-gray-500 dark:text-gray-500">
      Unable to render content
    </div>
  );
}

/**
 * Helper to get a preview string from structured content
 */
export function getStructuredOutputPreview(content: StructuredOutput): string {
  switch (content.type) {
    // Legacy templates
    case 'actionItems': {
      const data = content as ActionItemsOutput;
      const total =
        (data.immediateActions?.length || 0) +
        (data.shortTermActions?.length || 0) +
        (data.longTermActions?.length || 0);
      return `${total} action item${total !== 1 ? 's' : ''} extracted`;
    }

    case 'followUpEmail': {
      const data = content as FollowUpEmailOutput;
      return data.subject;
    }

    case 'salesEmail': {
      const data = content as SalesEmailOutput;
      return data.subject;
    }

    case 'internalUpdate': {
      const data = content as InternalUpdateOutput;
      return data.subject;
    }

    case 'clientProposal': {
      const data = content as ClientProposalOutput;
      return data.subject;
    }

    case 'blogPost': {
      const data = content as BlogPostOutput;
      return data.headline;
    }

    case 'linkedin': {
      const data = content as LinkedInOutput;
      return data.hook.slice(0, 100) + (data.hook.length > 100 ? '...' : '');
    }

    case 'communicationAnalysis': {
      const data = content as CommunicationAnalysisOutput;
      return `Overall score: ${data.overallScore}/100`;
    }

    case 'agileBacklog': {
      const data = content as AgileBacklogOutput;
      const epicCount = data.epics?.length || 0;
      const storyCount =
        (data.epics?.reduce((acc, epic) => acc + (epic.stories?.length || 0), 0) || 0) +
        (data.standaloneStories?.length || 0);
      return `${epicCount} epic${epicCount !== 1 ? 's' : ''}, ${storyCount} user stor${storyCount !== 1 ? 'ies' : 'y'}`;
    }

    // Priority 1: Meeting & Documentation
    case 'meetingMinutes': {
      const data = content as MeetingMinutesOutput;
      const decisionCount = data.decisions?.length || 0;
      const actionCount = data.actionItems?.length || 0;
      return `${decisionCount} decision${decisionCount !== 1 ? 's' : ''}, ${actionCount} action item${actionCount !== 1 ? 's' : ''}`;
    }

    case 'oneOnOneNotes': {
      const data = content as OneOnOneNotesOutput;
      return data.topics?.[0]?.topic || 'One-on-one notes';
    }

    case 'interviewAssessment': {
      const data = content as InterviewAssessmentOutput;
      return `${data.candidate} - ${data.recommendation}`;
    }

    case 'prd': {
      const data = content as PRDOutput;
      return data.title || 'Product Requirements';
    }

    case 'retrospective': {
      const data = content as RetrospectiveOutput;
      const wellCount = data.wentWell?.length || 0;
      const improveCount = data.toImprove?.length || 0;
      return `${wellCount} positives, ${improveCount} improvements`;
    }

    case 'decisionDocument': {
      const data = content as DecisionDocumentOutput;
      return data.decision?.slice(0, 100) || 'Decision document';
    }

    // Priority 2: Sales
    case 'dealQualification': {
      const data = content as DealQualificationOutput;
      return `${data.prospect} - ${data.qualification}`;
    }

    case 'crmNotes': {
      const data = content as CRMNotesOutput;
      return data.summary?.slice(0, 100) || 'CRM notes';
    }

    case 'objectionHandler': {
      const data = content as ObjectionHandlerOutput;
      const objectionCount = data.objections?.length || 0;
      return `${objectionCount} objection${objectionCount !== 1 ? 's' : ''} addressed`;
    }

    case 'competitiveIntel': {
      const data = content as CompetitiveIntelOutput;
      return `${data.competitors?.[0]?.competitor || 'Competitive'} analysis`;
    }

    // Priority 3: Consulting
    case 'workshopSynthesis': {
      const data = content as WorkshopSynthesisOutput;
      return data.title || 'Workshop synthesis';
    }

    case 'projectStatus': {
      const data = content as ProjectStatusOutput;
      return `${data.projectName} - ${data.overallStatus}`;
    }

    case 'sow': {
      const data = content as SOWOutput;
      return data.projectTitle || 'Statement of Work';
    }

    case 'recommendationsMemo': {
      const data = content as RecommendationsMemoOutput;
      return data.title || 'Recommendations memo';
    }

    // Priority 4: Executive
    case 'boardUpdate': {
      const data = content as BoardUpdateOutput;
      return `${data.company || 'Board'} Update - ${data.period || 'Current'}`;
    }

    case 'investorUpdate': {
      const data = content as InvestorUpdateOutput;
      return `${data.company || 'Investor'} Update - ${data.period || 'Current'}`;
    }

    case 'allHandsTalkingPoints': {
      const data = content as AllHandsTalkingPointsOutput;
      const topicCount = data.announcements?.length || 0;
      return `${topicCount} topic${topicCount !== 1 ? 's' : ''} for all-hands`;
    }

    // Priority 5: Engineering
    case 'technicalDesignDoc': {
      const data = content as TechnicalDesignDocOutput;
      return data.title || 'Technical design document';
    }

    case 'incidentPostmortem': {
      const data = content as IncidentPostmortemOutput;
      return `${data.title} - ${data.severity}`;
    }

    case 'bugReport': {
      const data = content as BugReportOutput;
      return `${data.title} - ${data.severity}`;
    }

    case 'adr': {
      const data = content as ADROutput;
      return `ADR: ${data.title}`;
    }

    // Priority 6: Content & Marketing
    case 'newsletter': {
      const data = content as NewsletterOutput;
      return data.subject || 'Newsletter';
    }

    case 'caseStudy': {
      const data = content as CaseStudyOutput;
      return `${data.customer} - ${data.title}`;
    }

    case 'podcastShowNotes': {
      const data = content as PodcastShowNotesOutput;
      return data.episodeTitle || 'Podcast show notes';
    }

    case 'videoScript': {
      const data = content as VideoScriptOutput;
      return data.title || 'Video script';
    }

    case 'pressRelease': {
      const data = content as PressReleaseOutput;
      return data.headline || 'Press release';
    }

    case 'twitterThread': {
      const data = content as TwitterThreadOutput;
      return `${data.totalTweets} tweet${data.totalTweets !== 1 ? 's' : ''} thread`;
    }

    // Priority 7: HR & Coaching
    case 'coachingNotes': {
      const data = content as CoachingNotesOutput;
      return `Session ${data.sessionNumber || ''} - ${data.focus?.slice(0, 50) || 'Coaching notes'}`;
    }

    case 'performanceReview': {
      const data = content as PerformanceReviewOutput;
      return `${data.employeeName} - Rating: ${data.overallRating}/5`;
    }

    case 'exitInterview': {
      const data = content as ExitInterviewOutput;
      return `${data.employee || 'Exit interview'} - ${data.department || ''}`;
    }

    case 'goalSetting': {
      const data = content as GoalSettingOutput;
      const goalCount = data.goals?.length || 0;
      return `${goalCount} SMART goal${goalCount !== 1 ? 's' : ''}`;
    }

    default:
      return 'Structured output';
  }
}
