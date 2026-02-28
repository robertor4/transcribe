import { Video, Monitor, CircleDot, Mic } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';

interface CompatibilitySectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  platforms: {
    meet: { name: string; desc: string };
    teams: { name: string; desc: string };
    zoom: { name: string; desc: string };
    anyAudio: { name: string; desc: string };
  };
  noBotCallout: string;
  noBotCalloutBody: string;
}

interface CompatibilitySectionProps {
  translations: CompatibilitySectionTranslations;
}

const platformIcons = [
  { key: 'meet' as const, Icon: Video, color: 'text-[#14D0DC]' },
  { key: 'teams' as const, Icon: Monitor, color: 'text-[#8D6AFA]' },
  { key: 'zoom' as const, Icon: CircleDot, color: 'text-[#5b84ff]' },
  { key: 'anyAudio' as const, Icon: Mic, color: 'text-[#48c78e]' },
];

export function CompatibilitySection({ translations: t }: CompatibilitySectionProps) {
  return (
    <section className="landing-section" aria-labelledby="compatibility-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="compatibility-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
          {t.body}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {platformIcons.map(({ key, Icon, color }) => (
            <div
              key={key}
              className="bg-white/[0.08] border border-white/[0.08] rounded-[14px] px-5 py-7 flex flex-col items-center gap-3 landing-card-hover"
            >
              <Icon className={`w-8 h-8 ${color}`} strokeWidth={1.5} />
              <div className="text-[13px] font-medium text-white">{t.platforms[key].name}</div>
              <div className="text-[11px] text-white/30 text-center leading-snug">{t.platforms[key].desc}</div>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-3 bg-gradient-to-br from-[rgba(20,208,220,0.1)] to-[rgba(141,106,250,0.1)] border border-[rgba(20,208,220,0.25)] rounded-xl px-7 py-4 text-[15px] text-white/60 text-left">
          <span className="text-xl shrink-0">🚫</span>
          <div>
            <strong className="text-white">{t.noBotCallout}</strong>{' '}
            {t.noBotCalloutBody}
          </div>
        </div>
      </div>
    </section>
  );
}
