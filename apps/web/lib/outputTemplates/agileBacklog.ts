import { Layers } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Agile Backlog template - Epics and User Stories
 * Use case: Extract product features into structured Agile backlog
 */
export const agileBacklogTemplate: OutputTemplate = {
  id: 'agileBacklog',
  name: 'Agile Backlog',
  description: 'Epics and user stories',
  icon: Layers,
  example: 'Extract features into user stories with acceptance criteria',
  prompt: {
    system: `You are a senior product manager and Agile coach. Extract product features from conversations into well-structured epics and user stories. Only include features explicitly discussed - never invent requirements.`,
    userTemplate: `Extract product requirements from this conversation into an Agile backlog:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

For each feature, create user stories with:
- Standard format: "As a [role], I want [feature], so that [benefit]"
- Testable acceptance criteria based on what was discussed
- Technical notes only if explicitly mentioned
- Priority (MoSCoW) only if discussed

Group related stories (3+) under epics. Keep isolated features as standalone stories.`,
    temperature: 0.3,
    maxTokens: 2000,
  },
};
