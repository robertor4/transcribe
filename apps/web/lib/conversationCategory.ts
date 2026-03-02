import type { ConversationCategory } from '@transcribe/shared';
import {
  Phone,
  Users,
  UserCheck,
  Mic,
  Lightbulb,
  AudioLines,
  Presentation,
  Boxes,
  HeadphonesIcon,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string; // Tailwind-compatible color for the badge
  bgColor: string;
  textColor: string;
}

/**
 * Configuration for each conversation category.
 * Icons and colors are brand-aligned.
 */
export const CATEGORY_CONFIG: Record<ConversationCategory, CategoryConfig> = {
  'sales-call': {
    label: 'Sales Call',
    icon: Phone,
    color: '#14D0DC',
    bgColor: 'bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20',
    textColor: 'text-[#0ea5b0] dark:text-[#14D0DC]',
  },
  'business-meeting': {
    label: 'Business Meeting',
    icon: Users,
    color: '#8D6AFA',
    bgColor: 'bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20',
    textColor: 'text-[#8D6AFA] dark:text-[#a98afb]',
  },
  'one-on-one': {
    label: '1:1',
    icon: UserCheck,
    color: '#3F38A0',
    bgColor: 'bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20',
    textColor: 'text-[#3F38A0] dark:text-[#7b74d4]',
  },
  'interview': {
    label: 'Interview',
    icon: Mic,
    color: '#8D6AFA',
    bgColor: 'bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20',
    textColor: 'text-[#8D6AFA] dark:text-[#a98afb]',
  },
  'brainstorm': {
    label: 'Brainstorm',
    icon: Lightbulb,
    color: '#14D0DC',
    bgColor: 'bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20',
    textColor: 'text-[#0ea5b0] dark:text-[#14D0DC]',
  },
  'solo-recording': {
    label: 'Solo Recording',
    icon: AudioLines,
    color: '#3F38A0',
    bgColor: 'bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20',
    textColor: 'text-[#3F38A0] dark:text-[#7b74d4]',
  },
  'presentation': {
    label: 'Presentation',
    icon: Presentation,
    color: '#8D6AFA',
    bgColor: 'bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20',
    textColor: 'text-[#8D6AFA] dark:text-[#a98afb]',
  },
  'workshop': {
    label: 'Workshop',
    icon: Boxes,
    color: '#14D0DC',
    bgColor: 'bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20',
    textColor: 'text-[#0ea5b0] dark:text-[#14D0DC]',
  },
  'support-call': {
    label: 'Support Call',
    icon: HeadphonesIcon,
    color: '#3F38A0',
    bgColor: 'bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20',
    textColor: 'text-[#3F38A0] dark:text-[#7b74d4]',
  },
  'general': {
    label: 'General',
    icon: MessageSquare,
    color: '#8D6AFA',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
};

/**
 * Get category config safely. Returns undefined for unknown categories.
 */
export function getCategoryConfig(category: string | undefined): CategoryConfig | undefined {
  if (!category) return undefined;
  return CATEGORY_CONFIG[category as ConversationCategory];
}
