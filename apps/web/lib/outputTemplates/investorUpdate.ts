import { TrendingUp } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Investor Update template - Investor memo
 * Use case: Monthly/quarterly investor memo with traction and asks
 */
export const investorUpdateTemplate: OutputTemplate = {
  id: 'investorUpdate',
  name: 'Investor Update',
  description: 'Monthly/quarterly investor memo with traction and asks',
  icon: TrendingUp,
  example: 'Update investors',
  prompt: null,
  category: 'output',
  status: 'beta',
};
