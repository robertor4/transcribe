'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DropdownMenuItemBase {
  variant?: 'default' | 'danger';
}

interface DropdownMenuItemStandard extends DropdownMenuItemBase {
  type?: 'item';
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

interface DropdownMenuItemDivider {
  type: 'divider';
}

interface DropdownMenuItemCustom {
  type: 'custom';
  content: ReactNode;
}

export type DropdownMenuItem = DropdownMenuItemStandard | DropdownMenuItemDivider | DropdownMenuItemCustom;

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  /** Alignment of dropdown relative to trigger */
  align?: 'start' | 'center' | 'end';
}

export function DropdownMenu({ trigger, items, align = 'end' }: DropdownMenuProps) {
  return (
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} sideOffset={8} className="w-56 z-[9999]">
        {items.map((item, idx) => {
          if (item.type === 'divider') {
            return <DropdownMenuSeparator key={idx} />;
          }

          if (item.type === 'custom') {
            return <div key={idx}>{item.content}</div>;
          }

          const Icon = item.icon;

          return (
            <ShadcnDropdownMenuItem
              key={idx}
              disabled={item.disabled}
              onSelect={item.onClick}
              variant={item.variant === 'danger' ? 'destructive' : 'default'}
              title={item.disabled ? item.disabledReason : undefined}
              className="gap-3 px-4 py-2 font-medium cursor-pointer"
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </ShadcnDropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  );
}
