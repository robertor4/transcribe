import { FileText } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Transcribe Only Template
 *
 * Quick action for users who just want basic transcription and summary
 * without generating a specific output type.
 *
 * This skips custom AI generation and provides only:
 * - Audio transcription
 * - Basic summary
 * - No specialized output formatting
 */
export const transcribeOnlyTemplate: OutputTemplate = {
  id: 'transcribe-only',
  name: 'Just Transcribe',
  description: 'Basic transcription and summary only—no special output',
  icon: FileText,
  example: 'Get a simple transcription and summary without generating specific outputs',
  prompt: null, // No custom AI generation
  category: 'quick',
  isQuickAction: true,
};
