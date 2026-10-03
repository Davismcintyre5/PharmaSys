import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from './_cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'solid' | 'outline';
}

const SIZES = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' };

const VARIANTS = {
  ghost: 'text-text-muted hover:text-text hover:bg-surface-2',
  solid: 'bg-primary text-primary-fg hover:bg-primary/90',
  outline: 'border border-border text-text hover:bg-surface-2',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 'aria-label': ariaLabel, size = 'md', variant = 'ghost', className, children, type = 'button', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          SIZES[size],
          VARIANTS[variant],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';