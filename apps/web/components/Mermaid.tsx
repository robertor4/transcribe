'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
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

/** Strip markdown fences that GPT sometimes wraps around Mermaid syntax */
function cleanChart(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  // Remove ```mermaid ... ``` wrapping
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:mermaid)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return cleaned.trim();
}

export function Mermaid({ chart, title, caption }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const cleaned = cleanChart(chart);

  useEffect(() => {
    if (!cleaned) return;
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          fontFamily: 'Montserrat, sans-serif',
          securityLevel: 'loose',
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, cleaned);
        if (!cancelled) {
          setSvg(rendered);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
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
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] overflow-auto bg-white dark:bg-gray-900 p-4 sm:p-8">
          <VisuallyHidden><DialogTitle>{title || 'Diagram'}</DialogTitle></VisuallyHidden>
          {title && (
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 text-center">
              {title}
            </p>
          )}
          <div
            className="flex justify-center [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-h-[80vh]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {caption && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center italic">
              {caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
