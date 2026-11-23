import { create } from 'zustand';

export interface SupabaseConnectionConfig {
  url: string;
  publishableKey: string;
}

function loadInitialSupabaseConfig(): SupabaseConnectionConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (envUrl && envKey) {
    return { url: envUrl, publishableKey: envKey };
  }
  return null;
}

interface VaultState {
  isUnlocked: boolean;
  pinHash: string | null;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  supabaseConfig: SupabaseConnectionConfig | null;
  unlockVault: (pinHash: string) => void;
  lockVault: () => void;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  isUnlocked: false,
  pinHash: null,
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  supabaseConfig: loadInitialSupabaseConfig(),
  unlockVault: (pinHash) => set({ isUnlocked: true, pinHash }),
  lockVault: () => set({ isUnlocked: false, pinHash: null, mobileDrawerOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
}));
