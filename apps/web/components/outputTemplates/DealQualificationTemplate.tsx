'use client';

import {
  Target,
  DollarSign,
  User,
  ClipboardList,
  GitBranch,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { DealQualificationOutput, MEDDICCriterion } from '@transcribe/shared';
import { SectionCard, BulletList, InfoBox, StatusBadge } from './shared';

interface DealQualificationTemplateProps {
  data: DealQualificationOutput;
}

function QualificationGauge({ score, qualification }: { score: number; qualification: string }) {
  const getGaugeColor = (s: number) => {
    if (s >= 90) return 'bg-green-500';
    if (s >= 70) return 'bg-blue-500';
    if (s >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-16 overflow-hidden">
          <div className="absolute w-32 h-32 rounded-full border-8 border-gray-200 dark:border-gray-700" />
          <div
            className={`absolute w-32 h-32 rounded-full border-8 ${getGaugeColor(score)}`}
            style={{
              clipPath: `polygon(0 100%, 100% 100%, 100% ${100 - score}%, 0 ${100 - score}%)`,
            }}
          />
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">{score}</p>
        <StatusBadge status={qualification} variant="qualification" className="mt-2" />
      </div>
    </div>
  );
}

function MEDDICCard({
  title,
  icon: Icon,
  criterion,
  details,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  criterion: MEDDICCriterion;
  details?: React.ReactNode;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'qualified':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'partially-qualified':
        return <HelpCircle className="w-5 h-5 text-amber-500" />;
      case 'not-qualified':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#8D6AFA]" />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(criterion.status)}
          <StatusBadge status={criterion.status} variant="qualification" />
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{criterion.evidence}</p>
      {details}
    </div>
  );
}

export function DealQualificationTemplate({ data }: DealQualificationTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Deal Qualification - MEDDIC
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Prospect:</span> {data.prospect}
              </span>
              {data.dealValue && (
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 dark:text-gray-400">Deal Value:</span> {data.dealValue}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Qualification Score */}
      <QualificationGauge score={data.overallScore} qualification={data.qualification} />

      {/* MEDDIC Criteria */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">MEDDIC Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Metrics */}
          <MEDDICCard
            title="Metrics"
            icon={DollarSign}
            criterion={data.meddic.metrics}
            details={
              data.meddic.metrics.quantifiedValue && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Quantified Value:
                  </span>{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    {data.meddic.metrics.quantifiedValue}
                  </span>
                </div>
              )
            }
          />

          {/* Economic Buyer */}
          <MEDDICCard
            title="Economic Buyer"
            icon={User}
            criterion={data.meddic.economicBuyer}
            details={
              (data.meddic.economicBuyer.identified || data.meddic.economicBuyer.engaged !== undefined) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.meddic.economicBuyer.identified && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {data.meddic.economicBuyer.identified}
                    </span>
                  )}
                  {data.meddic.economicBuyer.engaged !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      data.meddic.economicBuyer.engaged
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {data.meddic.economicBuyer.engaged ? 'Engaged' : 'Not Engaged'}
                    </span>
                  )}
                </div>
              )
            }
          />

          {/* Decision Criteria */}
          <MEDDICCard
            title="Decision Criteria"
            icon={ClipboardList}
            criterion={data.meddic.decisionCriteria}
            details={
              <>
                {data.meddic.decisionCriteria.mustHaves && data.meddic.decisionCriteria.mustHaves.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Must-haves:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.meddic.decisionCriteria.mustHaves.map((item, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.meddic.decisionCriteria.ourPosition && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    Our position: {data.meddic.decisionCriteria.ourPosition}
                  </p>
                )}
              </>
            }
          />

          {/* Decision Process */}
          <MEDDICCard
            title="Decision Process"
            icon={GitBranch}
            criterion={data.meddic.decisionProcess}
            details={
              <>
                {data.meddic.decisionProcess.steps && data.meddic.decisionProcess.steps.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Steps:</span>
                    <ol className="mt-1 text-xs text-gray-600 dark:text-gray-400 list-decimal list-inside">
                      {data.meddic.decisionProcess.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {data.meddic.decisionProcess.timeline && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Timeline: {data.meddic.decisionProcess.timeline}
                  </p>
                )}
              </>
            }
          />

          {/* Identified Pain */}
          <MEDDICCard
            title="Identified Pain"
            icon={AlertTriangle}
            criterion={data.meddic.identifiedPain}
            details={
              (data.meddic.identifiedPain.organizationalPain || data.meddic.identifiedPain.personalPain) && (
                <div className="mt-2 space-y-1 text-xs">
                  {data.meddic.identifiedPain.organizationalPain && (
                    <p>
                      <span className="font-medium text-gray-500">Org Pain:</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {data.meddic.identifiedPain.organizationalPain}
                      </span>
                    </p>
                  )}
                  {data.meddic.identifiedPain.personalPain && (
                    <p>
                      <span className="font-medium text-gray-500">Personal Pain:</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {data.meddic.identifiedPain.personalPain}
                      </span>
                    </p>
                  )}
                </div>
              )
            }
          />

          {/* Champion */}
          <MEDDICCard
            title="Champion"
            icon={UserCheck}
            criterion={data.meddic.champion}
            details={
              (data.meddic.champion.name || data.meddic.champion.influence) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.meddic.champion.name && (
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      {data.meddic.champion.name}
                    </span>
                  )}
                  {data.meddic.champion.influence && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      data.meddic.champion.influence === 'high'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : data.meddic.champion.influence === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {data.meddic.champion.influence} influence
                    </span>
                  )}
                </div>
              )
            }
          />
        </div>
      </div>

      {/* Risk Factors */}
      {data.riskFactors && data.riskFactors.length > 0 && (
        <InfoBox title="Risk Factors" icon={AlertTriangle} variant="red">
          <BulletList items={data.riskFactors} bulletColor="bg-red-500" />
        </InfoBox>
      )}

      {/* Competitive Threats */}
      {data.competitiveThreats && data.competitiveThreats.length > 0 && (
        <SectionCard title="Competitive Threats" icon={Shield} iconColor="text-amber-500">
          <BulletList items={data.competitiveThreats} bulletColor="bg-amber-500" />
        </SectionCard>
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
