import { cn } from './_cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled, label, id }: SwitchProps) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          checked ? 'bg-primary' : 'bg-surface-2 border border-border',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}