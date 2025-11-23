import { BlogPostOutputContent } from '@/lib/mockData';
import Image from 'next/image';

interface BlogPostTemplateProps {
  content: BlogPostOutputContent;
}

export function BlogPostTemplate({ content }: BlogPostTemplateProps) {
  return (
    <article>
      {/* Hero Section - New layout */}
      <header className="mb-20">
        {/* Category Badge */}
        <div className="mb-8">
          <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-full">
            {content.metadata.targetAudience}
          </span>
        </div>

        {/* Title & Intro - 50/50 Split */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Left: Title */}
          <div>
            <h1 className="text-5xl font-medium text-gray-900 dark:text-gray-100 leading-tight" style={{ fontSize: '48px', fontWeight: 500 }}>
              {content.headline}
            </h1>
          </div>

          {/* Right: Intro/Teaser - Longer */}
          <div className="flex items-end">
            <p className="text-[21px] font-normal text-gray-700 dark:text-gray-300 leading-relaxed">
              {content.subheading || content.hook}
            </p>
          </div>
        </div>

        {/* Full-width Hero Image */}
        {content.images?.hero && (
          <div className="-mx-6 lg:-mx-12 mb-12">
            <div className="aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden flex items-center justify-center">
              {/* Placeholder indicator */}
              <div className="text-center p-8">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  AI-Generated Hero Image
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  {content.images?.hero?.altText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Author & Metadata */}
        <div className="flex items-center gap-4 py-6 border-y border-gray-200 dark:border-gray-700">
          {/* Author Avatar & Info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Circular Avatar with Neural Summary Logo */}
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-white">
              <Image
                src="/android-chrome-192x192.png"
                alt="Neural Summary Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Neural Summary
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Chief Editor
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-right text-xs text-gray-600 dark:text-gray-400">
            <div>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="mt-0.5">{Math.ceil(content.metadata.wordCount / 200)} min read</div>
          </div>
        </div>
      </header>

      {/* Hook - Featured opening paragraph */}
      <div className="text-xl font-normal text-gray-700 dark:text-gray-300 mb-16 leading-relaxed">
        {content.hook}
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {content.sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {section.heading}
            </h2>

            <div className="space-y-6">
              {section.paragraphs.map((paragraph, pIdx) => (
                <p key={pIdx} className="text-lg font-normal text-gray-700 dark:text-gray-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Bullet Points */}
            {section.bulletPoints && section.bulletPoints.length > 0 && (
              <ul className="mt-6 space-y-3">
                {section.bulletPoints.map((point, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#cc3399] mt-2.5" />
                    <span className="text-lg font-normal text-gray-700 dark:text-gray-300 leading-relaxed">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Quotes - Calm, elegant styling */}
            {section.quotes && section.quotes.length > 0 && (
              <div className="my-8 space-y-6">
                {section.quotes.map((quote, qIdx) => (
                  <blockquote key={qIdx} className="relative pl-8 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#cc3399] rounded-full" />
                    <p className="text-xl font-light text-gray-700 dark:text-gray-300 italic mb-3 leading-relaxed">
                      "{quote.text}"
                    </p>
                    <cite className="text-sm font-medium text-gray-600 dark:text-gray-400 not-italic">
                      — {quote.attribution}
                    </cite>
                  </blockquote>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Call to Action - Subtle, elegant */}
      <div className="mt-20 p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <p className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
          {content.callToAction}
        </p>
      </div>
    </article>
  );
}
