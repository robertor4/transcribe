import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import type { PostMeta } from '@/lib/blog';

interface PostCardProps {
  post: PostMeta;
  locale: string;
  featured?: boolean;
}

export function PostCard({ post, locale, featured = false }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (featured) {
    return (
      <article className="group">
        <Link
          href={`/${locale}/blog/${post.slug}`}
          className="block rounded-2xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          {post.image && (
            <div className="relative w-full aspect-[2/1] overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )}
          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-[#8D6AFA] bg-purple-50 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-[#8D6AFA] transition-colors mb-4 leading-tight">
              {post.title}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 max-w-2xl">
              {post.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingTime}
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
      >
        {post.image && (
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          </div>
        )}
        <div className="flex flex-col flex-1 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-[#8D6AFA] bg-purple-50 px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#8D6AFA] transition-colors mb-2 line-clamp-2 leading-snug">
            {post.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
            {post.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-4 border-t border-gray-100">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
