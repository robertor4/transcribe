'use client';

/**
 * DottedBackgroundDrift
 *
 * Ultra-slow drifting background for the hero section.
 * Uses pure CSS animation for performance (no JS overhead for infinite loop).
 * The drift is 2px over 25s - if it's noticeable within 3 seconds, it's too much.
 */
export function DottedBackgroundDrift() {
  return (
    <div
      className="absolute inset-0 animate-hero-dots-drift"
      style={{
        backgroundImage: 'url(/assets/images/dotted-background-inverted.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        maskImage: 'linear-gradient(to right, transparent 0%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 100%)',
        opacity: 0.15,
      }}
      aria-hidden="true"
    />
  );
}
