'use client';

import {
  FileText,
  Building2,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Wrench,
  TrendingUp,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import type { CaseStudyOutput, CaseStudyMetric } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox } from './shared';

interface CaseStudyTemplateProps {
  data: CaseStudyOutput;
}

function MetricCard({ metric }: { metric: CaseStudyMetric }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{metric.metric}</p>
      <div className="flex items-center justify-center gap-2 mt-2">
        {metric.before && (
          <>
            <span className="text-lg text-gray-500 dark:text-gray-400">{metric.before}</span>
            <span className="text-gray-400">→</span>
          </>
        )}
        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{metric.after}</span>
      </div>
      {metric.improvement && (
        <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
          {metric.improvement}
        </p>
      )}
    </div>
  );
}

export function CaseStudyTemplate({ data }: CaseStudyTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.title}
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {data.customer}
              </span>
              {data.industry && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {data.industry}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Challenge */}
      <InfoBox title="The Challenge" icon={AlertTriangle} variant="red">
        {data.challenge}
      </InfoBox>

      {/* Solution */}
      <InfoBox title="The Solution" icon={Lightbulb} variant="purple">
        {data.solution}
      </InfoBox>

      {/* Implementation */}
      {data.implementation && (
        <SectionCard title="Implementation" icon={Wrench} iconColor="text-blue-500">
          <p className="text-gray-700 dark:text-gray-300">{data.implementation}</p>
        </SectionCard>
      )}

      {/* Results */}
      {data.results && data.results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Results
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((metric, idx) => (
              <MetricCard key={idx} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Testimonial */}
      {data.testimonial && (
        <div className="bg-[#8D6AFA]/5 dark:bg-[#8D6AFA]/10 rounded-xl p-6">
          <Quote className="w-8 h-8 text-[#8D6AFA]/50 mb-3" />
          <blockquote className="text-lg text-gray-700 dark:text-gray-300 italic mb-4">
            &ldquo;{data.testimonial.quote}&rdquo;
          </blockquote>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            — {data.testimonial.attribution}
          </p>
        </div>
      )}

      {/* Key Takeaways */}
      {data.keyTakeaways && data.keyTakeaways.length > 0 && (
        <SectionCard
          title="Key Takeaways"
          icon={CheckCircle2}
          iconColor="text-green-500"
          className="bg-green-50/50 dark:bg-green-900/10"
        >
          <BulletList items={data.keyTakeaways} bulletColor="bg-green-500" />
        </SectionCard>
      )}
    </div>
  );
}
