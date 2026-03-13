'use client';

import {
  Code2,
  Calendar,
  User,
  Target,
  Ban,
  GitBranch,
  Check,
  X,
  Shield,
  TestTube2,
  Rocket,
  HelpCircle,
  Network,
  Square,
} from 'lucide-react';
import type { TechnicalDesignDocOutput, DesignAlternative } from '@transcribe/shared';
import { Mermaid } from '../Mermaid';
import { Badge } from '@/components/ui/badge';
import {
  BulletList,
  safeString,
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  EditorialParagraphs,
  EditorialCollapsible,
  EditorialNumberedList,
} from './shared';

interface TechnicalDesignDocTemplateProps {
  data: TechnicalDesignDocOutput;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
  review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  implemented: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

function AlternativeCard({ alternative, index }: { alternative: DesignAlternative; index: number }) {
  const isRejected = alternative.rejected;

  return (
    <div className={`border rounded-lg p-5 ${
      isRejected
        ? 'border-gray-200 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/20'
        : 'border-gray-200 dark:border-gray-700/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
          {index + 1}. {safeString(alternative.approach)}
        </h4>
        {isRejected && (
          <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50">
            Rejected
          </Badge>
        )}
      </div>

      {((alternative.pros && alternative.pros.length > 0) || (alternative.cons && alternative.cons.length > 0)) && (
        <div className="space-y-3">
          {alternative.pros && alternative.pros.length > 0 && (
            <ul className="space-y-1.5">
              {alternative.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{safeString(pro)}</span>
                </li>
              ))}
            </ul>
          )}
          {alternative.cons && alternative.cons.length > 0 && (
            <ul className="space-y-1.5">
              {alternative.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <X className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{safeString(con)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {alternative.rejectionReason && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
          {safeString(alternative.rejectionReason)}
        </p>
      )}
    </div>
  );
}

/** Parse bullet lines (starting with "- ") from text, falling back to paragraphs */
function parseBulletLines(text: string): string[] | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith('- '));
  if (bullets.length >= 2) return bullets.map(l => l.replace(/^- /, ''));
  return null;
}

function TestingStrategyContent({ text }: { text: string }) {
  const items = parseBulletLines(text);
  if (!items) return <EditorialParagraphs text={text} />;

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
          <Square className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function boldBeforeColon(text: string) {
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 40) {
    return (
      <>
        <strong className="font-semibold text-gray-900 dark:text-gray-100">{text.slice(0, colonIdx)}</strong>
        {text.slice(colonIdx)}
      </>
    );
  }
  return text;
}

function RolloutPlanContent({ text }: { text: string }) {
  // Try bullet format first
  const bullets = parseBulletLines(text);
  if (bullets) {
    return (
      <ul className="space-y-2">
        {bullets.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]">&gt;</span>
            <span>{boldBeforeColon(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Fallback: paragraph format — split by double newline, bold phase labels
  const str = safeString(text);
  if (!str) return null;
  const paragraphs = str.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((p, idx) => (
        <p key={idx} className={EDITORIAL.body}>
          {boldBeforeColon(p)}
        </p>
      ))}
    </div>
  );
}

export function TechnicalDesignDocTemplate({ data }: TechnicalDesignDocTemplateProps) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.draft;

  const metadata = (data.author || data.date || data.status) ? (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
      {data.author && (
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {data.author}
        </span>
      )}
      {data.date && (
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {data.date}
        </span>
      )}
      {data.status && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle}`}>
          {data.status}
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Overview — pull-quote style */}
      {safeString(data.overview) && (
        <EditorialPullQuote>
          <EditorialParagraphs text={data.overview} />
        </EditorialPullQuote>
      )}

      {/* Background */}
      {data.background && (
        <EditorialSection label="Background" borderTop>
          <EditorialParagraphs text={data.background} />
        </EditorialSection>
      )}

      {/* Goals & Non-Goals */}
      {data.goals && data.goals.length > 0 && (
        <EditorialSection label="Goals" icon={Target} borderTop>
          <BulletList items={data.goals} bulletColor="bg-green-600 dark:bg-green-500" variant="chevron" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}
      {data.nonGoals && data.nonGoals.length > 0 && (
        <EditorialSection label="Non-Goals" icon={Ban}>
          <BulletList items={data.nonGoals} bulletColor="bg-gray-800 dark:bg-gray-200" variant="chevron" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}

      {/* Proposed Solution */}
      {safeString(data.proposedSolution) && (
        <EditorialSection label="Proposed Solution" borderTop>
          <EditorialParagraphs text={data.proposedSolution} />
        </EditorialSection>
      )}

      {/* Diagrams */}
      {data.diagrams && data.diagrams.filter(d => d.chart).length > 0 && (
        <EditorialSection label="Architecture Diagrams" icon={Network} borderTop>
          {data.diagrams.filter(d => d.chart).map((diagram, idx) => (
            <Mermaid key={idx} chart={diagram.chart} title={diagram.title} caption={diagram.caption} />
          ))}
        </EditorialSection>
      )}

      {/* Alternatives Considered */}
      {data.alternatives && data.alternatives.length > 0 && (
        <EditorialCollapsible
          label="Alternatives Considered"
          icon={GitBranch}
          count={data.alternatives.length}
          defaultOpen={false}
        >
          <div className="space-y-4">
            {data.alternatives.map((alt, idx) => (
              <AlternativeCard key={idx} alternative={alt} index={idx} />
            ))}
          </div>
        </EditorialCollapsible>
      )}

      {/* Technical Details */}
      {data.technicalDetails && data.technicalDetails.length > 0 && (
        <EditorialSection label="Technical Details" icon={Code2} borderTop>
          <EditorialNumberedList
            items={data.technicalDetails.map(detail => {
              const text = safeString(detail);
              const colonIdx = text.indexOf(':');
              if (colonIdx > 0 && colonIdx < 50) {
                return {
                  primary: (
                    <>
                      <strong className="font-semibold text-gray-900 dark:text-gray-100">{text.slice(0, colonIdx)}</strong>
                      {text.slice(colonIdx)}
                    </>
                  ),
                };
              }
              return { primary: text };
            })}
          />
        </EditorialSection>
      )}

      {/* Security Considerations */}
      {data.securityConsiderations && data.securityConsiderations.length > 0 && (
        <EditorialSection label="Security Considerations" icon={Shield} borderTop>
          <BulletList items={data.securityConsiderations} bulletColor="bg-red-600" variant="chevron" className={EDITORIAL.listItem} />
        </EditorialSection>
      )}

      {/* Testing Strategy — render as checkbox list if bullet lines detected */}
      {data.testingStrategy && (
        <EditorialSection label="Testing Strategy" icon={TestTube2} borderTop>
          <TestingStrategyContent text={data.testingStrategy} />
        </EditorialSection>
      )}

      {/* Rollout Plan — render as bullet list with bold phase labels */}
      {data.rolloutPlan && (
        <EditorialSection label="Rollout Plan" icon={Rocket} borderTop>
          <RolloutPlanContent text={data.rolloutPlan} />
        </EditorialSection>
      )}

      {/* Open Questions */}
      {data.openQuestions && data.openQuestions.length > 0 && (
        <EditorialCollapsible label="Open Questions" icon={HelpCircle} count={data.openQuestions.length} defaultOpen>
          <ul className="space-y-2">
            {data.openQuestions.map((question, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7]">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-[10px] font-bold flex items-center justify-center mt-[3px]">
                  {idx + 1}
                </span>
                <span>{safeString(question)}</span>
              </li>
            ))}
          </ul>
        </EditorialCollapsible>
      )}
    </EditorialArticle>
  );
}
