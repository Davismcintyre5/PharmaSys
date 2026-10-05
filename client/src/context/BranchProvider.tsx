import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { branchApi } from '@/api/branch';
import { setBranchId as setAxiosBranchId } from '@/api/axios';
import { useAuth } from './AuthProvider';
import type { Branch } from '@/types';

/* ═════════════════════════════════════════════════════════════════
   Context
   ═════════════════════════════════════════════════════════════════ */

interface BranchContextValue {
  branches: Branch[];
  currentBranch: Branch | null;
  currentBranchId: string | null;
  loading: boolean;
  /** Only meaningful for owners; non-owners are pinned to their assigned branch. */
  setCurrentBranchId: (id: string) => void;
  /** Force a refetch — useful after creating/deactivating a branch. */
  refresh: () => Promise<void>;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const BRANCH_KEY = 'pharmasys_pos_branch';

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, scope } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ─── resolve which branch to use by default ─── */
  function pickDefault(
    list: Branch[],
    role: string | undefined,
    branchIds: string[] | undefined
  ): Branch | null {
    if (!list.length) return null;

    if (role === 'owner') {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(BRANCH_KEY);
      } catch {}
      const fromStorage = saved ? list.find((b) => String(b._id) === saved) : null;
      return fromStorage ?? list[0];
    }

    const assigned = list.find(
      (b) => String(b._id) === String(branchIds?.[0])
    );
    return assigned ?? list[0];
  }

  /* ─── load branches ─── */
  async function load() {
    if (!isAuthenticated || scope !== 'active') {
      setBranches([]);
      setCurrentBranchIdState(null);
      return;
    }

    setLoading(true);
    try {
      const raw = await branchApi.list().catch(() => []);
      const list = (Array.isArray(raw) ? raw : []).filter((b) => b.isActive);
      setBranches(list);

      const def = pickDefault(list, user?.role, user?.branchIds);
      setCurrentBranchIdState(def ? String(def._id) : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, scope, user?.role, user?.branchIds?.join(',')]);

  /* ─── keep axios in sync with the current branch ─── */
  useEffect(() => {
    setAxiosBranchId(currentBranchId || null);
  }, [currentBranchId]);

  /* ─── persist owner's choice ─── */
  useEffect(() => {
    if (user?.role !== 'owner') return;
    if (!currentBranchId) return;
    try {
      localStorage.setItem(BRANCH_KEY, currentBranchId);
    } catch {}
  }, [currentBranchId, user?.role]);

  /* ─── setter (guarded by role) ─── */
  function setCurrentBranchId(id: string) {
    if (user?.role !== 'owner') return; // non-owners are pinned
    setCurrentBranchIdState(id);
  }

  const currentBranch = useMemo(
    () => branches.find((b) => String(b._id) === currentBranchId) ?? null,
    [branches, currentBranchId]
  );

  const value = useMemo<BranchContextValue>(
    () => ({
      branches,
      currentBranch,
      currentBranchId,
      loading,
      setCurrentBranchId,
      refresh: load,
    }),
    [branches, currentBranch, currentBranchId, loading]
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}