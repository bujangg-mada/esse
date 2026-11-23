import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Building2, Plus } from 'lucide-react';
import { useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { StudioFormModal } from '../components/EntityFormModals';

export function StudiosPage() {
  const { data, isLoading } = useVaultRecordsQuery();
  const [formOpen, setFormOpen] = useState(false);

  const studios = data?.studios ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5 sm:gap-3 min-w-0">
          <h1 className="text-2xl font-semibold text-[#F2ECEE] truncate">Studio</h1>
          <span className="text-sm text-[#F2ECEE]/65 tabular-nums shrink-0">{studios.length}</span>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Tambah Studio"
          title="Tambah Studio"
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tambah Studio</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-48 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse"
            />
          ))}
        </div>
      ) : studios.length === 0 ? (
        <div className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
          <p className="text-sm text-[#F2ECEE]/75">Belum ada data studio.</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Studio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {studios.map((studio) => (
            <Link
              key={studio.id}
              to="/studio/$studioId"
              params={{ studioId: studio.id }}
              className="bg-[#561F2D] border border-[#702E3F] hover:bg-[#622534] transition-colors rounded-lg overflow-hidden flex flex-col"
            >
              <div className="aspect-video w-full bg-[#38111B] border-b border-[#702E3F] flex items-center justify-center p-4 overflow-hidden">
                {studio.logo_url ? (
                  <img
                    src={studio.logo_url}
                    alt={studio.name}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-[#D9C5A9]/60" />
                )}
              </div>

              <div className="p-4">
                <h2 className="text-base font-semibold text-[#F2ECEE] truncate">{studio.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      )}

      <StudioFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
