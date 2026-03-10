'use client';

import {
  Calendar,
  Briefcase,
  Star,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { InterviewAssessmentOutput, CompetencyAssessment } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

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

function CompetencyRow({ competency }: { competency: CompetencyAssessment }) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{competency.competency}</h4>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
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
          <span className={EDITORIAL.sectionLabel}>Evidence</span>
          <BulletList items={competency.evidence} bulletColor="bg-blue-500" className="mt-1" />
        </div>
      )}
      {competency.notes && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">{competency.notes}</p>
      )}
    </div>
  );
}

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'strong-hire': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Strong Hire' },
  hire: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Hire' },
  'no-hire': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'No Hire' },
  'strong-no-hire': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Strong No Hire' },
};

export function InterviewAssessmentTemplate({ data }: InterviewAssessmentTemplateProps) {
  const recStyle = RECOMMENDATION_STYLES[data.recommendation] || RECOMMENDATION_STYLES['no-hire'];

  const metadata = (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">{data.candidate}</span>
      <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {data.role}</span>
      {data.date && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {data.date}</span>}
    </div>
  );

  return (
    <EditorialArticle>
      <EditorialTitle title="Interview Assessment" metadata={metadata} />

      {/* Overall Score & Recommendation */}
      <div className="flex items-center gap-6 mb-10">
        <div className="text-center">
          <div className="flex justify-center mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-7 h-7 ${
                  i < data.overallScore
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.overallScore}/5</p>
        </div>
        <div className={`${recStyle.bg} rounded-lg px-5 py-3`}>
          <p className={`text-lg font-bold ${recStyle.text}`}>{recStyle.label}</p>
        </div>
      </div>

      {/* Competencies */}
      {data.competencies && data.competencies.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Competency Assessment</EditorialHeading>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.competencies.map((comp, idx) => (
              <CompetencyRow key={idx} competency={comp} />
            ))}
          </div>
        </section>
      )}

      {/* Strengths */}
      {data.strengths && data.strengths.length > 0 && (
        <EditorialSection label="Key Strengths" icon={TrendingUp}>
          <BulletList items={data.strengths} bulletColor="bg-green-500" />
        </EditorialSection>
      )}

      {/* Concerns */}
      {data.concerns && data.concerns.length > 0 && (
        <EditorialSection label="Concerns / Areas to Probe" icon={AlertTriangle}>
          <BulletList items={data.concerns} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Culture Fit */}
      {data.cultureFit && (
        <EditorialSection label="Culture Fit" icon={Users}>
          <EditorialPullQuote>
            <p>{data.cultureFit}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Next Steps */}
      {data.nextSteps && data.nextSteps.length > 0 && (
        <EditorialSection label="Recommended Next Steps" icon={ArrowRight}>
          <BulletList items={data.nextSteps} bulletColor="bg-[#14D0DC]" />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
