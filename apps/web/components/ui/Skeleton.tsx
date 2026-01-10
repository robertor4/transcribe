'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant of the skeleton */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Animation type */
  animation?: 'pulse' | 'none';
  /** Width in pixels or CSS value */
  width?: string | number;
  /** Height in pixels or CSS value */
  height?: string | number;
}

/**
 * Base skeleton component for loading states.
 * Provides better perceived performance than spinners by showing content shape.
 *
 * @example
 * // Text line skeleton
 * <Skeleton variant="text" className="w-32" />
 *
 * // Avatar skeleton
 * <Skeleton variant="circular" width={48} height={48} />
 *
 * // Card skeleton
 * <Skeleton variant="rounded" className="w-full h-24" />
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    none: '',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton text block with multiple lines.
 * Last line is typically shorter for realistic paragraph endings.
 */
interface SkeletonTextProps {
  /** Number of lines to render */
  lines?: number;
  /** Width of the last line (e.g., "60%") */
  lastLineWidth?: string;
  /** Gap between lines */
  gap?: string;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = 'gap-2',
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col', gap, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === lines - 1 ? '' : 'w-full'
          )}
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton card with icon and text - common pattern for list items.
 */
interface SkeletonCardProps {
  /** Show icon placeholder */
  showIcon?: boolean;
  /** Icon size in pixels */
  iconSize?: number;
  /** Number of text lines */
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  showIcon = true,
  iconSize = 40,
  lines = 2,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'animate-pulse p-4 bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <Skeleton
            variant="rounded"
            width={iconSize}
            height={iconSize}
            className="flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" className="h-4 w-3/4 mb-2" />
          {lines > 1 && (
            <Skeleton variant="text" className="h-3 w-1/2" />
          )}
          {lines > 2 && (
            <Skeleton variant="text" className="h-3 w-full mt-1" />
          )}
        </div>
      </div>
    </div>
  );
}
