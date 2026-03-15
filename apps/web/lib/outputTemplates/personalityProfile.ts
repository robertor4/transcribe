import { Brain } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Personality Profile template - Infer personality types per speaker
 * Use case: Understand communication preferences, work styles, and team dynamics
 */
export const personalityProfileTemplate: OutputTemplate = {
  id: 'personalityProfile',
  name: 'Personality Profile',
  description: 'Infer personality types and work styles per speaker',
  icon: Brain,
  example: 'Build personality sketches using MBTI, DISC, and Big Five indicators',
  prompt: {
    system: `You are an organizational psychologist who infers personality traits from conversational behavior. Draw on established frameworks (MBTI, DISC, Big Five) to build practical personality sketches. Be transparent about confidence levels.`,
    userTemplate: `Analyze each speaker's personality traits and communication style:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

For each speaker, identify their primary personality type, assess 5 trait dimensions with confidence levels, and provide practical tips for working with them.`,
    temperature: 0.5,
    maxTokens: 2500,
  },
  status: 'reviewed',
};
