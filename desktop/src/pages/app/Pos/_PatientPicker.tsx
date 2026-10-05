import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { patientApi } from '@/api/patient';
import { cn } from '@/components/ui/_cn';
import type { Patient } from '@/types';

interface PatientPickerProps {
  onPick: (p: Patient) => void;
  onClose: () => void;
}

export function PatientPicker({ onPick, onClose }: PatientPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const list = await patientApi
        .list(q ? { search: q } : {})
        .catch(() => []);
      if (reqId.current === id) {
        setResults(Array.isArray(list) ? list.slice(0, 30) : []);
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuery('');
      return;
    }
    if (e.key === 'Enter') {
      const q = query.trim().toLowerCase();
      if (!q) return;
      const target = results[0];
      if (target) {
        onPick(target);
      }
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Attach patient"
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          leftIcon={<Search size={14} />}
          placeholder="Search patients by name or phone…"
        />

        <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-border">
          {loading ? (
            <p className="p-4 text-center text-xs text-text-muted">Loading…</p>
          ) : !results.length ? (
            <EmptyState
              icon={<X size={18} />}
              title={query ? 'No matches' : 'No patients'}
              description={query ? 'Try a different search.' : 'Add a patient first.'}
            />
          ) : (
            <ul className="divide-y divide-border">
              {results.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => onPick(p)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left',
                      'hover:bg-surface-2'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {p.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {p.phone || p.email || '—'}
                      </p>
                    </div>
                    {p.allergies?.length ? (
                      <span className="shrink-0 text-[10px] text-danger">
                        {p.allergies.length} allergy
                        {p.allergies.length === 1 ? '' : 'ies'}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}