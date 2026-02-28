import { SectionTag } from '@/components/landing/shared/SectionTag';

interface InfrastructureSectionTranslations {
  tag: string;
  headline1: string;
  headlineEm: string;
  body: string;
  stats: {
    languages: { number: string; label: string; desc: string };
    accuracy: { number: string; label: string; desc: string };
    speed: { number: string; label: string; desc: string };
  };
}

interface InfrastructureSectionProps {
  translations: InfrastructureSectionTranslations;
}

const statKeys = ['languages', 'accuracy', 'speed'] as const;

export function InfrastructureSection({ translations: t }: InfrastructureSectionProps) {
  return (
    <section className="landing-section" aria-labelledby="infrastructure-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="infrastructure-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br /><em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
          {t.body}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {statKeys.map((key) => (
            <div
              key={key}
              className="bg-white/[0.08] border border-white/[0.08] rounded-[14px] p-7 text-left"
            >
              <div className="font-[family-name:var(--font-merriweather)] text-5xl font-black text-[#14D0DC] leading-none mb-2">
                {t.stats[key].number}
              </div>
              <div className="text-[15px] font-semibold text-white mb-2">{t.stats[key].label}</div>
              <div className="text-[13px] text-white/30 leading-relaxed">{t.stats[key].desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
