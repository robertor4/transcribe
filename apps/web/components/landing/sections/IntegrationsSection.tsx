import { StickyNote, MessageSquare, FolderOpen, Hexagon, Mail, FileText, Database, Link2 } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';

interface IntegrationsSectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  logos: string;
}

interface IntegrationsSectionProps {
  translations: IntegrationsSectionTranslations;
}

const iconMap: Record<string, typeof StickyNote> = {
  'Notion': StickyNote,
  'Slack': MessageSquare,
  'Google Drive': FolderOpen,
  'HubSpot': Hexagon,
  'Gmail': Mail,
  'Google Docs': FileText,
  'Salesforce': Database,
  'Zapier': Link2,
};

export function IntegrationsSection({ translations: t }: IntegrationsSectionProps) {
  const logos = t.logos.split(',');

  return (
    <section className="landing-section bg-[rgba(20,16,52,0.45)] border-t border-white/[0.08]" aria-labelledby="integrations-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="integrations-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto mb-12">
          {t.body}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {logos.map((name) => {
            const Icon = iconMap[name] || Link2;
            return (
              <div
                key={name}
                className="bg-white/[0.08] border border-white/[0.08] rounded-xl px-6 py-4 flex items-center gap-2.5 text-[13px] font-medium text-white landing-card-hover"
              >
                <Icon className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                {name}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
