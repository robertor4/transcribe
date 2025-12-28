/**
 * Pending Import Utility
 *
 * Manages a pending import in localStorage for the auto-import flow.
 * When an unauthenticated user clicks "Import", we store the shareToken
 * and redirect them to sign up. After authentication, we auto-import.
 */

const STORAGE_KEY = 'pendingImport';

export interface PendingImport {
  shareToken: string;
  timestamp: number;
}

/**
 * Set a pending import before redirecting to auth.
 */
export function setPendingImport(shareToken: string): void {
  if (typeof window === 'undefined') return;

  const pending: PendingImport = {
    shareToken,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

/**
 * Get and clear the pending import.
 * Returns null if no pending import or if it's older than 1 hour.
 */
export function getPendingImport(): PendingImport | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const pending: PendingImport = JSON.parse(stored);

    // Check if pending import is less than 1 hour old
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - pending.timestamp > oneHour) {
      clearPendingImport();
      return null;
    }

    return pending;
  } catch {
    clearPendingImport();
    return null;
  }
}

/**
 * Clear the pending import from localStorage.
 */
export function clearPendingImport(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if there's a pending import without clearing it.
 */
export function hasPendingImport(): boolean {
  return getPendingImport() !== null;
}
