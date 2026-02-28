import Link from 'next/link';
import { SectionTag } from '@/components/landing/shared/SectionTag';

interface FinalCtaSectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  ctaPrimary: string;
  ctaSecondary: string;
  meta: {
    trial: string;
    noCard: string;
    noBot: string;
    cancel: string;
  };
}

interface FinalCtaSectionProps {
  translations: FinalCtaSectionTranslations;
  locale: string;
}

export function FinalCtaSection({ translations: t, locale }: FinalCtaSectionProps) {
  const metaItems = [t.meta.trial, t.meta.noCard, t.meta.noBot, t.meta.cancel];

  return (
    <section className="landing-section !py-[120px] text-center border-t border-white/[0.08]" aria-label="Get started">
      <div className="max-w-[1100px] mx-auto px-10">
        <SectionTag>{t.tag}</SectionTag>

        <h2 className="text-[clamp(36px,5vw,64px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-10">
          {t.body}
        </p>

        <div className="flex gap-3 justify-center items-center mb-8 flex-wrap">
          <Link
            href={`/${locale}/signup`}
            className="inline-flex items-center bg-[#8D6AFA] text-white border-none px-9 py-4 rounded-[10px] text-base font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)]"
          >
            {t.ctaPrimary}
          </Link>
          <button className="inline-flex items-center bg-transparent text-white/60 border border-white/20 px-6 py-4 rounded-[10px] text-[15px] transition-all hover:border-white/40 hover:text-white cursor-pointer">
            {t.ctaSecondary}
          </button>
        </div>

        <div className="flex gap-6 justify-center text-[13px] text-white/30 flex-wrap">
          {metaItems.map((item) => (
            <span key={item} className="before:content-['✓_'] before:text-[#14D0DC]">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
