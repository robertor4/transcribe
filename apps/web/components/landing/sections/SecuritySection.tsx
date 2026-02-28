import { Shield, Lock, Trash2, User } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';

interface SecuritySectionTranslations {
  tag: string;
  headline1: string;
  headlineEm: string;
  headline2: string;
  body: string;
  badges: {
    gdpr: { title: string; desc: string };
    encrypted: { title: string; desc: string };
    autoDelete: { title: string; desc: string };
    ownership: { title: string; desc: string };
  };
}

interface SecuritySectionProps {
  translations: SecuritySectionTranslations;
}

const badges = [
  { key: 'gdpr' as const, Icon: Shield },
  { key: 'encrypted' as const, Icon: Lock },
  { key: 'autoDelete' as const, Icon: Trash2 },
  { key: 'ownership' as const, Icon: User },
];

export function SecuritySection({ translations: t }: SecuritySectionProps) {
  return (
    <section className="landing-section bg-[rgba(20,16,52,0.45)] border-t border-b border-white/[0.08]" aria-labelledby="security-heading">
      <div className="max-w-[1100px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — text */}
          <div>
            <SectionTag>{t.tag}</SectionTag>

            <h2 id="security-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
              {t.headline1}<br /><em>{t.headlineEm}</em>{t.headline2}
            </h2>

            <p className="text-[17px] text-white/60 leading-relaxed">
              {t.body}
            </p>
          </div>

          {/* Right — badge grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {badges.map(({ key, Icon }) => (
              <div
                key={key}
                className="bg-white/[0.08] border border-white/[0.08] rounded-xl p-[18px] flex flex-col items-start gap-2"
              >
                <Icon className="w-6 h-6 text-[#14D0DC]" strokeWidth={1.5} />
                <div className="text-[13px] font-semibold text-white">{t.badges[key].title}</div>
                <div className="text-[11px] text-white/30 leading-snug">{t.badges[key].desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
