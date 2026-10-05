import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './_cn';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  onSubmit?: () => void;
  busy?: boolean;
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  onSubmit,
  busy = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Enter' && onSubmit && !busy) {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const tag = target.tagName;
        if (tag === 'TEXTAREA') return;
        if (tag === 'BUTTON') return;
        if (tag === 'A') return;
        if (target.isContentEditable) return;

        e.preventDefault();
        onSubmit();
      }
    };

    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose, onSubmit, busy]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative z-10 flex w-full max-h-[calc(100vh-2rem)] flex-col rounded-lg bg-surface shadow-xl animate-slide-up',
            SIZES[size]
          )}
        >
          {title && (
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-text">{title}</h2>
              <IconButton aria-label="Close" onClick={onClose} size="sm">
                <X size={18} />
              </IconButton>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer && (
            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}