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
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import type { AgileBacklogOutput, UserStory, Epic } from '@transcribe/shared';

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
}

interface UserStoryCardProps {
  story: UserStory;
  t: TranslationStrings;
}

function UserStoryCard({ story, t }: UserStoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const priorityStyle = story.priority ? PRIORITY_STYLES[story.priority] : null;
  const hasDetails =
    (story.technicalNotes && story.technicalNotes.length > 0) ||
    (story.dependencies && story.dependencies.length > 0);

  return (
    <div className="border-l-2 border-l-[#8D6AFA]/30 border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800/50">
      {/* Header with ID and title */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 text-[#8D6AFA] dark:text-[#8D6AFA]">
            {story.id}
          </span>
          <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">{story.title}</h4>
        </div>
        {priorityStyle && (
          <span
            className={`inline-flex items-center flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            {priorityStyle.label}
          </span>
        )}
      </div>

      {/* User story statement */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-700 dark:text-gray-300 [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100">
        <ReactMarkdown>{story.statement}</ReactMarkdown>
      </div>

      {/* Acceptance criteria */}
      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div className="mb-4 pl-4 border-l-2 border-[#14D0DC]/30">
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t.acceptanceCriteria}
          </h5>
          <ul className="space-y-2">
            {story.acceptanceCriteria.map((ac, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#14D0DC] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{ac.criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable details (technical notes, dependencies) */}
      {hasDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
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
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 pl-5">
                    {story.technicalNotes.map((note, index) => (
                      <li key={index} className="list-disc">
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
    <div className="mb-8 last:mb-0">
      {/* Epic header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 rounded-lg hover:bg-[#8D6AFA]/10 dark:hover:bg-[#8D6AFA]/20 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-[#8D6AFA]" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#8D6AFA]" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#8D6AFA]/20 dark:bg-[#8D6AFA]/30 text-[#8D6AFA]">
              {epic.id}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{epic.title}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({epic.stories?.length || 0} {t.stories})
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{epic.description}</p>
        </div>
      </button>

      {/* Stories */}
      {isExpanded && epic.stories && epic.stories.length > 0 && (
        <div className="mt-4 ml-8 space-y-4">
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          <span>
            {totalEpics} {totalEpics !== 1 ? 'epics' : 'epic'}
          </span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>
          {totalStories} {totalStories !== 1 ? tRaw('userStories') : tRaw('userStory')}
        </span>
      </div>

      {/* Epics */}
      {epics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
            {tRaw('epics')}
          </h2>
          {epics.map((epic) => (
            <EpicSection key={epic.id} epic={epic} t={t} />
          ))}
        </div>
      )}

      {/* Standalone Stories */}
      {standaloneStories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
            {tRaw('standaloneStories')}
          </h2>
          <div className="space-y-4">
            {standaloneStories.map((story) => (
              <UserStoryCard key={story.id} story={story} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
