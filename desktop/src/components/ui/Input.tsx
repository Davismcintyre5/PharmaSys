import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './_cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, invalid, className, ...rest }, ref) => {
    return (
      <div className={cn('relative', className)}>
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-subtle">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-md border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle',
            'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            invalid ? 'border-danger focus:ring-danger/40' : 'border-border',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9'
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-subtle">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';