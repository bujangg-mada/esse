import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { TagFormModal } from '../components/EntityFormModals';

export function TagsPage() {
  const { data, isLoading } = useVaultRecordsQuery();
  const [formOpen, setFormOpen] = useState(false);

  const tags = data?.tags ?? [];
  const codes = data?.codes ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-2xl font-semibold text-[#F2ECEE] truncate">Tag</h1>
          <span className="text-sm text-[#F2ECEE]/65 tabular-nums shrink-0">{tags.length}</span>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Tambah Tag"
          title="Tambah Tag"
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tambah Tag</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-x-6 gap-y-3 py-2">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-5 w-20 rounded bg-[#561F2D] animate-pulse" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="py-8 space-y-4">
          <p className="text-sm text-[#F2ECEE]/75">Belum ada data tag.</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            aria-label="Tambah Tag Pertama"
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tag</span>
          </button>
        </div>
      ) : (
        <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-3 py-2">
          {tags.map((tag) => {
            const count = codes.filter((c) => c.tags.some((t) => t.id === tag.id)).length;
            return (
              <li key={tag.id} className="min-w-0 max-w-full">
                <Link
                  to="/tag/$tagId"
                  params={{ tagId: tag.id }}
                  className="inline-flex items-baseline gap-1.5 text-base font-medium text-[#F2ECEE] hover:text-[#D9C5A9] hover:underline transition-colors break-words"
                >
                  <span>{tag.name}</span>
                  <span className="text-xs text-[#F2ECEE]/50 tabular-nums">({count})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <TagFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
