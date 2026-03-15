import Image from 'next/image';
import ScrollAnimation from '@/components/ScrollAnimation';

interface PersonaTestimonialTranslations {
  stars: string;
  quote1: string;
  quoteStrong: string;
  quote2: string;
  name: string;
  role: string;
}

interface PersonaTestimonialSectionProps {
  translations: PersonaTestimonialTranslations;
  avatar: string;
}

export function PersonaTestimonialSection({ translations: t, avatar }: PersonaTestimonialSectionProps) {
  return (
    <section className="landing-section" aria-label="Testimonial">
      <div className="max-w-[700px] mx-auto px-10 text-center">
        <ScrollAnimation animation="scale">
        <div className="bg-white/[0.08] border border-white/[0.08] rounded-2xl p-10 sm:p-12">
          <div className="text-[#ffd93d] text-base mb-5 tracking-wider">{t.stars}</div>

          <p className="font-[family-name:var(--font-merriweather)] italic text-[18px] sm:text-[20px] font-light text-white/60 leading-relaxed mb-8">
            &ldquo;{t.quote1}<strong className="text-white not-italic">{t.quoteStrong}</strong>{t.quote2}&rdquo;
          </p>

          <div className="flex items-center justify-center gap-4">
            <Image
              src={avatar}
              alt={t.name}
              width={52}
              height={52}
              className="rounded-full object-cover shrink-0"
            />
            <div className="text-left">
              <div className="text-[15px] font-semibold text-white">{t.name}</div>
              <div className="text-[12px] text-white/50 font-[family-name:var(--font-dm-mono)]">{t.role}</div>
            </div>
          </div>
        </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
