import { HTMLAttributes, ReactNode } from 'react';
import { cn } from './_cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  plain?: boolean;
}

export function Card({ header, footer, plain, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface',
        !plain && 'border border-border shadow-sm',
        className
      )}
      {...rest}
    >
      {header && (
        <div className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
          {header}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-border px-4 py-3 text-sm text-text-muted">
          {footer}
        </div>
      )}
    </div>
  );
}