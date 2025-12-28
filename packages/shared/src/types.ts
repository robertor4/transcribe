import { BASE_PRICING } from './pricing';
import { SummaryV2 } from './types/summary';

export enum TranscriptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum AnalysisType {
  SUMMARY = 'summary',
  COMMUNICATION_STYLES = 'communication_styles',
  ACTION_ITEMS = 'action_items',
  EMOTIONAL_INTELLIGENCE = 'emotional_intelligence',
  INFLUENCE_PERSUASION = 'influence_persuasion',
  PERSONAL_DEVELOPMENT = 'personal_development',
  CUSTOM = 'custom'
}

export interface User {
  uid: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  preferredLanguage?: string; // User's preferred language for the UI
  createdAt: Date;
  updatedAt: Date;

  // NEW: Soft delete fields
  isDeleted?: boolean; // True if account is soft-deleted
  deletedAt?: Date; // When the account was soft-deleted

  // NEW: Last login tracking
  lastLogin?: Date; // When user last authenticated

  // NEW: Subscription fields
  subscriptionTier: 'free' | 'professional' | 'payg';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;

  // NEW: Usage tracking
  usageThisMonth: {
    hours: number;
    transcriptions: number;
    onDemandAnalyses: number;
    lastResetAt: Date;
  };

  // NEW: Pay-As-You-Go credits
  paygCredits?: number; // Remaining hours for PAYG users

  // DEPRECATED: Old subscription format (kept for backward compatibility)
  subscription?: {
    type: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };

  emailNotifications?: {
    enabled: boolean;
    onTranscriptionComplete?: boolean;
    digest?: 'immediate' | 'daily' | 'weekly';
  };
}

export interface TranscriptionContext {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// V2 Folder support
export interface Folder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  sortOrder?: number;
  conversationCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderRequest {
  name: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  color?: string;
  sortOrder?: number;
}

export interface AnalysisResults {
  summary?: string;
  communicationStyles?: string;
  actionItems?: string;
  emotionalIntelligence?: string;
  influencePersuasion?: string;
  personalDevelopment?: string;
  custom?: string;
  transcript?: string;
  details?: string; // Metadata and recording information
}

/**
 * @deprecated Use summaryV2 directly on Transcription and generatedAnalyses collection for other analyses.
 * This interface is kept for backwards compatibility with existing transcriptions.
 * Will be removed after migration is complete.
 */
export interface CoreAnalyses {
  summary: string; // Markdown summary (V1 format for backwards compatibility)
  summaryV2?: SummaryV2; // V2 structured JSON summary (new)
  actionItems: string;
  communicationStyles: string;
  // Note: transcript removed - use transcriptText directly (no duplication)
}

// New: Analysis template definition
export interface AnalysisTemplate {
  id: string; // e.g., "system-emotional-iq"
  name: string; // "Emotional Intelligence"
  description: string; // Short description for catalog
  category: string; // Dynamic category (e.g., 'professional', 'content', 'specialized')
  icon: string; // Lucide icon name
  color: string; // Badge color
  systemPrompt: string; // GPT system prompt
  userPrompt: string; // GPT user prompt template
  modelPreference: 'gpt-5' | 'gpt-5-mini';
  estimatedSeconds: number; // ~20 for mini, ~30 for gpt-5
  featured: boolean; // Show in featured section
  order: number; // Display order
  outputFormat?: 'markdown' | 'structured'; // V2: Output format (default: markdown for backwards compat)
  jsonSchema?: string; // V2: JSON schema for structured outputs
  createdAt: Date;
  updatedAt: Date;

  // Taxonomy (optional) - for filtering and discovery
  tags?: string[]; // e.g., ["linkedin", "social-media", "professional"]
  targetRoles?: string[]; // e.g., ["founder", "content-creator", "product-manager"]
  templateGroup?: string; // Groups variants together, e.g., "linkedin" for all LinkedIn templates

  // Ownership & visibility
  createdBy: string; // "system" for built-in templates, userId for user-created
  isSystemTemplate: boolean; // true = hardcoded system template, false = user-created
  visibility: 'public' | 'private'; // public = anyone can see, private = creator only
  requiredTier?: 'free' | 'professional' | 'business'; // Subscription tier required to use

  // Versioning - for template evolution and compatibility tracking
  version: string; // Semantic version (e.g., "1.0.0", "1.1.0", "2.0.0")
  baseTemplateId?: string; // If forked from another template
}

// ============================================================
// V2 STRUCTURED OUTPUT TYPES
// ============================================================

/** Action item extracted from conversation */
export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
  priorityReason?: string; // Explains why this priority was assigned (shown in tooltip)
  context?: string;
}

