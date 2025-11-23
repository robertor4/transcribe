// Mock data for UI prototyping - no backend changes required
import { SpeakerSegment } from '@transcribe/shared';

export interface MockConversation {
  id: string;
  title: string;
  folderId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  source: {
    audioUrl: string;
    audioDuration: number; // seconds
    transcript: {
      text: string;
      speakers: number;
      confidence: number;
      speakerSegments?: SpeakerSegment[]; // Added for transcript timeline
    };
    summary: {
      text: string;
      keyPoints: string[];
      keyPointsDetailed?: {
        title: string;
        content: string;
      }[];
      generatedAt: Date;
    };
  };
  tags: string[];
  templateType: 'meeting' | 'spec' | 'article' | 'custom';
  sharing: {
    isPublic: boolean;
    publicLinkId?: string;
    viewCount: number;
    sharedWith: string[];
  };
  outputs?: string[]; // Array of output IDs
}

export interface MockFolder {
  id: string;
  name: string;
  ownerId: string;
  color: string;
  createdAt: Date;
  members: {
    userId: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: Date;
  }[];
  conversationCount: number;
  totalMinutes: number;
}

export interface MockEmailOutput {
  subject: string;
  greeting: string;
  body: string[];
  keyPoints: string[];
  actionItems: string[];
  closing: string;
}

