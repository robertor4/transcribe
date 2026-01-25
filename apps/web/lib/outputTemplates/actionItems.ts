import { CheckSquare } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Action Items template - Structured task list
 * Use case: Extract actionable next steps from conversations
 */
export const actionItemsTemplate: OutputTemplate = {
  id: 'actionItems',
  name: 'Action Items',
  description: 'Structured task list',
  icon: CheckSquare,
  example: 'Extract actionable next steps',
  prompt: {
    system: `You are a project manager specialized in extracting clear, actionable tasks from conversations. Identify concrete action items, assign owners when mentioned, and organize by priority. Be specific and measurable in defining each task.`,
    userTemplate: `Extract actionable tasks from this conversation:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

For each action item, provide:
- Clear, specific task description (start with action verb)
- Owner/assignee (if mentioned in conversation)
- Priority level (High/Medium/Low)
- Due date or timeframe (if discussed)
- Any dependencies or context needed

Group by:
1. Immediate actions (this week)
2. Short-term actions (this month)
3. Long-term actions (beyond this month)

Be specific and actionable. Only include genuine action items discussed in the conversation.`,
    temperature: 0.3,
    maxTokens: 1000,
  },
  status: 'reviewed',
};
