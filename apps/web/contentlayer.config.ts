import { defineDocumentType, makeSource } from 'contentlayer2/source-files';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// Supported locales matching i18n.config.ts
const locales = ['en', 'nl', 'de', 'fr', 'es'] as const;
type Locale = (typeof locales)[number];

export const BlogPost = defineDocumentType(() => ({
  name: 'BlogPost',
  filePathPattern: `blog/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
      description: 'The title of the blog post',
    },
    description: {
      type: 'string',
      required: true,
      description: 'A brief description for SEO and previews',
    },
    date: {
      type: 'date',
      required: true,
      description: 'The publish date of the post',
    },
    updatedAt: {
      type: 'date',
      required: false,
      description: 'The last update date',
    },
    author: {
      type: 'string',
      required: true,
      description: 'Author name',
    },
    authorRole: {
      type: 'string',
      required: false,
      description: 'Author role/title',
    },
    authorImage: {
      type: 'string',
      required: false,
      description: 'Path to author avatar image',
    },
    image: {
      type: 'string',
      required: false,
      description: 'Featured image path for the post',
    },
    imageAlt: {
      type: 'string',
      required: false,
      description: 'Alt text for the featured image',
    },
    locale: {
      type: 'enum',
      options: locales,
      required: true,
      description: 'The language/locale of the post',
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      required: false,
      description: 'Tags for categorization',
    },
    category: {
      type: 'string',
      required: false,
      description: 'Primary category',
    },
    featured: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Whether this is a featured post',
    },
    draft: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Draft posts are not published',
    },
    canonicalUrl: {
      type: 'string',
      required: false,
      description: 'Canonical URL if cross-posted',
    },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => {
        // Extract slug from path: blog/en/my-post.mdx -> my-post
        const pathParts = doc._raw.flattenedPath.split('/');
        return pathParts[pathParts.length - 1];
      },
    },
    url: {
      type: 'string',
      resolve: (doc) => {
        const pathParts = doc._raw.flattenedPath.split('/');
        const slug = pathParts[pathParts.length - 1];
        return `/${doc.locale}/blog/${slug}`;
      },
    },
    readingTime: {
      type: 'string',
      resolve: (doc) => {
        const wordsPerMinute = 200;
        const words = doc.body.raw.split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} min read`;
      },
    },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [BlogPost],
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
          onVisitLine(node: { children: unknown[] }) {
            // Prevent lines from collapsing in `display: grid` mode
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }];
            }
          },
          onVisitHighlightedLine(node: { properties: { className: string[] } }) {
            node.properties.className.push('line--highlighted');
          },
          onVisitHighlightedWord(node: { properties: { className: string[] } }) {
            node.properties.className = ['word--highlighted'];
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
    ],
  },
});
