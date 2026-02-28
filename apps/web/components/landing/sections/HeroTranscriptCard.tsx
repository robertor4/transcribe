interface HeroTranscriptCardTranslations {
  tabSummary: string;
  tabTranscript: string;
  duration: string;
  durationValue: string;
  segments: string;
  segmentsValue: string;
  speakers: string;
  speakersValue: string;
  confidence: string;
  confidenceValue: string;
  speakerA: string;
  speakerAText: string;
  speakerB: string;
  speakerBText: string;
}

interface HeroTranscriptCardProps {
  translations: HeroTranscriptCardTranslations;
}

export function HeroTranscriptCard({ translations: t }: HeroTranscriptCardProps) {
  return (
    <div className="w-[280px] bg-[#131042] border border-[rgba(141,106,250,0.3)] rounded-xl p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      {/* Tabs */}
      <div className="flex gap-1.5 mb-2.5">
        <span className="text-[8.5px] font-[family-name:var(--font-dm-mono)] px-2.5 py-0.5 rounded-full text-white/40 border border-white/10">
          {t.tabSummary}
        </span>
        <span className="text-[8.5px] font-[family-name:var(--font-dm-mono)] px-2.5 py-0.5 rounded-full bg-[rgba(141,106,250,0.25)] border border-[rgba(141,106,250,0.6)] text-[#a688ff]">
          {t.tabTranscript}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 mb-2.5">
        {[
          { label: t.duration, value: t.durationValue },
          { label: t.segments, value: t.segmentsValue },
          { label: t.speakers, value: t.speakersValue },
          { label: t.confidence, value: t.confidenceValue },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded px-1.5 py-1 text-[7px] font-[family-name:var(--font-dm-mono)] text-white/50">
            <strong className="block text-white/85 text-[10px]">{stat.value}</strong>
            {stat.label}
          </div>
        ))}
      </div>

      {/* Speaker timeline bar */}
      <div className="h-[7px] rounded bg-white/5 flex overflow-hidden mb-2.5">
        <div className="h-full" style={{ flex: 3, background: '#5b84ff', opacity: 0.6 }} />
        <div className="h-full mx-px" style={{ flex: 1, background: '#48c78e' }} />
        <div className="h-full mx-px" style={{ flex: 2, background: '#e86cff', opacity: 0.6 }} />
        <div className="h-full" style={{ flex: 1.5, background: '#5b84ff', opacity: 0.6 }} />
        <div className="h-full" style={{ flex: 1, background: '#48c78e' }} />
      </div>

      {/* Speaker A bubble */}
      <div className="flex gap-1.5 mb-1.5 items-start">
        <div className="w-4 h-4 rounded-full bg-[rgba(141,106,250,0.3)] text-[#c4aaff] border border-[rgba(141,106,250,0.4)] text-[6.5px] font-bold flex items-center justify-center shrink-0">
          A
        </div>
        <div className="rounded-md bg-[rgba(141,106,250,0.1)] border border-[rgba(141,106,250,0.18)] p-1.5 flex-1">
          <div className="text-[6.5px] font-[family-name:var(--font-dm-mono)] font-semibold text-[#c4aaff] mb-0.5">{t.speakerA}</div>
          <div className="text-[7.5px] text-white/55 leading-snug">{t.speakerAText}</div>
        </div>
      </div>

      {/* Speaker B bubble */}
      <div className="flex gap-1.5 items-start">
        <div className="w-4 h-4 rounded-full bg-[rgba(72,199,142,0.3)] text-[#5fd4a0] border border-[rgba(72,199,142,0.4)] text-[6.5px] font-bold flex items-center justify-center shrink-0">
          B
        </div>
        <div className="rounded-md bg-[rgba(72,199,142,0.1)] border border-[rgba(72,199,142,0.18)] p-1.5 flex-1">
          <div className="text-[6.5px] font-[family-name:var(--font-dm-mono)] font-semibold text-[#5fd4a0] mb-0.5">{t.speakerB}</div>
          <div className="text-[7.5px] text-white/55 leading-snug">{t.speakerBText}</div>
        </div>
      </div>
    </div>
  );
}
