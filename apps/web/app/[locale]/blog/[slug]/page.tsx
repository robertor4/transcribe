import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { MdxContent } from '@/components/blog/MdxComponents';
import { getBlogPost, getRelatedPosts, getAllSlugs } from '@/lib/blog';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(({ slug, locale }) => ({
    locale,
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      images: post.image
        ? [
            {
              url: post.image,
              width: 1200,
              height: 630,
              alt: post.imageAlt || post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
    alternates: {
      canonical: post.canonicalUrl || post.url,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const post = getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post, 3);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      '@type': 'Person',
      name: post.author,
      jobTitle: post.authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Neural Summary',
      logo: {
        '@type': 'ImageObject',
        url: 'https://neuralsummary.com/assets/logos/neural-summary-logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://neuralsummary.com${post.url}`,
    },
  };

  return (
    <>
      <PublicHeader locale={locale} />

      <article className="min-h-screen bg-white">
        {/* Hero Section */}
        <header className="pt-32 pb-12 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#8D6AFA] transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('post.backToList')}
            </Link>

            {/* Category Badge */}
            {post.category && (
              <span className="inline-block px-3 py-1 bg-[#8D6AFA]/10 text-[#8D6AFA] text-sm font-medium rounded-full mb-4">
                {post.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8">{post.description}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>{format(new Date(post.date), 'MMMM d, yyyy')}</time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readingTime}</span>
              </div>
              {post.updatedAt && (
                <span className="text-gray-400">
                  {t('post.updated')}: {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-4 pb-8 border-b border-gray-200">
              {post.authorImage && (
                <Image
                  src={post.authorImage}
                  alt={post.author}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                {post.authorRole && <p className="text-gray-500 text-sm">{post.authorRole}</p>}
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.image && (
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 mb-12">
            <figure>
              <Image
                src={post.image}
                alt={post.imageAlt || post.title}
                width={1200}
                height={630}
                className="rounded-2xl w-full"
                priority
              />
              {post.imageAlt && (
                <figcaption className="text-center text-sm text-gray-500 mt-4">
                  {post.imageAlt}
                </figcaption>
              )}
            </figure>
          </div>
        )}

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
          <MdxContent code={post.body.code} />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-400" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 px-6 sm:px-8 lg:px-12 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('post.relatedPosts')}</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <article
                    key={relatedPost.slug}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#8D6AFA]/30 hover:shadow-lg transition-all group"
                  >
                    {relatedPost.image && (
                      <Link href={relatedPost.url} className="block relative aspect-video">
                        <Image
                          src={relatedPost.image}
                          alt={relatedPost.imageAlt || relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    )}
                    <div className="p-5">
                      <p className="text-sm text-gray-500 mb-2">{relatedPost.readingTime}</p>
                      <Link href={relatedPost.url}>
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#8D6AFA] transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

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

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </article>
    </>
  );
}
