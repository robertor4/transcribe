import { Hash } from 'lucide-react';
import type { LinkedInOutput } from '@transcribe/shared';

interface LinkedInTemplateProps {
  data: LinkedInOutput;
}

export function LinkedInTemplate({ data }: LinkedInTemplateProps) {
  // Split content by newlines for rendering
  const contentParagraphs = data.content.split('\n').filter((p) => p.trim());

  return (
    <div className="space-y-6">
      {/* LinkedIn Post Preview */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Post Header - LinkedIn Style */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077b5] to-[#00a0dc] flex items-center justify-center">
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Your Name</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Your Headline • Just now</p>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Hook - Bold opener */}
          <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">
            {data.hook}
          </p>

          {/* Main Content */}
          <div className="space-y-3">
            {contentParagraphs.map((paragraph, index) => (
              <p key={index} className="text-gray-700 dark:text-gray-300">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Call to Action */}
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {data.callToAction}
          </p>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {data.hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-[#0077b5] hover:underline cursor-pointer"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Post Actions - LinkedIn Style */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <button className="flex items-center gap-1 hover:text-[#0077b5] transition-colors">
            <span>👍</span> Like
          </button>
          <button className="flex items-center gap-1 hover:text-[#0077b5] transition-colors">
            <span>💬</span> Comment
          </button>
          <button className="flex items-center gap-1 hover:text-[#0077b5] transition-colors">
            <span>🔄</span> Repost
          </button>
          <button className="flex items-center gap-1 hover:text-[#0077b5] transition-colors">
            <span>📤</span> Send
          </button>
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
