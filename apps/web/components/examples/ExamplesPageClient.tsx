'use client';

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { CheckSquare, Mail, FileText, Linkedin, MessageSquare } from 'lucide-react';

import { ExampleCard } from './ExampleCard';
import { ActionItemsExample } from './templates/ActionItemsExample';
import { EmailExample } from './templates/EmailExample';
import { BlogPostExample } from './templates/BlogPostExample';
import { LinkedInExample } from './templates/LinkedInExample';
import { CommunicationAnalysisExample } from './templates/CommunicationAnalysisExample';
import { type ScenarioKey } from './exampleData';

// Animation timing constants
const CARD_STAGGER_MS = 200;     // Between card entrances

// Brand colors
const COLORS = {
  actionItems: '#14D0DC',   // Cyan
  email: '#8D6AFA',         // Brand purple
  blogPost: '#3F38A0',      // Deep purple
  linkedin: '#0A66C2',      // LinkedIn blue
  communicationAnalysis: '#8D6AFA', // Brand purple
};

// Translated content interfaces
interface ActionItemContent {
  task: string;
  owner: string;
  deadline: string;
}

interface EmailContent {
  subject: string;
  greeting: string;
  intro: string;
  decisionsLabel: string;
  decisions: string[];
  closing: string;
  signature: { name: string; title: string; initials: string };
}

interface BlogPostContent {
  headline: string;
  subheading: string;
  hook: string;
  body: string;
  quote: { text: string; attribution: string };
  imageAlt: string;
}

interface LinkedInContent {
  hook: string;
  bullets: string[];
  result: string;
  callToAction: string;
  author: { name: string; title: string; initials: string };
}

interface CommunicationAnalysisContent {
  overallAssessment: string;
  dimensions: {
    clarity: { name: string; strength: string; improvement: string };
    activeListening: { name: string; strength: string; improvement: string };
  };
}

interface ScenarioContent {
  actionItems: { items: ActionItemContent[] };
  email: EmailContent;
  blogPost: BlogPostContent;
  linkedin?: LinkedInContent;
  communicationAnalysis?: CommunicationAnalysisContent;
}

interface ExamplesPageClientProps {
  translations: {
    actionItems: string;
    email: string;
    blogPost: string;
    linkedin: string;
    communicationAnalysis: string;
  };
  scenarioLabels: {
    productLaunch: string;
    clientDiscovery: string;
  };
  content: {
    productLaunch: ScenarioContent;
    clientDiscovery: ScenarioContent;
  };
}

