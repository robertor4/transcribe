'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { EDITORIAL } from './editorial';

interface EditorialCollapsibleProps {
  /** Section label (uppercase) */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional count badge (e.g., number of items) */
  count?: number;
  /** Start open. Default false. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Collapsible section with editorial label styling and chevron indicator. */
export function EditorialCollapsible({
  label,
  icon: Icon,
  count,
  defaultOpen = false,
  children,
}: EditorialCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full cursor-pointer group">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
          <span className={EDITORIAL.sectionLabel}>{label}</span>
          {count !== undefined && (
            <span className="text-xs text-gray-400 dark:text-gray-500">({count})</span>
          )}
          <ChevronRight
            className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              open ? 'rotate-90' : ''
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={`${EDITORIAL.sectionBorder} mt-3 pt-4`}>
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
