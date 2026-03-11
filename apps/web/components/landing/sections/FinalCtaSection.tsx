import Image from 'next/image';
import { SectionTag } from '@/components/landing/shared/SectionTag';
import { getAppUrl } from '@/lib/config';

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

function FloatingIcon({ className, children, ...props }: { className: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`absolute z-20 w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm flex items-center justify-center ${className}`} {...props}>
      {children}
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(141,106,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(20,208,220,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(141,106,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(20,208,220,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

export function FinalCtaSection({ translations: t, locale }: FinalCtaSectionProps) {
  const metaItems = [t.meta.trial, t.meta.noCard, t.meta.noBot, t.meta.cancel];
  const appUrl = getAppUrl();

  return (
    <section className="landing-section !py-[120px] text-center border-t border-white/[0.08]" aria-label="Get started">
      <div className="max-w-[1100px] mx-auto px-10">
        <SectionTag>{t.tag}</SectionTag>

        <h2 className="text-[clamp(36px,5vw,64px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <div className="relative mx-auto max-w-[380px] mb-10">
          {/* Floating document icons */}
          <FloatingIcon className="-top-6 -left-16 animate-[float-drift_6s_ease-in-out_infinite]" aria-hidden="true">
            <DocumentIcon />
          </FloatingIcon>
          <FloatingIcon className="top-6 -right-18 animate-[float-drift_7s_ease-in-out_1s_infinite]" aria-hidden="true">
            <ChartIcon />
          </FloatingIcon>
          <FloatingIcon className="-bottom-4 -left-14 animate-[float-drift_8s_ease-in-out_2s_infinite]" aria-hidden="true">
            <EmailIcon />
          </FloatingIcon>
          <FloatingIcon className="bottom-12 -right-16 animate-[float-drift_6.5s_ease-in-out_0.5s_infinite]" aria-hidden="true">
            <ChecklistIcon />
          </FloatingIcon>

          <Image
            src="/assets/images/lionel-videocall.webp"
            alt="Team video call"
            width={1200}
            height={800}
            className="relative z-10 rounded-2xl border border-white/10 shadow-[0_8px_40px_rgba(141,106,250,0.15)]"
          />
        </div>

        <div className="flex gap-3 justify-center items-center mb-8 flex-wrap">
          <a
            href={`${appUrl}/${locale}/signup`}
            className="inline-flex items-center bg-[#8D6AFA] text-white border-none px-9 py-4 rounded-[10px] text-base font-semibold transition-all hover:bg-[#7A5AE0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(141,106,250,0.35)]"
          >
            {t.ctaPrimary}
          </a>
          <button className="inline-flex items-center bg-transparent text-white/60 border border-white/20 px-6 py-4 rounded-[10px] text-[15px] transition-all hover:border-white/40 hover:text-white cursor-pointer">
            {t.ctaSecondary}
          </button>
        </div>

        <div className="flex gap-6 justify-center text-[13px] text-white/50 flex-wrap">
          {metaItems.map((item) => (
            <span key={item} className="before:content-['✓_'] before:text-[#14D0DC]">
              {item}
            </span>
          ))}
        </div>      </div>
    </section>
  );
}
