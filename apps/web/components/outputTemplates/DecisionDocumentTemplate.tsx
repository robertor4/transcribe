'use client';

import {
  Calendar,
  Users,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CalendarClock,
  FileText,
} from 'lucide-react';
import type { DecisionDocumentOutput, DecisionOption } from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialHeading,
  EditorialPullQuote,
  EditorialParagraphs,
  BulletList,
  StatusBadge,
  safeString,
  EDITORIAL,
} from './shared';

interface DecisionDocumentTemplateProps {
  data: DecisionDocumentOutput;
}

const STATUS_VARIANT_MAP: Record<string, string> = {
  proposed: 'proposed',
  decided: 'decided',
  implemented: 'implemented',
  deprecated: 'deprecated',
};

/** Safely extract the option name from various AI response shapes */
function getOptionName(option: DecisionOption): string {
  const obj = option as unknown as Record<string, unknown>;
  const raw = obj.option ?? obj.name ?? obj.title ?? '';
  return safeString(raw);
}

/** Safely convert a decisionMakers entry (string or object) to a display string */
function toPersonName(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj.name) return String(obj.name);
    if (obj.title) return String(obj.title);
  }
  return safeString(value);
}

function OptionCard({ option, index }: { option: DecisionOption; index: number }) {
  const name = getOptionName(option);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700/50 pb-6 last:border-b-0 last:pb-0">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
        <span className={EDITORIAL.numbering}>
          {String(index + 1).padStart(2, '0')}
        </span>
        {name || `Option ${index + 1}`}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
        {option.pros && option.pros.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-2">
              <ThumbsUp className="w-4 h-4" />
              Pros
            </div>
            <BulletList
              items={option.pros}
              bulletColor="bg-green-500"
              className={EDITORIAL.listItem}
            />
          </div>
        )}
        {option.cons && option.cons.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              <ThumbsDown className="w-4 h-4" />
              Cons
            </div>
            <BulletList
              items={option.cons}
              bulletColor="bg-red-500"
              className={EDITORIAL.listItem}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function DecisionDocumentTemplate({ data }: DecisionDocumentTemplateProps) {
  const statusKey = STATUS_VARIANT_MAP[data.status] || 'proposed';

  const makers = data.decisionMakers?.map(toPersonName).filter(Boolean);

  const metadata = (data.date || (makers && makers.length > 0)) ? (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      {makers && makers.length > 0 && (
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {makers.join(', ')}
        </span>
      )}
      <StatusBadge status={statusKey} variant="custom" className={
        statusKey === 'decided' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
        statusKey === 'implemented' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
        statusKey === 'deprecated' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      } />
    </div>
  ) : undefined;

  // Handle rationale as string or array
  const rationaleText = Array.isArray(data.rationale)
    ? (data.rationale as string[]).map(safeString).filter(Boolean).join('\n\n')
    : data.rationale;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Context */}
      {safeString(data.context) && (
        <EditorialPullQuote>
          <EditorialParagraphs text={data.context} />
        </EditorialPullQuote>
      )}

      {/* Options Considered */}
      {data.options && data.options.length > 0 && (
        <section className="mb-10">
          <EditorialHeading>Options Considered</EditorialHeading>
          <div className="space-y-6 mt-4">
            {data.options.map((option, idx) => (
              <OptionCard
                key={idx}
                option={option}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}

      {/* Decision */}
      {safeString(data.decision) && (
        <EditorialSection label="Decision" icon={CheckCircle2} borderTop>
          <EditorialParagraphs text={data.decision} className="font-semibold" />
        </EditorialSection>
      )}

      {/* Rationale */}
      {safeString(rationaleText) && (
        <EditorialSection label="Rationale" icon={FileText} borderTop>
          <EditorialParagraphs text={rationaleText} />
        </EditorialSection>
      )}

      {/* Consequences */}
      {data.consequences && data.consequences.length > 0 && (
        <EditorialSection label="Consequences" icon={AlertTriangle} borderTop>
          <ul className="list-none pl-0 space-y-2.5">
            {data.consequences.map((item, idx) => {
              const text = safeString(item);
              if (!text) return null;
              const colonIdx = text.indexOf(':');
              const hasLabel = colonIdx > 0 && colonIdx < 60;
              return (
                <li key={idx} className={`flex items-start gap-3 ${EDITORIAL.listItem}`}>
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
                  <span className="flex-1">
                    {hasLabel ? (
                      <>
                        <strong className="font-semibold text-gray-900 dark:text-gray-100">{text.slice(0, colonIdx)}</strong>
                        {text.slice(colonIdx)}
                      </>
                    ) : text}
                  </span>
                </li>
              );
            })}
          </ul>
        </EditorialSection>
      )}

      {/* Review Date */}
      {safeString(data.reviewDate) && (
        <EditorialSection label="Review Date" icon={CalendarClock} borderTop>
          <p className={EDITORIAL.body}>
            {safeString(data.reviewDate)}
          </p>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
