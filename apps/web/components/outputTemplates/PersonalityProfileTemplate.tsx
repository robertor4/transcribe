'use client';

import { Shield, Zap, AlertTriangle } from 'lucide-react';
import type {
  PersonalityProfileOutput,
  SpeakerPersonalityProfile,
  PersonalityTrait,
} from '@transcribe/shared';
import {
  EditorialArticle,
  EditorialHeading,
  EditorialPullQuote,
  BulletList,
  EDITORIAL,
} from './shared';

interface PersonalityProfileTemplateProps {
  data: PersonalityProfileOutput;
}

const CONFIDENCE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'High' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Medium' },
  low: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-400', label: 'Low' },
};

function TraitRow({ trait }: { trait: PersonalityTrait }) {
  const style = CONFIDENCE_STYLE[trait.confidence] || CONFIDENCE_STYLE.low;

  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{trait.dimension}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{trait.value}</p>
      {trait.evidence.length > 0 && (
        <div className="space-y-0.5">
          {trait.evidence.map((e, idx) => (
            <p key={idx} className="text-xs text-gray-500 dark:text-gray-400 italic">&ldquo;{e}&rdquo;</p>
          ))}
        </div>
      )}
    </div>
  );
}

function SpeakerProfileCard({ profile }: { profile: SpeakerPersonalityProfile }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6 last:mb-0">
      {/* Header */}
      <div className="p-5 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {profile.speaker}
            </h3>
            {profile.role && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
            )}
          </div>
        </div>
        <div className="mt-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#8D6AFA]/10 text-[#8D6AFA] text-sm font-semibold">
            {profile.primaryType}
          </span>
          {profile.secondaryType && (
            <span className="inline-block ml-2 px-3 py-1 rounded-full bg-[#14D0DC]/10 text-[#14D0DC] text-sm font-medium">
              {profile.secondaryType}
            </span>
          )}
        </div>
      </div>

      {/* Traits */}
      <div className="px-5 py-2">
        {profile.traits.map((trait, idx) => (
          <TraitRow key={idx} trait={trait} />
        ))}
      </div>

      {/* Communication Preferences & Working Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pb-5">
        {profile.communicationPreferences.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Communication preferences
            </h4>
            <BulletList items={profile.communicationPreferences} bulletColor="bg-[#8D6AFA]" />
          </div>
        )}
        {profile.workingWithTips.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Working with this person
            </h4>
            <BulletList items={profile.workingWithTips} bulletColor="bg-[#14D0DC]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function PersonalityProfileTemplate({ data }: PersonalityProfileTemplateProps) {
  return (
    <EditorialArticle>
      {/* Framework Note */}
      <p className={`${EDITORIAL.body} mb-6`}>
        <span className="font-medium text-gray-900 dark:text-gray-100">Framework:</span>{' '}
        {data.framework}
      </p>

      {/* Speaker Profiles */}
      <section className="mb-10">
        <EditorialHeading>Speaker profiles</EditorialHeading>
        {data.speakers.map((profile, idx) => (
          <SpeakerProfileCard key={idx} profile={profile} />
        ))}
      </section>

      {/* Team Dynamics */}
      {data.teamDynamics && (
        <EditorialPullQuote cite="Team dynamics">
          <p>{data.teamDynamics}</p>
        </EditorialPullQuote>
      )}

      {/* Complementary Strengths */}
      {data.complementaryStrengths && data.complementaryStrengths.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
              Complementary strengths
            </h3>
          </div>
          <BulletList items={data.complementaryStrengths} bulletColor="bg-green-500" />
        </section>
      )}

      {/* Potential Friction */}
      {data.potentialFriction && data.potentialFriction.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">
              Potential friction points
            </h3>
          </div>
          <BulletList items={data.potentialFriction} bulletColor="bg-amber-500" />
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Personality inferences are based on limited conversational data and should be treated as
            directional insights, not definitive assessments. Traits may vary across contexts.
          </p>
        </div>
      </div>
    </EditorialArticle>
  );
}
