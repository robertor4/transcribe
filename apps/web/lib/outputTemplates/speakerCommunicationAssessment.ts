import { UserCheck } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Speaker Communication Assessment template - Per-speaker communication skills evaluation
 * Use case: Assess individual communication strengths and growth areas for coaching
 */
export const speakerCommunicationAssessmentTemplate: OutputTemplate = {
  id: 'speakerCommunicationAssessment',
  name: 'Speaker Communication Assessment',
  description: 'Assess each speaker\'s communication skills individually',
  icon: UserCheck,
  example: 'Score each person on clarity, conciseness, active listening, and more',
  prompt: {
    system: `You are an executive communication coach who assesses individual speakers. Analyze each speaker separately based on what they actually said. Be specific, evidence-based, and actionable.`,
    userTemplate: `Assess each individual speaker's communication skills from this conversation:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

For each speaker, score 6 dimensions (0-100): Clarity, Conciseness, Active Listening, Assertiveness, Questioning, Tone & Rapport. Provide evidence and actionable tips.`,
    temperature: 0.4,
    maxTokens: 2000,
  },
  status: 'reviewed',
};
