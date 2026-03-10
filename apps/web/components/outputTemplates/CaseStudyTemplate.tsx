'use client';

import {
  Building2,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Wrench,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import type { CaseStudyOutput, CaseStudyMetric } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EditorialParagraphs,
  BulletList,
  EDITORIAL,
} from './shared';

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
            <span className="text-gray-400 dark:text-gray-500">→</span>
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
  const metadata = (data.customer || data.industry) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" />
        {data.customer}
      </span>
      {data.industry && (
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" />
          {data.industry}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Challenge — pull-quote style with red accent */}
      <EditorialSection label="The Challenge" icon={AlertTriangle}>
        <EditorialPullQuote color="#ef4444">
          <EditorialParagraphs text={data.challenge} />
        </EditorialPullQuote>
      </EditorialSection>

      {/* Solution — pull-quote style with purple accent */}
      <EditorialSection label="The Solution" icon={Lightbulb}>
        <EditorialPullQuote color="#8D6AFA">
          <EditorialParagraphs text={data.solution} />
        </EditorialPullQuote>
      </EditorialSection>

      {/* Implementation */}
      {data.implementation && (
        <EditorialSection label="Implementation" icon={Wrench} borderTop>
          <p className={EDITORIAL.body}>{data.implementation}</p>
        </EditorialSection>
      )}

      {/* Results */}
      {data.results && data.results.length > 0 && (
        <EditorialSection label="Results" icon={TrendingUp} borderTop>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((metric, idx) => (
              <MetricCard key={idx} metric={metric} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Testimonial */}
      {data.testimonial && (
        <EditorialSection label="Testimonial" borderTop>
          <EditorialPullQuote cite={data.testimonial.attribution}>
            <p>{data.testimonial.quote}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* Key Takeaways */}
      {data.keyTakeaways && data.keyTakeaways.length > 0 && (
        <EditorialSection label="Key Takeaways" icon={CheckCircle2} borderTop>
          <BulletList items={data.keyTakeaways} bulletColor="bg-green-500" />
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
