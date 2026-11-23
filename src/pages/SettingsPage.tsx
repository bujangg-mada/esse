import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Download, KeyRound, RotateCcw, Trash2, Upload } from 'lucide-react';
import { SECURITY_QUESTIONS, changePinSchema } from '../lib/schemas';
import { changeVaultPin } from '../lib/db';
import { buildBackupPayload, parseBackupJson } from '../lib/backup';
import { useVaultStore } from '../store/useVaultStore';
import { VAULT_KEYS, useVaultMutations, useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { notify } from '../lib/toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

type ResetTarget =
  | { kind: 'category'; category: 'codes' | 'actresses' | 'studios' | 'tags' | 'series' | 'all'; label: string }
  | { kind: 'item'; entity: 'code' | 'actress' | 'studio' | 'tag' | 'series'; id: string; label: string }
  | null;

export function SettingsPage() {
  const queryClient = useQueryClient();
  const unlockVault = useVaultStore((s) => s.unlockVault);

  const { data } = useVaultRecordsQuery();
  const {
    resetCategory,
    importBackup,
    removeCode,
    removeActress,
    removeStudio,
    removeTag,
    removeSeries,
  } = useVaultMutations();

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [resetTarget, setResetTarget] = useState<ResetTarget>(null);
  const [selectedEntity, setSelectedEntity] = useState<'code' | 'actress' | 'studio' | 'tag' | 'series'>('code');
  const [selectedItemId, setSelectedItemId] = useState('');

  const pinForm = useForm({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      currentPin: '',
      newPin: '',
      confirmNewPin: '',
      securityQuestion: SECURITY_QUESTIONS[0],
      securityAnswer: '',
    },
  });

  const handleChangePin = pinForm.handleSubmit(async (values) => {
    try {
      const nextHash = await changeVaultPin({
        currentPin: values.currentPin,
        newPin: values.newPin,
        securityQuestion: values.securityQuestion,
        securityAnswer: values.securityAnswer,
      });
      if (!nextHash) {
        notify.error('PIN saat ini salah');
        return;
      }
      unlockVault(nextHash);
      await queryClient.invalidateQueries({ queryKey: VAULT_KEYS.status });
      pinForm.reset();
      notify.success('PIN berhasil diperbarui');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memperbarui PIN');
    }
  });

  const handleExportJson = () => {
    if (!data) return;
    const payload = buildBackupPayload({
      actresses: data.actresses,
      studios: data.studios,
      tags: data.tags,
      series: data.series,
      codes: data.codes,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success('Backup JSON diunduh');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = parseBackupJson(text);
      await importBackup.mutateAsync({ payload, mode: importMode });
      notify.success('Data JSON berhasil diimpor');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal mengimpor file JSON');
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    try {
      if (resetTarget.kind === 'category') {
        await resetCategory.mutateAsync(resetTarget.category);
        notify.success(`${resetTarget.label} berhasil direset`);
      } else {
        if (resetTarget.entity === 'code') await removeCode.mutateAsync(resetTarget.id);
        if (resetTarget.entity === 'actress') await removeActress.mutateAsync(resetTarget.id);
        if (resetTarget.entity === 'studio') await removeStudio.mutateAsync(resetTarget.id);
        if (resetTarget.entity === 'tag') await removeTag.mutateAsync(resetTarget.id);
        if (resetTarget.entity === 'series') await removeSeries.mutateAsync(resetTarget.id);
        setSelectedItemId('');
        notify.success(`${resetTarget.label} dihapus`);
      }
      setResetTarget(null);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal mereset data');
    }
  };

  const entityItems = (() => {
    if (!data) return [];
    if (selectedEntity === 'code') return data.codes.map((c) => ({ id: c.id, label: c.code }));
    if (selectedEntity === 'actress') return data.actresses.map((a) => ({ id: a.id, label: a.name }));
    if (selectedEntity === 'studio') return data.studios.map((s) => ({ id: s.id, label: s.name }));
    if (selectedEntity === 'tag') return data.tags.map((t) => ({ id: t.id, label: t.name }));
    return data.series.map((s) => ({ id: s.id, label: s.name }));
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-[#F2ECEE]">Pengaturan</h1>

      {/* 1. Ubah PIN (tidak dapat dinonaktifkan) */}
      <section className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <KeyRound className="w-5 h-5 text-[#D9C5A9] shrink-0" />
          <h2 className="text-lg font-semibold text-[#F2ECEE]">Keamanan PIN</h2>
        </div>

        <form onSubmit={handleChangePin} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cfg-current-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
              PIN Saat Ini
            </label>
            <input
              id="cfg-current-pin"
              type="password"
              inputMode="numeric"
              {...pinForm.register('currentPin')}
              placeholder="••••"
              className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9] tabular-nums"
            />
            {pinForm.formState.errors.currentPin ? (
              <p className="mt-2 text-xs text-[#F0A8AA]">
                {pinForm.formState.errors.currentPin.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="cfg-new-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
              PIN Baru
            </label>
            <input
              id="cfg-new-pin"
              type="password"
              inputMode="numeric"
              {...pinForm.register('newPin')}
              placeholder="••••"
              className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9] tabular-nums"
            />
            {pinForm.formState.errors.newPin ? (
              <p className="mt-2 text-xs text-[#F0A8AA]">{pinForm.formState.errors.newPin.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="cfg-confirm-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
              Konfirmasi PIN Baru
            </label>
            <input
              id="cfg-confirm-pin"
              type="password"
              inputMode="numeric"
              {...pinForm.register('confirmNewPin')}
              placeholder="••••"
              className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9] tabular-nums"
            />
            {pinForm.formState.errors.confirmNewPin ? (
              <p className="mt-2 text-xs text-[#F0A8AA]">
                {pinForm.formState.errors.confirmNewPin.message}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <label htmlFor="cfg-question" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
              Pertanyaan Lupa PIN
            </label>
            <select
              id="cfg-question"
              {...pinForm.register('securityQuestion')}
              className="w-full min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cfg-answer" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
              Jawaban Verifikasi Baru
            </label>
            <input
              id="cfg-answer"
              type="text"
              {...pinForm.register('securityAnswer')}
              placeholder="Jawaban verifikasi"
              className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
            />
            {pinForm.formState.errors.securityAnswer ? (
              <p className="mt-2 text-xs text-[#F0A8AA]">
                {pinForm.formState.errors.securityAnswer.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={pinForm.formState.isSubmitting}
              className="px-6 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
            >
              Ubah PIN
            </button>
          </div>
        </form>
      </section>

      {/* 2. Backup & Import JSON */}
      <section className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6">
        <h2 className="text-lg font-semibold text-[#F2ECEE]">Backup & Import JSON</h2>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Backup JSON</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            <select
              aria-label="Mode import JSON"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
              className="flex-1 sm:flex-initial min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
            >
              <option value="merge">Gabungkan Data</option>
              <option value="replace">Timpa Semua Data</option>
            </select>

            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors cursor-pointer whitespace-nowrap shrink-0">
              <Upload className="w-4 h-4 shrink-0" />
              <span>{importBackup.isPending ? 'Mengimpor...' : 'Import JSON'}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </section>

      {/* 3. Reset Data (Per-Data, Per-Kategori, Seluruh Data) */}
      <section className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-[#D9C5A9] shrink-0" />
          <h2 className="text-lg font-semibold text-[#F2ECEE]">Reset Data</h2>
        </div>

        {/* Reset Per-Data Item */}
        <div className="space-y-2 pb-6 border-b border-[#702E3F]">
          <p className="text-xs font-medium text-[#F2ECEE]/80">Reset Per-Data</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              aria-label="Pilih tipe data"
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(
                  e.target.value as 'code' | 'actress' | 'studio' | 'tag' | 'series'
                );
                setSelectedItemId('');
              }}
              className="w-full min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE]"
            >
              <option value="code">Kode</option>
              <option value="actress">Aktris</option>
              <option value="studio">Studio</option>
              <option value="tag">Tag</option>
              <option value="series">Seri</option>
            </select>

            <select
              aria-label="Pilih item untuk dihapus"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE]"
            >
              <option value="">Pilih Data</option>
              {entityItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedItemId}
              onClick={() => {
                const found = entityItems.find((i) => i.id === selectedItemId);
                if (!found) return;
                setResetTarget({
                  kind: 'item',
                  entity: selectedEntity,
                  id: found.id,
                  label: found.label,
                });
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#5E1B1E] hover:border-[#963538] hover:text-[#F0A8AA] transition-colors disabled:opacity-45"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Data Ini</span>
            </button>
          </div>
        </div>

        {/* Reset Per-Kategori & Seluruh Data */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-[#F2ECEE]/80">Reset Per-Kategori</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { category: 'codes', label: 'Reset Kode' },
                { category: 'actresses', label: 'Reset Aktris' },
                { category: 'studios', label: 'Reset Studio' },
                { category: 'tags', label: 'Reset Tag' },
                { category: 'series', label: 'Reset Seri' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.category}
                type="button"
                onClick={() =>
                  setResetTarget({
                    kind: 'category',
                    category: btn.category,
                    label: btn.label,
                  })
                }
                className="px-4 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#702E3F]">
            <button
              type="button"
              onClick={() =>
                setResetTarget({
                  kind: 'category',
                  category: 'all',
                  label: 'Seluruh Data',
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5E1B1E] text-[#F0A8AA] border border-[#963538] hover:bg-[#6E2125] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Seluruh Data</span>
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(resetTarget)}
        title={`Konfirmasi ${resetTarget?.label ?? ''}`}
        message="Tindakan ini akan menghapus data terpilih secara permanen dan tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetTarget(null)}
      />
    </div>
  );
}
