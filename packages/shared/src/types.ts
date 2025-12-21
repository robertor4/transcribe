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

/** Structured email output */
export interface EmailOutput {
  type: 'email';
  subject: string;
  greeting: string;
  body: string[];
  keyPoints: string[];
  actionItems: string[];
  closing: string;
}

/** Blog post section */
export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bulletPoints?: string[];
  quotes?: { text: string; attribution: string }[];
}

/** Structured blog post output */
export interface BlogPostOutput {
  type: 'blogPost';
  headline: string;
  subheading?: string;
  hook: string;
  sections: BlogSection[];
  callToAction: string;
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
  | EmailOutput
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
  coreAnalysesOutdated?: boolean; // True when transcript corrected but analyses not regenerated
  // References to analyses in generatedAnalyses collection (actionItems, communicationAnalysis, etc.)
  generatedAnalysisIds?: string[]; // Array of GeneratedAnalysis IDs
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
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
  // Translation fields
  translations?: Record<string, TranslationData>; // Key is language code (e.g., 'es', 'fr')
  preferredTranslationLanguage?: string; // User's preferred language for this transcription (e.g., 'es', 'fr', or 'original')
  // Soft delete fields
  deletedAt?: Date; // When the transcription was soft-deleted (null = not deleted)
  // V2: Template selection - controls which analyses are generated
  selectedTemplates?: string[]; // Array of template IDs from frontend (e.g., ['transcribe-only', 'actionItems'])
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

// Transcript Correction Types

export interface CorrectTranscriptRequest {
  instructions: string;
  previewOnly?: boolean; // Default: true
}

export interface TranscriptDiff {
  segmentIndex: number;
  speakerTag: string;
  timestamp: string; // Formatted like "1:23"
  oldText: string;
  newText: string;
}

export interface CorrectionPreview {
  original: string; // Full original transcript
  corrected: string; // Full corrected transcript
  diff: TranscriptDiff[]; // Only changed segments
  summary: {
    totalChanges: number; // Number of text changes
    affectedSegments: number; // Number of segments changed
  };
}

export interface CorrectionApplyResponse {
  success: boolean;
  transcription: Transcription; // Updated transcript object
  deletedAnalysisIds: string[]; // IDs of deleted custom analyses
  clearedTranslations: string[]; // Language codes that were cleared (e.g., ['es', 'fr'])
}

// AI-First Intelligent Routing Types
export interface SimpleReplacement {
  find: string;
  replace: string;
  caseSensitive: boolean;
  estimatedMatches: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ComplexCorrection {
  description: string;
  affectedSegmentIndices: number[];
  speakerTag?: string;
  reason: string;
}

export interface RoutingPlan {
  simpleReplacements: SimpleReplacement[];
  complexCorrections: ComplexCorrection[];
  estimatedTime: {
    regex: string;
    ai: string;
    total: string;
  };
  summary: {
    totalCorrections: number;
    simpleCount: number;
    complexCount: number;
    totalSegmentsAffected: number;
    totalSegments: number;
    percentageAffected: string;
  };
}

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