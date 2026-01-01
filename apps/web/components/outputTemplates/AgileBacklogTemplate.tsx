'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Code,
} from 'lucide-react';
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

interface UserStoryCardProps {
  story: UserStory;
}

function UserStoryCard({ story }: UserStoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const priorityStyle = story.priority ? PRIORITY_STYLES[story.priority] : null;
  const hasDetails =
    (story.technicalNotes && story.technicalNotes.length > 0) ||
    (story.dependencies && story.dependencies.length > 0);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50">
      {/* Header with ID and title */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
            {story.id}
          </span>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{story.title}</h4>
        </div>
        {priorityStyle && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            {priorityStyle.label}
          </span>
        )}
      </div>

      {/* User story statement */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm">
        <p className="text-gray-700 dark:text-gray-300">
          <span className="font-medium text-gray-900 dark:text-gray-100">As a</span>{' '}
          {story.asA},{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">I want</span>{' '}
          {story.iWant},{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">so that</span>{' '}
          {story.soThat}.
        </p>
      </div>

      {/* Acceptance criteria */}
      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Acceptance Criteria
          </h5>
          <ul className="space-y-1.5">
            {story.acceptanceCriteria.map((ac, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{ac.criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable details (technical notes, dependencies) */}
      {hasDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showDetails ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>Technical details</span>
          </button>

          {showDetails && (
            <div className="mt-2 space-y-3">
              {/* Technical notes */}
              {story.technicalNotes && story.technicalNotes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>Technical Notes</span>
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
                    <span>Dependencies</span>
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
}

function EpicSection({ epic, defaultExpanded = true }: EpicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-6 last:mb-0">
      {/* Epic header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-200 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300">
              {epic.id}
            </span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{epic.title}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({epic.stories?.length || 0} stories)
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{epic.description}</p>
        </div>
      </button>

      {/* Stories */}
      {isExpanded && epic.stories && epic.stories.length > 0 && (
        <div className="mt-3 ml-6 space-y-3">
          {epic.stories.map((story) => (
            <UserStoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AgileBacklogTemplate({ data }: AgileBacklogTemplateProps) {
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
          No user stories found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          This conversation didn&apos;t contain any explicit product features or requirements to
          extract.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-700 dark:text-gray-300">{data.summary}</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          <span>
            {totalEpics} epic{totalEpics !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>
          {totalStories} user stor{totalStories !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Epics */}
      {epics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
            Epics
          </h2>
          {epics.map((epic) => (
            <EpicSection key={epic.id} epic={epic} />
          ))}
        </div>
      )}

      {/* Standalone Stories */}
      {standaloneStories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
            Standalone Stories
          </h2>
          <div className="space-y-3">
            {standaloneStories.map((story) => (
              <UserStoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
