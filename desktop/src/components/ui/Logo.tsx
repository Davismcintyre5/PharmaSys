import { cn } from './_cn';
import { useSite } from '@/context/SiteProvider';

interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

export function Logo({ size = 32, className, alt = 'PharmaSys' }: LogoProps) {
  const { brand } = useSite();
  const src = brand?.logoUrl || '/brand/logo.svg';
  return (
    <img
      src={src}
      alt={brand?.name || alt}
      width={size}
      height={size}
      className={cn('rounded-full select-none', className)}
      draggable={false}
    />
  );
}