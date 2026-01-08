import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getBlogPosts, getFeaturedPosts, BlogPost } from '@/lib/blog';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article
      className={`group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#8D6AFA]/30 hover:shadow-lg transition-all ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''
      }`}
    >
      {post.image && (
        <Link href={post.url} className="block relative aspect-video overflow-hidden">
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <time dateTime={post.date}>{format(new Date(post.date), 'MMM d, yyyy')}</time>
          <span>•</span>
          <span>{post.readingTime}</span>
          {post.category && (
            <>
              <span>•</span>
              <span className="text-[#8D6AFA]">{post.category}</span>
            </>
          )}
        </div>

        <Link href={post.url}>
          <h2
            className={`font-bold text-gray-900 group-hover:text-[#8D6AFA] transition-colors mb-3 ${
              featured ? 'text-2xl md:text-3xl' : 'text-xl'
            }`}
          >
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-600 mb-4 line-clamp-3">{post.description}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {post.authorImage && (
            <Image
              src={post.authorImage}
              alt={post.author}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="text-sm">
            <p className="font-medium text-gray-900">{post.author}</p>
            {post.authorRole && <p className="text-gray-500">{post.authorRole}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  const posts = getBlogPosts(locale);
  const featuredPosts = getFeaturedPosts(locale);
  const regularPosts = posts.filter((post) => !post.featured);

  return (
    <>
      <PublicHeader locale={locale} />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-12 px-6 sm:px-8 lg:px-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('sections.featured')}</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} featured />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-12 px-6 sm:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto">
            {featuredPosts.length > 0 && (
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('sections.latest')}</h2>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">{t('empty.message')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(featuredPosts.length > 0 ? regularPosts : posts).map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 sm:px-8 lg:px-12 bg-[#23194B]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{t('cta.title')}</h2>
            <p className="text-gray-300 mb-8">{t('cta.subtitle')}</p>
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#23194B] font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              {t('cta.button')}
            </Link>
          </div>
        </section>

        <PublicFooter locale={locale} />
      </div>
    </>
  );
}
