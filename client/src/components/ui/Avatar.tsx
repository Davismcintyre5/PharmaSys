import { cn } from './_cn';
import { formatNameInitials } from '@/utils/format';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = formatNameInitials(name);
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-fg font-semibold',
        SIZES[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name || ''} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}