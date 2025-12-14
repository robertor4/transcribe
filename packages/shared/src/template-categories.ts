/**
 * Template Categories Registry
 *
 * Defines the available categories for organizing analysis templates.
 * Categories can be extended via Firestore in the future, but system
 * categories are defined here as the source of truth.
 */

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  order: number; // Display order in UI
}

/**
 * System-defined template categories.
 * These are the default categories available to all users.
 * New categories can be added here or via Firestore (future).
 */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Business communication and analysis',
    icon: 'Briefcase',
    order: 1,
  },
  {
    id: 'content',
    name: 'Content Creation',
    description: 'Blogs, social media, and articles',
    icon: 'PenTool',
    order: 2,
  },
  {
    id: 'specialized',
    name: 'Specialized',
    description: 'Industry-specific analyses',
    icon: 'Microscope',
    order: 3,
  },
];

/**
 * Get a category by ID
 */
export function getTemplateCategory(id: string): TemplateCategory | undefined {
  return TEMPLATE_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getTemplateCategoryIds(): string[] {
  return TEMPLATE_CATEGORIES.map((cat) => cat.id);
}
