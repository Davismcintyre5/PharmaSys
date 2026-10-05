import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { inventoryApi } from '@/api/inventory';
import { formatMoney } from '@/utils/format';
import { DRUG_CATEGORIES } from '@/utils/constants';
import { cn } from '@/components/ui/_cn';
import type { Drug } from '@/types';

interface DrugGridProps {
  onPick: (drug: Drug) => void;
  cartDrugIds: string[];
}

const PAGE_LIMIT = 100;

export function DrugGrid({ onPick, cartDrugIds }: DrugGridProps) {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, unknown> = { limit: PAGE_LIMIT };
    if (category) params.category = category;

    inventoryApi.drugs
      .list(params)
      .catch(() => [])
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res) ? res : ((res as any).items ?? []);
        setDrugs(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    searchRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter((d) => {
      const name = d.name?.toLowerCase() || '';
      const generic = d.generic?.toLowerCase() || '';
      const brand = d.brand?.toLowerCase() || '';
      const barcode = d.barcode?.toLowerCase() || '';
      return (
        name.includes(q) ||
        generic.includes(q) ||
        brand.includes(q) ||
        barcode === q
      );
    });
  }, [drugs, search]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setSearch('');
      return;
    }
    if (e.key === 'Enter') {
      const q = search.trim().toLowerCase();
      if (!q) return;
      const exact = drugs.find((d) => d.barcode?.toLowerCase() === q);
      const target = exact || filtered[0];
      if (target) {
        onPick(target);
        setSearch('');
      }
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* Search + categories (fixed) */}
      <div className="shrink-0 border-b border-border p-3">
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          leftIcon={<Search size={14} />}
          rightIcon={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-text-subtle hover:text-text"
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            ) : undefined
          }
          placeholder="Search or scan barcode — Enter to add"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          <CatPill active={!category} onClick={() => setCategory('')}>
            All
          </CatPill>
          {DRUG_CATEGORIES.slice(0, 8).map((c) => (
            <CatPill
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? '' : c)}
            >
              {c}
            </CatPill>
          ))}
        </div>
      </div>

      {/* Grid (scrolls) */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-text-muted" />
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={<Search size={20} />}
            title={search ? 'No matches' : 'No drugs'}
            description={
              search
                ? 'Try a different name, generic, or barcode.'
                : 'Add drugs to your inventory first.'
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((drug) => (
              <DrugCard
                key={drug._id}
                drug={drug}
                inCart={cartDrugIds.includes(drug._id)}
                onClick={() => onPick(drug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

function DrugCard({
  drug,
  inCart,
  onClick,
}: {
  drug: Drug;
  inCart: boolean;
  onClick: () => void;
}) {
  const qty = drug.currentQty ?? 0;
  const out = qty <= 0;
  const low = !out && drug.reorderLevel > 0 && qty <= drug.reorderLevel;
  const disabled = out || drug.controlled;
  const price = drug.lastSellingPrice ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col rounded-lg border bg-surface p-2.5 text-left transition-all',
        disabled
          ? 'cursor-not-allowed border-border opacity-50'
          : 'border-border hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm',
        inCart && !disabled && 'border-primary ring-1 ring-primary/40'
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-text">
            {drug.name}
            {drug.strength ? ` ${drug.strength}` : ''}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-text-muted">
            {drug.generic || drug.form}
          </p>
        </div>
        {drug.prescriptionRequired && (
          <Badge variant="warning" className="!px-1.5 !py-0 text-[9px]">
            Rx
          </Badge>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-1.5">
        <p className="text-sm font-bold text-text">
          {price ? formatMoney(price, 'KES') : '—'}
        </p>
        <span
          className={cn(
            'text-[10px] font-medium',
            out ? 'text-danger' : low ? 'text-warning' : 'text-success'
          )}
        >
          {out ? 'Out' : `${qty} left`}
        </span>
      </div>
    </button>
  );
}