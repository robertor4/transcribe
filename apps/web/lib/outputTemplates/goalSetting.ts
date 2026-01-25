import { Target } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Goal Setting template - SMART goals document
 * Use case: Create SMART goals with milestones and support needed
 */
export const goalSettingTemplate: OutputTemplate = {
  id: 'goalSetting',
  name: 'Goal Setting Document',
  description: 'SMART goals with milestones and support needed',
  icon: Target,
  example: 'Set structured goals',
  prompt: null,
  category: 'output',
  status: 'beta',
};
