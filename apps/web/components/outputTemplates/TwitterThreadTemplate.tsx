'use client';

import {
  Twitter,
  Zap,
  ArrowRight,
  Hash,
} from 'lucide-react';
import type { TwitterThreadOutput, ThreadTweet } from '@transcribe/shared';
import { InfoBox } from './shared';

interface TwitterThreadTemplateProps {
  data: TwitterThreadOutput;
}

function TweetCard({ tweet }: { tweet: ThreadTweet }) {
  const characterPercentage = (tweet.characterCount / 280) * 100;
  const isNearLimit = characterPercentage > 90;
  const isOverLimit = tweet.characterCount > 280;

  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
            <span className="text-sm font-bold text-[#1DA1F2]">{tweet.tweetNumber}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {tweet.content}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Character count bar */}
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOverLimit
                      ? 'bg-red-500'
                      : isNearLimit
                      ? 'bg-amber-500'
                      : 'bg-[#1DA1F2]'
                  }`}
                  style={{ width: `${Math.min(characterPercentage, 100)}%` }}
                />
              </div>
              <span
                className={`text-xs ${
                  isOverLimit
                    ? 'text-red-500'
                    : isNearLimit
                    ? 'text-amber-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {tweet.characterCount}/280
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TwitterThreadTemplate({ data }: TwitterThreadTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Twitter className="w-6 h-6 text-[#1DA1F2] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Twitter/X Thread
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Hash className="w-4 h-4" />
              <span>{data.totalTweets} tweet{data.totalTweets !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hook */}
      <InfoBox title="Hook (Tweet 1)" icon={Zap} variant="cyan">
        {data.hook}
      </InfoBox>

      {/* Thread */}
      {data.tweets && data.tweets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
            Full Thread
          </h3>
          <div className="relative">
            {/* Thread line */}
            <div className="absolute left-[1.25rem] top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-3">
              {data.tweets.map((tweet, idx) => (
                <TweetCard key={idx} tweet={tweet} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {data.callToAction && (
        <InfoBox title="Call to Action" icon={ArrowRight} variant="purple">
          {data.callToAction}
        </InfoBox>
      )}
    </div>
  );
}
