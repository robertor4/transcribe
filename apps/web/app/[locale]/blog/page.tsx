import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { PostCard } from '@/components/blog/PostCard';
import { getAllPosts } from '@/lib/blog';
import { SEO_BASE_URL, SITE_NAME } from '@/config/page-metadata';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = getAllPosts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    description: t('description'),
    url: `${SEO_BASE_URL}/${locale}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SEO_BASE_URL,
    },
  };

  return (
    <>
      <PublicHeader locale={locale} />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('description')}
            </p>
          </header>

          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              {t('noPosts')}
            </p>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </main>
      <PublicFooter locale={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
