'use client';

import {
  Calendar,
  User,
  Building2,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { ExitInterviewOutput, ExitTheme } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  BulletList,
  StatusBadge,
  EDITORIAL,
} from './shared';

interface ExitInterviewTemplateProps {
  data: ExitInterviewOutput;
}

function ThemeCard({ theme }: { theme: ExitTheme }) {
  const sentimentConfig = {
    positive: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-200 dark:border-green-800/30',
    },
    negative: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/30',
    },
    neutral: {
      icon: MinusCircle,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-800/50',
      border: 'border-gray-200 dark:border-gray-700/50',
    },
  };

  const config = sentimentConfig[theme.sentiment];
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{theme.theme}</h4>
            <StatusBadge status={theme.sentiment} variant="sentiment" />
          </div>
          {theme.details && theme.details.length > 0 && (
            <ul className="space-y-1">
              {theme.details.map((detail, idx) => (
                <li key={idx} className={`flex items-start gap-2 ${EDITORIAL.listItem}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function BooleanIndicator({ value, label }: { value: boolean | null; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className={EDITORIAL.body}>{label}</span>
      {value === true && <CheckCircle2 className="w-6 h-6 text-green-500" />}
      {value === false && <XCircle className="w-6 h-6 text-red-500" />}
      {value === null && <MinusCircle className="w-6 h-6 text-gray-400" />}
    </div>
  );
}

export function ExitInterviewTemplate({ data }: ExitInterviewTemplateProps) {
  const metadata = (data.employee || data.department || data.tenure || data.date) ? (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.employee && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> {data.employee}
        </span>
      )}
      {data.department && (
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> {data.department}
        </span>
      )}
      {data.tenure && (
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {data.tenure}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> {data.date}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title="Exit Interview Analysis" metadata={metadata} />

      {/* Reason for Leaving — pull-quote style */}
      {data.reasonForLeaving && (
        <EditorialPullQuote cite="Primary Reason for Leaving">
          <p>{data.reasonForLeaving}</p>
        </EditorialPullQuote>
      )}

      {/* Key Themes */}
      {data.themes && data.themes.length > 0 && (
        <EditorialSection label="Key Themes" icon={TrendingUp} borderTop>
          <div className="space-y-4">
            {data.themes.map((theme, idx) => (
              <ThemeCard key={idx} theme={theme} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* What Worked Well vs Could Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {data.whatWorkedWell && data.whatWorkedWell.length > 0 && (
          <EditorialSection label="What Worked Well" icon={ThumbsUp}>
            <BulletList items={data.whatWorkedWell} bulletColor="bg-green-500" />
          </EditorialSection>
        )}
        {data.whatCouldImprove && data.whatCouldImprove.length > 0 && (
          <EditorialSection label="Areas for Improvement" icon={ThumbsDown}>
            <BulletList items={data.whatCouldImprove} bulletColor="bg-red-500" />
          </EditorialSection>
        )}
      </div>

      {/* Suggestions */}
      {data.suggestions && data.suggestions.length > 0 && (
        <EditorialSection label="Suggestions" icon={Lightbulb} borderTop>
          <BulletList items={data.suggestions} bulletColor="bg-amber-500" />
        </EditorialSection>
      )}

      {/* Would Recommend / Would Return */}
      <EditorialSection label="Final Assessment" icon={MessageSquare} borderTop>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <BooleanIndicator value={data.wouldRecommend} label="Would Recommend Company" />
          <BooleanIndicator value={data.wouldReturn} label="Would Return" />
        </div>
      </EditorialSection>
    </EditorialArticle>
  );
}
