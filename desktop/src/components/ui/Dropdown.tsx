import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from './_cn';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

const MENU_MAX_HEIGHT = 320;

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [alignSide, setAlignSide] = useState<'left' | 'right'>(align);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* close on scroll (page or container) */
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  /* flip placement + clamp to viewport on open */
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip up if not enough room below but enough above
    const shouldFlip =
      spaceBelow < MENU_MAX_HEIGHT + 16 && spaceAbove > spaceBelow;
    setPlacement(shouldFlip ? 'top' : 'bottom');

    // Flip horizontal alignment if it would overflow
    const containerLeft = rect.left;
    const containerRight = rect.right;
    const menuWidth = menuRef.current?.offsetWidth ?? 200;

    if (align === 'right') {
      // Menu right-aligned to container: check left edge
      if (containerRight - menuWidth < 8) setAlignSide('left');
      else setAlignSide('right');
    } else {
      // Menu left-aligned to container: check right edge
      if (containerLeft + menuWidth > window.innerWidth - 8) setAlignSide('right');
      else setAlignSide('left');
    }
  }, [open, align]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ maxHeight: MENU_MAX_HEIGHT }}
          className={cn(
            'absolute z-50 min-w-[180px] overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg animate-slide-up',
            placement === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
            alignSide === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full rounded-sm px-3 py-2 text-left text-sm transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text hover:bg-surface-2'
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}