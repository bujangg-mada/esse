import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Building2,
  ExternalLink,
  FolderKanban,
  Library,
  Plus,
  Settings,
  Tag,
  Users,
} from 'lucide-react';
import { useVaultRecordsQuery } from '../hooks/useVaultQueries';
import { getLatestCodes } from '../lib/queryFilter';
import { isValidHttpUrl } from '../lib/schemas';
import { CodeFormModal } from '../components/CodeFormModal';
import { MediaThumbnail } from '../components/MediaThumbnail';

export function DashboardPage() {
  const { data, isLoading } = useVaultRecordsQuery();
  const [formOpen, setFormOpen] = useState(false);

  const codes = data?.codes ?? [];
  const actresses = data?.actresses ?? [];
  const studios = data?.studios ?? [];
  const series = data?.series ?? [];
  const tags = data?.tags ?? [];
  const latestFive = getLatestCodes(codes, 5);

  const navCards = [
    { to: '/koleksi', label: 'Koleksi', count: codes.length, icon: Library },
    { to: '/aktris', label: 'Aktris', count: actresses.length, icon: Users },
    { to: '/studio', label: 'Studio', count: studios.length, icon: Building2 },
    { to: '/seri', label: 'Seri', count: series.length, icon: FolderKanban },
    { to: '/tag', label: 'Tag', count: tags.length, icon: Tag },
    { to: '/pengaturan', label: 'Pengaturan', count: null, icon: Settings },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#F2ECEE] truncate min-w-0">Dasbor</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Tambah Kode"
          title="Tambah Kode"
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[40px] min-w-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tambah Kode</span>
        </button>
      </div>

      {/* Navigasi */}
      <section aria-label="Navigasi cepat" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {navCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="bg-[#561F2D] border border-[#702E3F] hover:bg-[#622534] transition-colors rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 min-w-0"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <Icon className="w-4 h-4 text-[#D9C5A9] shrink-0" />
                <span className="text-sm font-medium text-[#F2ECEE] truncate">{item.label}</span>
              </div>
              {item.count !== null ? (
                <span className="text-sm font-semibold text-[#D9C5A9] tabular-nums shrink-0">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </section>

      {/* 5 Riwayat Data Baru Ditambahkan */}
      <section aria-label="5 Riwayat Terbaru" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#F2ECEE]">5 Riwayat Terbaru</h2>
          <Link
            to="/koleksi"
            className="text-xs font-medium text-[#D9C5A9] hover:underline whitespace-nowrap"
          >
            Lihat Semua
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-20 rounded-lg bg-[#561F2D] border border-[#702E3F] animate-pulse"
              />
            ))}
          </div>
        ) : latestFive.length === 0 ? (
          <div className="bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center space-y-4">
            <p className="text-sm text-[#F2ECEE]/75">Belum ada data ditambahkan.</p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kode Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {latestFive.map((item) => {
              const actressText =
                item.actresses.length > 0
                  ? item.actresses.map((a) => a.name).join(' · ')
                  : 'Tanpa Aktris';
              const safeHref = isValidHttpUrl(item.url) ? item.url : '#';
              const dateLabel = new Date(item.created_at).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className="bg-[#561F2D] border border-[#702E3F] hover:bg-[#622534] transition-colors rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-w-0"
                >
                  <Link
                    to="/koleksi/$codeId"
                    params={{ codeId: item.id }}
                    className="w-24 sm:w-32 shrink-0 rounded overflow-hidden border border-[#702E3F]"
                  >
                    <MediaThumbnail
                      src={item.thumbnail_url}
                      alt={`Thumbnail ${item.code}`}
                      label={item.code}
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                    <Link
                      to="/koleksi/$codeId"
                      params={{ codeId: item.id }}
                      className="text-sm sm:text-base font-semibold text-[#F2ECEE] hover:underline block truncate tabular-nums"
                    >
                      {item.code}
                    </Link>
                    <p className="text-xs text-[#F2ECEE]/80 truncate">
                      {actressText}
                      {item.studio ? ` · ${item.studio.name}` : ''}
                    </p>
                    <p className="text-xs text-[#F2ECEE]/55 tabular-nums">{dateLabel}</p>
                  </div>

                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buka URL ${item.code}`}
                    title={`Buka URL ${item.code}`}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 min-h-[38px] min-w-[38px] sm:min-h-[40px] rounded-lg text-xs font-medium bg-[#D9C5A9] text-[#2B0D14] hover:bg-[#C5AF91] transition-colors whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <CodeFormModal
        open={formOpen}
        actresses={actresses}
        studios={studios}
        tags={tags}
        seriesList={series}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
