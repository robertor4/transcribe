import Image from 'next/image';

interface ChatMockTranslations {
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
}

interface ChatMockProps {
  translations: ChatMockTranslations;
}

function TimestampChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center bg-[rgba(20,208,220,0.12)] border border-[rgba(20,208,220,0.3)] rounded px-1.5 py-px text-[9px] text-[#14D0DC] font-[family-name:var(--font-dm-mono)] mx-0.5 align-middle">
      {children}
    </span>
  );
}

export function ChatMock({ translations: t }: ChatMockProps) {
  return (
    <div className="bg-[#0e0c2a] border border-[rgba(141,106,250,0.25)] rounded-2xl p-5 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="bg-[rgba(141,106,250,0.15)] border border-[rgba(141,106,250,0.25)] rounded-[9px] px-3 py-2 flex items-center gap-2 mb-4">
        <div className="w-[18px] h-[18px] bg-[#8D6AFA] rounded-[5px] flex items-center justify-center text-[9px] text-white">
          ✦
        </div>
        <span className="text-[11px] font-medium text-white">{t.header}</span>
        <span className="text-[9px] text-white/30 font-[family-name:var(--font-dm-mono)] ml-auto">{t.headerSub}</span>
      </div>

      {/* User message 1 */}
      <div className="flex justify-end mb-2.5">
        <div className="bg-[rgba(141,106,250,0.2)] border border-[rgba(141,106,250,0.35)] rounded-xl rounded-br-sm px-3 py-2 text-xs text-white/85 max-w-[75%]">
          {t.userMsg1}
        </div>
      </div>

      {/* AI reply 1 */}
      <div className="flex gap-2 mb-2.5">
        <div className="w-[22px] h-[22px] bg-gradient-to-br from-[#8D6AFA] to-[#14D0DC] rounded-full shrink-0 mt-0.5 flex items-center justify-center">
              <Image src="/assets/symbols/ai-icon-white.svg" alt="" width={13} height={13} />
            </div>
        <div className="bg-white/5 border border-white/[0.08] rounded-sm rounded-tr-xl rounded-br-xl rounded-bl-xl px-3 py-2 text-xs text-white/65 leading-relaxed flex-1">
          {t.aiReply1a}<TimestampChip>{t.aiReply1chip1}</TimestampChip>
          {t.aiReply1b}<TimestampChip>{t.aiReply1chip2}</TimestampChip>
          {t.aiReply1c}<TimestampChip>{t.aiReply1chip3}</TimestampChip>
        </div>
      </div>

      {/* User message 2 */}
      <div className="flex justify-end mb-2.5">
        <div className="bg-[rgba(141,106,250,0.2)] border border-[rgba(141,106,250,0.35)] rounded-xl rounded-br-sm px-3 py-2 text-xs text-white/85 max-w-[75%]">
          {t.userMsg2}
        </div>
      </div>

      {/* AI reply 2 */}
      <div className="flex gap-2 mb-2.5">
        <div className="w-[22px] h-[22px] bg-gradient-to-br from-[#8D6AFA] to-[#14D0DC] rounded-full shrink-0 mt-0.5 flex items-center justify-center">
              <Image src="/assets/symbols/ai-icon-white.svg" alt="" width={13} height={13} />
            </div>
        <div className="bg-white/5 border border-white/[0.08] rounded-sm rounded-tr-xl rounded-br-xl rounded-bl-xl px-3 py-2 text-xs text-white/65 leading-relaxed flex-1">
          {t.aiReply2a}<TimestampChip>{t.aiReply2chip1}</TimestampChip>
          {t.aiReply2b}<TimestampChip>{t.aiReply2chip2}</TimestampChip>
        </div>
      </div>

      {/* Input row */}
      <div className="bg-white/[0.04] border border-white/10 rounded-[9px] px-3 py-2 flex items-center gap-2.5 mt-1.5">
        <span className="text-[11px] text-white/[0.18] font-[family-name:var(--font-dm-mono)] flex-1">{t.inputPlaceholder}</span>
        <div className="w-[26px] h-[26px] bg-[#8D6AFA] rounded-[7px] flex items-center justify-center text-[11px] text-white shrink-0">
          ↑
        </div>
      </div>
    </div>
  );
}
