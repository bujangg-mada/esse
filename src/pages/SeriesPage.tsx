import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FolderKanban, Plus } from 'lucide-react';
import { useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { SeriesFormModal } from '../components/EntityFormModals';

export function SeriesPage() {
  const { data, isLoading } = useVaultRecordsQuery();
  const [formOpen, setFormOpen] = useState(false);

  const seriesList = data?.series ?? [];
  const codes = data?.codes ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5 sm:gap-3 min-w-0">
          <h1 className="text-2xl font-semibold text-[#F2ECEE] truncate">Seri</h1>
          <span className="text-sm text-[#F2ECEE]/65 tabular-nums shrink-0">{seriesList.length}</span>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Tambah Seri"
          title="Tambah Seri"
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tambah Seri</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-28 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse"
            />
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
          <p className="text-sm text-[#F2ECEE]/75">Belum ada seri atau playlist.</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Seri</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {seriesList.map((ser) => {
            const count = codes.filter((c) => c.series_id === ser.id).length;
            return (
              <Link
                key={ser.id}
                to="/seri/$seriesId"
                params={{ seriesId: ser.id }}
                className="bg-[#561F2D] border border-[#702E3F] hover:bg-[#622534] transition-colors rounded-lg p-6 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#38111B] border border-[#6E2D3D] flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5 text-[#D9C5A9]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#F2ECEE] truncate">{ser.name}</h2>
                    <p className="text-xs text-[#F2ECEE]/65 tabular-nums">{count} kode</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <SeriesFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
