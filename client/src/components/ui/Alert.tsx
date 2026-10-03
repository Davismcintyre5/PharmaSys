import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from './_cn';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const STYLES: Record<Variant, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'bg-info/10 border-info/30 text-info',
    icon: <Info size={16} />,
  },
  success: {
    wrapper: 'bg-success/10 border-success/30 text-success',
    icon: <CheckCircle2 size={16} />,
  },
  warning: {
    wrapper: 'bg-warning/10 border-warning/30 text-warning',
    icon: <AlertTriangle size={16} />,
  },
  danger: {
    wrapper: 'bg-danger/10 border-danger/30 text-danger',
    icon: <AlertCircle size={16} />,
  },
};

interface AlertProps {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  return (
    <div className={cn('flex gap-2 rounded-md border px-3 py-2.5 text-sm', STYLES[variant].wrapper, className)}>
      <span className="mt-0.5 shrink-0">{STYLES[variant].icon}</span>
      <div className="flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
}