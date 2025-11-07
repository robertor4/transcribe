import { MetadataRoute } from 'next';

const baseUrl = 'https://neuralnotes.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
  const currentDate = new Date().toISOString();

  // Main pages with internationalization
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
      path: '/login',
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      path: '/features',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      path: '/pricing',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      path: '/about',
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      path: '/blog',
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      path: '/contact',
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/help',
      changeFrequency: 'weekly' as const,
      priority: 0.6,
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
    {
      path: '/security',
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      path: '/api',
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      path: '/careers',
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      path: '/status',
      changeFrequency: 'daily' as const,
      priority: 0.3,
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
      languages: locales.reduce((acc, locale) => {
        acc[locale] = `${baseUrl}/${locale}`;
        return acc;
      }, {} as Record<string, string>),
    },
  });

  // Add all pages for each locale
  mainPages.forEach(page => {
    locales.forEach(locale => {
      const url = page.path ? `${baseUrl}/${locale}${page.path}` : `${baseUrl}/${locale}`;
      
      sitemapEntries.push({
        url,
        lastModified: currentDate,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: locales.reduce((acc, lang) => {
            const langUrl = page.path ? `${baseUrl}/${lang}${page.path}` : `${baseUrl}/${lang}`;
            acc[lang] = langUrl;
            return acc;
          }, {} as Record<string, string>),
        },
      });
    });
  });

  return sitemapEntries;
}