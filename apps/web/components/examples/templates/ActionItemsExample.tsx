'use client';

import { useState, useCallback } from 'react';
import { CheckSquare } from 'lucide-react';
import { TypewriterText } from '../TypewriterText';
import type { ActionItemsExampleData, ActionItemData } from '../exampleData';

// Priority badge styles (matches ActionItemsTemplate.tsx)
const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'High',
  },
  medium: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Medium',
  },
  low: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: 'Low',
  },
};

interface ActionItemRowProps {
  item: ActionItemData;
  isActive: boolean;
  onComplete: () => void;
  typewriterDelay: number;
  showMetadata: boolean;
}

function ActionItemRow({ item, isActive, onComplete, typewriterDelay, showMetadata }: ActionItemRowProps) {
  const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Checkbox icon (visual only) */}
      <CheckSquare className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" strokeWidth={1.5} />

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800">
          <TypewriterText
            text={item.task}
            speed={20}
            delay={typewriterDelay}
            isActive={isActive}
            onComplete={onComplete}
          />
        </div>
        {showMetadata && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{item.owner}</span>
            <span>·</span>
            <span>{item.deadline}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priority.bg} ${priority.text}`}
            >
              {priority.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionItemsExampleProps {
  data: ActionItemsExampleData;
  isActive: boolean;
  onComplete?: () => void;
}

export function ActionItemsExample({ data, isActive, onComplete }: ActionItemsExampleProps) {
  const items = data.items.slice(0, 4);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  // Stagger items - each starts after the previous completes (roughly)
  // Using longer stagger to account for typing time
  const ITEM_STAGGER_MS = 1200;

  const handleItemComplete = useCallback((index: number) => {
    setCompletedItems(prev => new Set([...prev, index]));
    if (index === items.length - 1) {
      onComplete?.();
    }
  }, [items.length, onComplete]);

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <ActionItemRow
          key={index}
          item={item}
          isActive={isActive}
          typewriterDelay={index * ITEM_STAGGER_MS}
          showMetadata={completedItems.has(index)}
          onComplete={() => handleItemComplete(index)}
        />
      ))}
    </div>
  );
}

export default ActionItemsExample;
