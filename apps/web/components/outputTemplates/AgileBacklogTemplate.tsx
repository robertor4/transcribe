'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import type { AgileBacklogOutput, UserStory, Epic } from '@transcribe/shared';
import { userStoryToHtml, userStoryToMarkdown } from '@/lib/outputToMarkdown';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialCollapsible,
  EditorialPullQuote,
  EditorialParagraphs,
  EDITORIAL,
} from './shared';

interface AgileBacklogTemplateProps {
  data: AgileBacklogOutput;
  analysisId?: string;
}

// Priority badge styles
const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'must-have': {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Must Have',
  },
  'should-have': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Should Have',
  },
  'could-have': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'Could Have',
  },
  'wont-have': {
    bg: 'bg-gray-100 dark:bg-gray-700/50',
    text: 'text-gray-600 dark:text-gray-400',
    label: "Won't Have",
  },
};

interface TranslationStrings {
  acceptanceCriteria: string;
  technicalDetails: string;
  technicalNotes: string;
  dependencies: string;
  stories: string;
  copyStory: string;
  copied: string;
}

interface UserStoryCardProps {
  story: UserStory;
  t: TranslationStrings;
}

function UserStoryCard({ story, t }: UserStoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const priorityStyle = story.priority ? PRIORITY_STYLES[story.priority] : null;
  const hasDetails =
    (story.technicalNotes && story.technicalNotes.length > 0) ||
    (story.dependencies && story.dependencies.length > 0);

  const handleCopyStory = async () => {
    try {
      const html = userStoryToHtml(story);
      const plainText = userStoryToMarkdown(story);

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy story:', err);
    }
  };

  return (
    <div className="border-l-2 border-l-gray-300 dark:border-l-gray-600 pl-5 py-3 group">
      {/* Header with ID and title */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {story.id}
          </span>
          <h4 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">{story.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyStory}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={copied ? t.copied : t.copyStory}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {priorityStyle && (
            <span
              className={`inline-flex items-center flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
            >
              {priorityStyle.label}
            </span>
          )}
        </div>
      </div>

      {/* User story statement */}
      <div className={`mb-4 ${EDITORIAL.body} [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100`}>
        <ReactMarkdown>{story.statement}</ReactMarkdown>
      </div>

      {/* Acceptance criteria */}
      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div className="mb-4 pl-4 border-l-2 border-[#14D0DC]/30">
          <h5 className={`${EDITORIAL.sectionLabel} mb-3`}>
            {t.acceptanceCriteria}
          </h5>
          <ul className="space-y-2">
            {story.acceptanceCriteria.map((ac, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#14D0DC] flex-shrink-0 mt-0.5" />
                <span className={EDITORIAL.listItem}>{ac.criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable details (technical notes, dependencies) */}
      {hasDetails && (
        <div className={`mt-4 pt-4 ${EDITORIAL.sectionBorder}`}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showDetails ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>{t.technicalDetails}</span>
          </button>

          {showDetails && (
            <div className="mt-2 space-y-3">
              {/* Technical notes */}
              {story.technicalNotes && story.technicalNotes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>{t.technicalNotes}</span>
                  </div>
                  <ul className="space-y-1 pl-5">
                    {story.technicalNotes.map((note, index) => (
                      <li key={index} className={`list-disc ${EDITORIAL.listItem}`}>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dependencies */}
              {story.dependencies && story.dependencies.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{t.dependencies}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {story.dependencies.map((dep, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EpicSectionProps {
  epic: Epic;
  defaultExpanded?: boolean;
  t: TranslationStrings;
}

function EpicSection({ epic, defaultExpanded = true, t }: EpicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-10 last:mb-0">
      {/* Epic header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {epic.id}
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{epic.title}</h3>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              ({epic.stories?.length || 0} {t.stories})
            </span>
          </div>
          <p className={`${EDITORIAL.body} mt-1`}>{epic.description}</p>
        </div>
      </button>

      {/* Stories */}
      {isExpanded && epic.stories && epic.stories.length > 0 && (
        <div className="mt-5 ml-6 space-y-5">
          {epic.stories.map((story) => (
            <UserStoryCard key={story.id} story={story} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AgileBacklogTemplate({ data }: AgileBacklogTemplateProps) {
  const tRaw = useTranslations('aiAssets.templates.agileBacklog');

  // Build translation strings object for sub-components
  const t: TranslationStrings = {
    acceptanceCriteria: tRaw('acceptanceCriteria'),
    technicalDetails: tRaw('technicalDetails'),
    technicalNotes: tRaw('technicalNotes'),
    dependencies: tRaw('dependencies'),
    stories: tRaw('stories'),
    copyStory: tRaw('copyStory'),
    copied: tRaw('copied'),
  };

  // Defensive: ensure arrays exist
  const epics = data.epics || [];
  const standaloneStories = data.standaloneStories || [];

  const totalEpics = epics.length;
  const totalStoriesInEpics = epics.reduce((acc, epic) => acc + (epic.stories?.length || 0), 0);
  const totalStandaloneStories = standaloneStories.length;
  const totalStories = totalStoriesInEpics + totalStandaloneStories;

  if (totalStories === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {tRaw('noStoriesFound')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          {tRaw('noStoriesDescription')}
        </p>
      </div>
    );
  }

  const metadata = (
    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5" />
        {totalEpics} {totalEpics !== 1 ? 'epics' : 'epic'}
      </span>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span>
        {totalStories} {totalStories !== 1 ? tRaw('userStories') : tRaw('userStory')}
      </span>
    </div>
  );

  return (
    <EditorialArticle>
      <EditorialTitle title={tRaw('name')} metadata={metadata} />

      {/* Summary — pull-quote style */}
      {data.summary && (
        <EditorialPullQuote>
          <EditorialParagraphs text={data.summary} />
        </EditorialPullQuote>
      )}

      {/* Epics */}
      {epics.length > 0 && (
        <EditorialSection label={tRaw('epics')} icon={Layers}>
          {epics.map((epic) => (
            <EpicSection key={epic.id} epic={epic} t={t} />
          ))}
        </EditorialSection>
      )}

      {/* Standalone Stories */}
      {standaloneStories.length > 0 && (
        <EditorialCollapsible
          label={tRaw('standaloneStories')}
          count={totalStandaloneStories}
          defaultOpen={epics.length === 0}
        >
          <div className="space-y-5">
            {standaloneStories.map((story) => (
              <UserStoryCard key={story.id} story={story} t={t} />
            ))}
          </div>
        </EditorialCollapsible>
      )}
    </EditorialArticle>
  );
}
