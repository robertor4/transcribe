import { Target, Search, Globe } from 'lucide-react';
import { SectionTag } from '@/components/landing/shared/SectionTag';
import { ChatMock } from './ChatMock';

interface AskAnythingSectionTranslations {
  tag: string;
  headline1: string;
  headline2: string;
  headlineEm: string;
  body: string;
  features: {
    timestamps: { title: string; desc: string };
    search: { title: string; desc: string };
    languages: { title: string; desc: string };
  };
  chat: {
    header: string;
    headerSub: string;
    userMsg1: string;
    aiReply1a: string;
    aiReply1chip1: string;
    aiReply1b: string;
    aiReply1chip2: string;
    aiReply1c: string;
    aiReply1chip3: string;
    userMsg2: string;
    aiReply2a: string;
    aiReply2chip1: string;
    aiReply2b: string;
    aiReply2chip2: string;
    inputPlaceholder: string;
  };
}

interface AskAnythingSectionProps {
  translations: AskAnythingSectionTranslations;
}

const features = [
  { key: 'timestamps' as const, Icon: Target },
  { key: 'search' as const, Icon: Search },
  { key: 'languages' as const, Icon: Globe },
];

export function AskAnythingSection({ translations: t }: AskAnythingSectionProps) {
  return (
    <section className="landing-section bg-[rgba(20,16,52,0.45)] border-t border-b border-white/[0.08]" aria-labelledby="ask-heading">
      <div className="max-w-[1100px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column */}
          <div>
            <SectionTag>{t.tag}</SectionTag>

            <h2 id="ask-heading" className="text-[clamp(28px,3.5vw,46px)] font-bold leading-[1.15] tracking-tight mb-4">
              {t.headline1}<br />{t.headline2}<em>{t.headlineEm}</em>
            </h2>

            <p className="text-[17px] text-white/60 leading-relaxed mb-8">
              {t.body}
            </p>

            <ul className="flex flex-col gap-4">
              {features.map(({ key, Icon }) => (
                <li key={key} className="flex gap-3.5 items-start text-[15px] text-white/60 leading-relaxed">
                  <div className="w-7 h-7 rounded-[7px] shrink-0 bg-[rgba(141,106,250,0.15)] border border-[rgba(141,106,250,0.3)] flex items-center justify-center mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#8D6AFA]" strokeWidth={2} />
                  </div>
                  <div>
                    <strong className="text-white block text-[15px] mb-0.5">{t.features[key].title}</strong>
                    {t.features[key].desc}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — chat mock */}
          <div>
            <ChatMock translations={t.chat} />
          </div>
        </div>
      </div>
    </section>
  );
}
