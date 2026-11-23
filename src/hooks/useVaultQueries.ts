import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteActress,
  deleteCodeEntry,
  deleteSeries,
  deleteStudio,
  deleteTag,
  fetchAllVaultRecords,
  getVaultStatus,
  importBackupPayload,
  resetDataCategory,
  saveActress,
  saveCodeEntry,
  saveSeries,
  saveStudio,
  saveTag,
} from '../lib/db';
import { useVaultStore } from '../store/useVaultStore';
import type { EsseBackupPayload } from '../types/esse';

export const VAULT_KEYS = {
  status: ['vault', 'status'] as const,
  records: ['vault', 'records'] as const,
};

export function useVaultStatusQuery() {
  const supabaseConfig = useVaultStore((s) => s.supabaseConfig);
  return useQuery({
    queryKey: [...VAULT_KEYS.status, supabaseConfig?.url ?? 'local'],
    queryFn: getVaultStatus,
  });
}

export function useVaultRecordsQuery() {
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const supabaseConfig = useVaultStore((s) => s.supabaseConfig);
  return useQuery({
    queryKey: [...VAULT_KEYS.records, supabaseConfig?.url ?? 'local'],
    queryFn: fetchAllVaultRecords,
    enabled: isUnlocked,
  });
}

export function useVaultMutations() {
  const queryClient = useQueryClient();

  const invalidateRecords = () =>
    queryClient.invalidateQueries({ queryKey: VAULT_KEYS.records });

  const upsertCode = useMutation({
    mutationFn: saveCodeEntry,
    onSuccess: invalidateRecords,
  });

  const removeCode = useMutation({
    mutationFn: deleteCodeEntry,
    onSuccess: invalidateRecords,
  });

  const upsertActress = useMutation({
    mutationFn: saveActress,
    onSuccess: invalidateRecords,
  });

  const removeActress = useMutation({
    mutationFn: deleteActress,
    onSuccess: invalidateRecords,
  });

  const upsertStudio = useMutation({
    mutationFn: saveStudio,
    onSuccess: invalidateRecords,
  });

  const removeStudio = useMutation({
    mutationFn: deleteStudio,
    onSuccess: invalidateRecords,
  });

  const createTag = useMutation({
    mutationFn: saveTag,
    onSuccess: invalidateRecords,
  });

  const removeTag = useMutation({
    mutationFn: deleteTag,
    onSuccess: invalidateRecords,
  });

  const upsertSeries = useMutation({
    mutationFn: saveSeries,
    onSuccess: invalidateRecords,
  });

  const removeSeries = useMutation({
    mutationFn: deleteSeries,
    onSuccess: invalidateRecords,
  });

  const resetCategory = useMutation({
    mutationFn: (category: 'codes' | 'actresses' | 'studios' | 'tags' | 'series' | 'all') =>
      resetDataCategory(category),
    onSuccess: invalidateRecords,
  });

  const importBackup = useMutation({
    mutationFn: ({ payload, mode }: { payload: EsseBackupPayload; mode: 'merge' | 'replace' }) =>
      importBackupPayload(payload, mode),
    onSuccess: invalidateRecords,
  });

  return {
    upsertCode,
    removeCode,
    upsertActress,
    removeActress,
    upsertStudio,
    removeStudio,
    createTag,
    removeTag,
    upsertSeries,
    removeSeries,
    resetCategory,
    importBackup,
  };
}
