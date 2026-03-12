import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { colors, fonts, sz, sp } from '@/lib/design-tokens';

const lt = colors.light;

// ─── Beat data ──────────────────────────────────────────

interface OutputCard {
  templateName: string;
  categoryColor: string;
  categoryLabel: string;
  /** Simulated output content — headline + body lines */
  headline: string;
  lines: string[];
}

interface Beat {
  /** Dark interstitial text */
  label: string;
  outputs: OutputCard[];
}

const beats: Beat[] = [
  {
    label: 'After a team meeting',
    outputs: [
      {
        templateName: 'Meeting Minutes',
        categoryColor: lt.categoryAnalysis,
        categoryLabel: 'ANALYSIS',
        headline: 'Team Strategy Session — Meeting Minutes',
        lines: [
          'Date: March 10, 2026 · Duration: 1h 12m · Attendees: 4',
          '',
          'Agenda Items',
          '1. Q3 Pricing Strategy Review',
          '2. Enterprise Expansion Roadmap',
          '3. Competitive Positioning vs. Salesforce',
          '',
          'Key Decisions',
          '• Approved 15% price increase for enterprise tier',
          '• Marketing to lead competitive response campaign',
          '• Product to prioritize SSO integration for Q4',
        ],
      },
      {
        templateName: 'Action Items',
        categoryColor: lt.categoryAnalysis,
        categoryLabel: 'ANALYSIS',
        headline: 'Action Items — 6 tasks extracted',
        lines: [
          '┌─────────────────────────────────────────────────┐',
          '│ Owner    │ Task                        │ Due    │',
          '├─────────────────────────────────────────────────┤',
          '│ Sarah    │ Finalize pricing deck       │ Mar 14 │',
          '│ Mike     │ Draft competitive analysis   │ Mar 17 │',
          '│ Alex     │ Schedule enterprise reviews  │ Mar 12 │',
          '│ Team     │ Review pipeline dashboard    │ Mar 15 │',
          '│ Sarah    │ Send board update summary    │ Mar 18 │',
          '│ Mike     │ Set up Salesforce tracking   │ Mar 20 │',
          '└─────────────────────────────────────────────────┘',
        ],
      },
      {
        templateName: 'Follow-Up Email',
        categoryColor: lt.categoryEmails,
        categoryLabel: 'EMAILS',
        headline: 'Re: Strategy Session Follow-Up',
        lines: [
          'Hi team,',
          '',
          'Thanks for a productive session today. Here\'s a quick',
          'recap of what we aligned on:',
          '',
          '• Enterprise pricing: 15% increase approved for Q4',
          '• Competitive response: Marketing to own, draft by Mar 17',
          '• SSO integration: Moved to top of Q4 product backlog',
          '',
          'Please review your action items above and flag any',
          'blockers by end of week.',
          '',
          'Best, Roberto',
        ],
      },
    ],
  },
  {
    label: 'After a sales call',
    outputs: [
      {
        templateName: 'Deal Qualification',
        categoryColor: lt.categorySales,
        categoryLabel: 'SALES',
        headline: 'MEDDIC Scorecard — Acme Corp',
        lines: [
          '┌───────────────────────────────────────────┐',
          '│ Metrics          │ Identified ████████ 9  │',
          '│ Economic Buyer   │ Confirmed  ███████░ 8  │',
          '│ Decision Criteria│ Mapped     ██████░░ 7  │',
          '│ Decision Process │ Understood ████████ 9  │',
          '│ Identify Pain    │ Validated  █████████ 10│',
          '│ Champion         │ Engaged    ███████░ 8  │',
          '├───────────────────────────────────────────┤',
          '│ Overall Score: 8.5/10 — Strong Qualify    │',
          '│ Next: Send technical proposal by Mar 15   │',
          '└───────────────────────────────────────────┘',
        ],
      },
      {
        templateName: 'CRM Notes',
        categoryColor: lt.categorySales,
        categoryLabel: 'SALES',
        headline: 'CRM Entry — Acme Corp Discovery',
        lines: [
          'Contact: Jennifer Walsh, VP Engineering',
          'Company: Acme Corp (Series C, 450 employees)',
          'Stage: Discovery → Technical Evaluation',
          '',
          'Pain Points:',
          '• Current tool lacks speaker diarization',
          '• Compliance team needs searchable transcripts',
          '• Spending 6hrs/week on manual meeting notes',
          '',
          'Next Steps: Technical demo on March 18',
          'Deal Size: $48,000 ARR (50 seats)',
        ],
      },
      {
        templateName: 'Sales Outreach Email',
        categoryColor: lt.categoryEmails,
        categoryLabel: 'EMAILS',
        headline: 'Re: Next steps — Neural Summary for Acme',
        lines: [
          'Hi Jennifer,',
          '',
          'Great speaking with you today. Based on your team\'s',
          'need for compliant, searchable meeting records, I\'ve',
          'put together a tailored demo for your engineering leads.',
          '',
          'Key areas we\'ll cover:',
          '• Speaker diarization with 96% accuracy',
          '• Enterprise SSO + audit trail',
          '• API integration with your existing stack',
          '',
          'Does March 18 at 2pm work for a 30-min walkthrough?',
        ],
      },
    ],
  },
  {
    label: 'After a brainstorm',
    outputs: [
      {
        templateName: 'Product Requirements Document',
        categoryColor: lt.categoryProduct,
        categoryLabel: 'PRODUCT',
        headline: 'PRD: AI Interview Feature',
        lines: [
          'Problem Statement',
          'Users want to capture ideas but don\'t always have a',
          'recording to upload. They need a guided experience.',
          '',
          'User Stories',
          '• As a PM, I want the AI to ask me questions about my',
          '  feature idea so I can generate a complete PRD.',
          '• As a founder, I want to brainstorm with an AI that',
          '  structures my thinking into a strategy document.',
          '',
          'Success Metrics: 40% adoption within 30 days of launch',
        ],
      },
      {
        templateName: 'Blog Post',
        categoryColor: lt.categoryContent,
        categoryLabel: 'CONTENT',
        headline: 'From Voice Memo to Product Spec: A New Way to Build',
        lines: [
          'What if you could build a product spec while walking',
          'your dog?',
          '',
          'That\'s not a hypothetical. Last Tuesday, I recorded a',
          '12-minute voice memo about a feature idea. By the time',
          'I got back to my desk, I had a complete PRD with user',
          'stories, success metrics, and technical constraints.',
          '',
          'The gap between thinking and documentation is where',
          'most good ideas go to die. Here\'s how we closed it.',
        ],
      },
      {
        templateName: 'Technical Design Document',
        categoryColor: lt.categoryProduct,
        categoryLabel: 'PRODUCT',
        headline: 'TDD: Real-time AI Interview Engine',
        lines: [
          'Architecture Overview',
          '┌──────────┐    ┌──────────┐    ┌──────────┐',
          '│  Client  │───▶│ WebSocket│───▶│  GPT-5   │',
          '│ (React)  │◀───│  Server  │◀───│ Reasoning│',
          '└──────────┘    └──────────┘    └──────────┘',
          '',
          'Components:',
          '• InterviewSessionManager: Manages question flow',
          '• ContextAccumulator: Builds structured output',
          '• TemplateResolver: Maps responses to deliverables',
          '',
          'Estimated complexity: 3 sprints',
        ],
      },
    ],
  },
  {
    label: 'After a 1:1',
    outputs: [
      {
        templateName: 'Coaching Session Notes',
        categoryColor: lt.categoryHR,
        categoryLabel: 'HR & COACHING',
        headline: 'Coaching Notes — Sarah Chen, Mar 10',
        lines: [
          'Key Discussion Topics',
          '• Transition to tech lead role: confidence growing',
          '• Delegation challenge: still reviewing all PRs',
          '• Public speaking goal: lightning talk at next all-hands',
          '',
          'Commitments',
          '• Sarah: Delegate 50% of PR reviews to junior devs',
          '• Sarah: Draft lightning talk outline by next 1:1',
          '• Manager: Connect Sarah with Lisa (senior TL mentor)',
          '',
          'Overall Sentiment: Positive, energized about growth',
        ],
      },
      {
        templateName: 'Performance Review',
        categoryColor: lt.categoryHR,
        categoryLabel: 'HR & COACHING',
        headline: 'Q1 Performance Review — Sarah Chen',
        lines: [
          '┌─────────────────────────────────────────┐',
          '│ Technical Skills        ████████░░ 8/10  │',
          '│ Leadership              ███████░░░ 7/10  │',
          '│ Communication           █████████░ 9/10  │',
          '│ Initiative              ████████░░ 8/10  │',
          '│ Collaboration           █████████░ 9/10  │',
          '└─────────────────────────────────────────┘',
          '',
          'Strengths: Exceptional code quality, strong cross-team',
          'collaboration, proactive in documentation.',
          '',
          'Growth Areas: Delegation, public speaking confidence',
        ],
      },
      {
        templateName: 'Goal Setting Document',
        categoryColor: lt.categoryHR,
        categoryLabel: 'HR & COACHING',
        headline: 'Q2 OKRs — Sarah Chen',
        lines: [
          'Objective 1: Successfully transition to Tech Lead',
          '  KR1: Delegate 60% of PR reviews by end of April',
          '  KR2: Lead 2 architecture decision reviews',
          '  KR3: Mentor 1 junior developer through a project',
          '',
          'Objective 2: Grow as a technical communicator',
          '  KR1: Deliver 1 lightning talk at all-hands',
          '  KR2: Write 2 internal tech blog posts',
          '  KR3: Present TDD to product stakeholders',
        ],
      },
    ],
  },
];

