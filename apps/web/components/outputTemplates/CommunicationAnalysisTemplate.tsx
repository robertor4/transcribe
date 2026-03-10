'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CommunicationAnalysisOutput, CommunicationDimension } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialHeading,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

interface CommunicationAnalysisTemplateProps {
  data: CommunicationAnalysisOutput;
}

function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const strokeWidth = size === 'lg' ? 8 : 6;
  const viewBoxSize = 100;
  const radius = (viewBoxSize - strokeWidth) / 2;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className={`relative ${size === 'lg' ? 'w-28 h-28' : 'w-16 h-16'}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <circle
          cx={center} cy={center} r={radius}
          stroke="currentColor" strokeWidth={strokeWidth} fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={center} cy={center} r={radius}
          stroke={getColor(score)} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-lg'} text-gray-900 dark:text-gray-100`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function DimensionRow({ dimension }: { dimension: CommunicationDimension }) {
  return (
    <div className="py-5">
      <div className="flex items-center gap-4 mb-3">
        <ScoreRing score={dimension.score} size="sm" />
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 break-words">{dimension.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dimension.score >= 80 ? 'Excellent' : dimension.score >= 60 ? 'Good' : 'Needs improvement'}
          </p>
        </div>
      </div>

      <div className="space-y-3 pl-20">
        {dimension.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Strengths
            </div>
            <BulletList items={dimension.strengths} bulletColor="bg-green-500" />
          </div>
        )}

        {dimension.improvements.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Areas to improve
            </div>
            <BulletList items={dimension.improvements} bulletColor="bg-amber-500" />
          </div>
        )}
      </div>
    </div>
  );
}

export function CommunicationAnalysisTemplate({ data }: CommunicationAnalysisTemplateProps) {
  return (
    <EditorialArticle>
      {/* Overall Score */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        <ScoreRing score={data.overallScore} size="lg" />
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Overall Communication Score
          </h1>
          <p className={EDITORIAL.body}>{data.overallAssessment}</p>
        </div>
      </div>

      <hr className={`${EDITORIAL.rule} mb-8`} />

      {/* Key Takeaway */}
      <EditorialPullQuote>
        <p>{data.keyTakeaway}</p>
      </EditorialPullQuote>

      {/* Detailed Breakdown */}
      <section className="mb-10">
        <EditorialHeading>Dimensions</EditorialHeading>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.dimensions.map((dimension, index) => (
            <DimensionRow key={index} dimension={dimension} />
          ))}
        </div>
      </section>
    </EditorialArticle>
  );
}
