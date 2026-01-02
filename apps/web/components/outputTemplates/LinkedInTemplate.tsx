'use client';

import { useMemo } from 'react';
import {
  Hash,
  Globe,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  BarChart2,
} from 'lucide-react';
import type { LinkedInOutput } from '@transcribe/shared';
import { useAuth } from '@/contexts/AuthContext';

interface LinkedInTemplateProps {
  data: LinkedInOutput;
}

export function LinkedInTemplate({ data }: LinkedInTemplateProps) {
  const { user } = useAuth();

  // Split content by newlines for rendering
  const contentParagraphs = data.content.split('\n').filter((p) => p.trim());

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'Y';
  };

  // Generate stable fake engagement metrics based on content hash
  // Exaggerated ranges to show users what success could look like!
  const engagementMetrics = useMemo(() => {
    // Simple hash from content to create stable random numbers
    const hash = data.content.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);

    const seed = Math.abs(hash);

    // Determine "virality tier" based on hash - some posts go viral!
    const viralityTier = seed % 100;

    let reactions: number;
    let comments: number;
    let reposts: number;
    let impressions: number;

    if (viralityTier < 10) {
      // 10% chance: Modest performance
      reactions = 15 + (seed % 50); // 15-64
      comments = 2 + (seed % 8); // 2-9
      reposts = seed % 3; // 0-2
      impressions = 800 + (seed % 1500); // 800-2,299
    } else if (viralityTier < 50) {
      // 40% chance: Good performance
      reactions = 80 + (seed % 200); // 80-279
      comments = 12 + (seed % 25); // 12-36
      reposts = 3 + (seed % 10); // 3-12
      impressions = 3000 + (seed % 8000); // 3,000-10,999
    } else if (viralityTier < 85) {
      // 35% chance: Great performance
      reactions = 300 + (seed % 500); // 300-799
      comments = 35 + (seed % 60); // 35-94
      reposts = 15 + (seed % 30); // 15-44
      impressions = 12000 + (seed % 25000); // 12,000-36,999
    } else {
      // 15% chance: Viral! 🚀
      reactions = 800 + (seed % 2000); // 800-2,799
      comments = 100 + (seed % 200); // 100-299
      reposts = 50 + (seed % 150); // 50-199
      impressions = 40000 + (seed % 80000); // 40,000-119,999
    }

    return { reactions, comments, reposts, impressions };
  }, [data.content]);

  const displayName = user?.displayName || 'Your Name';

  return (
    <div className="space-y-6">
      {/* LinkedIn Post Preview */}
      <div className="bg-white dark:bg-gray-800/40 overflow-hidden">
        {/* Post Header - LinkedIn Style */}
        <div className="px-4 py-3 flex items-start gap-3 border-b border-gray-100 dark:border-gray-700/50">
          {/* Profile Picture */}
          {user?.photoURL ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#8D6AFA] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">{getInitials()}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">• You</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Your Headline
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span>Just now</span>
              <span>•</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 py-3 space-y-4">
          {/* Hook - Bold opener */}
          <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">
            {data.hook}
          </p>

          {/* Main Content */}
          <div className="space-y-3">
            {contentParagraphs.map((paragraph, index) => {
              const trimmed = paragraph.trim();
              const bulletMatch = trimmed.match(/^[•\-\*]\s*/);
              if (bulletMatch) {
                const text = trimmed.slice(bulletMatch[0].length);
                return (
                  <div key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="mt-2 w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                );
              }
              return (
                <p key={index} className="text-gray-700 dark:text-gray-300">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Call to Action */}
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {data.callToAction}
          </p>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {data.hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-0.5 text-[#0077b5] hover:underline cursor-pointer text-sm"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1">
            <span className="flex -space-x-1">
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">
                👍
              </span>
              <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px]">
                ❤️
              </span>
              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px]">
                👏
              </span>
            </span>
            <span className="ml-1">{engagementMetrics.reactions}</span>
          </div>
          <div className="flex items-center gap-2">
            {engagementMetrics.comments > 0 && (
              <span>
                {engagementMetrics.comments} comment
                {engagementMetrics.comments !== 1 ? 's' : ''}
              </span>
            )}
            {engagementMetrics.comments > 0 && engagementMetrics.reposts > 0 && (
              <span>•</span>
            )}
            {engagementMetrics.reposts > 0 && (
              <span>
                {engagementMetrics.reposts} repost
                {engagementMetrics.reposts !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Post Actions - LinkedIn Style */}
        <div className="px-2 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around text-sm text-gray-600 dark:text-gray-400">
          <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Like</span>
          </button>
          <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Comment</span>
          </button>
          <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Repeat2 className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Repost</span>
          </button>
          <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Send className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Send</span>
          </button>
        </div>

        {/* Analytics Footer */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <BarChart2 className="w-4 h-4 mr-2" />
          <span>{engagementMetrics.impressions.toLocaleString()} impressions</span>
          <span className="ml-auto text-[#0077b5] hover:underline cursor-pointer">
            View analytics
          </span>
        </div>
      </div>

      {/* Tips */}
      <div className="text-sm text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <p className="font-medium mb-2">Tips for posting:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Post during business hours (Tue-Thu morning) for best engagement</li>
          <li>Reply to comments within the first hour to boost visibility</li>
          <li>Tag relevant people or companies to expand reach</li>
        </ul>
      </div>
    </div>
  );
}
