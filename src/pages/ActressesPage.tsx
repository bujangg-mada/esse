import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, User } from 'lucide-react';
import { useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { ActressFormModal } from '../components/EntityFormModals';

export function ActressesPage() {
  const { data, isLoading } = useVaultRecordsQuery();
  const [formOpen, setFormOpen] = useState(false);

  const actresses = data?.actresses ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5 sm:gap-3 min-w-0">
          <h1 className="text-2xl font-semibold text-[#F2ECEE] truncate">Aktris</h1>
          <span className="text-sm text-[#F2ECEE]/65 tabular-nums shrink-0">{actresses.length}</span>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Tambah Aktris"
          title="Tambah Aktris"
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tambah Aktris</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-64 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse"
            />
          ))}
        </div>
      ) : actresses.length === 0 ? (
        <div className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
          <p className="text-sm text-[#F2ECEE]/75">Belum ada data aktris.</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aktris</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {actresses.map((actress) => (
            <Link
              key={actress.id}
              to="/aktris/$actressId"
              params={{ actressId: actress.id }}
              className="bg-[#561F2D] border border-[#702E3F] hover:bg-[#622534] transition-colors rounded-lg overflow-hidden flex flex-col"
            >
              <div className="aspect-square w-full bg-[#38111B] border-b border-[#702E3F] flex items-center justify-center overflow-hidden">
                {actress.photo_url ? (
                  <img
                    src={actress.photo_url}
                    alt={actress.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-[#D9C5A9]/60" />
                )}
              </div>

              <div className="p-4 space-y-1">
                <h2 className="text-base font-semibold text-[#F2ECEE] truncate">{actress.name}</h2>
                <p className="text-xs text-[#F2ECEE]/70 tabular-nums">
                  {actress.age !== null ? `${actress.age} tahun` : 'Umur —'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ActressFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
