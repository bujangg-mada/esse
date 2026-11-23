import { type ReactNode } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  Library,
  Lock,
  Menu,
  Settings,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore';
import { notify } from '../lib/toast';

const NAV_ITEMS = [
  { to: '/dasbor', label: 'Dasbor', icon: LayoutDashboard },
  { to: '/koleksi', label: 'Koleksi', icon: Library },
  { to: '/aktris', label: 'Aktris', icon: Users },
  { to: '/studio', label: 'Studio', icon: Building2 },
  { to: '/seri', label: 'Seri', icon: FolderKanban },
  { to: '/tag', label: 'Tag', icon: Tag },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const lockVault = useVaultStore((s) => s.lockVault);
  const sidebarCollapsed = useVaultStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useVaultStore((s) => s.toggleSidebar);
  const mobileDrawerOpen = useVaultStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useVaultStore((s) => s.setMobileDrawerOpen);

  const handleLock = () => {
    lockVault();
    notify.success('ESSE dikunci');
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-[#4A1925] text-[#F2ECEE] flex flex-col">
      {/* Top Bar: Hanya logo "ESSE" (Cinzel) di paling kiri, dan HANYA tombol Kunci di desktop / ikon hamburger di kanan untuk mobile */}
      <header className="sticky top-0 z-30 h-16 px-4 md:px-6 bg-[#4A1925] border-b border-[#702E3F] flex items-center justify-between gap-8">
        <Link
          to={isUnlocked ? '/dasbor' : '/'}
          className="font-logo text-2xl font-bold tracking-widest text-[#F2ECEE] whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9C5A9] rounded"
        >
          ESSE
        </Link>

        {/* Desktop: hanya tombol Kunci saat sudah terbuka */}
        {isUnlocked ? (
          <div className="hidden md:flex items-center shrink-0">
            <button
              type="button"
              onClick={handleLock}
              aria-label="Kunci ESSE"
              title="Kunci ESSE"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        {/* Mobile: hanya ikon hamburger di sebelah paling kanan saat sudah terbuka */}
        {isUnlocked ? (
          <div className="flex md:hidden items-center shrink-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={mobileDrawerOpen}
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Expandable/Collapsible Sidebar */}
        {isUnlocked ? (
          <aside
            aria-label="Navigasi utama"
            className={`hidden md:flex flex-col shrink-0 border-r border-[#702E3F] bg-[#4A1925] transition-[width] duration-200 ${
              sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
            }`}
          >
            <div className="p-4 flex justify-end">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
                aria-expanded={!sidebarCollapsed}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            <nav className="flex-1 px-2 pb-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={`flex items-center gap-4 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#D9C5A9] text-[#2B0D14]'
                        : 'text-[#F2ECEE]/85 hover:bg-[#561F2D] hover:text-[#F2ECEE]'
                    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed ? <span>{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </aside>
        ) : null}

        {/* Mobile Right-Side Drawer */}
        <AnimatePresence>
          {isUnlocked && mobileDrawerOpen ? (
            <div className="fixed inset-0 z-50 md:hidden flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 bg-[#2B0D14]/75"
                aria-hidden="true"
              />

              <motion.aside
                aria-label="Menu navigasi seluler"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-72 max-w-[85vw] h-full bg-[#4A1925] border-l border-[#702E3F] flex flex-col justify-between p-4"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#702E3F]">
                    <span className="font-logo text-xl font-bold tracking-widest text-[#F2ECEE]">
                      ESSE
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileDrawerOpen(false)}
                      aria-label="Tutup menu navigasi"
                      className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-2">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.to || pathname.startsWith(`${item.to}/`);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center gap-4 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#D9C5A9] text-[#2B0D14]'
                              : 'text-[#F2ECEE]/90 hover:bg-[#561F2D]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-[#702E3F]">
                  <button
                    type="button"
                    onClick={handleLock}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-[#5B2230] text-[#F2ECEE] border border-[#7D3648] hover:bg-[#6B2A3A] hover:border-[#9C495E] transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Kunci ESSE</span>
                  </button>
                </div>
              </motion.aside>
            </div>
          ) : null}
        </AnimatePresence>

        <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