// ─── Timing constants ───────────────────────────────────
/** Duration of the dark interstitial card per beat */
const INTERSTITIAL_FRAMES = 40; // ~1.3s
/** Duration each output card is visible */
const OUTPUT_FRAMES = 55; // ~1.8s
/** Transition overlap */
const TRANSITION_FRAMES = 10;

/**
 * Scene 4: The Montage (0:22–0:48)
 *
 * 4 beats. Each beat:
 *  - Dark interstitial card with context text (Merriweather italic cyan)
 *  - 3 rapid output card reveals in light-mode style
 */
export const TheMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate which beat and which phase we're in
  const beatDuration = INTERSTITIAL_FRAMES + OUTPUT_FRAMES * 3;
  const beatIndex = Math.min(Math.floor(frame / beatDuration), beats.length - 1);
  const beatFrame = frame - beatIndex * beatDuration;

  const beat = beats[beatIndex];
  const isInterstitial = beatFrame < INTERSTITIAL_FRAMES;
  const outputIndex = isInterstitial ? -1 : Math.min(Math.floor((beatFrame - INTERSTITIAL_FRAMES) / OUTPUT_FRAMES), 2);
  const outputFrame = isInterstitial ? 0 : beatFrame - INTERSTITIAL_FRAMES - outputIndex * OUTPUT_FRAMES;

  // ─── Interstitial rendering ───────────────────────────
  const interstitialOpacity = isInterstitial
    ? interpolate(
        beatFrame,
        [0, 8, INTERSTITIAL_FRAMES - TRANSITION_FRAMES, INTERSTITIAL_FRAMES],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  // ─── Output card rendering ────────────────────────────
  const outputCardOpacity = !isInterstitial
    ? interpolate(
        outputFrame,
        [0, 8, OUTPUT_FRAMES - TRANSITION_FRAMES, OUTPUT_FRAMES],
        [0, 1, 1, outputIndex < 2 ? 0 : 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  const outputCardScale = !isInterstitial
    ? interpolate(outputFrame, [0, 12], [0.95, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const currentOutput = !isInterstitial && outputIndex >= 0 ? beat.outputs[outputIndex] : null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ─── Dark interstitial ──────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: interstitialOpacity,
          zIndex: isInterstitial ? 2 : 0,
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(141,106,250,0.2) 0%, transparent 100%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: fonts.heading,
            fontSize: sz(38),
            fontWeight: 700,
            fontStyle: 'italic',
            color: colors.cyan,
            textAlign: 'center',
          }}
        >
          {beat.label}
        </div>
      </div>

      {/* ─── Output card (light mode) ───────────────────── */}
      {currentOutput && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: lt.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: outputCardOpacity,
            zIndex: !isInterstitial ? 2 : 0,
          }}
        >
          <div
            style={{
              width: '72%',
              maxWidth: 1200,
              transform: `scale(${outputCardScale})`,
            }}
          >
            {/* Template name badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: sp(8),
                marginBottom: sp(16),
                padding: `${sp(5)}px ${sp(14)}px`,
                borderRadius: 20,
                backgroundColor: `${currentOutput.categoryColor}15`,
                border: `1px solid ${currentOutput.categoryColor}30`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: currentOutput.categoryColor,
                }}
              />
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: sz(9),
                  fontWeight: 500,
                  color: currentOutput.categoryColor,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {currentOutput.categoryLabel} · {currentOutput.templateName}
              </span>
            </div>

            {/* Output card */}
            <div
              style={{
                backgroundColor: lt.bg,
                border: `1px solid ${lt.border}`,
                borderLeft: `4px solid ${currentOutput.categoryColor}`,
                borderRadius: 12,
                padding: `${sp(28)}px ${sp(32)}px`,
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Headline */}
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: sz(22),
                  fontWeight: 700,
                  color: lt.textPrimary,
                  lineHeight: 1.3,
                  marginBottom: sp(18),
                  letterSpacing: -0.5,
                }}
              >
                {currentOutput.headline}
              </div>

              {/* Content lines */}
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: sz(11),
                  color: lt.textSecondary,
                  lineHeight: 1.7,
                  whiteSpace: 'pre',
                }}
              >
                {currentOutput.lines.map((line, i) => {
                  const lineDelay = 3 + i * 1.5;
                  const lineOpacity = interpolate(outputFrame, [lineDelay, lineDelay + 4], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  return (
                    <div key={i} style={{ opacity: lineOpacity }}>
                      {line || '\u00A0'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
