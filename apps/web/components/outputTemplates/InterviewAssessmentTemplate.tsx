'use client';

import {
  UserCheck,
  Calendar,
  Briefcase,
  Star,
  ThumbsUp,
  AlertTriangle,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { InterviewAssessmentOutput, CompetencyAssessment } from '@transcribe/shared';
import { SectionCard, BulletList, MetadataRow, InfoBox, StatusBadge } from './shared';

interface InterviewAssessmentTemplateProps {
  data: InterviewAssessmentOutput;
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const percentage = (score / max) * 100;
  const getColor = (s: number) => {
    if (s >= 4) return 'bg-green-500';
    if (s >= 3) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-8 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

function CompetencyCard({ competency }: { competency: CompetencyAssessment }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{competency.competency}</h4>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < competency.score
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
      <ScoreBar score={competency.score} />
      {competency.evidence && competency.evidence.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Evidence
          </span>
          <BulletList
            items={competency.evidence}
            bulletColor="bg-blue-500"
            className="mt-1 text-sm text-gray-600 dark:text-gray-400"
          />
        </div>
      )}
      {competency.notes && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">{competency.notes}</p>
      )}
    </div>
  );
}

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'strong-hire': {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    label: 'Strong Hire',
  },
  hire: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Hire',
  },
  'no-hire': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'No Hire',
  },
  'strong-no-hire': {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Strong No Hire',
  },
};

export function InterviewAssessmentTemplate({ data }: InterviewAssessmentTemplateProps) {
  const recStyle = RECOMMENDATION_STYLES[data.recommendation] || RECOMMENDATION_STYLES['no-hire'];

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <UserCheck className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Interview Assessment
            </h2>
            <MetadataRow
              items={[
                { label: 'Candidate', value: data.candidate },
                { label: 'Role', value: data.role, icon: Briefcase },
                { label: 'Date', value: data.date, icon: Calendar },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Overall Score & Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
          <div className="flex justify-center mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-8 h-8 ${
                  i < data.overallScore
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.overallScore}/5</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overall Score</p>
        </div>
        <div className={`${recStyle.bg} rounded-xl p-6 text-center flex flex-col items-center justify-center`}>
          <p className={`text-2xl font-bold ${recStyle.text}`}>{recStyle.label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recommendation</p>
        </div>
      </div>

      {/* Competencies */}
      {data.competencies && data.competencies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Competency Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.competencies.map((comp, idx) => (
              <CompetencyCard key={idx} competency={comp} />
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.strengths && data.strengths.length > 0 && (
          <SectionCard
            title="Key Strengths"
            icon={ThumbsUp}
            iconColor="text-green-500"
            className="bg-green-50/50 dark:bg-green-900/10"
          >
            <BulletList items={data.strengths} bulletColor="bg-green-500" />
          </SectionCard>
        )}
        {data.concerns && data.concerns.length > 0 && (
          <SectionCard
            title="Concerns / Areas to Probe"
            icon={AlertTriangle}
            iconColor="text-amber-500"
            className="bg-amber-50/50 dark:bg-amber-900/10"
          >
            <BulletList items={data.concerns} bulletColor="bg-amber-500" />
          </SectionCard>
        )}
      </div>

      {/* Culture Fit */}
      {data.cultureFit && (
        <InfoBox title="Culture Fit Assessment" icon={Users} variant="purple">
          {data.cultureFit}
        </InfoBox>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <SectionCard title="Recommended Next Steps" icon={ArrowRight} iconColor="text-[#14D0DC]">
          <BulletList items={data.nextSteps} bulletColor="bg-[#14D0DC]" />
        </SectionCard>
      )}
    </div>
  );
}
