'use client';

import { MessageSquare, TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { CommunicationAnalysisOutput, CommunicationDimension } from '@transcribe/shared';
import { TemplateHeader, BulletList } from './shared';

interface CommunicationAnalysisTemplateProps {
  data: CommunicationAnalysisOutput;
}

function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const radius = size === 'lg' ? 45 : 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e'; // green
    if (s >= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className={`relative ${size === 'lg' ? 'w-28 h-28' : 'w-16 h-16'}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth={size === 'lg' ? 8 : 6}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={getColor(score)}
          strokeWidth={size === 'lg' ? 8 : 6}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
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

function DimensionCard({ dimension }: { dimension: CommunicationDimension }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-4 mb-4">
        <ScoreRing score={dimension.score} size="sm" />
        <div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100">{dimension.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {dimension.score >= 80 ? 'Excellent' : dimension.score >= 60 ? 'Good' : 'Needs improvement'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Strengths */}
        {dimension.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              Strengths
            </div>
            <BulletList
              items={dimension.strengths}
              bulletColor="bg-green-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}

        {/* Improvements */}
        {dimension.improvements.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
              <TrendingDown className="w-4 h-4" />
              Areas to improve
            </div>
            <BulletList
              items={dimension.improvements}
              bulletColor="bg-amber-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CommunicationAnalysisTemplate({ data }: CommunicationAnalysisTemplateProps) {
  return (
    <div className="space-y-6">
      <TemplateHeader icon={MessageSquare} label="Communication Analysis" />

      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ScoreRing score={data.overallScore} size="lg" />
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Overall Communication Score
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {data.overallAssessment}
            </p>
          </div>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="bg-[#cc3399]/5 dark:bg-[#cc3399]/10 border border-[#cc3399]/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-[#cc3399] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Key takeaway</h4>
            <p className="text-gray-700 dark:text-gray-300">{data.keyTakeaway}</p>
          </div>
        </div>
      </div>

      {/* Dimension Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Detailed breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.dimensions.map((dimension, index) => (
            <DimensionCard key={index} dimension={dimension} />
          ))}
        </div>
      </div>
    </div>
  );
}
