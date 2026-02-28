import { DollarSign, Megaphone, Puzzle, Settings } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';

interface OutputsSectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  headline3: string;
  body: string;
  categories: {
    sales: { title: string; subtitle: string; chips: string };
    marketing: { title: string; subtitle: string; chips: string };
    product: { title: string; subtitle: string; chips: string };
    tech: { title: string; subtitle: string; chips: string };
  };
}

interface OutputsSectionProps {
  translations: OutputsSectionTranslations;
}

const categories = [
  { key: 'sales' as const, Icon: DollarSign, colorClass: 'landing-output-sales', iconBg: 'bg-[rgba(255,159,67,0.15)]', iconColor: 'text-[#ff9f43]' },
  { key: 'marketing' as const, Icon: Megaphone, colorClass: 'landing-output-marketing', iconBg: 'bg-[rgba(20,208,220,0.15)]', iconColor: 'text-[#14D0DC]' },
  { key: 'product' as const, Icon: Puzzle, colorClass: 'landing-output-product', iconBg: 'bg-[rgba(141,106,250,0.15)]', iconColor: 'text-[#8D6AFA]' },
  { key: 'tech' as const, Icon: Settings, colorClass: 'landing-output-tech', iconBg: 'bg-[rgba(72,199,142,0.15)]', iconColor: 'text-[#48c78e]' },
];

export function OutputsSection({ translations: t }: OutputsSectionProps) {
  return (
    <section className="landing-section" aria-labelledby="outputs-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="outputs-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>{t.headline3}
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
          {t.body}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map(({ key, Icon, colorClass, iconBg, iconColor }) => (
            <div
              key={key}
              className={`landing-output-card ${colorClass} bg-white/[0.08] border border-white/[0.08] rounded-2xl p-7 text-left`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-[18px] h-[18px] ${iconColor}`} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-white">{t.categories[key].title}</div>
                  <div className="text-[11px] text-white/30 font-[family-name:var(--font-dm-mono)]">{t.categories[key].subtitle}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-[7px]">
                {t.categories[key].chips.split(',').map((chip) => (
                  <span
                    key={chip}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-white/60"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
