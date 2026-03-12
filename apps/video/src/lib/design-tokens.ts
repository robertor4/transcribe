/**
 * Design tokens matching the Neural Summary landing page.
 * Single source of truth for all video compositions.
 */

// ─── Colors ──────────────────────────────────────────────
export const colors = {
  bg: '#22184C',
  bgCard: 'rgba(255, 255, 255, 0.08)',
  bgCardBorder: 'rgba(255, 255, 255, 0.15)',

  primary: '#8D6AFA',
  primaryHover: '#7A5AE0',
  cyan: '#14D0DC',
  deepPurple: '#3F38A0',
  accentDark: '#23194B',

  // Category colors (outputs section)
  sales: '#ff9f43',
  marketing: '#14D0DC',
  product: '#8D6AFA',
  tech: '#48c78e',

  // Speaker colors (transcript card)
  speakerA: '#c4aaff',
  speakerB: '#5fd4a0',

  // Text hierarchy
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.55)',
  textSubtle: 'rgba(255, 255, 255, 0.3)',

  // Level bars
  barPurple: '#8D6AFA',
  barCyan: '#14D0DC',

  // Light-mode tokens (for app UI recreation in video)
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F9FAFB',      // gray-50
    bgHover: '#F3F4F6',          // gray-100
    bgSelected: '#F5F0FF',       // purple-50
    border: '#E5E7EB',           // gray-200
    borderFocus: '#8D6AFA',
    textPrimary: '#111827',      // gray-900
    textSecondary: '#374151',    // gray-700
    textMuted: '#6B7280',        // gray-500
    textHint: '#9CA3AF',         // gray-400
    ringSelected: 'rgba(141, 106, 250, 0.3)',
    stepActive: '#8D6AFA',
    stepComplete: '#14D0DC',
    stepInactive: '#E5E7EB',
    categoryAnalysis: '#22C55E', // green-500
    categoryContent: '#8D6AFA', // purple-500
    categoryEmails: '#3B82F6',  // blue-500
    categoryProduct: '#14D0DC', // cyan-500
    categorySales: '#10B981',   // emerald-500
    categoryHR: '#F97316',      // orange-500
    categoryLeadership: '#6366F1', // indigo-500
  },
} as const;

// ─── Typography ──────────────────────────────────────────
// Fonts loaded via Remotion's loadFont or @fontsource packages.
export const fonts = {
  heading: 'Merriweather, Georgia, "Times New Roman", serif',
  body: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"DM Mono", "SF Mono", "Fira Code", monospace',
} as const;

// ─── Animation ───────────────────────────────────────────
export const motion = {
  /** Standard easeOutQuad — matches landing page Framer Motion config */
  easeOut: [0.25, 0.46, 0.45, 0.94] as const,
  /** Default transition duration in frames (at 30fps) */
  durationFrames: 18, // 600ms
  /** Stagger delay between sequential elements in frames */
  staggerFrames: 4, // ~133ms (closest to 120ms at 30fps)
} as const;

// ─── Video ───────────────────────────────────────────────
export const video = {
  fps: 30,
  width: 1920,
  height: 1080,
} as const;

// ─── Scale Helpers ──────────────────────────────────────
// Cinema canvas (1920x1080) needs larger values than web (1440x900).
// These helpers apply category-specific multipliers so you write
// web-familiar values and get cinema-ready output.

export const scale = {
  /** Text size multiplier */
  text: 1.8,
  /** Spacing/padding multiplier */
  space: 1.6,
  /** Component size multiplier (icons, rings, bars) */
  component: 1.5,
} as const;

/** Scale a font size for cinema canvas. `sz(28)` → 50px */
export function sz(px: number): number {
  return Math.round(px * scale.text);
}

/** Scale a spacing/padding/gap value. `sp(24)` → 38px */
export function sp(px: number): number {
  return Math.round(px * scale.space);
}

/** Scale a component dimension (icons, rings, bars). `cs(120)` → 180px */
export function cs(px: number): number {
  return Math.round(px * scale.component);
}

// ─── Level bars config (matching LevelBarsRow.tsx) ───────
export const levelBars = {
  barCount: 12,
  barWidth: 10,
  barGap: 10,
  barMinHeight: 0.08, // 8%
  barMaxHeight: 0.80, // 80%
  /** Indices that use cyan accent instead of purple */
  accentIndices: [3, 6, 9] as number[],
  attackSpeed: 0.35,
  releaseSpeed: 0.15,
  waveFrequency: 3.5,
  waveAmount: 0.08,
  idleWaveAmount: 0.3,
} as const;
