import { safeString } from './safeDisplay';
import { EDITORIAL } from './editorial';

interface EditorialParagraphsProps {
  /** Raw text value (handles unknown types via safeString). Split on double-newlines. */
  text: unknown;
  className?: string;
}

/** Renders text as styled paragraphs, splitting on double-newlines. Handles AI data safely. */
export function EditorialParagraphs({ text, className = '' }: EditorialParagraphsProps) {
  const str = safeString(text);
  if (!str) return null;

  const parts = str.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const paragraphs = parts.length > 0 ? parts : [str];

  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className={EDITORIAL.body}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
