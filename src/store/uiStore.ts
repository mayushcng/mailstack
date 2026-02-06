// =============================================================================
// UI Store - General UI state
// =============================================================================

import { create } from 'zustand';

interface UIState {
    sidebarCollapsed: boolean;
    mobileMenuOpen: boolean;

    // Actions
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    mobileMenuOpen: false,

    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));
