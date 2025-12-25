import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16' | '3:2' | '2:3';
  outputFormat?: 'webp' | 'png' | 'jpg';
  model?: 'flux-schnell' | 'flux-dev' | 'flux-pro';
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  model: string;
  generationTimeMs: number;
}

@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private client: Replicate | null = null;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiToken = this.configService.get<string>('REPLICATE_API_TOKEN');

    if (!apiToken) {
      this.logger.warn(
        'REPLICATE_API_TOKEN not configured - image generation will be disabled',
      );
      return;
    }

    this.client = new Replicate({
      auth: apiToken,
    });
    this.initialized = true;
    this.logger.log('Replicate client initialized successfully');
  }

  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  async generateImage(
    options: ImageGenerationOptions,
  ): Promise<ImageGenerationResult | null> {
    if (!this.client) {
      this.logger.warn(
        'Replicate client not initialized, skipping image generation',
      );
      return null;
    }

    const {
      prompt,
      aspectRatio = '4:5',
      outputFormat = 'webp',
      model = 'flux-schnell',
    } = options;

    // Map model names to Replicate model IDs
    const modelIds = {
      'flux-schnell': 'black-forest-labs/flux-schnell',
      'flux-dev': 'black-forest-labs/flux-dev',
      'flux-pro': 'black-forest-labs/flux-1.1-pro',
    } as const;

    const modelId = modelIds[model] as `${string}/${string}`;
    const startTime = Date.now();

    try {
      this.logger.log(
        `Generating image with ${model}: "${prompt.substring(0, 50)}..."`,
      );

      const output = await this.client.run(modelId, {
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          output_quality: 90,
          // Flux-specific settings for best results
          num_inference_steps: model === 'flux-schnell' ? 4 : 28,
          guidance_scale: 3.5,
        },
      });

      const generationTimeMs = Date.now() - startTime;

      // Handle different output formats from Replicate
      // The SDK returns FileOutput objects which extend ReadableStream
      // FileOutput has: url() -> URL object, toString() -> string URL
      let imageUrl: string;

      this.logger.log(
        `Replicate output type: ${typeof output}, isArray: ${Array.isArray(output)}`,
      );

      // Helper to extract URL string from a FileOutput or string
      // FileOutput interface: { url(): URL; toString(): string; blob(): Promise<Blob> }
      const extractUrl = (item: unknown): string | null => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          const obj = item as {
            toString?: () => string;
            url?: () => URL;
            href?: string;
          };

          // FileOutput.toString() returns the URL as a string
          if (typeof obj.toString === 'function') {
            const str = obj.toString();
            if (str && str.startsWith('http')) {
              return str;
            }
          }
          // Try url() method which returns a URL object
          if (typeof obj.url === 'function') {
            const urlObj = obj.url();
            if (urlObj && urlObj.href) {
              return urlObj.href;
            }
          }
          // Try href property directly (URL object)
          if (typeof obj.href === 'string') {
            return obj.href;
          }
        }
        return null;
      };

      if (Array.isArray(output)) {
        // Flux models return array - first element is FileOutput
        const firstItem = output[0];
        const url = extractUrl(firstItem);
        if (url) {
          imageUrl = url;
        } else {
          this.logger.error(
            'Cannot extract URL from array item. Item type:',
            typeof firstItem,
            'Item keys:',
            firstItem && typeof firstItem === 'object'
              ? Object.keys(firstItem as object)
              : 'not an object',
          );
          return null;
        }
      } else {
        const url = extractUrl(output);
        if (url) {
          imageUrl = url;
        } else {
          this.logger.error(
            'Cannot extract URL from output. Output type:',
            typeof output,
            'Output keys:',
            output && typeof output === 'object'
              ? Object.keys(output)
              : 'not an object',
          );
          return null;
        }
      }

      this.logger.log(
        `Image generated successfully in ${generationTimeMs}ms: ${imageUrl.substring(0, 80)}...`,
      );

      return {
        url: imageUrl,
        prompt,
        model,
        generationTimeMs,
      };
    } catch (error) {
      this.logger.error('Error generating image with Replicate:', error);
      // Don't throw - return null so blog post generation can continue without image
      return null;
    }
  }

  /**
   * Download an image from URL and return as Buffer
   * Useful for uploading to Firebase Storage
   */
  async downloadImage(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error('Error downloading image:', error);
      return null;
    }
  }
}
