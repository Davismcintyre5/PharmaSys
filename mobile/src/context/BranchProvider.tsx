import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { branchApi, setBranchId as setAxiosBranchId } from '@/api/axios';
import { storage } from '@/utils/storage';
import { useAuth } from './AuthProvider';
import type { Branch } from '@/types';

interface BranchContextValue {
  branches: Branch[];
  currentBranch: Branch | null;
  currentBranchId: string | null;
  loading: boolean;
  setCurrentBranchId: (id: string) => void;
  refresh: () => Promise<void>;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const BRANCH_KEY = 'pharmasys_active_branch';

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, scope } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickDefault(
    list: Branch[],
    role: string | undefined,
    branchIds: string[] | undefined
  ): Promise<Branch | null> {
    if (!list.length) return null;

    if (role === 'owner') {
      const saved = await storage.getItem(BRANCH_KEY);
      const fromStorage = saved ? list.find((b) => String(b._id) === saved) : null;
      return fromStorage ?? list[0];
    }

    const assigned = list.find((b) => String(b._id) === String(branchIds?.[0]));
    return assigned ?? list[0];
  }

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

      const def = await pickDefault(list, user?.role, user?.branchIds);
      setCurrentBranchIdState(def ? String(def._id) : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [isAuthenticated, scope, user?.role, user?.branchIds?.join(',')]);

  useEffect(() => {
    setAxiosBranchId(currentBranchId || null);
  }, [currentBranchId]);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    if (!currentBranchId) return;
    storage.setItem(BRANCH_KEY, currentBranchId);
  }, [currentBranchId, user?.role]);

  function setCurrentBranchId(id: string) {
    if (user?.role !== 'owner') return;
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

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within BranchProvider');
  return ctx;
}