export function ExamplesPageClient({ translations, scenarioLabels, content }: ExamplesPageClientProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: '-100px' });
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('productLaunch');
  const [animationKey, setAnimationKey] = useState(0);

  // Reset animation when scenario changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [activeScenario]);

  const currentContent = content[activeScenario];

  // Build action items data with priorities (static)
  const actionItemsData = {
    type: 'actionItems' as const,
    items: currentContent.actionItems.items.map((item, idx) => ({
      ...item,
      priority: idx < 2 ? 'high' as const : idx < 4 ? 'medium' as const : 'low' as const,
    })),
  };

  // Build email data
  const emailData = {
    type: 'email' as const,
    subject: currentContent.email.subject,
    greeting: currentContent.email.greeting,
    intro: currentContent.email.intro,
    decisionsLabel: currentContent.email.decisionsLabel,
    decisions: currentContent.email.decisions,
    actionItems: [], // Not shown in condensed view
    nextSteps: '',
    closing: currentContent.email.closing,
    signature: currentContent.email.signature,
  };

  // Build blog post data
  const blogPostData = {
    type: 'blogPost' as const,
    headline: currentContent.blogPost.headline,
    subheading: currentContent.blogPost.subheading,
    hook: currentContent.blogPost.hook,
    body: currentContent.blogPost.body,
    quote: currentContent.blogPost.quote,
    callToAction: '',
    image: {
      url: activeScenario === 'productLaunch'
        ? '/assets/images/blog-example-abstract.webp'
        : '/assets/images/blog-example-discovery.webp',
      alt: currentContent.blogPost.imageAlt,
    },
  };

  // Build LinkedIn data (only for productLaunch)
  const linkedInData = currentContent.linkedin ? {
    type: 'linkedin' as const,
    hook: currentContent.linkedin.hook,
    bullets: currentContent.linkedin.bullets,
    result: currentContent.linkedin.result,
    callToAction: currentContent.linkedin.callToAction,
    hashtags: ['ProductLaunch', 'Startups', 'ProductManagement', 'Leadership'],
    author: currentContent.linkedin.author,
    timestamp: '2h',
    engagement: { likes: 847, comments: 52 },
  } : null;

  // Build communication analysis data (only for clientDiscovery)
  const communicationAnalysisData = currentContent.communicationAnalysis ? {
    type: 'communicationAnalysis' as const,
    overallScore: 78,
    dimensions: [
      {
        name: currentContent.communicationAnalysis.dimensions.clarity.name,
        score: 85,
        strengths: [currentContent.communicationAnalysis.dimensions.clarity.strength],
        improvements: [currentContent.communicationAnalysis.dimensions.clarity.improvement],
      },
      {
        name: currentContent.communicationAnalysis.dimensions.activeListening.name,
        score: 82,
        strengths: [currentContent.communicationAnalysis.dimensions.activeListening.strength],
        improvements: [currentContent.communicationAnalysis.dimensions.activeListening.improvement],
      },
    ],
    overallAssessment: currentContent.communicationAnalysis.overallAssessment,
    keyTakeaway: '',
  } : null;

  // Base cards that are the same for both scenarios
  const actionItemsCard = {
    key: 'actionItems',
    title: translations.actionItems,
    icon: CheckSquare,
    color: COLORS.actionItems,
    component: (
      <ActionItemsExample
        key={`actionItems-${animationKey}`}
        data={actionItemsData}
        isActive={isInView}
      />
    ),
  };

  const emailCard = {
    key: 'email',
    title: translations.email,
    icon: Mail,
    color: COLORS.email,
    component: (
      <EmailExample
        key={`email-${animationKey}`}
        data={emailData}
        isActive={isInView}
      />
    ),
  };

  const blogPostCard = {
    key: 'blogPost',
    title: translations.blogPost,
    icon: FileText,
    color: COLORS.blogPost,
    component: (
      <BlogPostExample
        key={`blogPost-${animationKey}`}
        data={blogPostData}
        isActive={isInView}
      />
    ),
  };

  const linkedInCard = linkedInData ? {
    key: 'linkedin',
    title: translations.linkedin,
    icon: Linkedin,
    color: COLORS.linkedin,
    component: (
      <LinkedInExample
        key={`linkedin-${animationKey}`}
        data={linkedInData}
        isActive={isInView}
      />
    ),
  } : null;

  const communicationAnalysisCard = communicationAnalysisData ? {
    key: 'communicationAnalysis',
    title: translations.communicationAnalysis,
    icon: MessageSquare,
    color: COLORS.communicationAnalysis,
    component: (
      <CommunicationAnalysisExample
        key={`communicationAnalysis-${animationKey}`}
        data={communicationAnalysisData}
        isActive={isInView}
      />
    ),
  } : null;

  // Different card order based on scenario
  // Product Launch: Action Items, Email, Blog Post, LinkedIn
  // Client Discovery: Action Items, Email, Communication Analysis, Blog Post
  const cards = activeScenario === 'productLaunch'
    ? [actionItemsCard, emailCard, blogPostCard, linkedInCard].filter((card): card is NonNullable<typeof card> => card !== null)
    : [actionItemsCard, emailCard, communicationAnalysisCard, blogPostCard].filter((card): card is NonNullable<typeof card> => card !== null);

  const scenarioOptions: { key: ScenarioKey; label: string }[] = [
    { key: 'productLaunch', label: scenarioLabels.productLaunch },
    { key: 'clientDiscovery', label: scenarioLabels.clientDiscovery },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Scenario Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-full">
          {scenarioOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveScenario(option.key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                activeScenario === option.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
      >
        {cards.map((card, index) => (
          <ExampleCard
            key={card.key}
            title={card.title}
            icon={card.icon}
            accentColor={card.color}
            delay={index * CARD_STAGGER_MS}
            isInView={isInView}
          >
            {card.component}
          </ExampleCard>
        ))}
      </div>
    </div>
  );
}

export default ExamplesPageClient;
