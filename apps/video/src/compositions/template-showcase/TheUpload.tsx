import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { colors, fonts, sz, sp, cs } from '@/lib/design-tokens';

const lt = colors.light;

/**
 * Scene 2: The Upload (0:05–0:14)
 *
 * Light-mode app UI recreation. Shows:
 * Phase 1 (0–3s): Dashboard wide shot with left nav + quick-create buttons
 * Phase 2 (3–6s): Zoom into upload button, modal opens
 * Phase 3 (6–8s): File drops in, progress bar fills
 * Phase 4 (8–9s): Completion checkmark, modal closes
 *
 * Text overlay: "Upload once."
 */
export const TheUpload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Phase timings ────────────────────────────────────
  const showModal = frame > fps * 2.5;
  const showProgress = frame > fps * 4.5;
  const showComplete = frame > fps * 6.5;

  // Dashboard zoom effect (2.5–3.5s zoom into center)
  const zoom = interpolate(frame, [fps * 2.0, fps * 3.2], [1, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dashboard fades as modal takes over
  const dashFade = showModal
    ? interpolate(frame, [fps * 2.5, fps * 3.0], [1, 0.15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  // Modal entrance
  const modalScale = showModal
    ? spring({ frame: frame - fps * 2.5, fps, config: { damping: 18 } })
    : 0;

  // Progress bar fill (4.5–6.5s)
  const progressFill = interpolate(frame, [fps * 4.5, fps * 6.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Checkmark pop
  const checkScale = showComplete
    ? spring({ frame: frame - fps * 6.5, fps, config: { damping: 12 } })
    : 0;

  // "Upload once." text overlay
  const overlayOpacity = interpolate(frame, [fps * 7.5, fps * 8.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit fade
  const exitFade = interpolate(frame, [fps * 8.5, fps * 9.0], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Quick create buttons matching the real app (icon bg + label)
  const quickButtons = [
    { label: 'Record Room', bgColor: '#8D6AFA' },
    { label: 'Record Tab', bgColor: '#14D0DC' },
    { label: 'Upload File', bgColor: '#3F38A0' },
  ];

  // Conversations in table
  const conversations = [
    { title: 'Q3 Board Review', date: 'Mar 10', duration: '52:14' },
    { title: 'Product Strategy Call', date: 'Mar 8', duration: '38:22' },
    { title: 'Client Discovery — Acme', date: 'Mar 6', duration: '45:07' },
    { title: 'Weekly Standup', date: 'Mar 4', duration: '15:33' },
  ];

  // Sidebar width
  const sidebarW = 300;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: lt.bg,
        position: 'relative',
        overflow: 'hidden',
        opacity: exitFade,
      }}
    >
      {/* ─── Dashboard (background layer) ────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: dashFade,
          transform: `scale(${zoom})`,
          transformOrigin: '65% 30%',
        }}
      >
        {/* Left navigation sidebar — deep purple like the real app */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: sidebarW,
            backgroundColor: '#3F38A0',
            padding: `${sp(20)}px ${sp(16)}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: sp(12),
          }}
        >
          {/* Logo — altBlue SVG matching the real sidebar */}
          <div style={{ padding: `${sp(8)}px ${sp(8)}px ${sp(16)}px` }}>
            <Img
              src={staticFile('logos/neural-summary-logo-altBlue.svg')}
              style={{ width: cs(140), height: 'auto' }}
            />
          </div>

          {/* Search bar */}
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: `${sp(8)}px ${sp(12)}px`,
              display: 'flex',
              alignItems: 'center',
              gap: sp(8),
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: sz(12) }}>🔍</span>
            <span style={{ fontFamily: fonts.body, fontSize: sz(12), color: 'rgba(255,255,255,0.5)' }}>Search conversations...</span>
          </div>

          {/* Nav items */}
          {['Dashboard', 'New Conversation'].map((item, i) => (
            <div
              key={i}
              style={{
                padding: `${sp(8)}px ${sp(12)}px`,
                borderRadius: 8,
                backgroundColor: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontFamily: fonts.body,
                fontSize: sz(12),
                fontWeight: 400,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              {item}
            </div>
          ))}

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.2)', margin: `${sp(4)}px 0` }} />

          {/* Folders section */}
          <div>
            <div style={{ fontFamily: fonts.body, fontSize: sz(10), fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, padding: `${sp(4)}px ${sp(12)}px`, marginBottom: sp(4) }}>
              Folders
            </div>
            {['Client Meetings', 'Product Strategy', 'Sales Calls'].map((folder, i) => (
              <div
                key={i}
                style={{
                  padding: `${sp(6)}px ${sp(12)}px`,
                  fontFamily: fonts.body,
                  fontSize: sz(12),
                  color: 'rgba(255,255,255,0.8)',
                  borderRadius: 8,
                }}
              >
                📁 {folder}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.2)', margin: `${sp(4)}px 0` }} />

          {/* Recently opened */}
          <div>
            <div style={{ fontFamily: fonts.body, fontSize: sz(10), fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, padding: `${sp(4)}px ${sp(12)}px`, marginBottom: sp(4) }}>
              Recently Opened
            </div>
            {['Q3 Board Review', 'Product Strategy Call'].map((name, i) => (
              <div
                key={i}
                style={{
                  padding: `${sp(6)}px ${sp(12)}px`,
                  fontFamily: fonts.body,
                  fontSize: sz(12),
                  color: 'rgba(255,255,255,0.8)',
                  borderRadius: 8,
                }}
              >
                🕐 {name}
              </div>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            position: 'absolute',
            left: sidebarW,
            top: 0,
            right: 0,
            bottom: 0,
            padding: `${sp(32)}px ${sp(40)}px`,
          }}
        >
          {/* Greeting */}
          <div style={{ fontFamily: fonts.heading, fontSize: sz(22), fontWeight: 700, color: lt.textPrimary, marginBottom: sp(8) }}>
            Good morning, Roberto
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: sz(13), color: lt.textMuted, marginBottom: sp(28) }}>
            You have 12 conversations this month
          </div>

          {/* Quick create buttons — matching the real app: colored icon box + label */}
          <div style={{ display: 'flex', gap: sp(12), marginBottom: sp(32) }}>
            {quickButtons.map((btn, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  height: cs(40),
                  backgroundColor: lt.bgSecondary,
                  border: `1px solid ${lt.border}`,
                  borderRadius: 8,
                }}
              >
                {/* Colored icon square */}
                <div
                  style={{
                    width: cs(40),
                    height: cs(40),
                    flexShrink: 0,
                    backgroundColor: btn.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: sz(14), color: '#fff' }}>
                    {i === 0 ? '🎙' : i === 1 ? '🖥' : '📤'}
                  </span>
                </div>
                <span style={{ padding: `0 ${sp(14)}px`, fontFamily: fonts.body, fontSize: sz(12), fontWeight: 500, color: lt.textPrimary }}>
                  {btn.label}
                </span>
              </div>
            ))}
          </div>

          {/* Conversations table header */}
          <div
            style={{
              display: 'flex',
              padding: `${sp(10)}px ${sp(16)}px`,
              borderBottom: `1px solid ${lt.border}`,
              marginBottom: sp(4),
            }}
          >
            {['Conversation', 'Date', 'Duration'].map((col, i) => (
              <div
                key={i}
                style={{
                  flex: i === 0 ? 3 : 1,
                  fontFamily: fonts.body,
                  fontSize: sz(10),
                  fontWeight: 600,
                  color: lt.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Conversations rows */}
          {conversations.map((conv, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                padding: `${sp(12)}px ${sp(16)}px`,
                borderBottom: `1px solid ${lt.border}40`,
              }}
            >
              <div style={{ flex: 3, fontFamily: fonts.body, fontSize: sz(13), fontWeight: 500, color: lt.textPrimary }}>
                {conv.title}
              </div>
              <div style={{ flex: 1, fontFamily: fonts.body, fontSize: sz(12), color: lt.textMuted }}>
                {conv.date}
              </div>
              <div style={{ flex: 1, fontFamily: fonts.mono, fontSize: sz(12), color: lt.textMuted }}>
                {conv.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Modal overlay ───────────────────────────────── */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              opacity: interpolate(frame, [fps * 2.5, fps * 3.0], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />

          {/* Modal — matches real ConversationCreateModal: sm:max-w-2xl */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${modalScale})`,
              width: '50%',
              maxWidth: 850,
              backgroundColor: lt.bg,
              borderRadius: 16,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: `${sp(14)}px ${sp(24)}px`,
                borderBottom: `1px solid ${lt.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: fonts.body, fontSize: sz(14), fontWeight: 700, color: lt.textPrimary, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  New Conversation
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: sz(10), color: lt.textMuted, marginTop: sp(2) }}>
                  Upload audio or record directly
                </div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: lt.textMuted, fontSize: sz(14) }}>
                ✕
              </div>
            </div>

            {/* Modal body */}
            <div style={{ display: 'flex', minHeight: 380 }}>
              {/* Step sidebar — matches real app: w-40, gap-3, items with gap-3 */}
              <div
                style={{
                  width: cs(160),
                  backgroundColor: lt.bgSecondary,
                  borderRight: `1px solid ${lt.border}`,
                  padding: `${sp(12)}px ${sp(12)}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: sp(4),
                  flexShrink: 0,
                }}
              >
                {['Capture', 'Context', 'Processing'].map((step, i) => {
                  const isActive = !showProgress ? i === 0 : !showComplete ? i === 2 : i === 2;
                  const isComplete = showProgress && i < 2;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: sp(10),
                        padding: `${sp(8)}px ${sp(10)}px`,
                        borderRadius: 8,
                        backgroundColor: isActive ? lt.bgSelected : 'transparent',
                      }}
                    >
                      <div
                        style={{
                          width: cs(28),
                          height: cs(28),
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: sz(10),
                          fontWeight: 700,
                          fontFamily: fonts.body,
                          backgroundColor: isComplete ? lt.stepComplete : isActive ? lt.stepActive : lt.stepInactive,
                          color: isComplete || isActive ? '#fff' : lt.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {isComplete ? '✓' : i + 1}
                      </div>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: sz(11),
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? colors.primary : isComplete ? lt.textPrimary : lt.textMuted,
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Modal content area */}
              <div style={{ flex: 1, padding: `${sp(28)}px ${sp(32)}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {!showProgress && (
                  <>
                    {/* Upload dropzone */}
                    <div
                      style={{
                        width: '100%',
                        border: `2px dashed ${colors.primary}`,
                        borderRadius: 16,
                        padding: `${sp(40)}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: sp(12),
                        backgroundColor: lt.bgSelected,
                      }}
                    >
                      <div style={{ fontSize: sz(28), opacity: 0.6 }}>📄</div>
                      <div style={{ fontFamily: fonts.body, fontSize: sz(15), fontWeight: 600, color: lt.textPrimary }}>
                        team-strategy-session.m4a
                      </div>
                      <div style={{ fontFamily: fonts.body, fontSize: sz(11), color: lt.textMuted }}>
                        47.2 MB · 1h 12m
                      </div>
                    </div>
                  </>
                )}

                {showProgress && !showComplete && (
                  <>
                    {/* Processing state */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp(20) }}>
                      <div style={{ fontFamily: fonts.body, fontSize: sz(14), fontWeight: 600, color: lt.textPrimary }}>
                        Processing your conversation...
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: '80%', height: 8, backgroundColor: lt.border, borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progressFill * 100}%`,
                            height: '100%',
                            backgroundColor: colors.primary,
                            borderRadius: 4,
                            transition: 'width 0.1s',
                          }}
                        />
                      </div>

                      <div style={{ fontFamily: fonts.mono, fontSize: sz(11), color: lt.textMuted, letterSpacing: 1 }}>
                        {Math.round(progressFill * 100)}% · Transcribing audio
                      </div>
                    </div>
                  </>
                )}

                {showComplete && (
                  <>
                    {/* Completion state */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp(16) }}>
                      <div
                        style={{
                          width: cs(64),
                          height: cs(64),
                          borderRadius: '50%',
                          backgroundColor: colors.cyan,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: `scale(${checkScale})`,
                        }}
                      >
                        <span style={{ fontSize: sz(28), color: '#fff' }}>✓</span>
                      </div>
                      <div style={{ fontFamily: fonts.body, fontSize: sz(16), fontWeight: 700, color: lt.textPrimary }}>
                        Conversation created
                      </div>
                      <div style={{ fontFamily: fonts.body, fontSize: sz(12), color: lt.textMuted }}>
                        team-strategy-session.m4a · 4 speakers · 1h 12m
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── "Upload once." text overlay ─────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: sp(48),
          left: sp(48),
          opacity: overlayOpacity,
          fontFamily: fonts.body,
          fontSize: sz(32),
          fontWeight: 700,
          color: lt.textPrimary,
          textShadow: '0 2px 20px rgba(255,255,255,0.8)',
        }}
      >
        Upload once.
      </div>
    </div>
  );
};
