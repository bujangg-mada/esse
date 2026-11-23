import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { useVaultStore } from './store/useVaultStore';
import { PinGatePage } from './pages/PinGatePage';
import { DashboardPage } from './pages/DashboardPage';
import { CollectionPage } from './pages/CollectionPage';
import { CodeDetailPage } from './pages/CodeDetailPage';
import { ActressesPage } from './pages/ActressesPage';
import { ActressDetailPage } from './pages/ActressDetailPage';
import { StudiosPage } from './pages/StudiosPage';
import { StudioDetailPage } from './pages/StudioDetailPage';
import { SeriesPage } from './pages/SeriesPage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import { TagsPage } from './pages/TagsPage';
import { TagDetailPage } from './pages/TagDetailPage';
import { SettingsPage } from './pages/SettingsPage';

function requireUnlocked() {
  if (!useVaultStore.getState().isUnlocked) {
    throw redirect({ to: '/' });
  }
}

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (useVaultStore.getState().isUnlocked) {
      throw redirect({ to: '/dasbor' });
    }
  },
  component: PinGatePage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dasbor',
  beforeLoad: requireUnlocked,
  component: DashboardPage,
});

const collectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/koleksi',
  beforeLoad: requireUnlocked,
  component: CollectionPage,
});

const codeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/koleksi/$codeId',
  beforeLoad: requireUnlocked,
  component: CodeDetailPage,
});

const actressesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/aktris',
  beforeLoad: requireUnlocked,
  component: ActressesPage,
});

const actressDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/aktris/$actressId',
  beforeLoad: requireUnlocked,
  component: ActressDetailPage,
});

const studiosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/studio',
  beforeLoad: requireUnlocked,
  component: StudiosPage,
});

const studioDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/studio/$studioId',
  beforeLoad: requireUnlocked,
  component: StudioDetailPage,
});

const seriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/seri',
  beforeLoad: requireUnlocked,
  component: SeriesPage,
});

const seriesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/seri/$seriesId',
  beforeLoad: requireUnlocked,
  component: SeriesDetailPage,
});

const tagsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tag',
  beforeLoad: requireUnlocked,
  component: TagsPage,
});

const tagDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tag/$tagId',
  beforeLoad: requireUnlocked,
  component: TagDetailPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pengaturan',
  beforeLoad: requireUnlocked,
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  collectionRoute,
  codeDetailRoute,
  actressesRoute,
  actressDetailRoute,
  studiosRoute,
  studioDetailRoute,
  seriesRoute,
  seriesDetailRoute,
  tagsRoute,
  tagDetailRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => {
    return (
      <div className="max-w-md mx-auto bg-[#561F2D] border border-[#702E3F] rounded-lg p-8 text-center">
        <p className="text-sm text-[#F2ECEE]">Halaman tidak ditemukan.</p>
      </div>
    );
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
