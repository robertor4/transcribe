'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import type { MDXComponents } from 'mdx/types';

// Custom components for MDX content
const components: MDXComponents = {
  // Headings with anchor links
  h1: ({ children, id }) => (
    <h1 id={id} className="text-4xl font-bold text-gray-900 mt-12 mb-6 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2 id={id} className="text-3xl font-bold text-gray-900 mt-10 mb-4 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="text-2xl font-semibold text-gray-900 mt-8 mb-3 scroll-mt-24">
      {children}
    </h3>
  ),
  h4: ({ children, id }) => (
    <h4 id={id} className="text-xl font-semibold text-gray-900 mt-6 mb-2 scroll-mt-24">
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-6">{children}</p>
  ),

  // Links
  a: ({ href, children }) => {
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8D6AFA] hover:text-[#7A5AE0] underline underline-offset-2"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href || '#'} className="text-[#8D6AFA] hover:text-[#7A5AE0] underline underline-offset-2">
        {children}
      </Link>
    );
  },

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#8D6AFA] pl-6 py-2 my-6 bg-[#8D6AFA]/5 rounded-r-lg italic text-gray-700">
      {children}
    </blockquote>
  ),

  // Code blocks
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto my-6 text-sm">
      {children}
    </pre>
  ),
  code: ({ children, className }) => {
    // Inline code
    if (!className) {
      return (
        <code className="bg-gray-100 text-[#8D6AFA] px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    // Code block (handled by pre)
    return <code className={className}>{children}</code>;
  },

  // Images with Next.js optimization
  img: ({ src, alt }) => {
    if (!src) return null;
    return (
      <figure className="my-8">
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={450}
          className="rounded-xl w-full"
        />
        {alt && (
          <figcaption className="text-center text-sm text-gray-500 mt-2">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-gray-700">{children}</td>
  ),

  // Horizontal rule
  hr: () => <hr className="my-12 border-gray-200" />,

  // Strong and emphasis
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
};

// Custom callout component for tips, warnings, etc.
function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    tip: 'bg-[#8D6AFA]/10 border-[#8D6AFA] text-[#3F38A0]',
    danger: 'bg-red-50 border-red-500 text-red-800',
  };

  return (
    <div className={`border-l-4 p-4 my-6 rounded-r-lg ${styles[type]}`}>
      {title && <p className="font-semibold mb-2">{title}</p>}
      <div className="prose-sm">{children}</div>
    </div>
  );
}

// Add custom components
const customComponents = {
  ...components,
  Callout,
};

interface MdxContentProps {
  code: string;
}

export function MdxContent({ code }: MdxContentProps) {
  const Component = useMDXComponent(code);
  return (
    <div className="prose prose-lg max-w-none">
      <Component components={customComponents} />
    </div>
  );
}
