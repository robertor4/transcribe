'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MermaidProps {
  /** Mermaid diagram syntax */
  chart: string;
  /** Optional title shown above the diagram */
  title?: string;
  /** Optional one-sentence caption shown below the diagram */
  caption?: string;
}

/** Strip markdown fences and normalise characters that GPT sometimes introduces */
function cleanChart(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  // Remove ```mermaid ... ``` wrapping
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:mermaid)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  // Normalise smart quotes and dashes that break the parser
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E]/g, '"')  // smart double quotes → "
    .replace(/[\u2018\u2019\u201A]/g, "'")  // smart single quotes → '
    .replace(/[\u2013\u2014]/g, '-')        // en/em dashes → -
    .replace(/\u00A0/g, ' ');               // non-breaking space → space
  // Strip // inline comments that GPT sometimes adds (mermaid only supports %% comments)
  cleaned = cleaned.replace(/\s*\/\/[^\n]*/g, '');
  return cleaned.trim();
}

/** Singleton: initialize mermaid once across all instances */
let mermaidReady: Promise<typeof import('mermaid')['default']> | null = null;
function getMermaid() {
  if (!mermaidReady) {
    mermaidReady = import('mermaid').then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'Montserrat, sans-serif',
        securityLevel: 'loose',
      });
      return mod.default;
    });
  }
  return mermaidReady;
}

/** Monotonic counter to guarantee unique render IDs across the page */
let renderCounter = 0;

/**
 * Serialize mermaid.render() calls — mermaid uses shared DOM state internally,
 * so concurrent renders cause "Cannot read properties of null" errors.
 */
let renderQueue: Promise<void> = Promise.resolve();
function enqueueRender(fn: () => Promise<void>): Promise<void> {
  renderQueue = renderQueue.then(fn, fn);
  return renderQueue;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

export function Mermaid({ chart, title, caption }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  // Reset zoom when opening/closing lightbox
  useEffect(() => {
    if (!expanded) setZoom(1);
  }, [expanded]);

  // Scroll-to-zoom inside lightbox
  useEffect(() => {
    const el = lightboxRef.current;
    if (!expanded || !el) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => {
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        return Math.min(Math.max(z + delta, ZOOM_MIN), ZOOM_MAX);
      });
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [expanded]);

  const cleaned = cleanChart(chart);

  useEffect(() => {
    if (!cleaned) return;
    let cancelled = false;

    enqueueRender(async () => {
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${++renderCounter}`;
        const { svg: rendered } = await mermaid.render(id, cleaned);
        if (!cancelled) {
          setSvg(rendered);
          setError(false);
        }
      } catch (e) {
        console.error('[Mermaid] render failed:', e);
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cleaned]);

  if (!cleaned) return null;

  return (
    <>
      <div className="my-6">
        {title && (
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            {title}
          </p>
        )}
        {error ? (
          <pre className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 p-4 text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
            {cleaned}
          </pre>
        ) : (
          <div className="relative group">
            <div
              ref={ref}
              className="flex justify-center overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 sm:p-6 [&_svg]:max-w-full [&_svg]:h-auto cursor-pointer"
              dangerouslySetInnerHTML={{ __html: svg }}
              onClick={() => setExpanded(true)}
            />
            <button
              onClick={() => setExpanded(true)}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Expand diagram"
            >
              <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
        {caption && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center italic">
            {caption}
          </p>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] overflow-hidden bg-white dark:bg-gray-900 p-0 flex flex-col">
          <VisuallyHidden><DialogTitle>{title || 'Diagram'}</DialogTitle></VisuallyHidden>

          {/* Header with title */}
          {title && (
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-4 sm:px-6 pt-10 pb-0">
              {title}
            </p>
          )}

          {/* Zoom toolbar — fixed bottom-right inside the dialog */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 flex items-center gap-1.5 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 px-1.5 py-1.5 shadow-sm backdrop-blur-sm">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= ZOOM_MIN}
              className="w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={handleZoomReset}
              className="h-8 px-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors tabular-nums min-w-[3rem] text-center"
              aria-label="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= ZOOM_MAX}
              className="w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={handleZoomReset}
              className="w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Zoomable diagram */}
          <div
            ref={lightboxRef}
            className="flex-1 overflow-auto px-4 sm:px-6"
          >
            <div
              className="flex justify-center min-h-full py-4 origin-top transition-transform duration-150 [&_svg]:h-auto"
              style={{ transform: `scale(${zoom})`, width: zoom > 1 ? `${zoom * 100}%` : '100%' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>

          {caption && (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 text-center italic flex-shrink-0">
              {caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
