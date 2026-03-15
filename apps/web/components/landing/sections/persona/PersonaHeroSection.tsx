import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { HeroCTAs } from '@/components/landing/hero/HeroCTAs';
import { getAppUrl } from '@/lib/config';

interface PersonaHeroTranslations {
  eyebrow: string;
  headline1: string;
  headlineEm: string;
  body: string;
  bodyStrong: string;
  cta: string;
}

interface PersonaHeroSectionProps {
  translations: PersonaHeroTranslations;
  locale: string;
}

export function PersonaHeroSection({ translations: t, locale }: PersonaHeroSectionProps) {
  const appUrl = getAppUrl();

  return (
    <section
      className="landing-section min-h-[80vh] !pt-[100px] sm:!pt-[120px] flex items-center overflow-hidden"
      aria-label="Hero section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <div className="relative z-[2]">
            <HeroHeadline>
              <div className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[2px] uppercase text-[#14D0DC] mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#14D0DC] animate-landing-pulse" />
                {t.eyebrow}
              </div>
            </HeroHeadline>

            <h1 className="text-[clamp(40px,5vw,60px)] font-black leading-[1.1] tracking-tight mb-6">
              {t.headline1}<em>{t.headlineEm}</em>
            </h1>

            <p className="text-[17px] text-white/60 leading-relaxed max-w-[440px] mb-9">
              {t.body}<strong className="text-white font-medium">{t.bodyStrong}</strong>
            </p>

            <HeroCTAs delay={360}>
              <a
                href={`${appUrl}/${locale}/signup`}
                className="inline-flex items-center bg-[#8D6AFA] text-white border-none px-7 py-3.5 rounded-[10px] text-[15px] font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)]"
              >
                {t.cta}
              </a>
            </HeroCTAs>
          </div>

          {/* Right column — Lionel mascot */}
          <div className="relative flex justify-center items-end min-h-[520px] hidden lg:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/lionel-hero.webp"
              alt="Lionel — Neural Summary mascot"
              className="absolute bottom-0 left-1/2 -translate-x-[40%] w-[380px] z-[3] drop-shadow-[0_0_60px_rgba(141,106,250,0.25)]"
              width={860}
              height={997}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
