import { LinkedInOutputContent } from '@/lib/mockData';
import { Hash } from 'lucide-react';

interface LinkedInTemplateProps {
  content: LinkedInOutputContent;
}

export function LinkedInTemplate({ content }: LinkedInTemplateProps) {
  const isWithinLimit = content.characterCount <= 280;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
      {/* LinkedIn Post Header */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            LinkedIn Post
          </h3>
          <div className={`text-sm font-medium ${
            isWithinLimit
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {content.characterCount}/280 characters
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#0077b5] rounded-lg p-6">
          <p className="text-lg font-normal text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
            {content.content}
          </p>
        </div>

        {/* Hashtags */}
        {content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Hash className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            {content.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#0077b5]/10 text-[#0077b5] dark:bg-[#0077b5]/20 dark:text-[#4fb3e3]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Character Limit Warning */}
        {!isWithinLimit && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Post exceeds LinkedIn's recommended 280 character limit. Consider shortening for better engagement.
            </p>
          </div>
        )}

        {/* Engagement Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
            💡 LinkedIn Tips
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Posts under 280 characters get 60% more engagement</li>
            <li>• Include a call-to-action or question</li>
            <li>• Use 3-5 relevant hashtags for discoverability</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