/** Structured action items output */
export interface ActionItemsOutput {
  type: 'actionItems';
  immediateActions: ActionItem[]; // This week
  shortTermActions: ActionItem[]; // This month
  longTermActions: ActionItem[]; // Beyond this month
}

// ============================================================
// SPECIALIZED EMAIL OUTPUT TYPES
// ============================================================

/** Action item with owner for email templates */
export interface EmailActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
}

/** Follow-up Email - Post-meeting recap with decisions and action items */
export interface FollowUpEmailOutput {
  type: 'followUpEmail';
  subject: string;
  greeting: string;
  meetingRecap: string;
  body: string[];
  decisionsConfirmed: string[];
  actionItems: EmailActionItem[];
  nextSteps: string;
  closing: string;
}

/** Sales Outreach Email - Post-discovery call with value proposition */
export interface SalesEmailOutput {
  type: 'salesEmail';
  subject: string;
  greeting: string;
  body: string[];
  painPointsAddressed: string[];
  valueProposition: string;
  callToAction: string;
  urgencyHook?: string;
  closing: string;
}

/** Internal Update Email - Stakeholder brief with TLDR and decisions */
export interface InternalUpdateOutput {
  type: 'internalUpdate';
  subject: string;
  greeting: string;
  tldr: string;
  body: string[];
  keyDecisions: string[];
  blockers?: string[];
  nextMilestone: string;
  closing: string;
}

/** Client Proposal Email - Formal proposal with requirements and solution */
export interface ClientProposalOutput {
  type: 'clientProposal';
  subject: string;
  greeting: string;
  executiveSummary: string;
  body: string[];
  requirementsSummary: string[];
  proposedSolution: string;
  timelineEstimate?: string;
  nextStepsToEngage: string[];
  closing: string;
}

/** Blog post section */
export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bulletPoints?: string[];
  quotes?: { text: string; attribution: string }[];
}

/** Hero image for blog posts (AI-generated) */
export interface BlogHeroImage {
  url: string;
  alt: string;
  prompt?: string; // Store prompt for regeneration
}

/** Structured blog post output */
export interface BlogPostOutput {
  type: 'blogPost';
  headline: string;
  subheading?: string;
  hook: string;
  sections: BlogSection[];
  callToAction: string;
  heroImage?: BlogHeroImage;
  metadata: {
    wordCount: number;
    targetAudience?: string;
    tone: string;
  };
}

/** Structured LinkedIn post output */
export interface LinkedInOutput {
  type: 'linkedin';
  hook: string;
  content: string;
  hashtags: string[];
  callToAction: string;
  characterCount: number;
}

/** Communication dimension score */
export interface CommunicationDimension {
  name: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

/** Structured communication analysis output */
export interface CommunicationAnalysisOutput {
  type: 'communicationAnalysis';
  overallScore: number;
  dimensions: CommunicationDimension[];
  overallAssessment: string;
  keyTakeaway: string;
}

/** Union type for all structured outputs */
export type StructuredOutput =
  | ActionItemsOutput
  | FollowUpEmailOutput
  | SalesEmailOutput
  | InternalUpdateOutput
  | ClientProposalOutput
  | BlogPostOutput
  | LinkedInOutput
  | CommunicationAnalysisOutput;

/** Type guard to check if content is structured */
export function isStructuredOutput(content: unknown): content is StructuredOutput {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    typeof (content as StructuredOutput).type === 'string'
  );
}

// ============================================================
// GENERATED ANALYSIS
// ============================================================

// New: Generated analysis record
export interface GeneratedAnalysis {
  id: string;
  transcriptionId: string;
  userId: string;
  templateId: string; // Links to AnalysisTemplate
  templateName: string; // Snapshot for history (e.g., "Emotional Intelligence")
  templateVersion: string; // Snapshot of template version at generation time (e.g., "1.0.0")
  content: string | StructuredOutput; // Markdown (V1) or structured JSON (V2)
  contentType: 'markdown' | 'structured'; // Indicates how to render content
  model: 'gpt-5' | 'gpt-5-mini';
  customInstructions?: string; // User-provided instructions at generation time
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  generatedAt: Date;
  generationTimeMs?: number;
  translations?: {
    [languageCode: string]: string | StructuredOutput; // Translated content for each language
  };
}

export interface TranslationData {
  language: string; // Target language code (e.g., 'es', 'fr', 'de')
  languageName: string; // Human-readable language name (e.g., 'Spanish', 'French')
  analyses?: AnalysisResults; // Translated analyses (transcript is NOT translated - always shown in original language)
  translatedAt: Date;
  translatedBy: 'gpt-5' | 'gpt-5-mini'; // Model used for translation
  // Note: transcriptText is intentionally excluded - transcripts are always shown in original language
}

