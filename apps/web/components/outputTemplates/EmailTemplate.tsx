'use client';

import { useState } from 'react';
import {
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  Target,
  Lightbulb,
  Clock,
  Users,
  FileText,
  Send,
  Mail,
  Info,
  Loader2,
} from 'lucide-react';
import type {
  FollowUpEmailOutput,
  SalesEmailOutput,
  InternalUpdateOutput,
  ClientProposalOutput,
  EmailActionItem,
} from '@transcribe/shared';
import { BulletList } from './shared';
import { useAuth } from '@/contexts/AuthContext';
import { transcriptionApi } from '@/lib/api';

// Union type for all email outputs
type EmailData =
  | FollowUpEmailOutput
  | SalesEmailOutput
  | InternalUpdateOutput
  | ClientProposalOutput;

interface EmailTemplateProps {
  data: EmailData;
  analysisId?: string;
}

// Shared email header component - clean subject line
function EmailHeader({ subject }: { subject: string }) {
  return (
    <div className="pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
        <span className="font-medium">Subject:</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {subject}
      </h2>
    </div>
  );
}

// Shared greeting and body component
function EmailBody({
  greeting,
  body,
  children,
}: {
  greeting: string;
  body: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-gray-900 dark:text-gray-100">{greeting}</p>

      <div className="space-y-4">
        {body.map((paragraph, index) => (
          <p
            key={index}
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {children}
    </div>
  );
}

// Shared closing component - styled as signature block
function EmailClosing({ closing }: { closing: string }) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{closing}</p>
    </div>
  );
}

// Follow-up Email specific content
function FollowUpEmailContent({ data }: { data: FollowUpEmailOutput }) {
  return (
    <>
      {/* Meeting Recap */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          Meeting recap
        </h3>
        <p className="text-gray-700 dark:text-gray-300">{data.meetingRecap}</p>
      </div>

      {/* Decisions Confirmed */}
      {data.decisionsConfirmed.length > 0 && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Decisions confirmed
          </h3>
          <BulletList
            items={data.decisionsConfirmed}
            bulletColor="bg-purple-500"
            className="text-purple-800 dark:text-purple-200"
          />
        </div>
      )}

      {/* Action Items with owners */}
      {data.actionItems.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Action items
          </h3>
          <ul className="space-y-2">
            {data.actionItems.map((item: EmailActionItem, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div className="text-green-800 dark:text-green-200">
                  <span>{item.task}</span>
                  {(item.owner || item.deadline) && (
                    <span className="text-green-600 dark:text-green-400 text-sm ml-2">
                      {item.owner && `@${item.owner}`}
                      {item.owner && item.deadline && ' · '}
                      {item.deadline && `Due: ${item.deadline}`}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          Next steps
        </h3>
        <p className="text-blue-800 dark:text-blue-200">{data.nextSteps}</p>
      </div>
    </>
  );
}

// Sales Email specific content
function SalesEmailContent({ data }: { data: SalesEmailOutput }) {
  return (
    <>
      {/* Pain Points Addressed */}
      {data.painPointsAddressed.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Challenges we discussed
          </h3>
          <BulletList
            items={data.painPointsAddressed}
            bulletColor="bg-amber-500"
            className="text-amber-800 dark:text-amber-200"
          />
        </div>
      )}

      {/* Value Proposition */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          How we can help
        </h3>
        <p className="text-blue-800 dark:text-blue-200">
          {data.valueProposition}
        </p>
      </div>

      {/* Call to Action */}
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Next step
        </h3>
        <p className="text-green-800 dark:text-green-200">{data.callToAction}</p>
      </div>

      {/* Urgency Hook (optional) */}
      {data.urgencyHook && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-orange-800 dark:text-orange-200 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {data.urgencyHook}
          </p>
        </div>
      )}
    </>
  );
}

// Internal Update specific content
function InternalUpdateContent({ data }: { data: InternalUpdateOutput }) {
  return (
    <>
      {/* TLDR */}
      <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-l-4 border-cyan-500">
        <h3 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-2 text-sm uppercase tracking-wide">
          TL;DR
        </h3>
        <p className="text-cyan-800 dark:text-cyan-200 font-medium">
          {data.tldr}
        </p>
      </div>

      {/* Key Decisions */}
      {data.keyDecisions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Key decisions
          </h3>
          <BulletList
            items={data.keyDecisions}
            bulletColor="bg-blue-500"
            className="text-blue-800 dark:text-blue-200"
          />
        </div>
      )}

      {/* Blockers (optional) */}
      {data.blockers && data.blockers.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Blockers / Risks
          </h3>
          <BulletList
            items={data.blockers}
            bulletColor="bg-red-500"
            className="text-red-800 dark:text-red-200"
          />
        </div>
      )}

      {/* Next Milestone */}
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Next milestone
        </h3>
        <p className="text-green-800 dark:text-green-200">
          {data.nextMilestone}
        </p>
      </div>
    </>
  );
}

// Client Proposal specific content
function ClientProposalContent({ data }: { data: ClientProposalOutput }) {
  return (
    <>
      {/* Executive Summary */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm uppercase tracking-wide">
          Executive summary
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {data.executiveSummary}
        </p>
      </div>

      {/* Requirements Summary */}
      {data.requirementsSummary.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Your requirements
          </h3>
          <BulletList
            items={data.requirementsSummary}
            bulletColor="bg-blue-500"
            className="text-blue-800 dark:text-blue-200"
          />
        </div>
      )}

      {/* Proposed Solution */}
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Proposed solution
        </h3>
        <p className="text-green-800 dark:text-green-200">
          {data.proposedSolution}
        </p>
      </div>

      {/* Timeline Estimate (optional) */}
      {data.timelineEstimate && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline estimate
          </h3>
          <p className="text-amber-800 dark:text-amber-200">
            {data.timelineEstimate}
          </p>
        </div>
      )}

      {/* Next Steps to Engage */}
      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Next steps
        </h3>
        <p className="text-indigo-800 dark:text-indigo-200">
          {data.nextStepsToEngage}
        </p>
      </div>
    </>
  );
}

// Main EmailTemplate component
export function EmailTemplate({ data, analysisId }: EmailTemplateProps) {
  const { user } = useAuth();
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendToSelf = async () => {
    if (!analysisId || !user?.email) return;

    setSendState('sending');
    setErrorMessage(null);

    try {
      const response = await transcriptionApi.sendEmailToSelf(analysisId);
      if (response.success) {
        setSendState('sent');
        // Reset after 5 seconds
        setTimeout(() => setSendState('idle'), 5000);
      } else {
        throw new Error(response.message || 'Failed to send email');
      }
    } catch (err) {
      setSendState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send email');
      // Reset after 5 seconds
      setTimeout(() => {
        setSendState('idle');
        setErrorMessage(null);
      }, 5000);
    }
  };

  const renderContent = () => {
    switch (data.type) {
      case 'followUpEmail':
        return <FollowUpEmailContent data={data} />;
      case 'salesEmail':
        return <SalesEmailContent data={data} />;
      case 'internalUpdate':
        return <InternalUpdateContent data={data} />;
      case 'clientProposal':
        return <ClientProposalContent data={data} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Send to self section - brand purple styling */}
      {user?.email && analysisId && (
        <div className="px-6 py-4 mb-6 bg-purple-50 dark:bg-[#8D6AFA]/10 rounded-xl border border-purple-100 dark:border-[#8D6AFA]/20">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#8D6AFA] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                Send this draft to yourself to review and forward from your mailbox
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700/50 flex-1 min-w-0">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSendToSelf}
                  disabled={sendState === 'sending' || sendState === 'sent'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all flex-shrink-0 ${
                    sendState === 'sent'
                      ? 'bg-[#7A5AE0] text-white cursor-default'
                      : sendState === 'error'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0] disabled:opacity-50'
                  }`}
                >
                  {sendState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : sendState === 'sent' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to myself
                    </>
                  )}
                </button>
              </div>
              {errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <EmailHeader subject={data.subject} />
      <EmailBody greeting={data.greeting} body={data.body}>
        {renderContent()}
        <EmailClosing closing={data.closing} />
      </EmailBody>
    </div>
  );
}
