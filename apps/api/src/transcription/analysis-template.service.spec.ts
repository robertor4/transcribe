import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisTemplateService } from './analysis-template.service';

describe('AnalysisTemplateService', () => {
  let service: AnalysisTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisTemplateService],
    }).compile();

    service = module.get<AnalysisTemplateService>(AnalysisTemplateService);
  });

  describe('getTemplates', () => {
    it('should return all templates', () => {
      const templates = service.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with required fields', () => {
      const templates = service.getTemplates();

      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template when found', () => {
      const templates = service.getTemplates();
      const firstTemplate = templates[0];

      const result = service.getTemplateById(firstTemplate.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(firstTemplate.id);
    });

    it('should return undefined for non-existent template', () => {
      const result = service.getTemplateById('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return professional templates', () => {
      const templates = service.getTemplatesByCategory('professional');

      expect(Array.isArray(templates)).toBe(true);
      templates.forEach((template) => {
        expect(template.category).toBe('professional');
      });
    });

    it('should return content templates', () => {
      const templates = service.getTemplatesByCategory('content');

      expect(Array.isArray(templates)).toBe(true);
      templates.forEach((template) => {
        expect(template.category).toBe('content');
      });
    });

    it('should return specialized templates', () => {
      const templates = service.getTemplatesByCategory('specialized');

      expect(Array.isArray(templates)).toBe(true);
      templates.forEach((template) => {
        expect(template.category).toBe('specialized');
      });
    });
  });

  describe('getFeaturedTemplates', () => {
    it('should return featured templates', () => {
      const templates = service.getFeaturedTemplates();

      expect(Array.isArray(templates)).toBe(true);
      templates.forEach((template) => {
        expect(template.featured).toBe(true);
      });
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', () => {
      const templates = service.getTemplates();
      const firstTemplate = templates[0];

      const exists = service.templateExists(firstTemplate.id);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent template', () => {
      const exists = service.templateExists('non-existent-id');

      expect(exists).toBe(false);
    });
  });
});
