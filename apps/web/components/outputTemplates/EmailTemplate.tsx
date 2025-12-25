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
import { useAuth } from '@/contexts/AuthContext';
import { transcriptionApi } from '@/lib/api';
import { Button } from '@/components/Button';

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

// Shared email header component - styled like an email client header with integrated send-to-self
function EmailHeader({
  subject,
  userName,
  userEmail,
  onSendToSelf,
  sendState,
  errorMessage,
}: {
  subject: string;
  userName?: string | null;
  userEmail?: string | null;
  onSendToSelf?: () => void;
  sendState?: 'idle' | 'sending' | 'sent' | 'error';
  errorMessage?: string | null;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="pb-5 mb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-6">
        {/* Left column - Email fields */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* From field */}
          {(userName || userEmail) && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">From:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                {userName && <span className="font-medium">{userName}</span>}
                {userName && userEmail && ' '}
                {userEmail && <span className="text-gray-500 dark:text-gray-400">&lt;{userEmail}&gt;</span>}
              </span>
            </div>
          )}

          {/* To field - placeholder */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">To:</span>
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">recipient@example.com</span>
          </div>

          {/* Subject field */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Subject:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{subject}</span>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="ml-[72px]">
              <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right column - Send button */}
        {onSendToSelf && userEmail && (
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Info tooltip */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-[#8D6AFA] hover:bg-purple-50 dark:hover:bg-[#8D6AFA]/10 transition-colors"
                  aria-label="Info about sending to yourself"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showInfo && (
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Send this draft to your inbox to review, edit, and forward to the recipient from your email client.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowInfo(false)}
                      className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Send button */}
              <Button
                variant={sendState === 'error' ? 'danger' : 'brand'}
                size="sm"
                onClick={onSendToSelf}
                disabled={sendState === 'sending' || sendState === 'sent'}
                icon={
                  sendState === 'sending' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sendState === 'sent' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )
                }
              >
                {sendState === 'sending'
                  ? 'Sending...'
                  : sendState === 'sent'
                  ? 'Sent'
                  : 'Send to myself'}
              </Button>
            </div>
          </div>
        )}
      </div>
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

// Shared closing component - styled as signature block with user info
function EmailClosing({
  closing,
  userName,
  userEmail,
  userPhoto,
}: {
  closing: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhoto?: string | null;
}) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
      <div className="space-y-8">
        {/* Sign-off phrase from AI */}
        <p className="text-gray-700 dark:text-gray-300">{closing}</p>

        {/* Signature with photo and name - always from user data */}
        {userName && (
          <div className="flex items-center gap-3">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#8D6AFA] flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
              {userEmail && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Follow-up Email specific content
function FollowUpEmailContent({ data }: { data: FollowUpEmailOutput }) {
  return (
    <>
      {/* Meeting Recap - Brand purple styling */}
      <div className="mt-6 px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#8D6AFA] rounded-r-lg">
        <h3 className="text-lg font-bold text-[#8D6AFA] mb-4 uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Meeting recap
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{data.meetingRecap}</p>
      </div>

      {/* Decisions Confirmed - Brand cyan styling */}
      {data.decisionsConfirmed.length > 0 && (
        <div className="mt-6 px-6 py-6 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20 border-l-4 border-[#14D0DC] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#14D0DC]" />
            Decisions confirmed
          </h3>
          <ul className="space-y-4 ml-4">
            {data.decisionsConfirmed.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="mt-2 w-2 h-2 bg-[#14D0DC] rounded-full flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items with owners - Brand purple alt styling */}
      {data.actionItems.length > 0 && (
        <div className="mt-6 px-6 py-6 bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 border-l-4 border-[#8D6AFA] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#8D6AFA]" />
            Action items
          </h3>
          <ul className="space-y-4 ml-4">
            {data.actionItems.map((item: EmailActionItem, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#8D6AFA] mt-2 flex-shrink-0" />
                <div className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span>{item.task}</span>
                  {(item.owner || item.deadline) && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
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

      {/* Next Steps - Secondary alt styling */}
      <div className="mt-6 px-6 py-6 bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20 border-l-4 border-[#3F38A0] rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-[#3F38A0]" />
          Next steps
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{data.nextSteps}</p>
      </div>
    </>
  );
}

// Sales Email specific content
function SalesEmailContent({ data }: { data: SalesEmailOutput }) {
  return (
    <>
      {/* Pain Points Addressed - Brand purple styling */}
      {data.painPointsAddressed.length > 0 && (
        <div className="mt-6 px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#8D6AFA] rounded-r-lg">
          <h3 className="text-lg font-bold text-[#8D6AFA] mb-5 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Challenges we discussed
          </h3>
          <ul className="space-y-4 ml-4">
            {data.painPointsAddressed.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="mt-2 w-2 h-2 bg-[#8D6AFA] rounded-full flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Value Proposition - Brand purple alt styling */}
      <div className="mt-6 px-6 py-6 bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 border-l-4 border-[#8D6AFA] rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#8D6AFA]" />
          How we can help
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.valueProposition}
        </p>
      </div>

      {/* Call to Action - Brand cyan styling */}
      <div className="mt-6 px-6 py-6 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20 border-l-4 border-[#14D0DC] rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Target className="w-5 h-5 text-[#14D0DC]" />
          Next step
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{data.callToAction}</p>
      </div>

      {/* Urgency Hook (optional) - Secondary alt styling */}
      {data.urgencyHook && (
        <div className="mt-6 px-6 py-5 bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20 border-l-4 border-[#3F38A0] rounded-r-lg">
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#3F38A0] flex-shrink-0" />
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
      {/* TLDR - Brand purple styling */}
      <div className="mt-6 px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#8D6AFA] rounded-r-lg">
        <h3 className="text-lg font-bold text-[#8D6AFA] mb-4 uppercase tracking-wide">
          TL;DR
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
          {data.tldr}
        </p>
      </div>

      {/* Key Decisions - Brand cyan styling */}
      {data.keyDecisions.length > 0 && (
        <div className="mt-6 px-6 py-6 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20 border-l-4 border-[#14D0DC] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#14D0DC]" />
            Key decisions
          </h3>
          <ul className="space-y-4 ml-4">
            {data.keyDecisions.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="mt-2 w-2 h-2 bg-[#14D0DC] rounded-full flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blockers (optional) - Keep red for urgency/warning but with brand styling pattern */}
      {data.blockers && data.blockers.length > 0 && (
        <div className="mt-6 px-6 py-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Blockers / Risks
          </h3>
          <ul className="space-y-4 ml-4">
            {data.blockers.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="mt-2 w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Milestone - Secondary alt styling */}
      <div className="mt-6 px-6 py-6 bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20 border-l-4 border-[#3F38A0] rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Target className="w-5 h-5 text-[#3F38A0]" />
          Next milestone
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.nextMilestone}
        </p>
      </div>
    </>
  );
}

// Client Proposal specific content
function ClientProposalContent({ data }: { data: ClientProposalOutput }) {
  // Parse numbered list from nextStepsToEngage if present
  const parseNumberedList = (text: string): string[] => {
    // Match patterns like "1) item", "1. item", "1: item"
    const matches = text.match(/\d+[.):\s]+[^0-9]+/g);
    if (matches && matches.length > 1) {
      return matches.map((item) => item.replace(/^\d+[.):\s]+/, '').trim());
    }
    return [];
  };

  const nextStepsList = parseNumberedList(data.nextStepsToEngage);

  return (
    <>
      {/* Executive Summary - Brand purple styling matching Key Points */}
      <div className="mt-6 px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-[#8D6AFA] rounded-r-lg">
        <h3 className="text-lg font-bold text-[#8D6AFA] mb-4 uppercase tracking-wide">
          Executive summary
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.executiveSummary}
        </p>
      </div>

      {/* Requirements Summary - Brand cyan styling */}
      {data.requirementsSummary.length > 0 && (
        <div className="mt-6 px-6 py-6 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20 border-l-4 border-[#14D0DC] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#14D0DC]" />
            Your requirements
          </h3>
          <ul className="space-y-4 ml-4">
            {data.requirementsSummary.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="mt-2 w-2 h-2 bg-[#14D0DC] rounded-full flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proposed Solution - Brand purple alt styling */}
      <div className="mt-6 px-6 py-6 bg-[#8D6AFA]/10 dark:bg-[#8D6AFA]/20 border-l-4 border-[#8D6AFA] rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#8D6AFA]" />
          Proposed solution
        </h3>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.proposedSolution}
        </p>
      </div>

      {/* Timeline Estimate (optional) - Secondary alt styling */}
      {data.timelineEstimate && (
        <div className="mt-6 px-6 py-6 bg-[#3F38A0]/10 dark:bg-[#3F38A0]/20 border-l-4 border-[#3F38A0] rounded-r-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#3F38A0]" />
            Timeline estimate
          </h3>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.timelineEstimate}
          </p>
        </div>
      )}

      {/* Next Steps to Engage - Cyan styling with numbered list */}
      <div className="mt-6 px-6 py-6 bg-[#14D0DC]/10 dark:bg-[#14D0DC]/20 border-l-4 border-[#14D0DC] rounded-r-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Users className="w-5 h-5 text-[#14D0DC]" />
          Next steps
        </h3>
        {nextStepsList.length > 0 ? (
          <ol className="space-y-3 ml-4 list-decimal list-inside">
            {nextStepsList.map((step, idx) => (
              <li key={idx} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.nextStepsToEngage}
          </p>
        )}
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
      <EmailHeader
        subject={data.subject}
        userName={user?.displayName}
        userEmail={user?.email}
        onSendToSelf={analysisId ? handleSendToSelf : undefined}
        sendState={sendState}
        errorMessage={errorMessage}
      />
      <EmailBody greeting={data.greeting} body={data.body}>
        {renderContent()}
        <EmailClosing
          closing={data.closing}
          userName={user?.displayName}
          userEmail={user?.email}
          userPhoto={user?.photoURL}
        />
      </EmailBody>
    </div>
  );
}
