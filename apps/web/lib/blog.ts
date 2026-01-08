import { allBlogPosts, BlogPost } from 'contentlayer/generated';

export type { BlogPost };

/**
 * Get all published blog posts for a specific locale, sorted by date
 */
export function getBlogPosts(locale: string): BlogPost[] {
  return allBlogPosts
    .filter((post) => post.locale === locale && !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single blog post by slug and locale
 */
export function getBlogPost(slug: string, locale: string): BlogPost | undefined {
  return allBlogPosts.find(
    (post) => post.slug === slug && post.locale === locale && !post.draft
  );
}

/**
 * Get all featured blog posts for a locale
 */
export function getFeaturedPosts(locale: string): BlogPost[] {
  return getBlogPosts(locale).filter((post) => post.featured);
}

/**
 * Get blog posts by tag
 */
export function getPostsByTag(tag: string, locale: string): BlogPost[] {
  return getBlogPosts(locale).filter((post) => post.tags?.includes(tag));
}

/**
 * Get blog posts by category
 */
export function getPostsByCategory(category: string, locale: string): BlogPost[] {
  return getBlogPosts(locale).filter((post) => post.category === category);
}

/**
 * Get all unique tags from blog posts for a locale
 */
export function getAllTags(locale: string): string[] {
  const tags = new Set<string>();
  getBlogPosts(locale).forEach((post) => {
    post.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get all unique categories from blog posts for a locale
 */
export function getAllCategories(locale: string): string[] {
  const categories = new Set<string>();
  getBlogPosts(locale).forEach((post) => {
    if (post.category) categories.add(post.category);
  });
  return Array.from(categories).sort();
}

/**
 * Get related posts based on tags
 */
export function getRelatedPosts(post: BlogPost, limit: number = 3): BlogPost[] {
  if (!post.tags || post.tags.length === 0) {
    return getBlogPosts(post.locale).filter((p) => p.slug !== post.slug).slice(0, limit);
  }

  const relatedPosts = getBlogPosts(post.locale)
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      post: p,
      score: p.tags?.filter((tag) => post.tags?.includes(tag)).length || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);

  return relatedPosts;
}

/**
 * Get all slugs for static generation
 */
export function getAllSlugs(): { slug: string; locale: string }[] {
  return allBlogPosts
    .filter((post) => !post.draft)
    .map((post) => ({
      slug: post.slug,
      locale: post.locale,
    }));
}
