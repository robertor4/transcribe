'use client';

import { HeroHeadline } from '@/components/landing/hero/HeroHeadline';
import { HeroCTAs } from '@/components/landing/hero/HeroCTAs';
import { HeroTranscriptCard } from './HeroTranscriptCard';
import Link from 'next/link';

interface HeroSectionTranslations {
  eyebrow: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  bodyStrong: string;
  bodyEnd: string;
  ctaPrimary: string;
  ctaSecondary: string;
  socialProof: string;
  lionPlaceholder: string;
  card: {
    tabSummary: string;
    tabTranscript: string;
    duration: string;
    durationValue: string;
    segments: string;
    segmentsValue: string;
    speakers: string;
    speakersValue: string;
    confidence: string;
    confidenceValue: string;
    speakerA: string;
    speakerAText: string;
    speakerB: string;
    speakerBText: string;
  };
}

interface HeroSectionProps {
  translations: HeroSectionTranslations;
  locale: string;
}

export function HeroSection({ translations: t, locale }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="landing-section min-h-screen !pt-[120px] flex items-center overflow-hidden"
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

            <HeroHeadline delay={120}>
              <h1 className="text-[clamp(40px,5vw,60px)] font-black leading-[1.1] tracking-tight mb-6">
                {t.headline1}<br />
                {t.headline2}<em>{t.headlineEm}</em>
              </h1>
            </HeroHeadline>

            <HeroHeadline delay={240}>
              <p className="text-[17px] text-white/60 leading-relaxed max-w-[440px] mb-9">
                {t.body}<strong className="text-white font-medium">{t.bodyStrong}</strong>{t.bodyEnd}
              </p>
            </HeroHeadline>

            <HeroCTAs delay={360}>
              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center bg-[#8D6AFA] text-white border-none px-7 py-3.5 rounded-[10px] text-[15px] font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)] whitespace-nowrap"
              >
                {t.ctaPrimary}
              </Link>
              <button className="inline-flex items-center gap-2 bg-transparent text-white/60 border border-white/20 px-6 py-3.5 rounded-[10px] text-[15px] transition-all hover:border-white/40 hover:text-white cursor-pointer">
                <span className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px]">
                  ▶
                </span>
                {t.ctaSecondary}
              </button>
            </HeroCTAs>

            <HeroHeadline delay={480}>
              <div className="flex items-center gap-4 mt-12 text-[13px] text-white/30">
                <div className="flex">
                  {['bg-[#5b84ff]', 'bg-[#48c78e]', 'bg-[#e86cff]', 'bg-[#ff9f43]'].map((bg, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full border-2 border-[#22184C] ${bg} text-[10px] flex items-center justify-center font-semibold ${i > 0 ? '-ml-2' : ''}`}
                    >
                      {['S', 'M', 'P', 'R'][i]}
                    </div>
                  ))}
                </div>
                {t.socialProof}
              </div>
            </HeroHeadline>
          </div>

          {/* Right column — transcript card + lion placeholder */}
          <div className="relative flex justify-center items-end min-h-[520px] hidden lg:flex">
            {/* Floating transcript card */}
            <div className="absolute top-5 -left-5 z-[3]">
              <HeroTranscriptCard translations={t.card} />
            </div>

            {/* Lion mascot placeholder */}
            <div className="absolute bottom-0 left-1/2 -translate-x-[45%] w-[340px] h-[480px] bg-gradient-to-b from-[rgba(141,106,250,0.1)] to-transparent rounded-t-[50%] flex items-start justify-center pt-10 z-[2]">
              <span className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[2px] text-white/20 uppercase text-center bg-[rgba(13,11,38,0.8)] px-3.5 py-1.5 rounded-full border border-white/[0.08]">
                ← {t.lionPlaceholder}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
