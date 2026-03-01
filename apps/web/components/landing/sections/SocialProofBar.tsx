import Image from 'next/image';

interface SocialProofBarTranslations {
  stars: string;
  quote1: string;
  quoteStrong: string;
  quote2: string;
  name: string;
  title: string;
}

interface SocialProofBarProps {
  translations: SocialProofBarTranslations;
  avatar?: string;
}

export function SocialProofBar({ translations: t, avatar }: SocialProofBarProps) {
  return (
    <section className="landing-section !py-8 bg-white/[0.025] border-t border-b border-white/[0.08]">
      <div className="max-w-[1100px] mx-auto px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="max-w-[500px]">
            <div className="text-[#ffd93d] text-xs mb-2 tracking-wider">{t.stars}</div>
            <p className="font-[family-name:var(--font-merriweather)] italic text-[15px] font-light text-white/60 leading-relaxed">
              &ldquo;{t.quote1}<strong className="text-white not-italic">{t.quoteStrong}</strong>{t.quote2}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <div className="text-xs text-white/30 font-[family-name:var(--font-dm-mono)]">{t.title}</div>
            </div>
            {avatar && (
              <Image
                src={avatar}
                alt={t.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
