'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon } from 'lucide-react';

interface DropdownMenuItemBase {
  variant?: 'default' | 'danger';
}

interface DropdownMenuItemStandard extends DropdownMenuItemBase {
  type?: 'item';
  icon: LucideIcon;
  label: string;
  onClick: () => void;
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
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 = 14rem = 224px

      // Position to the left of the trigger, below it
      setPosition({
        top: rect.bottom + 8,
        left: rect.right - menuWidth,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={triggerRef}>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* Dropdown Menu - rendered via portal to escape overflow:hidden containers */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999]"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          <div className="py-1">
            {items.map((item, idx) => {
              // Divider
              if (item.type === 'divider') {
                return (
                  <div
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
                <button
                  key={idx}
                  onClick={() => handleItemClick(item.onClick)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors text-left ${
                    isDanger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isDanger ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
