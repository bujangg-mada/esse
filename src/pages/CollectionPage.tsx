import { useMemo, useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import type { CodeFilterState, CodeWithRelations, SortOption } from '../types/esse';
import { EMPTY_FILTERS, filterAndSortCodes } from '../lib/queryFilter';
import { useVaultMutations, useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { notify } from '../lib/toast';
import { CodeCard } from '../components/CodeCard';
import { SearchFilterSortPanel } from '../components/SearchFilterSortPanel';
import { CodeFormModal } from '../components/CodeFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function CollectionPage() {
  const { data, isLoading } = useVaultRecordsQuery();
  const { removeCode } = useVaultMutations();

  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CodeFilterState>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CodeWithRelations | null>(null);
  const [deleting, setDeleting] = useState<CodeWithRelations | null>(null);

  const codes = data?.codes ?? [];
  const actresses = data?.actresses ?? [];
  const studios = data?.studios ?? [];
  const tags = data?.tags ?? [];
  const series = data?.series ?? [];

  const filteredCodes = useMemo(
    () => filterAndSortCodes(codes, searchQuery, filters, sortBy),
    [codes, searchQuery, filters, sortBy]
  );

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await removeCode.mutateAsync(deleting.id);
      notify.success(`${deleting.code} dihapus`);
      setDeleting(null);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Gagal menghapus data');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-baseline gap-2.5 sm:gap-3 min-w-0">
          <h1 className="text-2xl font-semibold text-[#F2ECEE] truncate">Koleksi</h1>
          <span className="text-sm text-[#F2ECEE]/65 tabular-nums shrink-0">{filteredCodes.length}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setPanelOpen((prev) => !prev)}
            aria-expanded={panelOpen}
            aria-label="Cari dan filter"
            title="Cari & Filter"
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Cari & Filter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            aria-label="Tambah Kode"
            title="Tambah Kode"
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
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
        actresses={actresses}
        studios={studios}
        tags={tags}
        series={series}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-64 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse"
            />
          ))}
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
          <p className="text-sm text-[#F2ECEE]/75">
            {codes.length === 0 ? 'Belum ada koleksi tersimpan.' : 'Tidak ada hasil yang cocok.'}
          </p>
          {codes.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kode</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredCodes.map((item) => (
            <CodeCard
              key={item.id}
              item={item}
              onEdit={(target) => {
                setEditing(target);
                setFormOpen(true);
              }}
              onDelete={(target) => setDeleting(target)}
            />
          ))}
        </div>
      )}

      <CodeFormModal
        open={formOpen}
        editing={editing}
        actresses={actresses}
        studios={studios}
        tags={tags}
        seriesList={series}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Hapus ${deleting?.code ?? ''}?`}
        message="Data kode ini akan dihapus permanen dari ESSE."
        loading={removeCode.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
