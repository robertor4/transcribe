import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getPostBySlug, getPostSlugs, extractHeadings } from '@/lib/blog';
import { getBlogPostMetadata } from '@/utils/metadata';
import { SEO_BASE_URL, SITE_NAME } from '@/config/page-metadata';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

// Track paragraph index for drop cap on first paragraph
let paragraphIndex = 0;

function buildMdxComponents(): MDXComponents {
  paragraphIndex = 0;

  return {
    h2: ({ children }) => {
      const text = getTextContent(children);
      const id = slugify(text);
      return (
        <h2
          id={id}
          className="text-xl font-bold text-gray-800 mb-6 mt-10 pb-3 border-b border-gray-200"
          style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const text = getTextContent(children);
      const id = slugify(text);
      return (
        <h3
          id={id}
          className="text-[15px] font-semibold text-gray-900 mt-6 mb-3"
        >
          {children}
        </h3>
      );
    },
    p: ({ children }) => {
      const isFirst = paragraphIndex === 0;
      paragraphIndex++;

      if (isFirst) {
        return (
          <p
            className="text-base lg:text-lg text-gray-700 leading-relaxed mb-6 lg:first-letter:text-4xl lg:first-letter:font-bold lg:first-letter:float-left lg:first-letter:mr-2 lg:first-letter:leading-[1] lg:first-letter:text-gray-900"
            style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
          >
            {children}
          </p>
        );
      }

      return (
        <p className="text-[16px] text-gray-700 leading-[1.35] mb-6">
          {children}
        </p>
      );
    },
    ul: ({ children }) => (
      <ul className="list-none pl-0 space-y-2.5 mb-6">
        {children}
      </ul>
    ),
    ol: ({ children }) => {
      let index = 0;
      const numbered = Array.isArray(children)
        ? children.map((child) => {
            if (child && typeof child === 'object' && 'type' in child) {
              index++;
              return (
                <li key={index} className="flex items-start gap-3 text-[15px] text-gray-700 leading-[1.7]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                    {index}
                  </span>
                  <span className="flex-1">{(child as { props: { children?: ReactNode } }).props.children}</span>
                </li>
              );
            }
            return child;
          })
        : children;
      return (
        <ol className="list-none pl-0 space-y-3 mb-6">
          {numbered}
        </ol>
      );
    },
    li: ({ children }) => (
      <li className="flex items-start gap-3 text-[15px] text-gray-700 leading-[1.7]">
        <span className="flex-shrink-0 w-5 h-5 rounded-full border border-gray-300 text-gray-400 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-600">{children}</em>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[#8D6AFA] pl-5 my-6 text-gray-600 italic">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-[#8D6AFA] hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    hr: () => (
      <hr className="border-t border-gray-200 my-8" />
    ),
  };
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return getBlogPostMetadata(locale, {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.description,
    keywords: post.tags,
    slug: post.slug,
    image: post.image,
    publishedTime: post.date,
    author: post.author,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const headings = extractHeadings(post.content);
  const mdxComponents = buildMdxComponents();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SEO_BASE_URL,
    },
    mainEntityOfPage: `${SEO_BASE_URL}/${locale}/blog/${post.slug}`,
  };

  return (
    <>
      <PublicHeader locale={locale} />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#8D6AFA] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToBlog')}
          </Link>

          {/* Article header — constrained width */}
          <header className="max-w-[680px]">
            <h1
              className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-snug"
              style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
            >
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5 bg-[#8D6AFA]/10 text-[#8D6AFA] text-xs font-semibold px-3 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime}
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.date).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {post.author}
              </span>
              {post.tags.length > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </>
              )}
            </div>
          </header>

          {/* Editorial rule */}
          <hr className="hidden lg:block border-t-2 border-gray-300 mt-6 lg:mt-8" />

          {/* Mobile TOC — inline above content */}
          {headings.length > 0 && (
            <nav className="lg:hidden border-t border-gray-200 pt-4 mt-6 mb-8">
              <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
                {t('tableOfContents')}
              </h2>
              <ul className="space-y-1.5">
                {headings.map((heading) => (
                  <li
                    key={heading.slug}
                    className={heading.level === 3 ? 'ml-4' : ''}
                  >
                    <a
                      href={`#${heading.slug}`}
                      className="text-sm text-gray-600 hover:text-[#8D6AFA] transition-colors"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Two-column layout: content + TOC sidebar */}
          <div className="lg:flex pt-6 lg:pt-10">
            {/* Main content column */}
            <article className="flex-1 min-w-0 lg:pr-10 max-w-[680px]">
              <MDXRemote
                source={post.content}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                  },
                }}
                components={mdxComponents}
              />
            </article>

            {/* Desktop TOC sidebar */}
            {headings.length > 0 && (
              <aside className="hidden lg:block w-60 flex-shrink-0 ml-auto bg-gray-100 -mt-10">
                <nav className="sticky top-8 px-6 pt-10 pb-6">
                  <h2 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                    {t('tableOfContents')}
                  </h2>
                  <ul className="divide-y divide-gray-200">
                    {headings.map((heading) => (
                      <li key={heading.slug}>
                        <a
                          href={`#${heading.slug}`}
                          className={`block hover:text-[#8D6AFA] transition-colors ${
                            heading.level === 3
                              ? 'text-[13px] text-gray-500 leading-relaxed py-2 pl-3'
                              : 'text-sm font-semibold text-gray-900 leading-snug py-3'
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}
          </div>
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
