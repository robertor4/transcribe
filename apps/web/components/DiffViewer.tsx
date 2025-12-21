'use client';

import React, { useState } from 'react';
import { TranscriptDiff } from '@transcribe/shared';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as Diff from 'diff';

interface DiffViewerProps {
  diff: TranscriptDiff[];
  summary: {
    totalChanges: number;
    affectedSegments: number;
  };
}

/**
 * Renders word-level diff highlighting between old and new text
 */
function renderWordDiff(oldText: string, newText: string, type: 'removed' | 'added') {
  const changes = Diff.diffWords(oldText, newText);

  return (
    <div className="text-sm leading-relaxed">
      {changes.map((part, index) => {
        if (type === 'removed') {
          // For removed section, show removed (red) and unchanged (normal)
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-0.5 rounded"
              >
                {part.value}
              </span>
            );
          } else if (!part.added) {
            return (
              <span key={index} className="text-gray-700 dark:text-gray-300">
                {part.value}
              </span>
            );
          }
          return null;
        } else {
          // For added section, show added (green) and unchanged (normal)
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200 px-0.5 rounded"
              >
                {part.value}
              </span>
            );
          } else if (!part.removed) {
            return (
              <span key={index} className="text-gray-700 dark:text-gray-300">
                {part.value}
              </span>
            );
          }
          return null;
        }
      })}
    </div>
  );
}

export default function DiffViewer({ diff, summary }: DiffViewerProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(
    new Set(diff.map((_, idx) => idx)) // Expand all by default
  );

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  const toggleAll = () => {
    if (expandedSegments.size === diff.length) {
      setExpandedSegments(new Set()); // Collapse all
    } else {
      setExpandedSegments(new Set(diff.map((_, idx) => idx))); // Expand all
    }
  };

  if (diff.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 text-center text-gray-700 dark:text-gray-300">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No changes detected</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          The AI did not find any text to modify based on your instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Banner */}
      <div className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-sm font-semibold text-blue-700 dark:text-blue-300">
            {summary.totalChanges}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {summary.totalChanges} {summary.totalChanges === 1 ? 'change' : 'changes'} found
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Across {summary.affectedSegments}{' '}
              {summary.affectedSegments === 1 ? 'segment' : 'segments'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleAll}
          className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
        >
          {expandedSegments.size === diff.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Diff List */}
      <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        {diff.map((change, index) => {
          const isExpanded = expandedSegments.has(index);

          return (
            <div
              key={index}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => toggleSegment(index)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {change.speakerTag}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{change.timestamp}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Content */}
              {isExpanded && (
                <div className="border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 space-y-2">
                  {/* Old Text (Removed) - with word-level highlighting */}
                  <div className="rounded bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-red-800 dark:text-red-300">
                        − Removed
                      </span>
                    </div>
                    {renderWordDiff(change.oldText, change.newText, 'removed')}
                  </div>

                  {/* New Text (Added) - with word-level highlighting */}
                  <div className="rounded bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-800 dark:text-green-300">
                        + Added
                      </span>
                    </div>
                    {renderWordDiff(change.oldText, change.newText, 'added')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
