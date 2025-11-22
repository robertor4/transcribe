import { BlogPostOutputContent } from '@/lib/mockData';

interface BlogPostTemplateProps {
  content: BlogPostOutputContent;
}

export function BlogPostTemplate({ content }: BlogPostTemplateProps) {
  return (
    <article className="prose prose-lg max-w-none">
      {/* Hero Image Placeholder */}
      {content.images?.hero && (
        <div className="mb-12 -mx-6 lg:-mx-12">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Hero Image
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                {content.images?.hero?.altText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Title & Subtitle */}
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
          {content.headline}
        </h1>
        {content.subheading && (
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
            {content.subheading}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-500 mt-4">
          <span>{content.metadata.wordCount} words</span>
          <span>·</span>
          <span>{Math.ceil(content.metadata.wordCount / 200)} min read</span>
          <span>·</span>
          <span>{content.metadata.targetAudience}</span>
        </div>
      </header>

      {/* Hook */}
      <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-8">
        {content.hook}
      </div>

      {/* Sections */}
      {content.sections.map((section, idx) => (
        <section key={idx} className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {section.heading}
          </h2>

          {section.paragraphs.map((paragraph, pIdx) => (
            <p key={pIdx} className="font-medium text-gray-700 dark:text-gray-300 mb-4">
              {paragraph}
            </p>
          ))}

          {/* Bullet Points */}
          {section.bulletPoints && section.bulletPoints.length > 0 && (
            <ul className="list-disc list-inside space-y-2 mb-4">
              {section.bulletPoints.map((point, bIdx) => (
                <li key={bIdx} className="font-medium text-gray-700 dark:text-gray-300">
                  {point}
                </li>
              ))}
            </ul>
          )}

          {/* Quotes */}
          {section.quotes && section.quotes.length > 0 && (
            <div className="my-6 pl-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#cc3399]">
              {section.quotes.map((quote, qIdx) => (
                <blockquote key={qIdx} className="mb-4 last:mb-0">
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 italic mb-2">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <cite className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    — {quote.attribution}
                  </cite>
                </blockquote>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Call to Action */}
      <div className="mt-12 p-6 bg-[#cc3399]/10 border-2 border-[#cc3399] rounded-xl">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {content.callToAction}
        </p>
      </div>
    </article>
  );
}
