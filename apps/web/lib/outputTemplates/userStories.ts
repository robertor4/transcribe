import { FileText } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * User Stories template - Product requirements
 * Use case: Generate user stories for development from product discussions
 */
export const userStoriesTemplate: OutputTemplate = {
  id: 'userStories',
  name: 'User Stories',
  description: 'Product requirements',
  icon: FileText,
  example: 'Generate user stories for development',
  prompt: {
    system: `You are a product manager expert in writing user stories following Agile methodology. Transform product discussions into well-structured user stories with clear acceptance criteria. Focus on user value, measurable outcomes, and technical clarity.`,
    userTemplate: `Create user stories from this product conversation:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

For each user story, provide:

**Title:** Brief, descriptive name

**User Story:**
As a [user type],
I want to [action/feature],
So that [benefit/value].

**Acceptance Criteria:**
- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2
- [ ] Specific, testable criterion 3

**Priority:** High/Medium/Low
**Estimated Effort:** (if discussed: Small/Medium/Large or story points)
**Notes:** Any technical considerations or dependencies

Format using standard Agile user story structure. Only create stories for features explicitly discussed in the conversation.`,
    temperature: 0.3,
    maxTokens: 1500,
  },
};
