import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ImagePromptRequest {
  headline: string;
  subheading?: string;
  hook?: string;
}

export interface ImagePromptResult {
  prompt: string;
  alt: string;
}

/**
 * Service for generating AI image prompts based on blog post content.
 * Uses GPT to create tailored prompts for Replicate's Flux models.
 */
@Injectable()
export class ImagePromptService {
  private readonly logger = new Logger(ImagePromptService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Generate an image prompt tailored to the blog post content.
   * Creates abstract, brand-aligned illustrations rather than literal imagery.
   */
  async generateImagePrompt(
    request: ImagePromptRequest,
  ): Promise<ImagePromptResult> {
    const { headline, subheading, hook } = request;

    const systemPrompt = `You are an expert at creating image generation prompts for AI models like Flux.
Your task is to create abstract, editorial-style image prompts for blog post hero images.

BRAND GUIDELINES:
- Style: Modern minimalist, geometric shapes, soft gradients
- Colors: Deep purple (#23194B), cyan (#14D0DC), soft grays, white space
- Mood: Thoughtful, innovative, calm, sophisticated
- Composition: Clean, balanced, suitable for 4:5 portrait ratio

STRICT RULES:
1. NEVER include human faces, hands, or body parts
2. NEVER include AI/robot imagery (no brains, circuits, robots)
3. NEVER include clichéd business imagery (handshakes, graphs, suits)
4. NEVER include any text or words in the image
5. ALWAYS use abstract, geometric, or flowing forms
6. ALWAYS evoke the theme symbolically, not literally

GOOD EXAMPLES:
- For "marketing mistakes": fragmented geometric shapes reforming into a unified flow
- For "productivity": ascending spiral forms with light rays
- For "leadership": interconnected nodes radiating outward
- For "communication": overlapping translucent circles creating harmony

OUTPUT FORMAT:
Return a JSON object with two fields:
1. "prompt": The complete image generation prompt (60-100 words)
2. "alt": A concise alt text description for accessibility (10-15 words)`;

    const userPrompt = `Create an image prompt for this blog post:

HEADLINE: ${headline}
${subheading ? `SUBHEADING: ${subheading}` : ''}
${hook ? `OPENING HOOK: ${hook.substring(0, 200)}...` : ''}

Generate an abstract, geometric illustration that evokes the theme symbolically.`;

    try {
      this.logger.log(
        `Generating image prompt for: "${headline.substring(0, 50)}..."`,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cost-effective for prompt generation
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in GPT response');
      }

      const result = JSON.parse(content) as ImagePromptResult;

      // Validate the result
      if (!result.prompt || !result.alt) {
        throw new Error('Invalid response format from GPT');
      }

      this.logger.log(
        `Generated image prompt: "${result.prompt.substring(0, 80)}..."`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error generating image prompt:', error);

      // Return a fallback prompt that's still brand-aligned
      return this.getFallbackPrompt(headline);
    }
  }

  /**
   * Fallback prompt when GPT fails - creates a generic but on-brand image
   */
  private getFallbackPrompt(headline: string): ImagePromptResult {
    const fallbackPrompt = `Abstract editorial illustration with flowing geometric shapes and soft gradients. Modern minimalist style with deep purple (#23194B) and cyan (#14D0DC) accents on clean white background. Interconnected circular and triangular forms creating a sense of harmony and forward movement. Professional, sophisticated composition with generous negative space. 4:5 portrait ratio. No text, no faces, no hands.`;

    return {
      prompt: fallbackPrompt,
      alt: `Abstract geometric illustration for ${headline.substring(0, 30)}`,
    };
  }
}
