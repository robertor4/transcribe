'use client';

import { TrendingUp, AlertCircle } from 'lucide-react';
import type {
  SpeakerCommunicationAssessmentOutput,
  SpeakerAssessment,
  SpeakerSkillScore,
} from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialHeading,
  EditorialPullQuote,
  EDITORIAL,
} from './shared';

interface SpeakerCommunicationAssessmentTemplateProps {
  data: SpeakerCommunicationAssessmentOutput;
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
    <div className={`relative ${size === 'lg' ? 'w-28 h-28' : 'w-14 h-14'}`}>
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
        <span className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-base'} text-gray-900 dark:text-gray-100`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function SkillBar({ skill }: { skill: SpeakerSkillScore }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{skill.skill}</span>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{skill.score}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(skill.score)}`}
          style={{ width: `${skill.score}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-1">&ldquo;{skill.evidence}&rdquo;</p>
      <p className="text-xs text-[#8D6AFA]">{skill.tip}</p>
    </div>
  );
}

function SpeakerCard({ speaker }: { speaker: SpeakerAssessment }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6 last:mb-0">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-800/50">
        <ScoreRing score={speaker.overallScore} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
            {speaker.speaker}
          </h3>
          {speaker.role && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{speaker.role}</p>
          )}
          <div className="mt-2 space-y-1">
            <div className="flex items-start gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{speaker.topStrength}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{speaker.primaryGrowthArea}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="px-5 py-2">
        {speaker.skills.map((skill, idx) => (
          <SkillBar key={idx} skill={skill} />
        ))}
      </div>
    </div>
  );
}

export function SpeakerCommunicationAssessmentTemplate({ data }: SpeakerCommunicationAssessmentTemplateProps) {
  return (
    <EditorialArticle>
      {/* Context */}
      {data.conversationContext && (
        <p className={`${EDITORIAL.body} mb-6`}>{data.conversationContext}</p>
      )}

      {/* Group Dynamic */}
      <EditorialPullQuote cite="Group dynamic">
        <p>{data.groupDynamic}</p>
      </EditorialPullQuote>

      {/* Speakers */}
      <section className="mb-10">
        <EditorialHeading>Individual assessments</EditorialHeading>
        {data.speakers.map((speaker, idx) => (
          <SpeakerCard key={idx} speaker={speaker} />
        ))}
      </section>
    </EditorialArticle>
  );
}
