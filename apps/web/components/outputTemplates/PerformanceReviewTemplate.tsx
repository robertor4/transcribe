'use client';

import {
  Star,
  Calendar,
  User,
  Trophy,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import type { PerformanceReviewOutput, PerformanceRating } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialNumberedList,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

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
      <p className={EDITORIAL.body}>{rating.comments}</p>
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
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center mb-10">
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
  const metadata = (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.employeeName && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="text-gray-400">Employee:</span> {data.employeeName}
        </span>
      )}
      {data.reviewerName && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span className="text-gray-400">Reviewer:</span> {data.reviewerName}
        </span>
      )}
      {data.reviewPeriod && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.reviewPeriod}
        </span>
      )}
    </div>
  );

  return (
    <EditorialArticle>
      <EditorialTitle title="Performance Review" metadata={metadata} />

      {/* Overall Rating */}
      <OverallRatingDisplay rating={data.overallRating} />

      {/* Category Ratings */}
      {data.ratings && data.ratings.length > 0 && (
        <EditorialSection label="Ratings by Category" icon={Star} borderTop>
          <div className="grid grid-cols-1 gap-4">
            {data.ratings.map((rating, idx) => (
              <CategoryRatingCard key={idx} rating={rating} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Accomplishments & Areas for Growth */}
      {data.accomplishments && data.accomplishments.length > 0 && (
        <EditorialSection label="Key Accomplishments" icon={Trophy} borderTop>
          <BulletList items={data.accomplishments} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {data.areasForGrowth && data.areasForGrowth.length > 0 && (
        <EditorialSection label="Areas for Growth" icon={TrendingUp} borderTop>
          <BulletList items={data.areasForGrowth} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Goals */}
      {data.goals && data.goals.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Development Goals</EditorialHeading>
          <EditorialNumberedList
            items={data.goals.map((goal) => ({
              primary: (
                <span className={EDITORIAL.listItem}>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{goal.goal}</span>
                </span>
              ),
              secondary: goal.timeline ? `Timeline: ${goal.timeline}` : undefined,
            }))}
          />
        </section>
      )}

      {/* Additional Comments */}
      {data.additionalComments && (
        <EditorialSection label="Additional Comments" icon={MessageSquare} borderTop>
          <EditorialPullQuote>
            <p className={EDITORIAL.body}>{data.additionalComments}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
