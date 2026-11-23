import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, FolderKanban, Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { CodeFilterState, CodeWithRelations, SortOption } from '../types/esse';
import { EMPTY_FILTERS, filterAndSortCodes } from '../lib/queryFilter';
import { useVaultMutations, useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { notify } from '../lib/toast';
import { CodeCard } from '../components/CodeCard';
import { SearchFilterSortPanel } from '../components/SearchFilterSortPanel';
import { CodeFormModal } from '../components/CodeFormModal';
import { SeriesFormModal } from '../components/EntityFormModals';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function SeriesDetailPage() {
  const { seriesId } = useParams({ from: '/seri/$seriesId' });
  const navigate = useNavigate();
  const { data, isLoading } = useVaultRecordsQuery();
  const { removeSeries, removeCode } = useVaultMutations();

  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CodeFilterState>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [editSeriesOpen, setEditSeriesOpen] = useState(false);
  const [deleteSeriesOpen, setDeleteSeriesOpen] = useState(false);
  const [codeFormOpen, setCodeFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CodeWithRelations | null>(null);
  const [deletingCode, setDeletingCode] = useState<CodeWithRelations | null>(null);

  const seriesItem = data?.series.find((s) => s.id === seriesId);

  const relatedCodes = useMemo(() => {
    const all = (data?.codes ?? []).filter((c) => c.series_id === seriesId);
    return filterAndSortCodes(all, searchQuery, filters, sortBy);
  }, [data?.codes, seriesId, searchQuery, filters, sortBy]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-64 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse" />
      </div>
    );
  }

  if (!seriesItem) {
    return (
      <div className="max-w-4xl mx-auto bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
        <p className="text-base text-[#F2ECEE]">Seri tidak ditemukan.</p>
        <Link
          to="/seri"
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Seri</span>
        </Link>
      </div>
    );
  }

  const handleDeleteSeries = async () => {
    try {
      await removeSeries.mutateAsync(seriesItem.id);
      notify.success(`${seriesItem.name} dihapus`);
      navigate({ to: '/seri' });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menghapus seri');
    }
  };

  const handleDeleteCode = async () => {
    if (!deletingCode) return;
    try {
      await removeCode.mutateAsync(deletingCode.id);
      notify.success(`${deletingCode.code} dihapus`);
      setDeletingCode(null);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menghapus kode');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <Link
          to="/seri"
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Seri</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditSeriesOpen(true)}
            aria-label={`Edit ${seriesItem.name}`}
            title={`Edit ${seriesItem.name}`}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteSeriesOpen(true)}
            aria-label={`Hapus ${seriesItem.name}`}
            title={`Hapus ${seriesItem.name}`}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#5E1B1E] hover:border-[#963538] hover:text-[#F0A8AA] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      </div>

      <section className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 sm:p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#38111B] border border-[#702E3F] flex items-center justify-center shrink-0">
          <FolderKanban className="w-6 h-6 text-[#D9C5A9]" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#F2ECEE] break-words">{seriesItem.name}</h1>
          <p className="text-sm text-[#F2ECEE]/75 tabular-nums">{relatedCodes.length} kode</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <h2 className="text-lg font-semibold text-[#F2ECEE] truncate min-w-0">Daftar Kode</h2>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setPanelOpen((prev) => !prev)}
            aria-expanded={panelOpen}
            aria-label="Cari dan filter"
            title="Cari & Filter"
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Cari & Filter</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCode(null);
              setCodeFormOpen(true);
            }}
            aria-label="Tambah Kode"
            title="Tambah Kode"
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kode</span>
          </button>
        </div>
      </div>

      <SearchFilterSortPanel
        open={panelOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        actresses={data?.actresses ?? []}
        studios={data?.studios ?? []}
        tags={data?.tags ?? []}
        series={data?.series ?? []}
        hideSeriesFilter
      />

      {relatedCodes.length === 0 ? (
        <div className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center">
          <p className="text-sm text-[#F2ECEE]/75">Belum ada kode di seri ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {relatedCodes.map((item) => (
            <CodeCard
              key={item.id}
              item={item}
              onEdit={(target) => {
                setEditingCode(target);
                setCodeFormOpen(true);
              }}
              onDelete={(target) => setDeletingCode(target)}
            />
          ))}
        </div>
      )}

      <SeriesFormModal
        open={editSeriesOpen}
        editing={seriesItem}
        onClose={() => setEditSeriesOpen(false)}
      />

      <CodeFormModal
        open={codeFormOpen}
        editing={editingCode}
        actresses={data?.actresses ?? []}
        studios={data?.studios ?? []}
        tags={data?.tags ?? []}
        seriesList={data?.series ?? []}
        defaultSeriesId={seriesItem.id}
        onClose={() => {
          setCodeFormOpen(false);
          setEditingCode(null);
        }}
      />

      <ConfirmDialog
        open={deleteSeriesOpen}
        title={`Hapus ${seriesItem.name}?`}
        message="Seri ini akan dihapus dari daftar seri."
        loading={removeSeries.isPending}
        onConfirm={handleDeleteSeries}
        onCancel={() => setDeleteSeriesOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deletingCode)}
        title={`Hapus ${deletingCode?.code ?? ''}?`}
        message="Data kode ini akan dihapus permanen dari ESSE."
        loading={removeCode.isPending}
        onConfirm={handleDeleteCode}
        onCancel={() => setDeletingCode(null)}
      />
    </div>
  );
}
