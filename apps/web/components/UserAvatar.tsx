'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  /** Size of the avatar */
  size?: AvatarSize;
  /** Custom class name for additional styling */
  className?: string;
  /** Whether to show border */
  showBorder?: boolean;
  /** Border color class (light or dark theme aware) */
  borderClass?: string;
  /** Fresh photo URL from UsageContext (pass this from parent that has access to useUsage) */
  freshPhotoUrl?: string | null;
  /** Override display name (for initials fallback) */
  displayName?: string | null;
  /** Override email (for initials fallback) */
  email?: string | null;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-xs' },
  sm: { container: 'h-8 w-8', text: 'text-sm' },
  md: { container: 'h-10 w-10', text: 'text-base' },
  lg: { container: 'h-12 w-12', text: 'text-lg' },
  xl: { container: 'h-16 w-16', text: 'text-xl' },
};

/**
 * Reusable user avatar component that handles:
 * - Fresh signed URL (pass via freshPhotoUrl prop to prevent 400 errors)
 * - Fallback to Firebase Auth photoURL
 * - Graceful fallback to initials when image fails to load
 * - Various sizes and border options
 *
 * Usage:
 * ```tsx
 * // Inside component with UsageContext access:
 * const { profilePhotoUrl } = useUsage();
 * <UserAvatar freshPhotoUrl={profilePhotoUrl} size="md" />
 *
 * // Outside UsageContext (will use Firebase Auth URL):
 * <UserAvatar size="sm" />
 * ```
 */
export function UserAvatar({
  size = 'md',
  className = '',
  showBorder = true,
  borderClass = 'border-gray-200 dark:border-gray-700',
  freshPhotoUrl,
  displayName: overrideDisplayName,
  email: overrideEmail,
}: UserAvatarProps) {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  // Determine which photo URL to use (priority order)
  // 1. Fresh URL passed as prop (regenerated signed URL from API)
  // 2. Firebase Auth photoURL (may be expired)
  const photoUrl = freshPhotoUrl ?? user?.photoURL;
  const displayName = overrideDisplayName ?? user?.displayName;
  const email = overrideEmail ?? user?.email;

  // Reset imageError when we get a fresh photo URL
  // This handles the case where the initial URL was expired,
  // but a fresh URL is now available
  useEffect(() => {
    if (freshPhotoUrl) {
      setImageError(false);
    }
  }, [freshPhotoUrl]);

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const sizeClass = sizeClasses[size];
  const borderStyles = showBorder ? `border ${borderClass}` : '';

  if (photoUrl && !imageError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photoUrl}
        alt={displayName || email || 'User'}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass.container} ${borderStyles} ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#8D6AFA] text-white flex items-center justify-center font-semibold flex-shrink-0 ${sizeClass.container} ${sizeClass.text} ${className}`}
    >
      {getInitials()}
    </div>
  );
}
