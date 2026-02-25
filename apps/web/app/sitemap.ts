import { MetadataRoute } from 'next';
import { locales } from '../i18n.config';
import { SEO_BASE_URL } from '../config/page-metadata';

const baseUrl = SEO_BASE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  // Only include actual public marketing pages
  const mainPages = [
    {
      path: '',
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      path: '/landing',
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      path: '/pricing',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      path: '/examples',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      path: '/contact',
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/privacy',
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      path: '/terms',
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ];

  // Generate sitemap entries for all locales
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add root URL
  sitemapEntries.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1,
    alternates: {
      languages: locales.reduce(
        (acc, locale) => {
          acc[locale] = `${baseUrl}/${locale}`;
          return acc;
        },
        {} as Record<string, string>,
      ),
    },
  });

  // Add all pages for each locale
  mainPages.forEach((page) => {
    locales.forEach((locale) => {
      const url = page.path
        ? `${baseUrl}/${locale}${page.path}`
        : `${baseUrl}/${locale}`;

      sitemapEntries.push({
        url,
        lastModified: currentDate,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: locales.reduce(
            (acc, lang) => {
              const langUrl = page.path
                ? `${baseUrl}/${lang}${page.path}`
                : `${baseUrl}/${lang}`;
              acc[lang] = langUrl;
              return acc;
            },
            {} as Record<string, string>,
          ),
        },
      });
    });
  });

  return sitemapEntries;
}
