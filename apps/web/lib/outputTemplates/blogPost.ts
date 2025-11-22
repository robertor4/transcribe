import { Edit3 } from 'lucide-react';
import { OutputTemplate } from './types';

/**
 * Blog Post template - Publish-ready article
 * Use case: Transform conversation insights into compelling blog content
 */
export const blogPostTemplate: OutputTemplate = {
  id: 'blogPost',
  name: 'Blog Post',
  description: 'Publish-ready article',
  icon: Edit3,
  example: 'Transform insights into a compelling blog post',
  prompt: {
    system: `You are an experienced content writer specializing in creating engaging, publish-ready blog posts. Transform conversation transcripts into compelling narratives that educate, inspire, and engage readers. Use storytelling techniques, clear structure, and authentic voice.`,
    userTemplate: `Transform the following conversation into a compelling blog post:

{{TRANSCRIPT}}

{{CUSTOM_INSTRUCTIONS}}

Create a blog post with:
- Engaging headline
- Hook that captures attention
- Clear introduction
- Well-structured body with subheadings
- Key insights and takeaways
- Compelling conclusion
- Natural, conversational tone

Make it publish-ready and engaging for readers.`,
    temperature: 0.8,
    maxTokens: 2000,
  },
};
