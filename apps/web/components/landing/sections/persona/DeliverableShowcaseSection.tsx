import { Mail, FileText, BarChart3, ClipboardList, Puzzle, Users, Activity } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';
import ScrollAnimation from '@/components/ScrollAnimation';
import { ScrollStagger } from '@/components/ScrollStagger';

interface DeliverableItem {
  title: string;
  desc: string;
}

interface DeliverableShowcaseTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  headline3: string;
  body: string;
  items: DeliverableItem[];
}

interface DeliverableShowcaseSectionProps {
  translations: DeliverableShowcaseTranslations;
  variant: 'consultant' | 'product';
}

const consultantIcons = [
  { Icon: Mail, color: 'text-[#14D0DC]', bg: 'bg-[rgba(20,208,220,0.15)]' },
  { Icon: FileText, color: 'text-[#8D6AFA]', bg: 'bg-[rgba(141,106,250,0.15)]' },
  { Icon: BarChart3, color: 'text-[#48c78e]', bg: 'bg-[rgba(72,199,142,0.15)]' },
  { Icon: ClipboardList, color: 'text-[#ff9f43]', bg: 'bg-[rgba(255,159,67,0.15)]' },
];

const productIcons = [
  { Icon: FileText, color: 'text-[#14D0DC]', bg: 'bg-[rgba(20,208,220,0.15)]' },
  { Icon: Puzzle, color: 'text-[#8D6AFA]', bg: 'bg-[rgba(141,106,250,0.15)]' },
  { Icon: Users, color: 'text-[#48c78e]', bg: 'bg-[rgba(72,199,142,0.15)]' },
  { Icon: Activity, color: 'text-[#e86cff]', bg: 'bg-[rgba(232,108,255,0.15)]' },
];

export function DeliverableShowcaseSection({ translations: t, variant }: DeliverableShowcaseSectionProps) {
  const icons = variant === 'consultant' ? consultantIcons : productIcons;

  return (
    <section className="landing-section" aria-label="Deliverables">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <ScrollAnimation>
          <SectionTag>{t.tag}</SectionTag>

          <h2 className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
            {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>{t.headline3}
          </h2>

          <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
            {t.body}
          </p>
        </ScrollAnimation>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[700px] mx-auto">
          {t.items.map((item, i) => {
            const { Icon, color, bg } = icons[i];
            return (
              <div
                key={item.title}
                className="bg-white/[0.08] border border-white/[0.08] rounded-2xl p-7 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${bg}`}>
                    <Icon className={`w-[18px] h-[18px] ${color}`} strokeWidth={1.5} />
                  </div>
                  <div className="text-[15px] font-semibold text-white">{item.title}</div>
                </div>
                <p className="text-[14px] text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </ScrollStagger>
      </div>
    </section>
  );
}
