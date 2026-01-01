'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TypewriterText } from '../TypewriterText';
import type { CommunicationAnalysisExampleData, CommunicationDimensionData } from '../exampleData';

interface CommunicationAnalysisExampleProps {
  data: CommunicationAnalysisExampleData;
  isActive: boolean;
  onComplete?: () => void;
}

function ScoreRing({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const strokeWidth = size === 'md' ? 6 : 5;
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
    <div className={`relative ${size === 'md' ? 'w-14 h-14' : 'w-10 h-10'}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${size === 'md' ? 'text-base' : 'text-xs'} text-gray-900`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function DimensionRow({ dimension }: { dimension: CommunicationDimensionData }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <ScoreRing score={dimension.score} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{dimension.name}</div>
        <div className="mt-1 space-y-0.5">
          {dimension.strengths[0] && (
            <div className="flex items-start gap-1.5 text-xs text-gray-600">
              <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{dimension.strengths[0]}</span>
            </div>
          )}
          {dimension.improvements[0] && (
            <div className="flex items-start gap-1.5 text-xs text-gray-600">
              <TrendingDown className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{dimension.improvements[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommunicationAnalysisExample({ data, isActive, onComplete }: CommunicationAnalysisExampleProps) {
  const [sectionsComplete, setSectionsComplete] = useState({
    assessment: false,
  });

  // Show only first 2 dimensions for condensed view
  const displayDimensions = data.dimensions.slice(0, 2);

  return (
    <div className="space-y-3">
      {/* Overall Score Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
        <ScoreRing score={data.overallScore} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Overall Score
          </div>
          <div className="text-sm text-gray-700 mt-1">
            <TypewriterText
              text={data.overallAssessment}
              speed={15}
              delay={0}
              isActive={isActive}
              onComplete={() => {
                setSectionsComplete(prev => ({ ...prev, assessment: true }));
                onComplete?.();
              }}
            />
          </div>
        </div>
      </div>

      {/* Dimension Rows - show after assessment completes */}
      {sectionsComplete.assessment && (
        <div className="divide-y divide-gray-100">
          {displayDimensions.map((dimension, index) => (
            <DimensionRow key={index} dimension={dimension} />
          ))}
        </div>
      )}

      {/* Show more indicator */}
      {sectionsComplete.assessment && data.dimensions.length > 2 && (
        <div className="text-xs text-gray-400 text-center pt-1">
          +{data.dimensions.length - 2} more dimensions
        </div>
      )}
    </div>
  );
}

export default CommunicationAnalysisExample;
