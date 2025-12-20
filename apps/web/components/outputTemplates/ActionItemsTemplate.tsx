'use client';

import { useState } from 'react';
import { CheckCircle2, Square, CheckSquare } from 'lucide-react';
import type { ActionItemsOutput, ActionItem } from '@transcribe/shared';

interface ActionItemsTemplateProps {
  data: ActionItemsOutput;
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const [completed, setCompleted] = useState(false);
  const [showReason, setShowReason] = useState(false);

  // Build metadata parts (owner, deadline)
  const metadataParts: string[] = [];
  if (item.owner) metadataParts.push(item.owner);
  if (item.deadline) metadataParts.push(item.deadline);

  const metadata = metadataParts.join(' · ');

  const handleToggleComplete = () => {
    setCompleted(!completed);
  };

  const handleToggleReason = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReason(!showReason);
  };

  return (
    <div
      className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors"
      onClick={handleToggleComplete}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggleComplete();
        }
      }}
      aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0 text-gray-400">
          {completed ? (
            <CheckSquare className="w-5 h-5 text-emerald-500" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`leading-relaxed transition-all ${
              completed
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {item.task}
          </p>

          {/* Metadata line with inline "Why priority?" link */}
          {(metadata || item.priorityReason) && (
            <p
              className={`text-sm mt-1 transition-all ${
                completed
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className={completed ? 'line-through' : ''}>{metadata}</span>
              {metadata && item.priorityReason && <span className="mx-2 text-base">•</span>}
              {item.priorityReason && (
                <button
                  onClick={handleToggleReason}
                  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showReason ? 'Hide' : `Why ${item.priority} priority?`}
                </button>
              )}
            </p>
          )}

          {/* Expanded priority reason */}
          {showReason && item.priorityReason && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              {item.priorityReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionSection({
  title,
  items,
  accentColor,
}: {
  title: string;
  items: ActionItem[];
  accentColor: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${accentColor}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-sm text-gray-400 dark:text-gray-500">({items.length})</span>
      </div>
      <div className="bg-white dark:bg-gray-800/50 rounded-lg px-4">
        {items.map((item, index) => (
          <ActionItemRow key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

export function ActionItemsTemplate({ data }: ActionItemsTemplateProps) {
  const totalItems =
    data.immediateActions.length +
    data.shortTermActions.length +
    data.longTermActions.length;

  if (totalItems === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No action items found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          This conversation didn&apos;t contain any explicit action items or commitments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Minimal summary */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {totalItems} action item{totalItems !== 1 ? 's' : ''} extracted
      </p>

      {/* Action sections */}
      <ActionSection
        title="This week"
        items={data.immediateActions}
        accentColor="bg-red-500"
      />
      <ActionSection
        title="This month"
        items={data.shortTermActions}
        accentColor="bg-amber-500"
      />
      <ActionSection
        title="Long term"
        items={data.longTermActions}
        accentColor="bg-emerald-500"
      />
    </div>
  );
}
