import { Mic, Sparkles, FileCheck } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';
import ScrollAnimation from '@/components/ScrollAnimation';
import { ScrollStagger } from '@/components/ScrollStagger';

interface Step {
  number: string;
  title: string;
  desc: string;
}

interface HowItWorksTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  steps: Step[];
}

interface HowItWorksSectionProps {
  translations: HowItWorksTranslations;
}

const stepIcons = [
  { Icon: Mic, color: 'text-[#14D0DC]', bg: 'bg-[rgba(20,208,220,0.15)]' },
  { Icon: Sparkles, color: 'text-[#8D6AFA]', bg: 'bg-[rgba(141,106,250,0.15)]' },
  { Icon: FileCheck, color: 'text-[#48c78e]', bg: 'bg-[rgba(72,199,142,0.15)]' },
];

export function HowItWorksSection({ translations: t }: HowItWorksSectionProps) {
  return (
    <section className="landing-section" aria-label="How it works">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <ScrollAnimation>
          <SectionTag>{t.tag}</SectionTag>

          <h2 className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-14">
            {t.headline1}{t.headline2}<em>{t.headlineEm}</em>
          </h2>
        </ScrollAnimation>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
          {t.steps.map((step, i) => {
            const { Icon, color, bg } = stepIcons[i];
            return (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line (hidden on mobile, hidden for last item) */}
                {i < t.steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t border-dashed border-white/10" />
                )}

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} mb-5 relative z-[1]`}>
                  <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.5} />
                </div>

                <div className="text-[11px] font-bold text-white/30 font-[family-name:var(--font-dm-mono)] uppercase tracking-[2px] mb-2">
                  Step {step.number}
                </div>

                <h3 className="text-[17px] font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-[14px] text-white/50 leading-relaxed max-w-[240px]">{step.desc}</p>
              </div>
            );
          })}
        </ScrollStagger>
      </div>
    </section>
  );
}
