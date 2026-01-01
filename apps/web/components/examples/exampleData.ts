/**
 * Mock data for the Examples page showcase.
 *
 * Two scenarios:
 * 1. Product Launch Meeting - PM planning a Q1 launch
 * 2. Client Discovery Call - Consultant gathering requirements
 *
 * All content follows brand voice guidelines:
 * - Short sentences, active voice
 * - No emojis, no exclamation marks
 * - Professional but human tone
 * - No buzzwords or AI self-reference
 */

export type ScenarioKey = 'productLaunch' | 'clientDiscovery';

export interface Scenario {
  key: ScenarioKey;
  actionItems: ActionItemsExampleData;
  email: EmailExampleData;
  blogPost: BlogPostExampleData;
  linkedin?: LinkedInExampleData;
  communicationAnalysis?: CommunicationAnalysisExampleData;
}

export interface ActionItemData {
  task: string;
  owner: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActionItemsExampleData {
  type: 'actionItems';
  items: ActionItemData[];
}

export interface EmailExampleData {
  type: 'email';
  subject: string;
  greeting: string;
  intro: string;
  decisionsLabel?: string;
  decisions: string[];
  actionItems: { task: string; owner: string }[];
  nextSteps: string;
  closing: string;
  signature: {
    name: string;
    title: string;
    initials: string;
  };
}

export interface BlogPostExampleData {
  type: 'blogPost';
  headline: string;
  subheading: string;
  hook: string;
  body: string;
  quote: {
    text: string;
    attribution: string;
  };
  callToAction: string;
  image: {
    url: string;
    alt: string;
  };
}

export interface LinkedInExampleData {
  type: 'linkedin';
  hook: string;
  bullets: string[];
  result: string;
  callToAction: string;
  hashtags: string[];
  author: {
    name: string;
    title: string;
    initials: string;
  };
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
  };
}

