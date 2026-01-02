import { Injectable } from '@nestjs/common';
import { AnalysisTemplate } from '@transcribe/shared';
import {
  getTemplateById,
  getTemplatesByCategory,
  getFeaturedTemplates,
  getAllTemplates,
} from './analysis-templates';

/**
 * Service for managing system-defined analysis templates
 * Templates are read-only constants defined in code
 */
@Injectable()
export class AnalysisTemplateService {
  /**
   * Get all analysis templates sorted by order
   */
  getTemplates(): AnalysisTemplate[] {
    return getAllTemplates();
  }

  /**
   * Get a specific template by ID
   */
  getTemplateById(id: string): AnalysisTemplate | undefined {
    return getTemplateById(id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(
    category: 'professional' | 'content' | 'specialized',
  ): AnalysisTemplate[] {
    return getTemplatesByCategory(category);
  }

  /**
   * Get featured templates
   */
  getFeaturedTemplates(): AnalysisTemplate[] {
    return getFeaturedTemplates();
  }

  /**
   * Check if a template exists
   */
  templateExists(id: string): boolean {
    return getTemplateById(id) !== undefined;
  }
}
