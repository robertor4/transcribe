/**
 * User Helper Functions
 * Utilities for personalization and user-related operations
 */

/**
 * Get time-of-day greeting based on current hour
 * @returns 'morning' | 'afternoon' | 'evening'
 */
export function getTimeOfDay(): string {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}

/**
 * Extract first name from email or display name
 * Examples:
 * - "roberto@dreamone.nl" → "Roberto"
 * - "john.doe@example.com" → "John"
 * - "Jane Smith" → "Jane"
 */
export function getFirstName(emailOrName?: string): string {
  if (!emailOrName) {
    return 'there'; // Fallback greeting
  }

  // If it's an email, extract the part before @
  if (emailOrName.includes('@')) {
    const localPart = emailOrName.split('@')[0];

    // Handle formats like "john.doe" or "john_doe"
    const firstName = localPart.split(/[._-]/)[0];

    // Capitalize first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1);
  }

  // If it's a display name, take the first word
  const firstName = emailOrName.split(' ')[0];

  // Capitalize first letter if needed
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

/**
 * Get full personalized greeting
 * @param emailOrName - User's email or display name
 * @returns Formatted greeting like "Good morning, Roberto"
 */
export function getGreeting(emailOrName?: string): string {
  const timeOfDay = getTimeOfDay();
  const firstName = getFirstName(emailOrName);

  return `Good ${timeOfDay}, ${firstName}`;
}

/**
 * Get milestone message for conversation count
 * @param count - Number of conversations
 * @returns Milestone message or null if no milestone
 */
export function getMilestoneMessage(count: number): string | null {
  const milestones: Record<number, string> = {
    1: "Your first conversation! 🎉",
    10: "10 conversations transcribed",
    50: "You're becoming a power user!",
    100: "100 conversations! Incredible.",
    250: "250 conversations! You're a Neural Summary expert!",
    500: "500 conversations! That's amazing!",
    1000: "1,000 conversations! This is extraordinary! 🚀"
  };

  return milestones[count] || null;
}

/**
 * Format hours and minutes from seconds
 * @param seconds - Total seconds
 * @returns Formatted string like "3.5 hours" or "45 minutes"
 */
export function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    const decimalHours = (seconds / 3600).toFixed(1);
    return `${decimalHours} hour${parseFloat(decimalHours) !== 1 ? 's' : ''}`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Get day of week name
 * @param date - Date object
 * @returns Day name like "Monday"
 */
export function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}
