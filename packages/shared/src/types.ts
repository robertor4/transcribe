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
  subscription?: {
    type: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
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

export interface AnalysisResults {
  summary?: string;
  communicationStyles?: string;
  actionItems?: string;
  emotionalIntelligence?: string;
  influencePersuasion?: string;
  personalDevelopment?: string;
  custom?: string;
  transcript?: string;
}

export interface Transcription {
  id: string;
  userId: string;
  fileName: string;
  title?: string; // Custom user-defined title, defaults to fileName
  fileUrl: string;
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
  analyses?: AnalysisResults; // All analysis results
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
  transcriptWithSpeakers?: string; // Formatted transcript with speaker labels
  diarizationConfidence?: number;
  // Sharing fields
  shareToken?: string;
  shareSettings?: ShareSettings;
  sharedAt?: Date;
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
}

export interface FileUploadRequest {
  file: File;
  analysisType?: AnalysisType;
  context?: string;
  contextId?: string;
  priority?: number;
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
  includeTranscript: boolean;
  includeSummary: boolean;
  includeCommunicationStyles: boolean;
  includeActionItems: boolean;
  includeEmotionalIntelligence: boolean;
  includeInfluencePersuasion: boolean;
  includePersonalDevelopment: boolean;
  includeCustomAnalysis: boolean;
  includeSpeakerInfo: boolean;
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
  analyses?: Partial<AnalysisResults>;
  speakerSegments?: SpeakerSegment[];
  speakers?: Speaker[];
  createdAt: Date;
  sharedBy?: string;
  viewCount?: number;
  contentOptions?: ShareContentOptions;
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
    key: 'transcript',
    label: 'Full Transcript',
    icon: 'FileText',
    color: 'gray',
    description: 'Complete transcription of the audio'
  },
  {
    key: 'communicationStyles',
    label: 'Communication',
    icon: 'Users',
    color: 'purple',
    description: 'Speaking patterns and interaction dynamics'
  },
  {
    key: 'actionItems',
    label: 'Action Items',
    icon: 'ListChecks',
    color: 'green',
    description: 'Tasks, deadlines, and follow-ups'
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
  }
];