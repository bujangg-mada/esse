import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useVaultMutations, useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { isValidHttpUrl } from '../lib/schemas';
import { notify } from '../lib/toast';
import { MediaThumbnail } from '../components/MediaThumbnail';
import { CodeFormModal } from '../components/CodeFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function CodeDetailPage() {
  const { codeId } = useParams({ from: '/koleksi/$codeId' });
  const navigate = useNavigate();
  const { data, isLoading } = useVaultRecordsQuery();
  const { removeCode } = useVaultMutations();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const item = data?.codes.find((c) => c.id === codeId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-96 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
        <p className="text-base text-[#F2ECEE]">Data kode tidak ditemukan.</p>
        <Link
          to="/koleksi"
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Koleksi</span>
        </Link>
      </div>
    );
  }

  const safeHref = isValidHttpUrl(item.url) ? item.url : '#';
  const createdLabel = new Date(item.created_at).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleDelete = async () => {
    try {
      await removeCode.mutateAsync(item.id);
      notify.success(`${item.code} dihapus`);
      navigate({ to: '/koleksi' });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menghapus data');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <Link
          to="/koleksi"
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Koleksi</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka URL ${item.code}`}
            title={`Buka URL ${item.code}`}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Buka URL</span>
          </a>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label={`Edit ${item.code}`}
            title={`Edit ${item.code}`}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label={`Hapus ${item.code}`}
            title={`Hapus ${item.code}`}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#5E1B1E] hover:border-[#963538] hover:text-[#F0A8AA] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      </div>

      <article className="bg-[#561F2D] border border-[#702E3F] rounded-lg overflow-hidden">
        <MediaThumbnail src={item.thumbnail_url} alt={`Thumbnail ${item.code}`} label={item.code} />

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-[#F2ECEE] tabular-nums">
              {item.code}
            </h1>
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#D9C5A9] hover:underline break-all inline-block"
            >
              {item.url}
            </a>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#702E3F]">
            <div className="space-y-1">
              <dt className="text-xs text-[#F2ECEE]/60">Aktris</dt>
              <dd className="text-sm text-[#F2ECEE]">
                {item.actresses.length === 0 ? (
                  '—'
                ) : (
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {item.actresses.map((a, idx) => (
                      <span key={a.id} className="inline-flex items-center gap-2">
                        <Link
                          to="/aktris/$actressId"
                          params={{ actressId: a.id }}
                          className="text-[#D9C5A9] hover:underline font-medium"
                        >
                          {a.name}
                        </Link>
                        {idx < item.actresses.length - 1 ? (
                          <span aria-hidden="true" className="text-[#F2ECEE]/45">
                            ·
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                )}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs text-[#F2ECEE]/60">Studio / Pembuat</dt>
              <dd className="text-sm text-[#F2ECEE]">
                {item.studio ? (
                  <Link
                    to="/studio/$studioId"
                    params={{ studioId: item.studio.id }}
                    className="text-[#D9C5A9] hover:underline font-medium"
                  >
                    {item.studio.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs text-[#F2ECEE]/60">Seri / Playlist</dt>
              <dd className="text-sm text-[#F2ECEE]">
                {item.series ? (
                  <Link
                    to="/seri/$seriesId"
                    params={{ seriesId: item.series.id }}
                    className="text-[#D9C5A9] hover:underline font-medium"
                  >
                    {item.series.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs text-[#F2ECEE]/60">Ditambahkan</dt>
              <dd className="text-sm text-[#F2ECEE] tabular-nums">{createdLabel}</dd>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <dt className="text-xs text-[#F2ECEE]/60">Tag</dt>
              <dd className="text-sm text-[#F2ECEE]">
                {item.tags.length === 0 ? (
                  '—'
                ) : (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {item.tags.map((tag, idx) => (
                      <span key={tag.id} className="inline-flex items-center gap-2">
                        <Link
                          to="/tag/$tagId"
                          params={{ tagId: tag.id }}
                          className="text-[#D9C5A9] hover:underline font-medium"
                        >
                          {tag.name}
                        </Link>
                        {idx < item.tags.length - 1 ? (
                          <span aria-hidden="true" className="text-[#F2ECEE]/45">
                            ·
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </article>

      <CodeFormModal
        open={editOpen}
        editing={item}
        actresses={data?.actresses ?? []}
        studios={data?.studios ?? []}
        tags={data?.tags ?? []}
        seriesList={data?.series ?? []}
        onClose={() => setEditOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Hapus ${item.code}?`}
        message="Data kode ini akan dihapus permanen dari ESSE."
        loading={removeCode.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
