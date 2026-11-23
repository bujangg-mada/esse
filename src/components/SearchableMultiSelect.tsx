import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableMultiSelectProps {
  id: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  onQuickCreate?: (name: string) => Promise<string | void>;
  quickCreateLabel?: string;
}

export function filterSelectableOptions(
  options: MultiSelectOption[],
  query: string
): MultiSelectOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false)
  );
}

export function SearchableMultiSelect({
  id,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  options,
  selectedIds,
  onChange,
  onQuickCreate,
  quickCreateLabel = 'Tambah',
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((opt) => [opt.id, opt]));
    return selectedIds
      .map((itemId) => map.get(itemId))
      .filter((item): item is MultiSelectOption => Boolean(item));
  }, [options, selectedIds]);

  const filteredOptions = useMemo(
    () => filterSelectableOptions(options, search),
    [options, search]
  );

  const trimmedSearch = search.trim();
  const hasExactMatch = useMemo(
    () =>
      trimmedSearch.length > 0 &&
      options.some((opt) => opt.label.toLowerCase() === trimmedSearch.toLowerCase()),
    [options, trimmedSearch]
  );

  const toggleItem = (targetId: string) => {
    if (selectedIds.includes(targetId)) {
      onChange(selectedIds.filter((item) => item !== targetId));
    } else {
      onChange([...selectedIds, targetId]);
    }
  };

  const handleQuickCreate = async () => {
    if (!onQuickCreate || !trimmedSearch || creating) return;
    try {
      setCreating(true);
      const createdId = await onQuickCreate(trimmedSearch);
      if (createdId && !selectedIds.includes(createdId)) {
        onChange([...selectedIds, createdId]);
      }
      setSearch('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 min-w-0">
      <div className="relative min-w-0">
        <button
          id={id}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-[#38111B] border border-[#6E2D3D] hover:border-[#9C495E] focus:outline-none focus:border-[#D9C5A9] text-sm text-left transition-colors min-w-0"
        >
          <span
            className={`flex-1 min-w-0 truncate ${
              selectedOptions.length > 0 ? 'text-[#F2ECEE]' : 'text-[#F2ECEE]/45'
            }`}
          >
            {selectedOptions.length > 0
              ? selectedOptions.map((o) => o.label).join(', ')
              : placeholder}
          </span>

          <span className="flex items-center gap-2 shrink-0">
            {selectedOptions.length > 0 ? (
              <span className="text-xs font-medium text-[#D9C5A9] tabular-nums">
                {selectedOptions.length}
              </span>
            ) : null}
            <ChevronDown
              className={`w-4 h-4 text-[#F2ECEE]/65 transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-lg bg-[#38111B] border border-[#9C495E] overflow-hidden">
            <div className="p-2 border-b border-[#6E2D3D]/70 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#F2ECEE]/55 shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onQuickCreate && trimmedSearch && !hasExactMatch) {
                    e.preventDefault();
                    void handleQuickCreate();
                  } else if (e.key === 'Escape') {
                    e.stopPropagation();
                    setOpen(false);
                  }
                }}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-[#F2ECEE] placeholder:text-[#F2ECEE]/45 focus:outline-none"
              />
            </div>

            <div
              role="listbox"
              aria-multiselectable="true"
              className="max-h-44 overflow-y-auto divide-y divide-[#6E2D3D]/35"
            >
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-3 text-xs text-[#F2ECEE]/60 text-center">
                  {emptyMessage}
                </p>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleItem(opt.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-left transition-colors min-w-0 ${
                        isSelected
                          ? 'bg-[#561F2D] text-[#F2ECEE]'
                          : 'text-[#F2ECEE]/85 hover:bg-[#5B2230]/70'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#D9C5A9] border-[#D9C5A9] text-[#2B0D14]'
                            : 'border-[#7D3648] bg-transparent'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : null}
                      </span>
                      <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                      {opt.sublabel ? (
                        <span className="text-xs text-[#F2ECEE]/55 shrink-0 tabular-nums">
                          {opt.sublabel}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {onQuickCreate && trimmedSearch && !hasExactMatch ? (
              <div className="p-2 border-t border-[#6E2D3D]/70">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void handleQuickCreate()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors min-w-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {creating ? 'Menambahkan...' : `${quickCreateLabel} "${trimmedSearch}"`}
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#5B2230] border border-[#7D3648] text-xs text-[#F2ECEE] max-w-full min-w-0"
            >
              <span className="truncate">{opt.label}</span>
              <button
                type="button"
                onClick={() => toggleItem(opt.id)}
                aria-label={`Hapus pilihan ${opt.label}`}
                className="text-[#F2ECEE]/70 hover:text-[#F2ECEE] shrink-0 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
