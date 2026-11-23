import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, RefreshCw, X } from 'lucide-react';
import type { Actress, CodeWithRelations, Series, Studio, Tag } from '../types/esse';
import { codeFormSchema, isValidHttpUrl } from '../lib/schemas';
import { fetchUrlMetadataThumbnail } from '../lib/crypto';
import { useVaultMutations } from '../hooks/useVaultQueries';
import { notify } from '../lib/toast';
import { MediaThumbnail } from './MediaThumbnail';
import {
  ActressFormModal,
  SeriesFormModal,
  StudioFormModal,
  TagFormModal,
} from './EntityFormModals';
import { ModalBackdrop } from './ModalBackdrop';
import { SearchableMultiSelect } from './SearchableMultiSelect';

interface CodeFormModalProps {
  open: boolean;
  editing?: CodeWithRelations | null;
  actresses: Actress[];
  studios: Studio[];
  tags: Tag[];
  seriesList: Series[];
  defaultActressId?: string;
  defaultStudioId?: string;
  defaultSeriesId?: string;
  defaultTagId?: string;
  onClose: () => void;
}

export function CodeFormModal({
  open,
  editing,
  actresses,
  studios,
  tags,
  seriesList,
  defaultActressId,
  defaultStudioId,
  defaultSeriesId,
  defaultTagId,
  onClose,
}: CodeFormModalProps) {
  const { upsertCode, createTag } = useVaultMutations();
  const [fetchingThumb, setFetchingThumb] = useState(false);
  const [showActressModal, setShowActressModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showSeriesModal, setShowSeriesModal] = useState(false);

  const form = useForm({
    resolver: zodResolver(codeFormSchema),
    defaultValues: {
      code: '',
      url: '',
      thumbnail_url: '',
      actress_ids: [] as string[],
      tag_ids: [] as string[],
      studio_id: null as string | null,
      series_id: null as string | null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: editing?.code ?? '',
        url: editing?.url ?? '',
        thumbnail_url: editing?.thumbnail_url ?? '',
        actress_ids: editing
          ? editing.actresses.map((a) => a.id)
          : defaultActressId
          ? [defaultActressId]
          : [],
        tag_ids: editing
          ? editing.tags.map((t) => t.id)
          : defaultTagId
          ? [defaultTagId]
          : [],
        studio_id: editing ? editing.studio_id : defaultStudioId ?? null,
        series_id: editing ? editing.series_id : defaultSeriesId ?? null,
      });
    }
  }, [
    open,
    editing,
    defaultActressId,
    defaultStudioId,
    defaultSeriesId,
    defaultTagId,
    form,
  ]);

  const urlValue = form.watch('url');
  const thumbnailPreview = form.watch('thumbnail_url');
  const selectedActressIds = form.watch('actress_ids') ?? [];
  const selectedTagIds = form.watch('tag_ids') ?? [];

  const actressOptions = useMemo(
    () =>
      actresses.map((a) => ({
        id: a.id,
        label: a.name,
        sublabel: a.age !== null ? `${a.age} thn` : undefined,
      })),
    [actresses]
  );

  const tagOptions = useMemo(
    () =>
      tags.map((t) => ({
        id: t.id,
        label: t.name,
      })),
    [tags]
  );

  const handleFetchThumbnail = async (targetUrl?: string) => {
    const candidate = (targetUrl ?? urlValue).trim();
    if (!isValidHttpUrl(candidate)) return;
    setFetchingThumb(true);
    try {
      const thumb = await fetchUrlMetadataThumbnail(candidate);
      if (thumb) {
        form.setValue('thumbnail_url', thumb, { shouldValidate: true });
      }
    } finally {
      setFetchingThumb(false);
    }
  };

  const handleQuickCreateTag = async (name: string): Promise<string | void> => {
    try {
      const tag = await createTag.mutateAsync(name);
      notify.success(`Tag "${tag.name}" ditambahkan`);
      return tag.id;
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menambah tag');
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      let finalThumb = values.thumbnail_url?.trim() || null;
      if (!finalThumb && isValidHttpUrl(values.url)) {
        finalThumb = await fetchUrlMetadataThumbnail(values.url);
      }

      await upsertCode.mutateAsync({
        id: editing?.id,
        code: values.code,
        url: values.url,
        thumbnail_url: finalThumb,
        actress_ids: values.actress_ids,
        tag_ids: values.tag_ids,
        studio_id: values.studio_id || null,
        series_id: values.series_id || null,
      });

      notify.success(editing ? 'Kode berhasil diperbarui' : 'Kode berhasil disimpan');
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menyimpan data');
    }
  });

  const subModalOpen = showActressModal || showTagModal || showStudioModal || showSeriesModal;

  return (
    <>
      <AnimatePresence>
        {open ? (
          <ModalBackdrop
            onClose={onClose}
            ariaLabelledBy="code-modal-title"
            disableClose={subModalOpen}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 space-y-6 max-h-[92vh] overflow-y-auto overflow-x-hidden"
            >
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="code-modal-title"
                  className="text-lg font-semibold text-[#F2ECEE] truncate min-w-0"
                >
                  {editing ? `Edit ${editing.code}` : 'Tambah Kode Baru'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup form utama"
                  className="p-2 rounded-lg text-[#F2ECEE]/70 hover:text-[#F2ECEE] hover:bg-[#622534] transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Urutan Form Utama: Kode -> URL -> Aktris -> Tag -> Studio -> Seri (Opsional) */}
              <form onSubmit={onSubmit} className="space-y-4">
                {/* 1. Kode */}
                <div>
                  <label
                    htmlFor="code-field"
                    className="block text-xs font-medium text-[#F2ECEE]/85 mb-2"
                  >
                    1. Kode
                  </label>
                  <input
                    id="code-field"
                    type="text"
                    {...form.register('code')}
                    placeholder="Contoh: ROE-504 atau ALDN-627"
                    className="w-full px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                  />
                  {form.formState.errors.code ? (
                    <p className="mt-2 text-xs text-[#F0A8AA]">{form.formState.errors.code.message}</p>
                  ) : null}
                </div>

                {/* 2. URL & Thumbnail Metadata 16:9 */}
                <div className="space-y-2">
                  <label htmlFor="url-field" className="block text-xs font-medium text-[#F2ECEE]/85">
                    2. URL
                  </label>
                  <div className="flex gap-2 min-w-0">
                    <input
                      id="url-field"
                      type="url"
                      {...form.register('url', {
                        onBlur: (e) => {
                          if (!form.getValues('thumbnail_url')) {
                            void handleFetchThumbnail(e.target.value);
                          }
                        },
                      })}
                      placeholder="https://..."
                      className="flex-1 min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/40 focus:outline-none focus:border-[#D9C5A9]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleFetchThumbnail()}
                      disabled={fetchingThumb || !isValidHttpUrl(urlValue)}
                      aria-label="Ambil thumbnail dari URL"
                      title="Ambil thumbnail dari URL"
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${fetchingThumb ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Thumbnail</span>
                    </button>
                  </div>
                  {form.formState.errors.url ? (
                    <p className="text-xs text-[#F0A8AA]">{form.formState.errors.url.message}</p>
                  ) : null}

                  <div className="rounded-lg overflow-hidden border border-[#702E3F]">
                    <MediaThumbnail
                      src={thumbnailPreview}
                      alt="Pratinjau thumbnail 16:9"
                      label={fetchingThumb ? 'Memuat metadata URL...' : 'Pratinjau Thumbnail 16:9'}
                    />
                  </div>
                </div>

                {/* 3. Aktris (Dropdown Multi-Select dengan Search) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="actress-multiselect"
                      className="block text-xs font-medium text-[#F2ECEE]/85 truncate"
                    >
                      3. Aktris
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowActressModal(true)}
                      aria-label="Tambah aktris baru"
                      title="Tambah aktris baru"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <SearchableMultiSelect
                    id="actress-multiselect"
                    placeholder="Pilih Aktris (Opsional)"
                    searchPlaceholder="Cari aktris..."
                    emptyMessage="Aktris tidak ditemukan."
                    options={actressOptions}
                    selectedIds={selectedActressIds}
                    onChange={(nextIds) => form.setValue('actress_ids', nextIds)}
                  />
                </div>

                {/* 4. Tag (Dropdown Multi-Select dengan Search) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="tag-multiselect"
                      className="block text-xs font-medium text-[#F2ECEE]/85 truncate"
                    >
                      4. Tag
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTagModal(true)}
                      aria-label="Tambah tag baru"
                      title="Tambah tag baru"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <SearchableMultiSelect
                    id="tag-multiselect"
                    placeholder="Pilih Tag (Opsional)"
                    searchPlaceholder="Cari atau tambah tag..."
                    emptyMessage="Tag tidak ditemukan."
                    options={tagOptions}
                    selectedIds={selectedTagIds}
                    onChange={(nextIds) => form.setValue('tag_ids', nextIds)}
                    onQuickCreate={handleQuickCreateTag}
                    quickCreateLabel="Tambah tag"
                  />
                </div>

                {/* 5. Studio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="studio-select"
                      className="block text-xs font-medium text-[#F2ECEE]/85 truncate"
                    >
                      5. Studio / Pembuat
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStudioModal(true)}
                      aria-label="Tambah studio baru"
                      title="Tambah studio baru"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    id="studio-select"
                    value={form.watch('studio_id') ?? ''}
                    onChange={(e) => form.setValue('studio_id', e.target.value || null)}
                    className="w-full min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                  >
                    <option value="">Pilih Studio (Opsional)</option>
                    {studios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Seri / Playlist (Opsional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="series-select"
                      className="block text-xs font-medium text-[#F2ECEE]/85 truncate"
                    >
                      6. Seri / Playlist / Folder (Opsional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSeriesModal(true)}
                      aria-label="Tambah seri baru"
                      title="Tambah seri baru"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    id="series-select"
                    value={form.watch('series_id') ?? ''}
                    onChange={(e) => form.setValue('series_id', e.target.value || null)}
                    className="w-full min-w-0 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                  >
                    <option value="">Tanpa Seri</option>
                    {seriesList.map((ser) => (
                      <option key={ser.id} value={ser.id}>
                        {ser.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#702E3F]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={upsertCode.isPending}
                    className="px-6 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
                  >
                    {upsertCode.isPending ? 'Menyimpan...' : editing ? 'Perbarui' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </ModalBackdrop>
        ) : null}
      </AnimatePresence>

      <ActressFormModal
        open={showActressModal}
        onClose={() => setShowActressModal(false)}
        onCreated={(created) => {
          const current = form.getValues('actress_ids') ?? [];
          if (!current.includes(created.id)) {
            form.setValue('actress_ids', [...current, created.id]);
          }
        }}
      />

      <TagFormModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreated={(created) => {
          const current = form.getValues('tag_ids') ?? [];
          if (!current.includes(created.id)) {
            form.setValue('tag_ids', [...current, created.id]);
          }
        }}
      />

      <StudioFormModal
        open={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        onCreated={(created) => {
          form.setValue('studio_id', created.id);
        }}
      />

      <SeriesFormModal
        open={showSeriesModal}
        onClose={() => setShowSeriesModal(false)}
        onCreated={(created) => {
          form.setValue('series_id', created.id);
        }}
      />
    </>
  );
}
