import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, Lock } from 'lucide-react';
import {
  SECURITY_QUESTIONS,
  forgotPinSchema,
  setupPinSchema,
  unlockPinSchema,
} from '../lib/schemas';
import {
  resetPinWithSecurityAnswer,
  setupVaultPin,
  verifyVaultPin,
} from '../lib/db';
import { useVaultStore } from '../store/useVaultStore';
import { VAULT_KEYS, useVaultStatusQuery } from '../hooks/useVaultQueries';
import { notify } from '../lib/toast';

export function PinGatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unlockVault = useVaultStore((s) => s.unlockVault);
  const { data: status, isLoading, isError, error, refetch } = useVaultStatusQuery();
  const [forgotMode, setForgotMode] = useState(false);

  const setupForm = useForm({
    resolver: zodResolver(setupPinSchema),
    defaultValues: {
      pin: '',
      confirmPin: '',
      securityQuestion: SECURITY_QUESTIONS[0],
      securityAnswer: '',
    },
  });

  const unlockForm = useForm({
    resolver: zodResolver(unlockPinSchema),
    defaultValues: { pin: '' },
  });

  const forgotForm = useForm({
    resolver: zodResolver(forgotPinSchema),
    defaultValues: {
      securityAnswer: '',
      newPin: '',
      confirmNewPin: '',
    },
  });

  const handleSetup = setupForm.handleSubmit(async (values) => {
    try {
      const pinHash = await setupVaultPin({
        pin: values.pin,
        securityQuestion: values.securityQuestion,
        securityAnswer: values.securityAnswer,
      });
      await queryClient.invalidateQueries({ queryKey: VAULT_KEYS.status });
      unlockVault(pinHash);
      notify.success('PIN berhasil dibuat');
      navigate({ to: '/dasbor' });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal membuat PIN');
    }
  });

  const handleUnlock = unlockForm.handleSubmit(async (values) => {
    try {
      const pinHash = await verifyVaultPin(values.pin);
      if (!pinHash) {
        notify.error('PIN salah');
        unlockForm.setValue('pin', '');
        return;
      }
      unlockVault(pinHash);
      notify.success('ESSE terbuka');
      navigate({ to: '/dasbor' });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memverifikasi PIN');
    }
  });

  const handleForgotReset = forgotForm.handleSubmit(async (values) => {
    try {
      const newPinHash = await resetPinWithSecurityAnswer({
        securityAnswer: values.securityAnswer,
        newPin: values.newPin,
      });
      if (!newPinHash) {
        notify.error('Jawaban verifikasi tidak cocok');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: VAULT_KEYS.status });
      unlockVault(newPinHash);
      setForgotMode(false);
      notify.success('PIN berhasil diatur ulang');
      navigate({ to: '/dasbor' });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal mengatur ulang PIN');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center">
          <p className="text-sm text-[#F2ECEE]/75">Memeriksa kunci...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-6 md:p-8 space-y-4">
          <h1 className="text-lg font-semibold text-[#F2ECEE]">Koneksi Supabase Gagal</h1>
          <p className="text-sm text-[#F0A8AA] break-words">
            {error instanceof Error ? error.message : 'Pastikan SQL schema sudah dijalankan di Supabase.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="w-full px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-6 md:p-8 space-y-6">
        {!status?.initialized ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#38111B] border border-[#6E2D3D] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-[#D9C5A9]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#F2ECEE]">Atur PIN Masuk</h1>
                <p className="text-xs text-[#F2ECEE]/70">Wajib untuk melindungi akses ESSE</p>
              </div>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label htmlFor="setup-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  PIN (4–8 digit angka)
                </label>
                <input
                  id="setup-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  {...setupForm.register('pin')}
                  placeholder="••••"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9] tabular-nums"
                />
                {setupForm.formState.errors.pin ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{setupForm.formState.errors.pin.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="setup-confirm-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Konfirmasi PIN
                </label>
                <input
                  id="setup-confirm-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  {...setupForm.register('confirmPin')}
                  placeholder="••••"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9] tabular-nums"
                />
                {setupForm.formState.errors.confirmPin ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">
                    {setupForm.formState.errors.confirmPin.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="setup-question" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Pertanyaan Verifikasi Lupa PIN
                </label>
                <select
                  id="setup-question"
                  {...setupForm.register('securityQuestion')}
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="setup-answer" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Jawaban Verifikasi
                </label>
                <input
                  id="setup-answer"
                  type="text"
                  {...setupForm.register('securityAnswer')}
                  placeholder="Masukkan jawaban Anda"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9]"
                />
                {setupForm.formState.errors.securityAnswer ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">
                    {setupForm.formState.errors.securityAnswer.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={setupForm.formState.isSubmitting}
                className="w-full px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
              >
                {setupForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan & Buka ESSE'}
              </button>
            </form>
          </>
        ) : !forgotMode ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#38111B] border border-[#6E2D3D] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#D9C5A9]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#F2ECEE]">Masukkan PIN</h1>
                <p className="text-xs text-[#F2ECEE]/70">Akses privat pemilik ESSE</p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label htmlFor="unlock-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  PIN
                </label>
                <input
                  id="unlock-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  autoFocus
                  {...unlockForm.register('pin')}
                  placeholder="••••"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-base tracking-widest text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9] tabular-nums"
                />
                {unlockForm.formState.errors.pin ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">
                    {unlockForm.formState.errors.pin.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={unlockForm.formState.isSubmitting}
                className="w-full px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
              >
                {unlockForm.formState.isSubmitting ? 'Memverifikasi...' : 'Buka'}
              </button>
            </form>

            <div className="pt-2 border-t border-[#702E3F] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  forgotForm.reset();
                  setForgotMode(true);
                }}
                className="text-xs font-medium text-[#D9C5A9] hover:underline py-2"
              >
                Lupa PIN?
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#38111B] border border-[#6E2D3D] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-[#D9C5A9]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#F2ECEE]">Pemulihan PIN</h1>
                <p className="text-xs text-[#F2ECEE]/70">Verifikasi pertanyaan keamanan</p>
              </div>
            </div>

            <form onSubmit={handleForgotReset} className="space-y-4">
              <div className="p-4 rounded-lg bg-[#38111B] border border-[#6E2D3D]">
                <p className="text-xs text-[#F2ECEE]/65 mb-1">Pertanyaan Verifikasi</p>
                <p className="text-sm font-medium text-[#F2ECEE]">
                  {status.security_question ?? SECURITY_QUESTIONS[0]}
                </p>
              </div>

              <div>
                <label htmlFor="forgot-answer" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Jawaban
                </label>
                <input
                  id="forgot-answer"
                  type="text"
                  {...forgotForm.register('securityAnswer')}
                  placeholder="Masukkan jawaban Anda"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9]"
                />
                {forgotForm.formState.errors.securityAnswer ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">
                    {forgotForm.formState.errors.securityAnswer.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="forgot-new-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  PIN Baru (4–8 digit)
                </label>
                <input
                  id="forgot-new-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  {...forgotForm.register('newPin')}
                  placeholder="••••"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9] tabular-nums"
                />
                {forgotForm.formState.errors.newPin ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">
                    {forgotForm.formState.errors.newPin.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="forgot-confirm-pin" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Konfirmasi PIN Baru
                </label>
                <input
                  id="forgot-confirm-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  {...forgotForm.register('confirmNewPin')}
                  placeholder="••••"
                  className="w-full px-4 py-2 min-h-[44px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/35 focus:outline-none focus:border-[#D9C5A9] tabular-nums"
                />
                {forgotForm.formState.errors.confirmNewPin ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">
                    {forgotForm.formState.errors.confirmNewPin.message}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="flex-1 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={forgotForm.formState.isSubmitting}
                  className="flex-1 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
                >
                  Reset PIN
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
