import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './_cn';
import { IconButton } from './IconButton';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIDE_CLASS = {
  left: 'left-0 top-0 h-full',
  right: 'right-0 top-0 h-full',
  bottom: 'bottom-0 left-0 w-full',
};

const SIZE_CLASS = {
  sm: { left: 'w-64', right: 'w-64', bottom: 'h-64' },
  md: { left: 'w-80', right: 'w-80', bottom: 'h-80' },
  lg: { left: 'w-96', right: 'w-96', bottom: 'h-96' },
};

export function Drawer({ open, onClose, side = 'right', title, children, size = 'md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute bg-surface shadow-xl animate-slide-up',
          SIDE_CLASS[side],
          SIZE_CLASS[size][side]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            <IconButton aria-label="Close" onClick={onClose} size="sm">
              <X size={18} />
            </IconButton>
          </div>
        )}
        <div className="overflow-y-auto p-5" style={{ maxHeight: title ? 'calc(100% - 60px)' : '100%' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}