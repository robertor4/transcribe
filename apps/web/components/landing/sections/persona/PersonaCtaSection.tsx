import Image from 'next/image';
import { SectionTag } from '@/components/landing/shared/SectionTag';
import ScrollAnimation from '@/components/ScrollAnimation';
import { FloatingAssetIcons } from '@/components/landing/shared/FloatingAssetIcons';
import { getAppUrl } from '@/lib/config';

interface PersonaCtaTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  ctaPrimary: string;
  meta: {
    trial: string;
    noCard: string;
    cancel: string;
  };
}

interface PersonaCtaSectionProps {
  translations: PersonaCtaTranslations;
  locale: string;
}

export function PersonaCtaSection({ translations: t, locale }: PersonaCtaSectionProps) {
  const metaItems = [t.meta.trial, t.meta.noCard, t.meta.cancel];
  const appUrl = getAppUrl();

  return (
    <section className="landing-section !py-[120px] text-center border-t border-white/[0.08]" aria-label="Get started">
      <ScrollAnimation className="max-w-[1100px] mx-auto px-10">
        <SectionTag>{t.tag}</SectionTag>

        <h2 className="text-[clamp(36px,5vw,64px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <div className="relative mx-auto max-w-[380px] mb-10">
          <FloatingAssetIcons />
          <Image
            src="/assets/images/lionel-videocall.webp"
            alt="Team video call"
            width={1200}
            height={800}
            className="relative z-10 rounded-2xl border border-white/10 shadow-[0_8px_40px_rgba(141,106,250,0.15)]"
          />
        </div>

        <div className="flex justify-center mb-8">
          <a
            href={`${appUrl}/${locale}/signup`}
            className="inline-flex items-center bg-[#8D6AFA] text-white border-none px-9 py-4 rounded-[10px] text-base font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)]"
          >
            {t.ctaPrimary}
          </a>
        </div>

        <div className="flex gap-6 justify-center text-[13px] text-white/50 flex-wrap">
          {metaItems.map((item) => (
            <span key={item} className="before:content-['✓_'] before:text-[#14D0DC]">
              {item}
            </span>
          ))}
        </div>
      </ScrollAnimation>
    </section>
  );
}
