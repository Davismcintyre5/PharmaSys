import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import { IconButton } from './IconButton';

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';
  return (
    <IconButton
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      variant="ghost"
      size="md"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}