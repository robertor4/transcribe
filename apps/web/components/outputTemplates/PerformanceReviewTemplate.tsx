'use client';

import {
  Star,
  Calendar,
  User,
  Trophy,
  TrendingUp,
  Target,
  MessageSquare,
} from 'lucide-react';
import type { PerformanceReviewOutput, PerformanceRating } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox } from './shared';

interface PerformanceReviewTemplateProps {
  data: PerformanceReviewOutput;
}

function RatingBar({ rating }: { rating: number }) {
  const getColor = (r: number) => {
    if (r >= 4) return 'bg-green-500';
    if (r >= 3) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-2 rounded-full ${
              i < rating ? getColor(rating) : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{rating}/5</span>
    </div>
  );
}

function CategoryRatingCard({ rating }: { rating: PerformanceRating }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{rating.category}</h4>
        <RatingBar rating={rating.rating} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{rating.comments}</p>
    </div>
  );
}

function OverallRatingDisplay({ rating }: { rating: number }) {
  const getRatingLabel = (r: number) => {
    if (r >= 5) return 'Exceptional';
    if (r >= 4) return 'Exceeds Expectations';
    if (r >= 3) return 'Meets Expectations';
    if (r >= 2) return 'Below Expectations';
    return 'Unsatisfactory';
  };

  const getColor = (r: number) => {
    if (r >= 4) return 'text-green-600 dark:text-green-400';
    if (r >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
      <div className="flex justify-center mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-10 h-10 ${
              i < rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
      <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{rating}/5</p>
      <p className={`text-lg font-medium mt-1 ${getColor(rating)}`}>{getRatingLabel(rating)}</p>
    </div>
  );
}

export function PerformanceReviewTemplate({ data }: PerformanceReviewTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Star className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Performance Review
            </h2>
            <MetadataRow
              items={[
                { label: 'Employee', value: data.employeeName, icon: User },
                { label: 'Reviewer', value: data.reviewerName },
                { label: 'Period', value: data.reviewPeriod, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Overall Rating */}
      <OverallRatingDisplay rating={data.overallRating} />

      {/* Category Ratings */}
      {data.ratings && data.ratings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Ratings by Category
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {data.ratings.map((rating, idx) => (
              <CategoryRatingCard key={idx} rating={rating} />
            ))}
          </div>
        </div>
      )}

      {/* Accomplishments & Areas for Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.accomplishments && data.accomplishments.length > 0 && (
          <SectionCard
            title="Key Accomplishments"
            icon={Trophy}
            iconColor="text-green-500"
            className="bg-green-50/50 dark:bg-green-900/10"
          >
            <BulletList items={data.accomplishments} bulletColor="bg-green-500" />
          </SectionCard>
        )}
        {data.areasForGrowth && data.areasForGrowth.length > 0 && (
          <SectionCard
            title="Areas for Growth"
            icon={TrendingUp}
            iconColor="text-amber-500"
            className="bg-amber-50/50 dark:bg-amber-900/10"
          >
            <BulletList items={data.areasForGrowth} bulletColor="bg-amber-500" />
          </SectionCard>
        )}
      </div>

      {/* Goals */}
      {data.goals && data.goals.length > 0 && (
        <SectionCard title="Development Goals" icon={Target} iconColor="text-[#8D6AFA]">
          <div className="space-y-3">
            {data.goals.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#8D6AFA]">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 dark:text-gray-300 break-words">{goal.goal}</p>
                  {goal.timeline && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Timeline: {goal.timeline}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Additional Comments */}
      {data.additionalComments && (
        <InfoBox title="Additional Comments" icon={MessageSquare} variant="gray">
          {data.additionalComments}
        </InfoBox>
      )}
    </div>
  );
}
