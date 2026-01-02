'use client';

import { ReactNode } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { LucideIcon } from 'lucide-react';

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
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={8}
          className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999] py-1 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {items.map((item, idx) => {
            // Divider
            if (item.type === 'divider') {
              return (
                <DropdownMenuPrimitive.Separator
                  key={idx}
                  className="my-1 border-t border-gray-200 dark:border-gray-700"
                />
              );
            }

            // Custom content
            if (item.type === 'custom') {
              return <div key={idx}>{item.content}</div>;
            }

            // Standard item (default)
            const Icon = item.icon;
            const isDanger = item.variant === 'danger';

            return (
              <DropdownMenuPrimitive.Item
                key={idx}
                disabled={item.disabled}
                onSelect={item.onClick}
                title={item.disabled ? item.disabledReason : undefined}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors text-left outline-none cursor-pointer
                  ${item.disabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : isDanger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${
                  item.disabled
                    ? 'text-gray-300 dark:text-gray-600'
                    : isDanger
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`} />
                <span>{item.label}</span>
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
