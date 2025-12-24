'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Square, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import type { ActionItemsOutput, ActionItem } from '@transcribe/shared';

interface ActionItemsTemplateProps {
  data: ActionItemsOutput;
  /** Unique ID for persisting checkmark state */
  analysisId?: string;
}

// localStorage key prefix for action item completion state
const STORAGE_KEY_PREFIX = 'actionItems_completed_';

/**
 * Get the storage key for a specific analysis
 */
function getStorageKey(analysisId: string): string {
  return `${STORAGE_KEY_PREFIX}${analysisId}`;
}

/**
 * Load completed item indices from localStorage
 */
function loadCompletedItems(analysisId: string | undefined): Set<string> {
  if (!analysisId || typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(getStorageKey(analysisId));
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/**
 * Save completed item indices to localStorage
 */
function saveCompletedItems(analysisId: string | undefined, completed: Set<string>): void {
  if (!analysisId || typeof window === 'undefined') return;

  try {
    localStorage.setItem(getStorageKey(analysisId), JSON.stringify([...completed]));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// Priority order for sorting (high first)
const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// Priority badge styles
const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'High',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Medium',
  },
  low: {
    bg: 'bg-gray-100 dark:bg-gray-700/50',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Low',
  },
};

function sortByPriority(items: ActionItem[]): ActionItem[] {
  return [...items].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.priority] ?? 2;
    const priorityB = PRIORITY_ORDER[b.priority] ?? 2;
    return priorityA - priorityB;
  });
}

/**
 * Format a date string to a more readable format (e.g., "25 Dec 2025")
 * Handles various input formats: ISO dates, "YYYY-MM-DD", natural language, etc.
 */
function formatDeadline(deadline: string): string {
  // Try to parse as a date
  const date = new Date(deadline);

  // Check if it's a valid date
  if (!isNaN(date.getTime())) {
    // Format as "25 Dec 2025"
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // If not a valid date, return as-is (might be "ASAP", "Next week", etc.)
  return deadline;
}

interface ActionItemRowProps {
  item: ActionItem;
  /** Unique key for this item (used for persistence) */
  itemKey: string;
  /** Whether this item is completed */
  isCompleted: boolean;
  /** Callback when completion state changes */
  onToggleComplete: (itemKey: string) => void;
}

function ActionItemRow({ item, itemKey, isCompleted, onToggleComplete }: ActionItemRowProps) {
  const [showReason, setShowReason] = useState(false);

  // Build metadata parts (owner, deadline)
  const metadataParts: string[] = [];
  if (item.owner) metadataParts.push(item.owner);
  if (item.deadline) metadataParts.push(formatDeadline(item.deadline));

  const metadata = metadataParts.join(' · ');
  const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium;

  const handleToggleComplete = () => {
    onToggleComplete(itemKey);
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
      aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0 text-gray-400">
          {isCompleted ? (
            <CheckSquare className="w-5 h-5 text-emerald-500" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`leading-relaxed transition-all ${
              isCompleted
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {item.task}
          </p>

          {/* Metadata line with priority badge */}
          <div
            className={`flex items-center gap-2 mt-2 text-sm transition-all ${
              isCompleted
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {/* Priority badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
            >
              {priorityStyle.label}
            </span>

            {/* Expand reason button */}
            {item.priorityReason && (
              <button
                onClick={handleToggleReason}
                className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-expanded={showReason}
              >
                {showReason ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Why?</span>
              </button>
            )}

            {/* Owner and deadline */}
            {metadata && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className={isCompleted ? 'line-through' : ''}>{metadata}</span>
              </>
            )}
          </div>

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

interface ActionSectionProps {
  title: string;
  items: ActionItem[];
  accentColor: string;
  /** Prefix for item keys (e.g., "immediate", "short", "long") */
  sectionPrefix: string;
  /** Set of completed item keys */
  completedItems: Set<string>;
  /** Callback when an item is toggled */
  onToggleComplete: (itemKey: string) => void;
}

function ActionSection({
  title,
  items,
  accentColor,
  sectionPrefix,
  completedItems,
  onToggleComplete,
}: ActionSectionProps) {
  if (items.length === 0) return null;

  // Sort items by priority (high → medium → low)
  const sortedItems = sortByPriority(items);

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
        {sortedItems.map((item, index) => {
          const itemKey = `${sectionPrefix}_${index}`;
          return (
            <ActionItemRow
              key={itemKey}
              item={item}
              itemKey={itemKey}
              isCompleted={completedItems.has(itemKey)}
              onToggleComplete={onToggleComplete}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ActionItemsTemplate({ data, analysisId }: ActionItemsTemplateProps) {
  // Defensive: ensure arrays exist (AI might omit them if no items in category)
  const immediateActions = data.immediateActions || [];
  const shortTermActions = data.shortTermActions || [];
  const longTermActions = data.longTermActions || [];

  // State for completed items - initialized from localStorage
  const [completedItems, setCompletedItems] = useState<Set<string>>(() => new Set());

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadCompletedItems(analysisId);
    if (loaded.size > 0) {
      setCompletedItems(loaded);
    }
  }, [analysisId]);

  // Handle toggling completion state
  const handleToggleComplete = useCallback(
    (itemKey: string) => {
      setCompletedItems((prev) => {
        const next = new Set(prev);
        if (next.has(itemKey)) {
          next.delete(itemKey);
        } else {
          next.add(itemKey);
        }
        // Persist to localStorage
        saveCompletedItems(analysisId, next);
        return next;
      });
    },
    [analysisId],
  );

  const totalItems =
    immediateActions.length +
    shortTermActions.length +
    longTermActions.length;

  const completedCount = completedItems.size;

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
      {/* Minimal summary with progress */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {completedCount > 0 ? (
          <>
            {completedCount} of {totalItems} completed
          </>
        ) : (
          <>
            {totalItems} action item{totalItems !== 1 ? 's' : ''} extracted
          </>
        )}
      </p>

      {/* Action sections */}
      <ActionSection
        title="This week"
        items={immediateActions}
        accentColor="bg-red-500"
        sectionPrefix="immediate"
        completedItems={completedItems}
        onToggleComplete={handleToggleComplete}
      />
      <ActionSection
        title="This month"
        items={shortTermActions}
        accentColor="bg-amber-500"
        sectionPrefix="short"
        completedItems={completedItems}
        onToggleComplete={handleToggleComplete}
      />
      <ActionSection
        title="Long term"
        items={longTermActions}
        accentColor="bg-emerald-500"
        sectionPrefix="long"
        completedItems={completedItems}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}
