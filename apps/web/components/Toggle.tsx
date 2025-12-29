'use client';

import * as Switch from '@radix-ui/react-switch';
import { forwardRef } from 'react';

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  'aria-label'?: string;
}

const sizeStyles = {
  sm: {
    root: { width: 36, height: 20 },
    thumb: { width: 14, height: 14 },
    translateX: 16,
  },
  md: {
    root: { width: 44, height: 24 },
    thumb: { width: 18, height: 18 },
    translateX: 20,
  },
  lg: {
    root: { width: 56, height: 28 },
    thumb: { width: 22, height: 22 },
    translateX: 28,
  },
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, disabled = false, size = 'md', id, 'aria-label': ariaLabel }, ref) => {
    const styles = sizeStyles[size];

    return (
      <Switch.Root
        ref={ref}
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={ariaLabel}
        style={{ width: styles.root.width, height: styles.root.height }}
        className="
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6AFA] focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-gray-800
          data-[state=checked]:bg-[#8D6AFA] data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600
          disabled:opacity-50 disabled:cursor-not-allowed
          !min-h-0 !min-w-0
        "
      >
        <Switch.Thumb
          style={{
            width: styles.thumb.width,
            height: styles.thumb.height,
            transform: checked ? `translateX(${styles.translateX}px)` : 'translateX(2px)',
          }}
          className="
            pointer-events-none block rounded-full bg-white shadow-md
            transition-transform duration-200 ease-in-out
          "
        />
      </Switch.Root>
    );
  }
);

Toggle.displayName = 'Toggle';
