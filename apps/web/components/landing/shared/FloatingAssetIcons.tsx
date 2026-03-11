'use client';

import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Icon SVGs                                                         */
/* ------------------------------------------------------------------ */

function ChartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(20,208,220,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(141,106,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(20,208,220,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(250,204,21,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(141,106,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(20,208,220,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon definitions with orbital positions                           */
/* ------------------------------------------------------------------ */

interface IconDef {
  id: string;
  icon: React.ReactNode;
  /** Pixel offset from centre of the image container */
  x: number;
  y: number;
  /** Float animation params */
  float: { ampX: number; ampY: number; period: number; phase: number };
}

// Two symmetric arcs flanking the image (3 icons per side).
// Image is ~380×253 (half = 190×127), so all icons use |x| > 220
// to guarantee clearance. Vertical range stays within image bounds.
const ICONS: IconDef[] = [
  // — Left arc (top → middle → bottom) —
  { id: 'email',     icon: <EmailIcon />,      x: -240, y: -85,  float: { ampX: 4, ampY: 8, period: 8,   phase: 2 } },
  { id: 'target',    icon: <TargetIcon />,     x: -280, y: 10,   float: { ampX: 4, ampY: 7, period: 8.5, phase: 3 } },
  { id: 'lightbulb', icon: <LightbulbIcon />,  x: -230, y: 105,  float: { ampX: 5, ampY: 6, period: 7.5, phase: 1.5 } },
  // — Right arc (top → middle → bottom) —
  { id: 'chart',     icon: <ChartIcon />,      x: 240,  y: -85,  float: { ampX: 6, ampY: 5, period: 7,   phase: 1 } },
  { id: 'check',     icon: <ChecklistIcon />,  x: 280,  y: 10,   float: { ampX: 7, ampY: 4, period: 6.5, phase: 0.5 } },
  { id: 'mic',       icon: <MicrophoneIcon />, x: 230,  y: 105,  float: { ampX: 6, ampY: 5, period: 5.5, phase: 2.5 } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function FloatingAssetIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {ICONS.map((def, i) => {
        const { x, y } = def;
        const entranceDelay = i * 0.08;

        return (
          /* Outer: handles orbital positioning via transition */
          <div
            key={def.id}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: entered
                ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                : 'translate(-50%, -50%)',
              opacity: entered ? 1 : 0,
              transitionProperty: 'transform, opacity',
              transitionDuration: '1s',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              transitionDelay: `${entranceDelay}s`,
            }}
          >
            {/* Inner: handles idle float animation (separate transform layer) */}
            <div
              className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm flex items-center justify-center"
              style={{
                animation: entered
                  ? `constellation-float-x ${def.float.period}s ease-in-out ${def.float.phase}s infinite alternate,
                     constellation-float-y ${def.float.period * 1.3}s ease-in-out ${def.float.phase + 0.5}s infinite alternate,
                     constellation-scale ${def.float.period * 1.6}s ease-in-out ${def.float.phase}s infinite alternate`
                  : 'none',
                ['--float-amp-x' as string]: `${def.float.ampX}px`,
                ['--float-amp-y' as string]: `${def.float.ampY}px`,
              }}
            >
              {def.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
}
