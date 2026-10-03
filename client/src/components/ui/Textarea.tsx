import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from './_cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'min-h-[80px] resize-y',
        invalid ? 'border-danger focus:ring-danger/40' : 'border-border',
        className
      )}
      {...rest}
    />
  )
);
Textarea.displayName = 'Textarea';