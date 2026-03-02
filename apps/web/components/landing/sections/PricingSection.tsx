import { Check } from 'lucide-react';
import Link from 'next/link';
import { SectionTag } from '@/components/landing/shared/SectionTag';

interface PricingTier {
  tier: string;
  price: string;
  period: string;
  periodSub: string;
  badge?: string;
  features: string;
  cta: string;
}

interface PricingSectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  free: PricingTier;
  pro: PricingTier;
  enterprise: PricingTier;
  note: string;
  noteCta: string;
}

interface PricingSectionProps {
  translations: PricingSectionTranslations;
  proPrice: string;
  locale: string;
}

export function PricingSection({ translations: t, proPrice, locale }: PricingSectionProps) {
  const tiers = [
    { data: t.free, featured: false },
    { data: { ...t.pro, price: proPrice }, featured: true },
    { data: t.enterprise, featured: false },
  ];

  return (
    <section id="pricing" className="landing-section" aria-labelledby="pricing-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="pricing-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
          {t.body}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map(({ data, featured }) => (
            <div
              key={data.tier}
              className={`border rounded-2xl p-7 text-left relative ${
                featured
                  ? 'landing-pricing-featured border-[rgba(141,106,250,0.5)]'
                  : 'bg-white/[0.08] border-white/[0.08]'
              }`}
            >
              {data.badge && (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 bg-[#8D6AFA] text-white text-[10px] font-[family-name:var(--font-dm-mono)] tracking-wider uppercase px-3 py-0.5 rounded-full whitespace-nowrap">
                  {data.badge}
                </div>
              )}

              <div className="text-xs font-[family-name:var(--font-dm-mono)] text-white/30 tracking-[2px] uppercase mb-2">
                {data.tier}
              </div>

              <div className="font-[family-name:var(--font-merriweather)] text-[38px] font-black leading-none mb-1">
                {data.price}<span className="text-base font-normal text-white/30">{data.period}</span>
              </div>

              <div className="text-xs text-white/30 mb-5">{data.periodSub}</div>

              <div className="flex flex-col gap-2.5 mb-6">
                {data.features.split(',').map((feature) => (
                  <div key={feature} className="flex gap-2 text-[13px] text-white/60 items-start">
                    <Check className="w-3.5 h-3.5 text-[#14D0DC] shrink-0 mt-0.5" strokeWidth={2.5} />
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/signup`}
                className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all ${
                  featured
                    ? 'bg-[#8D6AFA] text-white hover:bg-[#7A5AE0]'
                    : 'bg-transparent text-white border border-white/20 hover:border-white/40'
                }`}
              >
                {data.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-white/30 mt-6">
          {t.note}{' '}
          <Link href={`/${locale}/contact`} className="text-[#14D0DC] hover:underline">
            {t.noteCta}
          </Link>
        </p>
      </div>
    </section>
  );
}