export interface MockActionItemsOutput {
  items: {
    task: string;
    owner: string | null;
    deadline: string | null;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface MockLinkedInOutput {
  content: string;
  hashtags: string[];
  characterCount: number;
}

// Generated Outputs - New unified structure
export type OutputType =
  | 'email'
  | 'actionItems'
  | 'blogPost'
  | 'linkedin'
  | 'userStories';

export interface GeneratedOutput {
  id: string;
  conversationId: string;
  type: OutputType;
  title: string;
  preview: string; // First 150 chars for gallery cards
  content: EmailOutputContent | BlogPostOutputContent | ActionItemsOutputContent | LinkedInOutputContent | UserStoriesOutputContent;
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

// Mock Folders
export const mockFolders: MockFolder[] = [
  {
    id: 'folder-1',
    name: 'Product Launch',
    ownerId: 'user-123',
    color: 'purple',
    createdAt: new Date('2025-01-10'),
    members: [
      {
        userId: 'user-123',
        email: 'roberto@dreamone.nl',
        role: 'owner',
        joinedAt: new Date('2025-01-10')
      },
      {
        userId: 'user-456',
        email: 'john@company.com',
        role: 'editor',
        joinedAt: new Date('2025-01-12')
      }
    ],
    conversationCount: 12,
    totalMinutes: 240
  },
  {
    id: 'folder-2',
    name: 'Client Projects',
    ownerId: 'user-123',
    color: 'blue',
    createdAt: new Date('2025-01-05'),
    members: [
      {
        userId: 'user-123',
        email: 'roberto@dreamone.nl',
        role: 'owner',
        joinedAt: new Date('2025-01-05')
      },
      {
        userId: 'user-789',
        email: 'sarah@client.com',
        role: 'viewer',
        joinedAt: new Date('2025-01-15')
      }
    ],
    conversationCount: 8,
    totalMinutes: 180
  },
  {
    id: 'folder-3',
    name: 'Team 1:1s',
    ownerId: 'user-123',
    color: 'green',
    createdAt: new Date('2024-12-20'),
    members: [
      {
        userId: 'user-123',
        email: 'roberto@dreamone.nl',
        role: 'owner',
        joinedAt: new Date('2024-12-20')
      }
    ],
    conversationCount: 24,
    totalMinutes: 360
  }
];

// Mock Conversations
export const mockConversations: MockConversation[] = [
  {
    id: 'conv-1',
    title: 'Q4 Product Roadmap',
    folderId: 'folder-1',
    userId: 'user-123',
    createdAt: new Date('2025-01-20T14:30:00'),
    updatedAt: new Date('2025-01-20T15:15:00'),
    status: 'ready',
    source: {
      audioUrl: 'https://example.com/audio-1.m4a',
      audioDuration: 2700, // 45 min
      transcript: {
        text: 'This is a comprehensive discussion about our Q4 product strategy. We need to focus on AI-powered features that will increase user engagement by at least 50%. The key areas include automated workflow generation, intelligent recommendations, and real-time collaboration features. Our timeline is aggressive - we need to launch by October 15th to capture the holiday season...',
        speakers: 3,
        confidence: 0.95,
        speakerSegments: [
          { speakerTag: 'Speaker 1', startTime: 0, endTime: 45, text: 'Alright everyone, thanks for joining. Today we need to finalize our Q4 product roadmap. I want to focus on AI-powered features that will drive user engagement.', confidence: 0.96 },
          { speakerTag: 'Speaker 2', startTime: 45, endTime: 92, text: 'Absolutely. Based on our analytics, we\'re seeing a 50% drop-off rate at the workflow creation stage. If we can automate that with AI, we could significantly improve retention.', confidence: 0.94 },
          { speakerTag: 'Speaker 1', startTime: 92, endTime: 135, text: 'Exactly. Let\'s talk about three main pillars: automated workflow generation, intelligent recommendations, and real-time collaboration features.', confidence: 0.97 },
          { speakerTag: 'Speaker 3', startTime: 135, endTime: 198, text: 'From a technical perspective, the workflow automation is the most complex. We\'ll need to integrate GPT-5 for pattern recognition and template suggestions. That\'s probably 8 weeks of development.', confidence: 0.93 },
          { speakerTag: 'Speaker 2', startTime: 198, endTime: 245, text: 'What about intelligent recommendations? We already have user behavior tracking in place, right?', confidence: 0.95 },
          { speakerTag: 'Speaker 3', startTime: 245, endTime: 310, text: 'Yes, we do. The recommendation engine can leverage our existing data. I\'d estimate 4 weeks for that, mostly frontend work to surface the suggestions in context.', confidence: 0.94 },
          { speakerTag: 'Speaker 1', startTime: 310, endTime: 368, text: 'Good. Now, real-time collaboration is critical. Users expect Google Docs-level functionality. What\'s the lift there?', confidence: 0.96 },
          { speakerTag: 'Speaker 3', startTime: 368, endTime: 445, text: 'That\'s the biggest challenge. We need WebSocket infrastructure, conflict resolution, presence indicators... I\'d say 10 weeks minimum. We could use operational transforms or CRDTs for sync.', confidence: 0.92 },
          { speakerTag: 'Speaker 2', startTime: 445, endTime: 492, text: 'Ten weeks is tight. We want to launch by October 15th to capture the holiday season. That gives us what, 12 weeks total?', confidence: 0.95 },
          { speakerTag: 'Speaker 1', startTime: 492, endTime: 548, text: 'Correct. Twelve weeks development, two weeks beta testing with partners, one week buffer. It\'s aggressive but achievable.', confidence: 0.97 },
          { speakerTag: 'Speaker 3', startTime: 548, endTime: 612, text: 'We\'ll need to parallelize. I can bring in another senior engineer for the real-time features while I focus on the AI integration.', confidence: 0.93 },
          { speakerTag: 'Speaker 2', startTime: 612, endTime: 670, text: 'What about design resources? The UX for all three features needs to be seamless. Users won\'t tolerate janky AI suggestions or laggy collaboration.', confidence: 0.94 },
          { speakerTag: 'Speaker 1', startTime: 670, endTime: 725, text: 'I can dedicate Sarah full-time. She\'ll work on interaction patterns, micro-animations, and making sure everything feels native.', confidence: 0.96 },
          { speakerTag: 'Speaker 2', startTime: 725, endTime: 788, text: 'Perfect. From a product perspective, I\'ll coordinate with the beta partners. We have three enterprise clients lined up: a SaaS company, a consulting firm, and a product team.', confidence: 0.95 },
          { speakerTag: 'Speaker 3', startTime: 788, endTime: 845, text: 'That\'s solid validation. Real-world feedback before we go live will be crucial. When do they start testing?', confidence: 0.93 },
          { speakerTag: 'Speaker 2', startTime: 845, endTime: 892, text: 'September 15th. Each partner committed 5-10 hours per week for feedback sessions.', confidence: 0.96 },
          { speakerTag: 'Speaker 1', startTime: 892, endTime: 955, text: 'Excellent. Let me summarize: We\'re committing to AI workflows, recommendations, and collaboration. Resources are 2 engineers, 1 designer, 1 PM. Launch October 15th. Any concerns?', confidence: 0.97 },
          { speakerTag: 'Speaker 3', startTime: 955, endTime: 1015, text: 'Just scope creep. We need to be ruthless about prioritization. If a feature doesn\'t directly impact engagement, it gets cut.', confidence: 0.94 },
          { speakerTag: 'Speaker 2', startTime: 1015, endTime: 1068, text: 'Agreed. Weekly progress reviews will keep us honest. We can\'t afford delays with the holiday season deadline.', confidence: 0.95 },
          { speakerTag: 'Speaker 1', startTime: 1068, endTime: 1125, text: 'Perfect. I\'ll document this and share the roadmap with the broader team by end of week. Thanks everyone!', confidence: 0.96 }
        ]
      },
      summary: {
        text: 'This roadmap outlines the Q4 2025 product strategy focusing on AI-powered features to increase user engagement. Key initiatives include automated workflow generation, intelligent recommendations, and real-time collaboration. The team discussed technical feasibility, resource allocation, and go-to-market strategy. Target launch date is October 15th to capture holiday season opportunities.',
        keyPoints: [
          'Focus on AI-powered features for 50% engagement increase',
          'Three main features: workflow automation, recommendations, collaboration',
          'Aggressive timeline: Launch by October 15th',
          'Resource allocation: 2 engineers, 1 designer, 1 PM',
          'Go-to-market: Partnership with 3 major clients for beta testing'
        ],
        keyPointsDetailed: [
          {
            title: 'AI-Powered Features for 50% Engagement Increase',
            content: 'The primary goal for Q4 is implementing machine learning capabilities that predict user needs and automate repetitive tasks. Based on current analytics, we identified three friction points where users drop off, and these AI features will directly address those pain points. Early prototypes show a 40% reduction in time-to-completion for common workflows. The investment in AI infrastructure will position us ahead of competitors who are still relying on rule-based automation.'
          },
          {
            title: 'Three Core Feature Sets',
            content: 'First, workflow automation will use GPT-5 to analyze user patterns and suggest template-based automations. Second, intelligent recommendations will surface relevant content based on usage history and team collaboration patterns. Third, real-time collaboration features will enable simultaneous editing with conflict resolution and presence indicators, similar to what users expect from modern productivity tools. Each feature set has been validated through user research with our top 20 enterprise customers.'
          },
          {
            title: 'Aggressive October 15th Launch Timeline',
            content: 'To capture the holiday season and Q4 enterprise budget cycles, we\'re committing to a hard deadline of October 15th. This gives us 12 weeks for development, 2 weeks for beta testing with partners, and 1 week buffer for critical fixes. The timeline is ambitious but achievable if we maintain focus and avoid scope creep. Weekly progress reviews with stakeholders will ensure we stay on track and make quick decisions when tradeoffs are necessary.'
          },
          {
            title: 'Resource Allocation and Team Structure',
            content: 'We\'re dedicating 2 senior engineers (one focused on backend AI integration, one on frontend real-time features), 1 product designer for UX flows and interaction patterns, and 1 product manager to coordinate with stakeholders and beta partners. Additional QA support will be pulled from the platform team during the final 3 weeks. This focused team structure ensures clear ownership and fast decision-making without the overhead of larger team coordination.'
          },
          {
            title: 'Beta Partnership Strategy',
            content: 'We\'ve secured commitments from 3 major enterprise clients to participate in closed beta testing starting September 15th. These partners represent our target segments: SaaS companies (50+ employees), professional services firms, and product development teams. Their feedback will be critical for refining the features before public launch. Each partner has committed 5-10 hours per week for testing and feedback sessions, giving us real-world validation before we go to market.'
          }
        ],
        generatedAt: new Date('2025-01-20T15:15:00')
      }
    },
    tags: ['product', 'q4-launch', 'roadmap', 'ai'],
    templateType: 'spec',
    sharing: {
      isPublic: true,
      publicLinkId: 'abc123',
      viewCount: 12,
      sharedWith: ['john@company.com']
    },
    outputs: ['email-summary-abc123', 'blog-post-xyz789']
  },
  {
    id: 'conv-2',
    title: 'Client Onboarding Call - Acme Corp',
    folderId: 'folder-2',
    userId: 'user-123',
    createdAt: new Date('2025-01-19T10:00:00'),
    updatedAt: new Date('2025-01-19T10:45:00'),
    status: 'ready',
    source: {
      audioUrl: 'https://example.com/audio-2.m4a',
      audioDuration: 1800, // 30 min
      transcript: {
        text: 'Welcome to Neural Summary! Today we will walk through your onboarding process and discuss your specific use cases. Based on our conversation, I understand you need to process about 50 hours of client interviews per month and generate structured reports...',
        speakers: 2,
        confidence: 0.92
      },
      summary: {
        text: 'Onboarding call with Acme Corp to discuss their use case for processing client interviews. They need to handle 50 hours/month of audio and generate structured reports. Agreed on custom template creation and integration with their CRM system.',
        keyPoints: [
          'Use case: Process 50 hours/month of client interviews',
          'Output needed: Structured reports with key insights',
          'Integration: Connect with Salesforce CRM',
          'Custom template: Client interview analysis format',
          'Next steps: Technical integration call next week'
        ],
        generatedAt: new Date('2025-01-19T10:45:00')
      }
    },
    tags: ['client', 'onboarding', 'acme-corp'],
    templateType: 'meeting',
    sharing: {
      isPublic: false,
      viewCount: 3,
      sharedWith: ['sarah@client.com']
    }
  },
  {
    id: 'conv-3',
    title: 'AI Strategy Discussion',
    folderId: 'folder-1',
    userId: 'user-123',
    createdAt: new Date('2025-01-18T16:00:00'),
    updatedAt: new Date('2025-01-18T17:30:00'),
    status: 'ready',
    source: {
      audioUrl: 'https://example.com/audio-3.m4a',
      audioDuration: 5400, // 90 min
      transcript: {
        text: 'Our AI strategy needs to focus on three pillars: accuracy, speed, and cost-efficiency. We have been evaluating GPT-5 versus other models...',
        speakers: 5,
        confidence: 0.89
      },
      summary: {
        text: 'Strategic discussion on AI model selection and optimization. Team evaluated GPT-5, cost implications, and performance benchmarks. Decided to implement hybrid approach with GPT-5 for complex analysis and GPT-5-mini for simpler tasks.',
        keyPoints: [
          'Evaluated GPT-5 vs alternatives for accuracy and cost',
          'Decision: Hybrid approach (GPT-5 + GPT-5-mini)',
          'Expected cost savings: 28% vs previous model',
          'Performance: 2x faster processing with semantic caching',
          'Implementation timeline: 2 weeks'
        ],
        generatedAt: new Date('2025-01-18T17:30:00')
      }
    },
    tags: ['strategy', 'ai', 'tech'],
    templateType: 'spec',
    sharing: {
      isPublic: true,
      publicLinkId: 'xyz789',
      viewCount: 27,
      sharedWith: []
    }
  },
  {
    id: 'conv-4',
    title: 'Weekly Team Sync',
    folderId: 'folder-3',
    userId: 'user-123',
    createdAt: new Date('2025-01-17T09:00:00'),
    updatedAt: new Date('2025-01-17T09:30:00'),
    status: 'ready',
    source: {
      audioUrl: 'https://example.com/audio-4.m4a',
      audioDuration: 1800, // 30 min
      transcript: {
        text: 'Good morning team! Let us review our sprint progress. John, how are you doing with the authentication refactor? Sarah mentioned some blockers yesterday...',
        speakers: 4,
        confidence: 0.93
      },
      summary: {
        text: 'Weekly team sync covering sprint progress, blockers, and upcoming priorities. Auth refactor on track, frontend redesign needs design review, backend API v2 delayed by 2 days.',
        keyPoints: [
          'Auth refactor: 80% complete, on track for Friday release',
          'Frontend redesign: Blocked on design review from Sarah',
          'Backend API v2: 2-day delay due to unexpected edge cases',
          'Sprint velocity: 23 points completed vs 25 planned',
          'Next sprint: Focus on public sharing feature'
        ],
        generatedAt: new Date('2025-01-17T09:30:00')
      }
    },
    tags: ['team', 'sync', 'sprint'],
    templateType: 'meeting',
    sharing: {
      isPublic: false,
      viewCount: 0,
      sharedWith: []
    }
  },
  {
    id: 'conv-5',
    title: 'Marketing Campaign Brainstorm',
    folderId: null, // Personal, no folder
    userId: 'user-123',
    createdAt: new Date('2025-01-16T14:00:00'),
    updatedAt: new Date('2025-01-16T15:00:00'),
    status: 'ready',
    source: {
      audioUrl: 'https://example.com/audio-5.m4a',
      audioDuration: 3600, // 60 min
      transcript: {
        text: 'For our Q2 marketing campaign we should focus on content marketing and thought leadership. The target audience is product managers and technical founders...',
        speakers: 2,
        confidence: 0.91
      },
      summary: {
        text: 'Brainstorming session for Q2 marketing campaign focusing on content marketing and thought leadership. Target audience: Product managers and technical founders. Budget: $50k. Timeline: Launch in April.',
        keyPoints: [
          'Focus: Content marketing and thought leadership',
          'Target audience: Product managers, technical founders',
          'Budget: $50,000 for Q2',
          'Channels: Blog, LinkedIn, Twitter, podcast sponsorships',
          'Goal: 500 qualified leads, 50 conversions'
        ],
        generatedAt: new Date('2025-01-16T15:00:00')
      }
    },
    tags: ['marketing', 'campaign', 'q2'],
    templateType: 'custom',
    sharing: {
      isPublic: false,
      viewCount: 1,
      sharedWith: []
    }
  },
  {
    id: 'conv-6',
    title: 'Podcast Interview Notes',
    folderId: null, // Ungrouped
    userId: 'user-123',
    createdAt: new Date('2025-01-15T11:30:00'),
    updatedAt: new Date('2025-01-15T12:15:00'),
    status: 'ready',
    source: {
      audioUrl: 'https://example.com/audio-6.m4a',
      audioDuration: 2400, // 40 min
      transcript: {
        text: 'Welcome to the show! Today we are talking about the future of AI in productivity tools. Voice-to-text has been around for decades, but what makes Neural Summary different is the transformation layer...',
        speakers: 2,
        confidence: 0.94
      },
      summary: {
        text: 'Podcast interview discussing the evolution of voice-to-text technology and Neural Summary\'s unique approach. Key differentiator is the transformation layer that converts conversations into work-ready documents, not just transcriptions.',
        keyPoints: [
          'Voice-to-text evolution: From dictation to document creation',
          'Neural Summary differentiator: Transformation, not transcription',
          'Use cases: Product specs, meeting notes, content creation',
          'Market opportunity: $10B productivity tools market',
          'Future vision: AI interviews that extract structured ideas'
        ],
        generatedAt: new Date('2025-01-15T12:15:00')
      }
    },
    tags: ['podcast', 'interview', 'ai', 'productivity'],
    templateType: 'article',
    sharing: {
      isPublic: true,
      publicLinkId: 'def456',
      viewCount: 8,
      sharedWith: []
    }
  }
];

// Mock Generated Outputs
export const mockEmailOutput: MockEmailOutput = {
  subject: 'Q4 Product Roadmap - Key Highlights',
  greeting: 'Hi team,',
  body: [
    'I wanted to share the key points from our Q4 planning session today.',
    'We have aligned on an ambitious roadmap that focuses on AI-powered features to significantly increase user engagement.'
  ],
  keyPoints: [
    'Focus: AI-powered features targeting 50% engagement increase',
    'Key initiatives: Workflow automation, intelligent recommendations, real-time collaboration',
    'Target: 50% increase in user engagement',
    'Timeline: Launch by October 15th to capture holiday season',
    'Resources: 2 engineers, 1 designer, 1 PM assigned'
  ],
  actionItems: [
    'Review technical feasibility with engineering team by Friday',
    'Schedule beta partner meetings for next week',
    'Finalize resource allocation by end of month'
  ],
  closing: 'Best,\nRoberto'
};

export const mockActionItemsOutput: MockActionItemsOutput = {
  items: [
    {
      task: 'Review technical feasibility with engineering team',
      owner: 'John Smith',
      deadline: '2025-01-24',
      priority: 'high'
    },
    {
      task: 'Schedule beta partner meetings',
      owner: 'Sarah Johnson',
      deadline: '2025-01-27',
      priority: 'high'
    },
    {
      task: 'Finalize resource allocation',
      owner: 'Roberto',
      deadline: '2025-01-31',
      priority: 'medium'
    },
    {
      task: 'Create detailed technical specifications',
      owner: 'Engineering Team',
      deadline: '2025-02-05',
      priority: 'medium'
    },
    {
      task: 'Design mockups for key features',
      owner: 'Design Team',
      deadline: '2025-02-10',
      priority: 'low'
    }
  ]
};

export const mockLinkedInOutput: MockLinkedInOutput = {
  content: '🚀 Exciting roadmap ahead! Our Q4 strategy focuses on AI-powered features that will transform how teams collaborate. 50% engagement boost is the goal. Launching October 15th. Stay tuned! 💡\n\n#ProductManagement #AI #Innovation',
  hashtags: ['ProductManagement', 'AI', 'Innovation', 'TechLeadership'],
  characterCount: 248
};

// Mock Generated Outputs
export const mockGeneratedOutputs: GeneratedOutput[] = [
  {
    id: 'email-summary-abc123',
    conversationId: 'conv-1',
    type: 'email',
    title: 'Email Summary',
    preview: 'Hi team, I wanted to share the key points from our Q4 planning session today. We have aligned on an ambitious roadmap...',
    content: {
      subject: 'Q4 Product Roadmap - Key Highlights',
      greeting: 'Hi team,',
      body: [
        'I wanted to share the key points from our Q4 planning session today.',
        'We have aligned on an ambitious roadmap that focuses on AI-powered features to significantly increase user engagement.'
      ],
      keyPoints: [
        'Focus: AI-powered features targeting 50% engagement increase',
        'Key initiatives: Workflow automation, intelligent recommendations, real-time collaboration',
        'Timeline: Launch by October 15th to capture holiday season',
        'Resources: 2 engineers, 1 designer, 1 PM assigned'
      ],
      actionItems: [
        'Review technical feasibility with engineering team by Friday',
        'Schedule beta partner meetings for next week',
        'Finalize resource allocation by end of month'
      ],
      closing: 'Best,\nRoberto'
    } as EmailOutputContent,
    context: 'Focus on technical stakeholders, emphasize timeline and resources',
    generatedAt: new Date('2025-01-21T10:30:00'),
    createdBy: 'Roberto',
    metadata: {
      wordCount: 147,
      estimatedReadTime: 1,
      promptVersion: 'email-v1.2'
    }
  },
  {
    id: 'blog-post-xyz789',
    conversationId: 'conv-1',
    type: 'blogPost',
    title: 'Blog Post: Q4 Product Strategy',
    preview: 'The Future of Product Development: How AI-Powered Features are Reshaping User Engagement. In today\'s competitive landscape...',
    content: {
      headline: 'AI-Powered Features Reshape Engagement',
      subheading: 'A deep dive into our Q4 product strategy and what it means for the industry. In today\'s competitive landscape, user engagement isn\'t just a metric—it\'s the lifeblood of product success.',
      hook: 'After months of steady growth, we hit a plateau. Traditional optimization tactics weren\'t moving the needle. We needed a fundamentally different approach—and AI was the answer.',
      sections: [
        {
          heading: 'The Challenge: Breaking Through Engagement Plateaus',
          paragraphs: [
            'After months of steady growth, we hit a plateau. User engagement metrics flatlined, and traditional optimization tactics weren\'t moving the needle. We needed a fundamentally different approach.',
            'That\'s when we decided to bet big on AI-powered features. Not just cosmetic AI additions, but core functionality that would transform how users interact with our product.'
          ],
          bulletPoints: [
            'Traditional A/B testing showed diminishing returns',
            'User research revealed friction points in workflows',
            'Competitors were doubling down on automation'
          ]
        },
        {
          heading: 'The Solution: Three Pillars of AI Integration',
          paragraphs: [
            'Our roadmap focuses on three core areas where AI can deliver immediate value: workflow automation, intelligent recommendations, and real-time collaboration.'
          ],
          bulletPoints: [
            'Workflow automation using GPT-5 to analyze patterns',
            'Recommendations based on usage history and team patterns',
            'Real-time collaboration with conflict resolution'
          ],
          quotes: [
            {
              text: 'This isn\'t about adding AI for AI\'s sake. It\'s about solving real problems that users face every day.',
              attribution: 'Roberto, Product Lead'
            }
          ]
        }
      ],
      callToAction: 'Want to see these features in action? Sign up for our beta program and be the first to experience the future of product collaboration.',
      metadata: {
        wordCount: 847,
        targetAudience: 'Product Managers',
        tone: 'professional'
      },
      images: {
        hero: {
          prompt: 'Futuristic product dashboard with AI interface elements, clean modern design, blue and purple gradient',
          altText: 'AI-powered product interface concept'
        }
      }
    } as BlogPostOutputContent,
    generatedAt: new Date('2025-01-21T11:15:00'),
    metadata: {
      wordCount: 847,
      estimatedReadTime: 5
    }
  }
];

// Helper function to get outputs for a conversation
export function getOutputsByConversation(conversationId: string): GeneratedOutput[] {
  return mockGeneratedOutputs.filter(output => output.conversationId === conversationId);
}

// Helper function to get a specific output
export function getOutput(conversationId: string, outputId: string): GeneratedOutput | undefined {
  return mockGeneratedOutputs.find(output =>
    output.conversationId === conversationId && output.id === outputId
  );
}

// Helper function to get conversations by folder
export function getConversationsByFolder(folderId: string | null): MockConversation[] {
  return mockConversations.filter(conv => conv.folderId === folderId);
}

// Helper function to get recent conversations
export function getRecentConversations(limit: number = 5): MockConversation[] {
  return [...mockConversations]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// Helper function to format duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

// Helper function to format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
