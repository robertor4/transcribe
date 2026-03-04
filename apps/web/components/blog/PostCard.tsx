import Link from 'next/link';
import { Calendar, Clock, Tag } from 'lucide-react';
import type { PostMeta } from '@/lib/blog';

interface PostCardProps {
  post: PostMeta;
  locale: string;
}

export function PostCard({ post, locale }: PostCardProps) {
  return (
    <article className="group">
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="block p-6 rounded-2xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-200"
      >
        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-[#8D6AFA] transition-colors mb-3 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {post.description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime}
          </span>
          {post.tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {post.tags[0]}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
