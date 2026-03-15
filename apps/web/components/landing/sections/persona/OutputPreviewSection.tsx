import { Mail, FileText, Zap } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';
import ScrollAnimation from '@/components/ScrollAnimation';

interface OutputPreviewTranslations {
  tag: string;
  badge: string;
}

interface EmailPreviewTranslations extends OutputPreviewTranslations {
  label: string;
  to: string;
  toValue: string;
  subject: string;
  subjectValue: string;
  greeting: string;
  body: string;
  bullets: string[];
  closing: string;
}

interface SpecPreviewTranslations extends OutputPreviewTranslations {
  label: string;
  feature: string;
  featureValue: string;
  owner: string;
  ownerValue: string;
  status: string;
  statusValue: string;
  goalsTitle: string;
  goals: string[];
  reqTitle: string;
  reqPriority: string;
  requirements: { name: string; priority: string }[];
}

type OutputPreviewSectionProps =
  | { variant: 'email'; translations: EmailPreviewTranslations }
  | { variant: 'spec'; translations: SpecPreviewTranslations };

export function OutputPreviewSection(props: OutputPreviewSectionProps) {
  const { variant, translations: t } = props;

  return (
    <section className="landing-section !py-16" aria-label="Output preview">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <ScrollAnimation>
          <SectionTag>{t.tag}</SectionTag>
        </ScrollAnimation>

        <div className="flex justify-center mt-8">
          <div className="relative">
            <ScrollAnimation animation="scale">
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-2xl bg-[#8D6AFA]/20 blur-[40px] scale-105" />

              {/* Card */}
              <div className={`relative bg-white rounded-2xl border border-gray-200 shadow-[0_8px_40px_rgba(141,106,250,0.15)] text-left rotate-[0.5deg] ${variant === 'spec' ? 'w-[600px] max-w-[calc(100vw-80px)]' : 'max-w-[520px]'}`}>
                {variant === 'email' ? (
                  <EmailCard translations={t as EmailPreviewTranslations} />
                ) : (
                  <SpecCard translations={t as SpecPreviewTranslations} />
                )}
              </div>
            </ScrollAnimation>

            {/* Badge below */}
            <ScrollAnimation delay={200}>
              <div className="flex items-center justify-center gap-1.5 mt-6 text-[13px] text-white/50 -rotate-[0.5deg]">
                <Zap className="w-3.5 h-3.5 text-[#14D0DC]" strokeWidth={2} />
                {t.badge}
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmailCard({ translations: t }: { translations: EmailPreviewTranslations }) {
  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#8D6AFA]/10 flex items-center justify-center">
          <Mail className="w-4 h-4 text-[#8D6AFA]" strokeWidth={1.5} />
        </div>
        <span className="text-[14px] font-semibold text-gray-900">{t.label}</span>
      </div>

      {/* Meta fields */}
      <div className="text-[13px] text-gray-500 space-y-1 mb-4">
        <div>
          <span className="text-gray-400">{t.to}</span>{' '}
          <span className="text-gray-600">{t.toValue}</span>
        </div>
        <div>
          <span className="text-gray-400">{t.subject}</span>{' '}
          <span className="text-gray-700 font-medium">{t.subjectValue}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 my-4" />

      {/* Body */}
      <div className="text-[14px] text-gray-700 leading-relaxed space-y-3">
        <p>{t.greeting}</p>
        <p>{t.body}</p>

        {/* Quoted bullets */}
        <div className="space-y-2 pl-3 border-l-2 border-[#8D6AFA]/30">
          {t.bullets.map((bullet, i) => (
            <p key={i} className="text-[13px] text-gray-600">{bullet}</p>
          ))}
        </div>

        <p>{t.closing}</p>
      </div>
    </div>
  );
}

function SpecCard({ translations: t }: { translations: SpecPreviewTranslations }) {
  const priorityColors: Record<string, string> = {
    P0: 'bg-red-50 text-red-700',
    P1: 'bg-amber-50 text-amber-700',
    P2: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#8D6AFA]/10 flex items-center justify-center">
          <FileText className="w-4 h-4 text-[#8D6AFA]" strokeWidth={1.5} />
        </div>
        <span className="text-[14px] font-semibold text-gray-900">{t.label}</span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] mb-1">
        <div>
          <span className="text-gray-400">{t.feature}</span>{' '}
          <span className="text-gray-700 font-medium">{t.featureValue}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] mb-4">
        <div>
          <span className="text-gray-400">{t.owner}</span>{' '}
          <span className="text-gray-600">{t.ownerValue}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">{t.status}</span>
          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">
            {t.statusValue}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 my-4" />

      {/* Goals */}
      <div className="mb-5">
        <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t.goalsTitle}
        </div>
        <div className="space-y-2">
          {t.goals.map((goal, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13px] text-gray-700">
              <span className="text-[#48c78e] mt-px">&#10003;</span>
              {goal}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 my-4" />

      {/* Requirements table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
            {t.reqTitle}
          </div>
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {t.reqPriority}
          </div>
        </div>
        <div className="space-y-2">
          {t.requirements.map((req, i) => (
            <div key={i} className="flex items-center justify-between text-[13px]">
              <span className="text-gray-700">{req.name}</span>
              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${priorityColors[req.priority] || 'bg-gray-50 text-gray-600'}`}>
                {req.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
