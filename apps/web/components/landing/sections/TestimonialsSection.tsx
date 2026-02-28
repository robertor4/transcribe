import { SectionTag } from '@/components/landing/shared/SectionTag';

interface TestimonialCard {
  quote1: string;
  quoteStrong: string;
  quote2: string;
  name: string;
  role: string;
  initials: string;
}

interface TestimonialsSectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  cards: {
    t1: TestimonialCard;
    t2: TestimonialCard;
    t3: TestimonialCard;
  };
}

interface TestimonialsSectionProps {
  translations: TestimonialsSectionTranslations;
}

const avatarColors = [
  'bg-[rgba(141,106,250,0.3)] text-[#c4aaff] border-[rgba(141,106,250,0.4)]',
  'bg-[rgba(72,199,142,0.3)] text-[#5fd4a0] border-[rgba(72,199,142,0.4)]',
  'bg-[rgba(232,108,255,0.3)] text-[#e86cff] border-[rgba(232,108,255,0.4)]',
];

export function TestimonialsSection({ translations: t }: TestimonialsSectionProps) {
  const cards = [t.cards.t1, t.cards.t2, t.cards.t3];

  return (
    <section className="landing-section" aria-labelledby="testimonials-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="testimonials-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-14">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <div
              key={card.initials}
              className="bg-white/[0.08] border border-white/[0.08] rounded-2xl p-7 text-left flex flex-col gap-5"
            >
              <div className="text-[#ffd93d] text-sm tracking-wider">★★★★★</div>
              <p className="font-[family-name:var(--font-merriweather)] italic text-sm font-light text-white/60 leading-relaxed flex-1">
                &ldquo;{card.quote1}<strong className="text-white not-italic">{card.quoteStrong}</strong>{card.quote2}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${avatarColors[i]}`}>
                  {card.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{card.name}</div>
                  <div className="text-[11px] text-white/30 font-[family-name:var(--font-dm-mono)]">{card.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
