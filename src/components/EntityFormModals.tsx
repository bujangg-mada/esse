import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { Upload, X } from 'lucide-react';
import type { Actress, Series, Studio, Tag } from '../types/esse';
import {
  actressFormSchema,
  seriesFormSchema,
  studioFormSchema,
  tagFormSchema,
} from '../lib/schemas';
import { compressImageToDataUrl } from '../lib/crypto';
import { useVaultMutations } from '../hooks/useVaultQueries';
import { notify } from '../lib/toast';
import { ModalBackdrop } from './ModalBackdrop';

interface ActressFormModalProps {
  open: boolean;
  editing?: Actress | null;
  onClose: () => void;
  onCreated?: (actress: Actress) => void;
}

export function ActressFormModal({ open, editing, onClose, onCreated }: ActressFormModalProps) {
  const { upsertActress } = useVaultMutations();
  const [uploading, setUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(actressFormSchema),
    defaultValues: {
      name: '',
      age: undefined as number | undefined,
      photo_url: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? '',
        age: editing?.age ?? undefined,
        photo_url: editing?.photo_url ?? '',
      });
    }
  }, [open, editing, form]);

  const photoPreview = form.watch('photo_url');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const dataUrl = await compressImageToDataUrl(file, 512);
      form.setValue('photo_url', dataUrl, { shouldValidate: true });
      notify.success('Foto profil dimuat');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memuat foto');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await upsertActress.mutateAsync({
        id: editing?.id,
        name: values.name,
        age: values.age ?? null,
        photo_url: values.photo_url || null,
      });
      notify.success(editing ? 'Data aktris diperbarui' : 'Aktris ditambahkan');
      onCreated?.(saved);
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menyimpan aktris');
    }
  });

  return (
    <AnimatePresence>
      {open ? (
        <ModalBackdrop onClose={onClose} ariaLabelledBy="actress-modal-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="actress-modal-title" className="text-lg font-semibold text-[#F2ECEE]">
                {editing ? 'Edit Aktris' : 'Tambah Aktris'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form aktris"
                className="p-2 rounded-lg text-[#F2ECEE]/70 hover:text-[#F2ECEE] hover:bg-[#622534] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="actress-name" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Nama
                </label>
                <input
                  id="actress-name"
                  type="text"
                  {...form.register('name')}
                  placeholder="Nama aktris"
                  className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                />
                {form.formState.errors.name ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="actress-age" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Umur (Opsional)
                </label>
                <input
                  id="actress-age"
                  type="number"
                  min={18}
                  max={120}
                  {...form.register('age', { valueAsNumber: true })}
                  placeholder="Contoh: 24"
                  className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9] tabular-nums"
                />
                {form.formState.errors.age ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.age.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="actress-photo" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Foto Profil (Opsional - URL atau Upload)
                </label>
                <div className="space-y-2">
                  <input
                    id="actress-photo"
                    type="text"
                    {...form.register('photo_url')}
                    placeholder="https://..."
                    className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                  />
                  <label className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Memproses...' : 'Upload Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                {form.formState.errors.photo_url ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.photo_url.message}</p>
                ) : null}
                {photoPreview ? (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-[#702E3F] bg-[#38111B]">
                    <img
                      src={photoPreview}
                      alt="Pratinjau foto"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={upsertActress.isPending}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
                >
                  {upsertActress.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}

interface StudioFormModalProps {
  open: boolean;
  editing?: Studio | null;
  onClose: () => void;
  onCreated?: (studio: Studio) => void;
}

export function StudioFormModal({ open, editing, onClose, onCreated }: StudioFormModalProps) {
  const { upsertStudio } = useVaultMutations();
  const [uploading, setUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(studioFormSchema),
    defaultValues: {
      name: '',
      logo_url: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? '',
        logo_url: editing?.logo_url ?? '',
      });
    }
  }, [open, editing, form]);

  const logoPreview = form.watch('logo_url');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const dataUrl = await compressImageToDataUrl(file, 512);
      form.setValue('logo_url', dataUrl, { shouldValidate: true });
      notify.success('Logo studio dimuat');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal memuat logo');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await upsertStudio.mutateAsync({
        id: editing?.id,
        name: values.name,
        logo_url: values.logo_url || null,
      });
      notify.success(editing ? 'Data studio diperbarui' : 'Studio ditambahkan');
      onCreated?.(saved);
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menyimpan studio');
    }
  });

  return (
    <AnimatePresence>
      {open ? (
        <ModalBackdrop onClose={onClose} ariaLabelledBy="studio-modal-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="studio-modal-title" className="text-lg font-semibold text-[#F2ECEE]">
                {editing ? 'Edit Studio' : 'Tambah Studio'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form studio"
                className="p-2 rounded-lg text-[#F2ECEE]/70 hover:text-[#F2ECEE] hover:bg-[#622534] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="studio-name" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Nama Studio / Pembuat
                </label>
                <input
                  id="studio-name"
                  type="text"
                  {...form.register('name')}
                  placeholder="Nama studio"
                  className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                />
                {form.formState.errors.name ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="studio-logo" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Logo (Opsional - URL atau Upload)
                </label>
                <div className="space-y-2">
                  <input
                    id="studio-logo"
                    type="text"
                    {...form.register('logo_url')}
                    placeholder="https://..."
                    className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                  />
                  <label className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Memproses...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                {form.formState.errors.logo_url ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.logo_url.message}</p>
                ) : null}
                {logoPreview ? (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-[#702E3F] bg-[#38111B] p-2">
                    <img
                      src={logoPreview}
                      alt="Pratinjau logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={upsertStudio.isPending}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
                >
                  {upsertStudio.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}

interface SeriesFormModalProps {
  open: boolean;
  editing?: Series | null;
  onClose: () => void;
  onCreated?: (series: Series) => void;
}

export function SeriesFormModal({ open, editing, onClose, onCreated }: SeriesFormModalProps) {
  const { upsertSeries } = useVaultMutations();

  const form = useForm({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? '',
      });
    }
  }, [open, editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await upsertSeries.mutateAsync({
        id: editing?.id,
        name: values.name,
      });
      notify.success(editing ? 'Seri diperbarui' : 'Seri ditambahkan');
      onCreated?.(saved);
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menyimpan seri');
    }
  });

  return (
    <AnimatePresence>
      {open ? (
        <ModalBackdrop onClose={onClose} ariaLabelledBy="series-modal-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="series-modal-title" className="text-lg font-semibold text-[#F2ECEE]">
                {editing ? 'Edit Seri' : 'Tambah Seri'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form seri"
                className="p-2 rounded-lg text-[#F2ECEE]/70 hover:text-[#F2ECEE] hover:bg-[#622534] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="series-name" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Nama Seri / Playlist / Folder
                </label>
                <input
                  id="series-name"
                  type="text"
                  {...form.register('name')}
                  placeholder="Nama seri"
                  className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                />
                {form.formState.errors.name ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={upsertSeries.isPending}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
                >
                  {upsertSeries.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}

interface TagFormModalProps {
  open: boolean;
  editing?: Tag | null;
  onClose: () => void;
  onCreated?: (tag: Tag) => void;
}

export function TagFormModal({ open, editing, onClose, onCreated }: TagFormModalProps) {
  const { createTag } = useVaultMutations();

  const form = useForm({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? '',
      });
    }
  }, [open, editing, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await createTag.mutateAsync(
        editing ? { id: editing.id, name: values.name } : values.name
      );
      notify.success(editing ? 'Tag diperbarui' : 'Tag ditambahkan');
      onCreated?.(saved);
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menyimpan tag');
    }
  });

  return (
    <AnimatePresence>
      {open ? (
        <ModalBackdrop onClose={onClose} ariaLabelledBy="tag-modal-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="tag-modal-title" className="text-lg font-semibold text-[#F2ECEE]">
                {editing ? 'Edit Tag' : 'Tambah Tag'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form tag"
                className="p-2 rounded-lg text-[#F2ECEE]/70 hover:text-[#F2ECEE] hover:bg-[#622534] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="tag-name" className="block text-xs font-medium text-[#F2ECEE]/85 mb-2">
                  Nama Tag
                </label>
                <input
                  id="tag-name"
                  type="text"
                  {...form.register('name')}
                  placeholder="Contoh: Drama"
                  className="w-full px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                />
                {form.formState.errors.name ? (
                  <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createTag.isPending}
                  className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
                >
                  {createTag.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}
