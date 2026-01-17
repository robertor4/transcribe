'use client';

import {
  Shield,
  User,
  MessageSquare,
  DollarSign,
  Clock,
  Users,
  Key,
  HelpCircle,
  Lock,
  MoreHorizontal,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { ObjectionHandlerOutput, Objection } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox, StatusBadge } from './shared';

interface ObjectionHandlerTemplateProps {
  data: ObjectionHandlerOutput;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  price: { icon: DollarSign, color: 'text-green-500', label: 'Price' },
  timing: { icon: Clock, color: 'text-amber-500', label: 'Timing' },
  competition: { icon: Users, color: 'text-blue-500', label: 'Competition' },
  authority: { icon: Key, color: 'text-purple-500', label: 'Authority' },
  need: { icon: HelpCircle, color: 'text-cyan-500', label: 'Need' },
  trust: { icon: Lock, color: 'text-red-500', label: 'Trust' },
  other: { icon: MoreHorizontal, color: 'text-gray-500', label: 'Other' },
};

function ObjectionCard({ objection, index }: { objection: Objection; index: number }) {
  const config = CATEGORY_CONFIG[objection.category] || CATEGORY_CONFIG.other;
  const CategoryIcon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
      {/* Objection Header */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full ${config.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${config.color.replace('text-', 'bg-').replace('-500', '-900/30')} flex items-center justify-center flex-shrink-0`}>
            <CategoryIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {objection.objection}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${config.color.replace('text-', 'bg-').replace('-500', '-900/30')} ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Response */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-[#8D6AFA] flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium text-[#8D6AFA]">Recommended Response</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 ml-6">{objection.response}</p>

        {/* Proof Points */}
        {objection.proofPoints && objection.proofPoints.length > 0 && (
          <div className="mt-4 ml-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Proof Points
              </span>
            </div>
            <BulletList
              items={objection.proofPoints}
              bulletColor="bg-green-500"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ObjectionHandlerTemplate({ data }: ObjectionHandlerTemplateProps) {
  // Group objections by category
  const groupedObjections = data.objections?.reduce((acc, obj) => {
    const category = obj.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(obj);
    return acc;
  }, {} as Record<string, Objection[]>) || {};

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Objection Handler
            </h2>
            {data.prospect && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>Prospect: {data.prospect}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall Strategy */}
      <InfoBox title="Overall Strategy" icon={Lightbulb} variant="purple">
        {data.overallStrategy}
      </InfoBox>

      {/* Objections */}
      {data.objections && data.objections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Objections & Responses ({data.objections.length})
          </h3>
          {data.objections.map((objection, idx) => (
            <ObjectionCard key={idx} objection={objection} index={idx} />
          ))}
        </div>
      )}

      {/* Follow-Up Actions */}
      {data.followUpActions && data.followUpActions.length > 0 && (
        <SectionCard title="Follow-Up Actions" icon={ArrowRight} iconColor="text-[#14D0DC]">
          <div className="space-y-2">
            {data.followUpActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-[#14D0DC]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#14D0DC]">{idx + 1}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words">{action}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
