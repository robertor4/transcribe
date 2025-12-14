import { AnalysisTemplate } from '@transcribe/shared';

/**
 * Common prompt instructions used across templates
 */
export const PROMPT_INSTRUCTIONS = {
  /** Instruction to maintain language consistency with transcript */
  languageConsistency:
    'If the transcript is in a non-English language, write ALL content in that same language.',

  /** Instruction for sentence case headers */
  sentenceCaseHeaders:
    'Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.',

  /** Combined language and header instruction for markdown templates */
  languageAndHeaders: `Write ALL section headers in sentence case, capitalizing only the first word and proper nouns.
If the transcript is in a non-English language, ALL headings and content must be in that same language.`,

  /** Instruction for JSON output */
  jsonRequirement: 'Always respond with valid JSON matching the provided schema.',
};

/**
 * Default ecosystem fields for system templates
 */
const SYSTEM_TEMPLATE_DEFAULTS = {
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system' as const,
  isSystemTemplate: true,
  visibility: 'public' as const,
  requiredTier: 'free' as const,
  version: 1,
};

/**
 * Required fields that must be provided for every template
 */
type RequiredTemplateFields = Pick<
  AnalysisTemplate,
  | 'id'
  | 'name'
  | 'description'
  | 'category'
  | 'icon'
  | 'color'
  | 'systemPrompt'
  | 'userPrompt'
  | 'modelPreference'
  | 'estimatedSeconds'
  | 'order'
>;

/**
 * Optional fields that can be overridden
 */
type OptionalTemplateFields = Partial<
  Omit<AnalysisTemplate, keyof RequiredTemplateFields | 'jsonSchema'>
>;

/**
 * Input type for structured templates - accepts jsonSchema as an object
 */
type StructuredTemplateInput = RequiredTemplateFields &
  Omit<OptionalTemplateFields, 'outputFormat'> & {
    jsonSchema: Record<string, unknown>;
  };

/**
 * Factory function to create a system template with default ecosystem fields.
 * Reduces boilerplate by automatically applying common fields.
 *
 * @param template - Required template fields plus any optional overrides
 * @returns Complete AnalysisTemplate with ecosystem defaults applied
 *
 * @example
 * ```ts
 * createTemplate({
 *   id: 'my-template',
 *   name: 'My Template',
 *   description: 'Does something useful',
 *   category: 'professional',
 *   icon: 'FileText',
 *   color: 'blue',
 *   systemPrompt: 'You are an expert...',
 *   userPrompt: 'Analyze this transcript...',
 *   modelPreference: 'gpt-5-mini',
 *   estimatedSeconds: 15,
 *   order: 0,
 *   // Optional overrides
 *   featured: true,
 *   tags: ['analysis', 'productivity'],
 * })
 * ```
 */
export function createTemplate(
  template: RequiredTemplateFields & OptionalTemplateFields & { jsonSchema?: string },
): AnalysisTemplate {
  return {
    ...SYSTEM_TEMPLATE_DEFAULTS,
    featured: false, // Default to not featured
    ...template,
  } as AnalysisTemplate;
}

/**
 * Factory function specifically for structured JSON output templates.
 * Ensures outputFormat and jsonSchema are properly set.
 * Accepts jsonSchema as an object and stringifies it automatically.
 *
 * @param template - Template fields including jsonSchema as an object
 * @returns Complete AnalysisTemplate configured for structured output
 */
export function createStructuredTemplate(
  template: StructuredTemplateInput,
): AnalysisTemplate {
  const { jsonSchema, ...rest } = template;
  return createTemplate({
    ...rest,
    outputFormat: 'structured',
    jsonSchema: JSON.stringify(jsonSchema),
  });
}

/**
 * Common JSON schema fragments for reuse across templates
 */
export const SCHEMA_FRAGMENTS = {
  /** Standard action item schema */
  actionItem: {
    type: 'object',
    properties: {
      task: { type: 'string' },
      owner: { type: ['string', 'null'] },
      deadline: { type: ['string', 'null'] },
      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
      priorityReason: { type: 'string' },
      context: { type: 'string' },
    },
    required: ['task', 'owner', 'deadline', 'priority', 'priorityReason'],
  },

  /** String array schema */
  stringArray: {
    type: 'array',
    items: { type: 'string' },
  },
};
