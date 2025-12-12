/**
 * Output Types - V2 UI
 *
 * Type definitions for generated outputs from conversations.
 */

// Generated Output types
export type OutputType =
  | 'email'
  | 'actionItems'
  | 'blogPost'
  | 'linkedin'
  | 'communicationAnalysis'
  | 'userStories';

export interface GeneratedOutput {
  id: string;
  conversationId: string;
  type: OutputType;
  title: string;
  preview: string; // First 150 chars for gallery cards
  content:
    | EmailOutputContent
    | BlogPostOutputContent
    | ActionItemsOutputContent
    | LinkedInOutputContent
    | CommunicationAnalysisOutputContent
    | UserStoriesOutputContent;
  context?: string; // User-provided instructions
  generatedAt: Date;
  createdBy?: string;
  metadata?: {
    wordCount?: number;
    estimatedReadTime?: number;
    promptVersion?: string;
  };
}

// Type-specific content interfaces
export interface EmailOutputContent {
  subject: string;
  greeting: string;
  body: string[];
  keyPoints: string[];
  actionItems: string[];
  closing: string;
}

export interface BlogPostOutputContent {
  headline: string;
  subheading?: string;
  hook: string;
  sections: BlogPostSection[];
  callToAction: string;
  metadata: {
    wordCount: number;
    targetAudience: string;
    tone: string;
  };
  images?: {
    hero?: ImageSpec;
    sections?: ImageSpec[];
  };
}

export interface BlogPostSection {
  heading: string;
  paragraphs: string[];
  bulletPoints?: string[];
  quotes?: { text: string; attribution: string }[];
}

export interface ImageSpec {
  url?: string;
  prompt: string;
  altText: string;
  position?: string;
}

export interface ActionItemsOutputContent {
  items: ActionItem[];
}

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
}

export interface LinkedInOutputContent {
  content: string;
  hashtags: string[];
  characterCount: number;
}

export interface UserStoriesOutputContent {
  stories: UserStory[];
}

export interface UserStory {
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface CommunicationAnalysisOutputContent {
  overallScore: number; // 0-100
  dimensions: CommunicationDimension[];
  overallAssessment: string;
  keyTakeaway: string;
}

export interface CommunicationDimension {
  name: string;
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
}