export interface Transcription {
  id: string;
  userId: string;
  folderId?: string | null; // V2: Optional folder assignment
  fileName: string;
  title?: string; // Custom user-defined title, defaults to fileName
  fileUrl?: string; // Optional - cleared after file deletion for privacy
  storagePath?: string; // The actual storage path for reliable deletion
  fileSize: number;
  mimeType: string;
  duration?: number;
  status: TranscriptionStatus;
  analysisType?: AnalysisType; // DEPRECATED - kept for backward compatibility
  context?: string;
  contextId?: string;
  transcriptText?: string;
  summary?: string; // DEPRECATED - moved to analyses.summary
  summaryVersion?: number;
  comments?: SummaryComment[];
  detectedLanguage?: string; // Language detected from the audio (e.g., 'english', 'dutch', 'german')
  summaryLanguage?: string; // Language used for the summary
  analyses?: AnalysisResults; // All analysis results - DEPRECATED, use coreAnalyses
  // V2 ARCHITECTURE: summaryV2 stored directly on doc, other analyses in generatedAnalyses collection
  summaryV2?: SummaryV2; // V2: Structured summary stored directly for fast access
  /**
   * @deprecated Use summaryV2 directly on Transcription and generatedAnalyses collection.
   * Kept for backwards compatibility with existing transcriptions.
   */
  coreAnalyses?: CoreAnalyses;
  // References to analyses in generatedAnalyses collection (actionItems, communicationAnalysis, etc.)
  generatedAnalysisIds?: string[]; // Array of GeneratedAnalysis IDs
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  lastAccessedAt?: Date; // When the user last opened this conversation
  cost?: number;
  metadata?: Record<string, any>;
  // Speaker diarization fields
  speakerCount?: number;
  speakers?: Speaker[];
  speakerSegments?: SpeakerSegment[];
  // Note: transcriptWithSpeakers removed - derive from speakerSegments using formatTranscriptWithSpeakers()
  diarizationConfidence?: number;
  // Sharing fields
  shareToken?: string;
  shareSettings?: ShareSettings;
  sharedAt?: Date;
  sharedWith?: SharedEmailRecord[]; // Email addresses this transcript was shared with (cleared when shareToken is revoked)
  // Translation fields (V1 - deprecated, use translations collection)
  translations?: Record<string, TranslationData>; // DEPRECATED: Key is language code (e.g., 'es', 'fr')
  preferredTranslationLanguage?: string; // DEPRECATED: Use preferredLocale instead
  // Translation V2: Uses separate 'translations' collection
  preferredLocale?: string; // User's preferred locale: 'original' | 'es-ES' | 'nl-NL' | etc.
  // Soft delete fields
  deletedAt?: Date; // When the transcription was soft-deleted (null = not deleted)
  // V2: Template selection - controls which analyses are generated
  selectedTemplates?: string[]; // Array of template IDs from frontend (e.g., ['transcribe-only', 'actionItems'])
  // Vector indexing metadata (for Q&A feature)
  vectorIndexedAt?: Date;      // When last indexed in Qdrant
  vectorChunkCount?: number;   // Number of chunks stored in Qdrant
  vectorIndexVersion?: number; // Schema version for future migrations
}

export interface TranscriptionJob {
  id: string;
  transcriptionId: string;
  userId: string;
  fileUrl: string;
  analysisType?: AnalysisType;
  context?: string;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  processedAt?: Date;
  // V2: Template selection - controls which analyses are generated
  selectedTemplates?: string[]; // Array of template IDs from frontend
}

export interface FileUploadRequest {
  file: File;
  analysisType?: AnalysisType;
  context?: string;
  contextId?: string;
  priority?: number;
}

export interface BatchUploadRequest {
  files: File[];
  mergeFiles: boolean;
  analysisType?: AnalysisType;
  context?: string;
  contextId?: string;
  priority?: number;
}

export interface BatchUploadResponse {
  transcriptionIds: string[];
  fileNames: string[];
  merged: boolean;
}

