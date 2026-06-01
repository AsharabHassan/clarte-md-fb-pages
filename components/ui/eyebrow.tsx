import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Eyebrow — the small uppercase mono label that sits above hero H1s,
 * section headers, and clinical-proof blocks. JetBrains Mono only;
 * ALL-CAPS only; max 4-5 words; tracking-[0.18em] per the Phase 0
 * type-scale rule. Universal across the segment (Bader, Tatcha,
 * Sulwhasoo, Dr.Jart+, COSRX).
 *
 * Use semanticElement to render as <h2> when the eyebrow IS the section
 * header (rare); default <div> keeps it decorative.
 */
export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'span' | 'p' | 'h2' | 'h3';
}

export function Eyebrow({ as: Tag = 'div', className, children, ...rest }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        'font-mono text-xs uppercase tracking-[0.18em] text-ink-mute',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
