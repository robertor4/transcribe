import Image from 'next/image';
import { Mic } from 'lucide-react';
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
}

interface CompatibilitySectionProps {
  translations: CompatibilitySectionTranslations;
}

const platforms = [
  { key: 'meet' as const, logo: '/assets/images/logos/platforms/google-meet.svg' },
  { key: 'teams' as const, logo: '/assets/images/logos/platforms/microsoft-teams.svg' },
  { key: 'zoom' as const, logo: '/assets/images/logos/platforms/zoom.svg' },
  { key: 'anyAudio' as const, logo: null },
] as const;

export function CompatibilitySection({ translations: t }: CompatibilitySectionProps) {
  return (
    <section id="compatibility" className="landing-section" aria-labelledby="compatibility-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="compatibility-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
          {t.body}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {platforms.map(({ key, logo }) => (
            <div
              key={key}
              className="bg-white/[0.08] border border-white/[0.08] rounded-[14px] px-5 py-7 flex flex-col items-center gap-3 landing-card-hover"
            >
              {logo ? (
                <Image src={logo} alt={t.platforms[key].name} width={32} height={32} />
              ) : (
                <Mic className="w-8 h-8 text-[#48c78e]" strokeWidth={1.5} />
              )}
              <div className="text-[13px] font-medium text-white">{t.platforms[key].name}</div>
              <div className="text-[11px] text-white/30 text-center leading-snug">{t.platforms[key].desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
