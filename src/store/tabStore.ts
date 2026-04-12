import { create } from 'zustand';

interface TabStore {
  activeTab: number;
  isTabBarVisible: boolean;
  setActiveTab: (idx: number) => void;
  setTabBarVisible: (v: boolean) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  activeTab: 0,
  // Hidden until the user is authenticated (root layout enables it)
  isTabBarVisible: false,
  setActiveTab: (idx) => set({ activeTab: idx }),
  setTabBarVisible: (v) => set({ isTabBarVisible: v }),
}));