export interface CommunicationDimensionData {
  name: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface CommunicationAnalysisExampleData {
  type: 'communicationAnalysis';
  overallScore: number;
  dimensions: CommunicationDimensionData[];
  overallAssessment: string;
  keyTakeaway: string;
}

export type ExampleData =
  | ActionItemsExampleData
  | EmailExampleData
  | BlogPostExampleData
  | LinkedInExampleData
  | CommunicationAnalysisExampleData;

export const actionItemsExample: ActionItemsExampleData = {
  type: 'actionItems',
  items: [
    {
      task: 'Finalize Q1 launch timeline and share with stakeholders',
      owner: 'Sarah',
      deadline: 'Jan 8',
      priority: 'high',
    },
    {
      task: 'Review beta feedback and prioritize bug fixes',
      owner: 'Dev Team',
      deadline: 'Jan 10',
      priority: 'high',
    },
    {
      task: 'Prepare press release and media kit',
      owner: 'Marketing',
      deadline: 'Jan 20',
      priority: 'medium',
    },
    {
      task: 'Schedule customer webinar for launch week',
      owner: 'CS Team',
      deadline: 'Jan 25',
      priority: 'medium',
    },
    {
      task: 'Plan Phase 2 feature rollout',
      owner: 'Product',
      deadline: 'Mar 1',
      priority: 'low',
    },
  ],
};

export const emailExample: EmailExampleData = {
  type: 'email',
  subject: 'Product Launch Planning - Next Steps',
  greeting: 'Hi team,',
  intro: 'Here\'s the recap from today\'s meeting on our Q1 product launch.',
  decisions: [
    'Launch date confirmed for January 28th',
    'Beta program extended by one week for additional testing',
    'Marketing budget approved for influencer campaign',
  ],
  actionItems: [
    { task: 'Finalize launch timeline', owner: 'Sarah' },
    { task: 'Complete bug fixes from beta', owner: 'Dev Team' },
    { task: 'Prepare press release', owner: 'Marketing' },
  ],
  nextSteps: 'Let\'s reconvene next Tuesday to review progress. Flag any blockers before then.',
  closing: 'Thanks everyone.',
  signature: {
    name: 'Sarah Mitchell',
    title: 'Product Manager',
    initials: 'SM',
  },
};

export const blogPostExample: BlogPostExampleData = {
  type: 'blogPost',
  headline: 'What We Learned Shipping in January',
  subheading: 'Lessons from our team on building momentum before day one',
  hook: 'The old playbook says wait until perfect. We tried something different.',
  body: 'Our beta testers weren\'t just finding bugs. They were shaping the product direction. Their feedback led us to pivot our onboarding flow entirely. The result: a 40% improvement in activation rates before we even launched.',
  quote: {
    text: 'The product felt like it was built for us, not just sold to us.',
    attribution: 'Beta User',
  },
  callToAction: 'Want early access to our next feature? Join our beta program today.',
  image: {
    url: '/assets/images/blog-example-abstract.webp',
    alt: 'Abstract geometric shapes representing innovation',
  },
};

export const linkedInExample: LinkedInExampleData = {
  type: 'linkedin',
  hook: 'We almost delayed our launch by 3 months.',
  bullets: [
    'Beta feedback > internal assumptions',
    'Momentum beats perfection',
    'Your first users define your product',
  ],
  result: '2,000 signups in the first week. Not because we were perfect. Because we were present.',
  callToAction: 'What\'s the biggest lesson from your last launch?',
  hashtags: ['ProductLaunch', 'Startups', 'ProductManagement', 'Leadership'],
  author: {
    name: 'Sarah Mitchell',
    title: 'Product Manager at TechFlow',
    initials: 'SM',
  },
  timestamp: '2h',
  engagement: {
    likes: 847,
    comments: 52,
  },
};

// ============================================
// SCENARIO 2: Client Discovery Call
// A consultant gathering requirements from a potential client
// ============================================

export const discoveryActionItemsExample: ActionItemsExampleData = {
  type: 'actionItems',
  items: [
    {
      task: 'Send proposal with three package options',
      owner: 'Marcus',
      deadline: 'Jan 15',
      priority: 'high',
    },
    {
      task: 'Schedule technical deep-dive with their CTO',
      owner: 'Marcus',
      deadline: 'Jan 12',
      priority: 'high',
    },
    {
      task: 'Prepare case study from similar fintech project',
      owner: 'Team',
      deadline: 'Jan 14',
      priority: 'medium',
    },
    {
      task: 'Draft timeline for Q2 implementation',
      owner: 'Marcus',
      deadline: 'Jan 18',
      priority: 'medium',
    },
    {
      task: 'Research their competitor landscape',
      owner: 'Research',
      deadline: 'Jan 20',
      priority: 'low',
    },
  ],
};

export const discoveryEmailExample: EmailExampleData = {
  type: 'email',
  subject: 'Great speaking with you - Next steps',
  greeting: 'Hi David,',
  intro: 'Thank you for taking the time to walk me through your challenges today. Your team\'s situation is exactly the kind of problem we specialize in solving.',
  decisions: [
    'Mobile-first approach aligned with your user demographics',
    'Phased rollout starting with core payment features',
    'Integration with your existing Salesforce instance',
  ],
  actionItems: [
    { task: 'Send proposal with pricing options', owner: 'Marcus' },
    { task: 'Schedule technical review', owner: 'Marcus' },
    { task: 'Share relevant case studies', owner: 'Team' },
  ],
  nextSteps: 'I\'ll have a detailed proposal in your inbox by Wednesday. Happy to jump on a quick call Thursday to walk through it together.',
  closing: 'Looking forward to the possibility of working together.',
  signature: {
    name: 'Marcus Chen',
    title: 'Senior Consultant',
    initials: 'MC',
  },
};

export const discoveryBlogPostExample: BlogPostExampleData = {
  type: 'blogPost',
  headline: 'The Discovery Call That Changed How I Sell',
  subheading: 'Why listening beats pitching every time',
  hook: 'I used to walk into discovery calls with a deck. Now I walk in with questions.',
  body: 'The client mentioned their real problem 47 minutes in. If I had been pitching, I would have missed it entirely. Their team wasn\'t struggling with technology. They were drowning in manual processes that nobody had time to fix. That insight shaped our entire proposal.',
  quote: {
    text: 'You understood our problem before we finished explaining it.',
    attribution: 'Client Feedback',
  },
  callToAction: 'What\'s the most surprising insight you\'ve uncovered in a client conversation?',
  image: {
    url: '/assets/images/blog-example-discovery.webp',
    alt: 'Abstract shapes representing conversation and connection',
  },
};

export const discoveryCommunicationExample: CommunicationAnalysisExampleData = {
  type: 'communicationAnalysis',
  overallScore: 78,
  dimensions: [
    {
      name: 'Clarity',
      score: 85,
      strengths: ['Questions were specific and actionable'],
      improvements: ['Summarize key points before moving on'],
    },
    {
      name: 'Active Listening',
      score: 82,
      strengths: ['Built on client responses naturally'],
      improvements: ['Pause longer after complex answers'],
    },
    {
      name: 'Empathy',
      score: 75,
      strengths: ['Acknowledged their timeline pressures'],
      improvements: ['Explore the why behind stated needs'],
    },
    {
      name: 'Persuasiveness',
      score: 70,
      strengths: ['Connected features to their pain points'],
      improvements: ['Use more concrete success metrics'],
    },
  ],
  overallAssessment: 'Strong discovery skills with room to deepen client understanding. You ask good questions but could let answers breathe more.',
  keyTakeaway: 'Add a 3-second pause after each client response before your next question.',
};

// ============================================
// SCENARIO COLLECTIONS
// ============================================

export const productLaunchScenario: Scenario = {
  key: 'productLaunch',
  actionItems: actionItemsExample,
  email: emailExample,
  blogPost: blogPostExample,
  linkedin: linkedInExample,
};

export const clientDiscoveryScenario: Scenario = {
  key: 'clientDiscovery',
  actionItems: discoveryActionItemsExample,
  email: discoveryEmailExample,
  blogPost: discoveryBlogPostExample,
  communicationAnalysis: discoveryCommunicationExample,
};

export const scenarios: Record<ScenarioKey, Scenario> = {
  productLaunch: productLaunchScenario,
  clientDiscovery: clientDiscoveryScenario,
};

// Legacy export for backwards compatibility
export const allExamples = {
  actionItems: actionItemsExample,
  email: emailExample,
  blogPost: blogPostExample,
  linkedin: linkedInExample,
} as const;
