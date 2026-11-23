import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, Search } from 'lucide-react';
import type { Actress, CodeFilterState, Series, SortOption, Studio, Tag } from '../types/esse';
import { EMPTY_FILTERS, hasActiveFilters } from '../lib/queryFilter';

interface SearchFilterSortPanelProps {
  open: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: CodeFilterState;
  onFiltersChange: (next: CodeFilterState) => void;
  sortBy: SortOption;
  onSortChange: (next: SortOption) => void;
  actresses: Actress[];
  studios: Studio[];
  tags: Tag[];
  series: Series[];
  hideActressFilter?: boolean;
  hideStudioFilter?: boolean;
  hideTagFilter?: boolean;
  hideSeriesFilter?: boolean;
}

export function SearchFilterSortPanel({
  open,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  actresses,
  studios,
  tags,
  series,
  hideActressFilter = false,
  hideStudioFilter = false,
  hideTagFilter = false,
  hideSeriesFilter = false,
}: SearchFilterSortPanelProps) {
  const active = hasActiveFilters(searchQuery, filters) || sortBy !== 'newest';

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.section
          aria-label="Panel pencarian, filter, dan urutan"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
          className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-4 md:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="min-w-0">
              <label htmlFor="esse-search-input" className="block text-xs font-medium text-[#F2ECEE]/80 mb-2">
                Cari Kode, Aktris, Studio, Tag
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#F2ECEE]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="esse-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Ketik kata kunci..."
                  className="w-full min-w-0 pl-10 pr-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/45 focus:outline-none focus:border-[#D9C5A9]"
                />
              </div>
            </div>

            {!hideActressFilter ? (
              <div className="min-w-0">
                <label htmlFor="esse-filter-actress" className="block text-xs font-medium text-[#F2ECEE]/80 mb-2">
                  Filter Aktris
                </label>
                <select
                  id="esse-filter-actress"
                  value={filters.actressId}
                  onChange={(e) => onFiltersChange({ ...filters, actressId: e.target.value })}
                  className="w-full min-w-0 px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                >
                  <option value="">Semua Aktris</option>
                  {actresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!hideStudioFilter ? (
              <div className="min-w-0">
                <label htmlFor="esse-filter-studio" className="block text-xs font-medium text-[#F2ECEE]/80 mb-2">
                  Filter Studio
                </label>
                <select
                  id="esse-filter-studio"
                  value={filters.studioId}
                  onChange={(e) => onFiltersChange({ ...filters, studioId: e.target.value })}
                  className="w-full min-w-0 px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                >
                  <option value="">Semua Studio</option>
                  {studios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!hideTagFilter ? (
              <div className="min-w-0">
                <label htmlFor="esse-filter-tag" className="block text-xs font-medium text-[#F2ECEE]/80 mb-2">
                  Filter Tag
                </label>
                <select
                  id="esse-filter-tag"
                  value={filters.tagId}
                  onChange={(e) => onFiltersChange({ ...filters, tagId: e.target.value })}
                  className="w-full min-w-0 px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                >
                  <option value="">Semua Tag</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!hideSeriesFilter ? (
              <div className="min-w-0">
                <label htmlFor="esse-filter-series" className="block text-xs font-medium text-[#F2ECEE]/80 mb-2">
                  Filter Seri
                </label>
                <select
                  id="esse-filter-series"
                  value={filters.seriesId}
                  onChange={(e) => onFiltersChange({ ...filters, seriesId: e.target.value })}
                  className="w-full min-w-0 px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
                >
                  <option value="">Semua Seri</option>
                  {series.map((ser) => (
                    <option key={ser.id} value={ser.id}>
                      {ser.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="min-w-0">
              <label htmlFor="esse-sort-select" className="block text-xs font-medium text-[#F2ECEE]/80 mb-2">
                Urutkan
              </label>
              <select
                id="esse-sort-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="w-full min-w-0 px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] text-sm text-[#F2ECEE] focus:outline-none focus:border-[#D9C5A9]"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="code_asc">Kode A–Z</option>
                <option value="code_desc">Kode Z–A</option>
              </select>
            </div>
          </div>

          {active ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onFiltersChange(EMPTY_FILTERS);
                  onSortChange('newest');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            </div>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
