import { SectionTag } from '@/components/landing/shared/SectionTag';
import { AlertTriangle, MessageSquareOff, ListX, HelpCircle } from 'lucide-react';
import ScrollAnimation from '@/components/ScrollAnimation';
import { ScrollStagger } from '@/components/ScrollStagger';

interface TimelineStep {
  label: string;
  step1: string;
  step2: string;
  step3: string;
}

interface GridItem {
  title: string;
  desc: string;
}

interface PainGapTimelineTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  them: TimelineStep;
  you: TimelineStep;
}

interface PainGapGridTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  decisions: GridItem;
  feedback: GridItem;
  requirements: GridItem;
  actions: GridItem;
}

type PainGapSectionProps =
  | { variant: 'timeline'; translations: PainGapTimelineTranslations }
  | { variant: 'grid'; translations: PainGapGridTranslations };

const gridIcons = [
  { Icon: HelpCircle, color: 'text-[#ff6b6b]', bg: 'bg-[rgba(255,107,107,0.15)]' },
  { Icon: MessageSquareOff, color: 'text-[#ff9f43]', bg: 'bg-[rgba(255,159,67,0.15)]' },
  { Icon: ListX, color: 'text-[#e86cff]', bg: 'bg-[rgba(232,108,255,0.15)]' },
  { Icon: AlertTriangle, color: 'text-[#ffd93d]', bg: 'bg-[rgba(255,217,61,0.15)]' },
];

export function PainGapSection(props: PainGapSectionProps) {
  const { variant, translations: t } = props;

  return (
    <section className="landing-section" aria-label="The problem">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <ScrollAnimation>
          <SectionTag>{t.tag}</SectionTag>

          <h2 className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
            {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
          </h2>

          <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-14">
            {t.body}
          </p>
        </ScrollAnimation>

        {variant === 'timeline' ? (
          <TimelineView translations={t as PainGapTimelineTranslations} />
        ) : (
          <GridView translations={t as PainGapGridTranslations} />
        )}
      </div>
    </section>
  );
}

function TimelineView({ translations: t }: { translations: PainGapTimelineTranslations }) {
  return (
    <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[700px] mx-auto">
      {/* You — pain */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-7 text-left">
        <div className="text-[13px] font-semibold text-white/30 font-[family-name:var(--font-dm-mono)] uppercase tracking-[2px] mb-5">
          {t.you.label}
        </div>
        <div className="flex flex-col gap-4">
          {[t.you.step1, t.you.step2, t.you.step3].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white/30 text-[11px] font-bold">{i + 1}</span>
              </div>
              <span className="text-[15px] text-white/30 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Them — success */}
      <div className="bg-white/[0.08] border border-white/[0.08] rounded-2xl p-7 text-left">
        <div className="text-[13px] font-semibold text-[#8D6AFA] font-[family-name:var(--font-dm-mono)] uppercase tracking-[2px] mb-5">
          {t.them.label}
        </div>
        <div className="flex flex-col gap-4">
          {[t.them.step1, t.them.step2, t.them.step3].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#8D6AFA] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[11px] font-bold">{i + 1}</span>
              </div>
              <span className="text-[15px] text-white/80 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </ScrollStagger>
  );
}

function GridView({ translations: t }: { translations: PainGapGridTranslations }) {
  const items = [
    { key: 'decisions' as const, ...t.decisions },
    { key: 'feedback' as const, ...t.feedback },
    { key: 'requirements' as const, ...t.requirements },
    { key: 'actions' as const, ...t.actions },
  ];

  return (
    <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[700px] mx-auto">
      {items.map((item, i) => {
        const { Icon, color, bg } = gridIcons[i];
        return (
          <div
            key={item.key}
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
  );
}
