import Image from 'next/image';
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

const logoMap: Record<string, string> = {
  'Notion': '/assets/images/logos/integrations/notion.svg',
  'Slack': '/assets/images/logos/integrations/slack.svg',
  'Google Drive': '/assets/images/logos/integrations/google-drive.svg',
  'HubSpot': '/assets/images/logos/integrations/hubspot.svg',
  'Gmail': '/assets/images/logos/integrations/gmail.svg',
  'Google Docs': '/assets/images/logos/integrations/google-docs.svg',
  'Salesforce': '/assets/images/logos/integrations/salesforce.svg',
  'Zapier': '/assets/images/logos/integrations/zapier.svg',
};

function LogoCard({ name }: { name: string }) {
  const logo = logoMap[name];
  return (
    <div className="bg-white/[0.08] border border-white/[0.08] rounded-xl px-6 py-4 flex items-center gap-2.5 text-[13px] font-medium text-white shrink-0 landing-card-hover">
      {logo && (
        <Image src={logo} alt={name} width={20} height={20} />
      )}
      {name}
    </div>
  );
}

export function IntegrationsSection({ translations: t }: IntegrationsSectionProps) {
  const logos = t.logos.split(',');

  return (
    <section className="landing-section bg-[rgba(20,16,52,0.45)] border-t border-white/[0.08]" aria-labelledby="integrations-heading">
      <div className="max-w-[1100px] mx-auto px-10 text-center">
        <SectionTag>{t.tag}</SectionTag>

        <h2 id="integrations-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
          {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
        </h2>

        <p className="text-[17px] text-white/60 leading-relaxed max-w-[560px] mx-auto">
          {t.body}
        </p>
      </div>

      {/* Marquee carousel */}
      <div className="relative overflow-hidden mt-12">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1a1440] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#1a1440] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-3 w-max animate-marquee-snap">
          {logos.map((name) => (
            <LogoCard key={name} name={name} />
          ))}
          {/* Duplicate for seamless loop */}
          {logos.map((name) => (
            <LogoCard key={`dup-${name}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
