import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EDITORIAL } from './editorial';

interface EditorialSectionProps {
  /** Uppercase section label */
  label: string;
  /** Optional icon next to the label */
  icon?: LucideIcon;
  /** Show a border-top above the section. Default false. */
  borderTop?: boolean;
  children: ReactNode;
  className?: string;
}

/** Section with small uppercase label heading, optional icon, and generous spacing. */
export function EditorialSection({
  label,
  icon: Icon,
  borderTop = false,
  children,
  className = '',
}: EditorialSectionProps) {
  return (
    <section className={`mb-10 ${className}`}>
      {borderTop && <div className={`${EDITORIAL.sectionBorder} mb-4`} />}
      <h2 className={`${EDITORIAL.sectionLabel} mb-4 flex items-center gap-2`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </h2>
      {children}
    </section>
  );
}
