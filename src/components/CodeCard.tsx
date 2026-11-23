import { Link, useNavigate } from '@tanstack/react-router';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { CodeWithRelations } from '../types/esse';
import { isValidHttpUrl } from '../lib/schemas';
import { MediaThumbnail } from './MediaThumbnail';

interface CodeCardProps {
  item: CodeWithRelations;
  onEdit: (item: CodeWithRelations) => void;
  onDelete: (item: CodeWithRelations) => void;
}

export function CodeCard({ item, onEdit, onDelete }: CodeCardProps) {
  const navigate = useNavigate();
  const actressNames =
    item.actresses.length > 0 ? item.actresses.map((a) => a.name).join(' · ') : 'Tanpa Aktris';
  const studioName = item.studio?.name ?? 'Tanpa Studio';
  const safeHref = isValidHttpUrl(item.url) ? item.url : '#';

  const openDetail = () => {
    navigate({ to: '/koleksi/$codeId', params: { codeId: item.id } });
  };

  return (
    <article
      className="group bg-[#561F2D] border border-[#702E3F] hover:bg-[#622534] transition-colors duration-150 rounded-lg overflow-hidden flex flex-col"
    >
      <Link
        to="/koleksi/$codeId"
        params={{ codeId: item.id }}
        aria-label={`Lihat detail ${item.code}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C5A9]"
      >
        <MediaThumbnail src={item.thumbnail_url} alt={`Thumbnail ${item.code}`} label={item.code} />
      </Link>

      <div
        onClick={openDetail}
        className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3 sm:gap-4 cursor-pointer min-w-0"
      >
        <div className="space-y-1.5 sm:space-y-2 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-[#F2ECEE] truncate tabular-nums">
            <Link
              to="/koleksi/$codeId"
              params={{ codeId: item.id }}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {item.code}
            </Link>
          </h3>

          <div className="text-xs text-[#F2ECEE]/80 space-y-1 sm:space-y-2 min-w-0">
            <p className="truncate" title={actressNames}>
              {actressNames}
            </p>
            <p className="truncate text-[#F2ECEE]/65" title={studioName}>
              {studioName}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-[#702E3F] min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka URL ${item.code}`}
            title={`Buka URL ${item.code}`}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-2 py-2 min-h-[36px] sm:min-h-[40px] rounded-lg text-xs font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Buka</span>
          </a>

          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.code}`}
            title={`Edit ${item.code}`}
            className="inline-flex items-center justify-center px-2 py-2 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Hapus ${item.code}`}
            title={`Hapus ${item.code}`}
            className="inline-flex items-center justify-center px-2 py-2 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] rounded-lg text-xs font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#5E1B1E] hover:border-[#963538] hover:text-[#F0A8AA] transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