export interface TranscriptionProgress {
  transcriptionId: string;
  status: TranscriptionStatus;
  progress: number;
  message?: string;
  error?: string;
  startTime?: number; // Timestamp when processing started (for timeout tracking)
  stage?: 'uploading' | 'processing' | 'summarizing'; // Current processing stage
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TranscriptionFilter {
  userId?: string;
  status?: TranscriptionStatus;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  sortBy?: 'createdAt' | 'completedAt' | 'fileName' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SummaryComment {
  id: string;
  transcriptionId: string;
  userId: string;
  position: CommentPosition;
  content: string;
  resolved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentPosition {
  section: string; // e.g., 'executive-summary', 'key-topics', 'decisions'
  paragraphIndex?: number;
  characterOffset?: number;
  selectedText?: string; // Text that was highlighted when comment was added
}

export interface RegenerateSummaryRequest {
  transcriptionId: string;
  comments: SummaryComment[];
  instructions?: string; // Additional user instructions
}

export interface SummaryRegenerationProgress {
  transcriptionId: string;
  status: 'analyzing' | 'generating' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}

export interface Speaker {
  speakerId: number;
  speakerTag: string; // e.g., "Speaker 1"
  totalSpeakingTime: number; // seconds
  wordCount: number;
  firstAppearance: number; // timestamp in seconds
}

export interface SpeakerSegment {
  speakerTag: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  confidence?: number;
}

export interface AnalysisTypeInfo {
  key: keyof AnalysisResults;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface ShareContentOptions {
  // Core analyses (always generated)
  includeTranscript: boolean;
  includeSummary: boolean;
  includeCommunicationStyles: boolean;
  includeActionItems: boolean;
  includeSpeakerInfo: boolean;

  // On-demand analyses (user-requested, stored in generatedAnalyses collection)
  includeOnDemandAnalyses: boolean;  // Master toggle for all on-demand analyses
  selectedAnalysisIds?: string[];     // Specific GeneratedAnalysis IDs to share (empty = share all)
}

export interface SharedEmailRecord {
  email: string;
  sentAt: Date;
}

export interface ShareSettings {
  enabled: boolean;
  expiresAt?: Date;
  viewCount?: number;
  maxViews?: number;
  password?: string;
  contentOptions?: ShareContentOptions;
}

export interface ShareEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  senderName?: string;
}

export interface SharedTranscriptionView {
  id: string;
  fileName: string;
  title?: string;
  transcriptText?: string;
  analyses?: Partial<AnalysisResults>;  // Core analyses (legacy + new coreAnalyses)
  summaryV2?: SummaryV2;  // V2 structured summary for rich rendering
  generatedAnalyses?: GeneratedAnalysis[];  // On-demand analyses from separate collection
  speakerSegments?: SpeakerSegment[];
  speakers?: Speaker[];
  createdAt: Date;
  sharedBy?: string;
  viewCount?: number;
  contentOptions?: ShareContentOptions;
  translations?: Record<string, TranslationData>; // All available translations at time of sharing
  preferredTranslationLanguage?: string; // Sender's preferred language (e.g., 'es', 'fr', or 'original')
}

// ============================================================================
// Imported Conversations (V2 - Shared with you folder)
// ============================================================================

/**
 * Represents a linked reference to a shared conversation.
 * The import points to the original share; if the share is revoked or expires,
 * the imported reference becomes inaccessible.
 */
export interface ImportedConversation {
  id: string;
  userId: string; // Who imported it
  shareToken: string; // Reference to original share
  originalTranscriptionId: string; // For tracking/analytics

  // Cached metadata (snapshot at import time for display)
  title: string;
  sharedByName?: string;
  sharedByEmail?: string;
  expiresAt?: Date; // Copied from share settings

  // Timestamps
  importedAt: Date;
  lastAccessedAt?: Date;
  deletedAt?: Date; // Soft delete
}

/**
 * Status of an imported conversation based on the underlying share's state.
 */
export type ImportedConversationStatus =
  | 'active' // Share is valid and accessible
  | 'expired' // Share has passed its expiration date
  | 'revoked' // Owner has revoked the share
  | 'unavailable'; // Share not found or other error

/**
 * Response when fetching an imported conversation with its live content.
 */
export interface ImportedConversationWithContent {
  importedConversation: ImportedConversation;
  sharedContent: SharedTranscriptionView | null; // null if unavailable
  status: ImportedConversationStatus;
}

/**
 * Response when importing a shared conversation.
 */
export interface ImportConversationResponse {
  importedConversation: ImportedConversation;
  alreadyImported: boolean; // True if user had already imported this
}

/**
 * Extended shared transcription view with import status.
 * Used when an authenticated user views a shared link.
 */
export interface SharedTranscriptionViewWithImportStatus
  extends SharedTranscriptionView {
  canImport: boolean; // Always true for valid shares
  alreadyImported: boolean; // Whether current user has imported this
  importedAt?: Date; // When user imported (if they did)
}

export interface TranslateRequest {
  targetLanguage: string; // Language code (e.g., 'es', 'fr', 'de')
}

export interface TranslationResponse {
  transcriptionId: string;
  language: string;
  languageName: string;
  translatedAt: Date;
  translationData: TranslationData;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const ANALYSIS_TYPE_INFO: AnalysisTypeInfo[] = [
  {
    key: 'summary',
    label: 'Summary',
    icon: 'MessageSquare',
    color: 'blue',
    description: 'Comprehensive overview with key topics and decisions'
  },
  {
    key: 'actionItems',
    label: 'Action Items',
    icon: 'ListChecks',
    color: 'green',
    description: 'Tasks, deadlines, and follow-ups'
  },
  {
    key: 'communicationStyles',
    label: 'Communication',
    icon: 'Users',
    color: 'purple',
    description: 'Speaking patterns and interaction dynamics'
  },
  {
    key: 'transcript',
    label: 'Full Transcript',
    icon: 'FileText',
    color: 'gray',
    description: 'Complete transcription of the audio'
  },
  {
    key: 'emotionalIntelligence',
    label: 'Emotional IQ',
    icon: 'Brain',
    color: 'pink',
    description: 'Emotional tone and empathy analysis'
  },
  {
    key: 'influencePersuasion',
    label: 'Influence',
    icon: 'Target',
    color: 'orange',
    description: 'Persuasion techniques and decision influence'
  },
  {
    key: 'personalDevelopment',
    label: 'Development',
    icon: 'TrendingUp',
    color: 'teal',
    description: 'Growth opportunities and recommendations'
  },
  {
    key: 'details',
    label: 'Details',
    icon: 'Info',
    color: 'gray',
    description: 'Recording metadata and technical information'
  }
];

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' }
];

// ============================================================
// TRANSLATION V2 - SEPARATE COLLECTION ARCHITECTURE
// ============================================================

/**
 * V2 Supported Locale - Uses ISO country codes for extensibility
 * Examples: 'en-US', 'es-ES', 'nl-NL', 'pt-BR', 'zh-CN'
 */
export interface SupportedLocale {
  code: string;        // ISO: 'en-US', 'es-ES', 'nl-NL', 'de-DE', 'fr-FR'
  language: string;    // 'English', 'Spanish', 'Dutch', 'German', 'French'
  nativeName: string;  // 'English', 'Español', 'Nederlands', 'Deutsch', 'Français'
  region?: string;     // 'United States', 'Spain', etc.
}

/**
 * Supported locales for translation (V2)
 * Easy to extend with regional variants: pt-BR, zh-CN, zh-TW, etc.
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'en-US', language: 'English', nativeName: 'English', region: 'United States' },
  { code: 'es-ES', language: 'Spanish', nativeName: 'Español', region: 'Spain' },
  { code: 'nl-NL', language: 'Dutch', nativeName: 'Nederlands', region: 'Netherlands' },
  { code: 'de-DE', language: 'German', nativeName: 'Deutsch', region: 'Germany' },
  { code: 'fr-FR', language: 'French', nativeName: 'Français', region: 'France' },
  { code: 'it-IT', language: 'Italian', nativeName: 'Italiano', region: 'Italy' },
  { code: 'pt-PT', language: 'Portuguese', nativeName: 'Português', region: 'Portugal' },
  { code: 'pt-BR', language: 'Portuguese', nativeName: 'Português', region: 'Brazil' },
  { code: 'zh-CN', language: 'Chinese', nativeName: '简体中文', region: 'China' },
  { code: 'zh-TW', language: 'Chinese', nativeName: '繁體中文', region: 'Taiwan' },
  { code: 'ja-JP', language: 'Japanese', nativeName: '日本語', region: 'Japan' },
  { code: 'ko-KR', language: 'Korean', nativeName: '한국어', region: 'South Korea' },
  { code: 'ar-SA', language: 'Arabic', nativeName: 'العربية', region: 'Saudi Arabia' },
  { code: 'ru-RU', language: 'Russian', nativeName: 'Русский', region: 'Russia' },
  { code: 'hi-IN', language: 'Hindi', nativeName: 'हिन्दी', region: 'India' },
  { code: 'pl-PL', language: 'Polish', nativeName: 'Polski', region: 'Poland' },
  { code: 'tr-TR', language: 'Turkish', nativeName: 'Türkçe', region: 'Turkey' },
];

/**
 * Get locale by code
 */
export function getLocaleByCode(code: string): SupportedLocale | undefined {
  return SUPPORTED_LOCALES.find(l => l.code === code);
}

/**
 * Translated Summary V2 - Mirrors SummaryV2 structure for translated content
 */
export interface TranslatedSummaryV2 {
  type: 'summaryV2';
  title: string;
  intro: string;
  keyPoints: Array<{ topic: string; description: string }>;
  detailedSections: Array<{ topic: string; content: string }>;
  decisions?: string[];
  nextSteps?: string[];
}

/**
 * Translated Summary V1 - Simple text for legacy markdown summaries
 */
export interface TranslatedSummaryV1 {
  type: 'summaryV1';
  text: string;
}

/**
 * Translated Analysis - For GeneratedAnalysis content
 */
export interface TranslatedAnalysis {
  type: 'analysis';
  content: string | StructuredOutput;
  contentType: 'markdown' | 'structured';
}

/**
 * Union of all translated content types
 */
export type TranslatedContent =
  | TranslatedSummaryV2
  | TranslatedSummaryV1
  | TranslatedAnalysis;

/**
 * Translation Document - Stored in 'translations' collection (V2 architecture)
 *
 * Each document represents a translation of a specific content item
 * (either a Summary or an AI Asset) into a target locale.
 */
export interface Translation {
  id: string;

  // Reference to source content
  sourceType: 'summary' | 'analysis';
  sourceId: string;           // transcriptionId for summary, analysisId for AI assets
  transcriptionId: string;    // Always set for querying all translations of a conversation
  userId: string;             // Owner for access control

  // Target locale
  localeCode: string;         // ISO: 'es-ES', 'nl-NL', 'de-DE'
  localeName: string;         // Human-readable: 'Spanish', 'Dutch', 'German'

  // Translated content
  content: TranslatedContent;

  // Metadata
  translatedAt: Date;
  translatedBy: 'gpt-5' | 'gpt-5-mini';
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of translation for a specific locale
 */
export interface LocaleTranslationStatus {
  code: string;                  // 'es-ES'
  name: string;                  // 'Spanish'
  nativeName: string;            // 'Español'
  hasSummaryTranslation: boolean;
  translatedAssetCount: number;
  totalAssetCount: number;
  lastTranslatedAt?: Date;
}

/**
 * Aggregated translation status for a conversation
 */
export interface ConversationTranslations {
  transcriptionId: string;
  originalLocale?: string;       // Detected from audio (e.g., 'en-US')
  availableLocales: LocaleTranslationStatus[];
  preferredLocale: string;       // 'original' | 'es-ES' | etc.
}

/**
 * Request to translate conversation content
 */
export interface TranslateConversationRequest {
  targetLocale: string;          // ISO locale code: 'es-ES', 'nl-NL'
  translateSummary?: boolean;    // Default: true
  translateAssets?: boolean;     // Default: true (all existing assets)
  assetIds?: string[];           // Optional: specific asset IDs to translate
  forceRetranslate?: boolean;    // Default: false - if true, deletes existing and re-translates
}

/**
 * Response with translation results
 */
export interface TranslateConversationResponse {
  transcriptionId: string;
  localeCode: string;
  localeName: string;
  translationsCreated: number;
  translations: Translation[];
}

// NEW: Subscription and pricing types

export interface SubscriptionTier {
  id: 'free' | 'payg' | 'professional' | 'business' | 'enterprise';
  name: string;
  price: {
    monthly?: number;
    annual?: number;
  };
  limits: {
    transcriptionsPerMonth?: number; // undefined = unlimited
    hoursPerMonth?: number; // undefined = unlimited
    maxFileDuration?: number; // minutes
    maxFileSize?: number; // bytes
    onDemandAnalysesPerMonth?: number; // undefined = unlimited
  };
  features: {
    coreAnalyses: boolean;
    onDemandAnalyses: boolean;
    translation: boolean;
    advancedSharing: boolean;
    batchUpload: boolean;
    priorityProcessing: boolean;
    apiAccess: boolean;
  };
}

export interface UsageRecord {
  id: string;
  userId: string;
  transcriptionId: string;
  durationSeconds: number;
  durationHours: number;
  type: 'transcription' | 'analysis' | 'translation';
  tier: 'free' | 'professional' | 'payg';
  cost?: number; // For PAYG or overages (in cents)
  createdAt: Date;
}

export interface OverageCharge {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  hours: number;
  amount: number; // in cents
  periodStart: Date;
  periodEnd: Date;
  status: 'pending' | 'paid' | 'failed';
  createdAt: Date;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: {},
    limits: {
      transcriptionsPerMonth: 3,
      hoursPerMonth: undefined,
      maxFileDuration: 30, // minutes
      maxFileSize: 100 * 1024 * 1024, // 100MB
      onDemandAnalysesPerMonth: 2,
    },
    features: {
      coreAnalyses: true,
      onDemandAnalyses: true, // Limited to 2/month
      translation: false,
      advancedSharing: false,
      batchUpload: false,
      priorityProcessing: false,
      apiAccess: false,
    },
  },
  payg: {
    id: 'payg',
    name: 'Pay As You Go',
    price: {}, // PAYG pricing available in BASE_PRICING.usd.payg
    limits: {
      transcriptionsPerMonth: undefined, // unlimited
      hoursPerMonth: undefined, // based on purchased credits
      maxFileDuration: undefined, // unlimited
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      onDemandAnalysesPerMonth: undefined, // unlimited
    },
    features: {
      coreAnalyses: true,
      onDemandAnalyses: true,
      translation: true,
      advancedSharing: true,
      batchUpload: true,
      priorityProcessing: false,
      apiAccess: false,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: BASE_PRICING.usd.professional, // Reference centralized pricing
    limits: {
      transcriptionsPerMonth: undefined, // unlimited
      hoursPerMonth: 60,
      maxFileDuration: undefined, // unlimited
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      onDemandAnalysesPerMonth: undefined, // unlimited
    },
    features: {
      coreAnalyses: true,
      onDemandAnalyses: true,
      translation: true,
      advancedSharing: true,
      batchUpload: true,
      priorityProcessing: true,
      apiAccess: false, // Add-on
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    price: {
      monthly: 79,
      annual: 790, // 17% discount
    },
    limits: {
      transcriptionsPerMonth: undefined,
      hoursPerMonth: 200,
      maxFileDuration: undefined,
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      onDemandAnalysesPerMonth: undefined,
    },
    features: {
      coreAnalyses: true,
      onDemandAnalyses: true,
      translation: true,
      advancedSharing: true,
      batchUpload: true,
      priorityProcessing: true,
      apiAccess: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: {}, // Custom pricing
    limits: {
      transcriptionsPerMonth: undefined,
      hoursPerMonth: undefined,
      maxFileDuration: undefined,
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
      onDemandAnalysesPerMonth: undefined,
    },
    features: {
      coreAnalyses: true,
      onDemandAnalyses: true,
      translation: true,
      advancedSharing: true,
      batchUpload: true,
      priorityProcessing: true,
      apiAccess: true,
    },
  },
};

// Admin Activity Audit Types
export interface AccountEvent {
  type: 'created' | 'login' | 'subscription_change' | 'deletion' | 'tier_change';
  timestamp: Date;
  details: Record<string, any>;
}

export interface UserActivitySummary {
  totalTranscriptions: number;
  totalHoursProcessed: number;
  totalAnalysesGenerated: number;
  accountAge: number; // days
  lastActive?: Date;
  monthlyUsage: {
    hours: number;
    transcriptions: number;
    analyses: number;
  };
}

export interface UserActivity {
  user: User;
  summary: UserActivitySummary;
  recentTranscriptions: Transcription[];
  recentAnalyses: GeneratedAnalysis[];
  usageRecords: UsageRecord[];
  accountEvents: AccountEvent[];
}

// ============================================================
// Q&A VECTOR SEARCH TYPES
// ============================================================

/**
 * Citation from a conversation used in Q&A answers
 */
export interface Citation {
  transcriptionId: string;
  conversationTitle: string;
  speaker: string;
  timestamp: string;        // "12:34" format
  timestampSeconds: number; // Raw seconds for seeking
  text: string;             // The quoted text
  relevanceScore: number;   // 0-1 similarity score
}

/**
 * A single Q&A exchange for conversation history
 * Used to provide context for follow-up questions
 */
export interface QAHistoryItem {
  question: string;
  answer: string;
}

/**
 * Debug information for Q&A requests
 */
export interface QADebugInfo {
  summaryTokens: number;           // Tokens from summary context
  chunksTokens: number;            // Tokens from transcript excerpts
  historyTokens: number;           // Tokens from Q&A history
  questionTokens: number;          // Tokens from user question
  systemPromptTokens: number;      // Tokens from system prompt
  totalInputTokens: number;        // Total input tokens
  outputTokens: number;            // Output tokens (from response)
  historyCount: number;            // Number of Q&A pairs in context
  chunksCount: number;             // Number of transcript chunks found
  estimatedCostUsd: number;        // Estimated cost in USD
  model: string;                   // Model used
}

/**
 * Response from Q&A "ask" endpoints
 */
export interface AskResponse {
  answer: string;
  citations: Citation[];
  searchScope: 'conversation' | 'folder' | 'global';
  processingTimeMs: number;
  indexed?: boolean;        // Whether the conversation was already indexed
  debug?: QADebugInfo;      // Debug info (only in development)
}

/**
 * Response from "find conversations" endpoint
 */
export interface FindResponse {
  conversations: ConversationMatch[];
  totalConversations: number;
  searchScope: 'folder' | 'global';
  processingTimeMs: number;
}

/**
 * A conversation matching a search query
 */
export interface ConversationMatch {
  transcriptionId: string;
  title: string;
  createdAt: Date;
  folderId: string | null;
  folderName: string | null;
  matchedSnippets: MatchedSnippet[];
  totalMatches: number;
}

/**
 * A text snippet matching the search query
 */
export interface MatchedSnippet {
  text: string;
  speaker: string;
  timestamp: string;        // "12:34" format
  timestampSeconds: number;
  relevanceScore: number;
}

/**
 * Payload structure for vector chunks stored in Qdrant
 */
export interface TranscriptChunkPayload {
  userId: string;
  transcriptionId: string;
  folderId: string | null;
  chunkType: 'content' | 'metadata';  // 'metadata' for title/summary chunks
  segmentIndex: number;
  speaker: string;
  startTime: number;        // seconds
  endTime: number;          // seconds
  text: string;
  chunkIndex: number;       // 0 if segment not split
  totalChunks: number;      // 1 if segment not split
  conversationTitle: string;
  conversationDate: string; // ISO date
  indexedAt: string;        // ISO timestamp
}

/**
 * A chunk prepared for embedding
 */
export interface TranscriptChunk {
  segmentIndex: number;
  chunkIndex: number;
  totalChunks: number;
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * A chunk with its embedding vector
 */
export interface EmbeddedChunk extends TranscriptChunk {
  embedding: number[];
}

/**
 * Search result from Qdrant
 */
export interface ScoredChunk {
  id: string;
  score: number;
  payload: TranscriptChunkPayload;
}

// ============================================================
// FIND/REPLACE TYPES
// ============================================================

/**
 * Category of a saved find/replace pattern for smart suggestions
 */
export type FindReplacePatternCategory =
  | 'person_name'
  | 'company_name'
  | 'place'
  | 'technical_term'
  | 'custom';

/**
 * A saved find/replace pattern for reuse across conversations
 */
export interface SavedFindReplacePattern {
  id: string;
  userId: string;
  findText: string;
  replaceText: string;
  category: FindReplacePatternCategory;
  caseSensitive: boolean;
  wholeWord: boolean;
  useCount: number;
  createdAt: Date;
  lastUsedAt: Date;
}

/**
 * Location where a match was found in conversation content
 */
export interface MatchLocation {
  type: 'transcript' | 'summary' | 'aiAsset';

  // For transcript matches
  segmentIndex?: number;
  charOffset?: number;

  // For summaryV2 matches
  summaryField?: 'title' | 'intro' | 'keyPoint' | 'detailedSection' | 'decision' | 'nextStep';
  arrayIndex?: number;
  subField?: 'topic' | 'description' | 'content';

  // For AI asset matches
  analysisId?: string;
  contentPath?: string; // JSON path for structured content (e.g., "sections[0].heading")
}

/**
 * A single match found in content
 */
export interface FindReplaceMatch {
  id: string;
  location: MatchLocation;
  matchedText: string; // The actual text that matched (preserves case)
  context: string; // ~50 chars before/after for preview
}

/**
 * Grouped matches by content category
 */
export interface FindReplaceResults {
  transcriptionId: string;
  findText: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  summary: FindReplaceMatch[];
  transcript: FindReplaceMatch[];
  aiAssets: {
    analysisId: string;
    templateName: string;
    matches: FindReplaceMatch[];
  }[];
  totalMatches: number;
}

/**
 * Request to find matches in a conversation
 */
export interface FindRequest {
  findText: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

/**
 * Request to replace matches in a conversation
 */
export interface ReplaceRequest {
  findText: string;
  replaceText: string;
  caseSensitive: boolean;
  wholeWord: boolean;

  // Selection options (exactly one should be specified)
  replaceAll?: boolean;
  replaceCategories?: ('summary' | 'transcript' | 'aiAssets')[];
  matchIds?: string[];

  // Optional: save as pattern for future use
  saveAsPattern?: {
    category: FindReplacePatternCategory;
  };
}

/**
 * Response from replace operation
 */
export interface ReplaceResponse {
  transcriptionId: string;
  replacedCount: number;
  replacedLocations: {
    summary: number;
    transcript: number;
    aiAssets: { analysisId: string; count: number }[];
  };
  patternSaved?: string; // Pattern ID if saved
}

/**
 * A pattern suggestion for a conversation
 */
export interface PatternSuggestion {
  pattern: SavedFindReplacePattern;
  matchCount: number;
  relevanceScore: number; // Based on use count and recency
}