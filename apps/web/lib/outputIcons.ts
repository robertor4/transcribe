import {
  Mail,
  CheckSquare,
  Edit3,
  Share2,
  MessageSquareQuote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Maps an AI Asset template ID to its corresponding Lucide icon.
 * Returns null for unknown types (callers typically fall back to AiIcon).
 */
export function getOutputIcon(templateId: string): LucideIcon | null {
  switch (templateId) {
    case 'email':
    case 'followUpEmail':
    case 'salesEmail':
    case 'internalUpdate':
    case 'clientProposal':
      return Mail;
    case 'actionItems':
      return CheckSquare;
    case 'blogPost':
      return Edit3;
    case 'linkedin':
      return Share2;
    case 'communicationAnalysis':
      return MessageSquareQuote;
    default:
      return null;
  }
}
