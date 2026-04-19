import { create } from 'zustand';

interface TabStore {
  activeTab: number;
  lastChangeSource: 'tap' | 'swipe';
  isTabBarVisible: boolean;
  pendingTab: number | null;
  setActiveTab: (idx: number) => void;
  setActiveTabFromSwipe: (idx: number) => void;
  setTabBarVisible: (v: boolean) => void;
  setPendingTab: (idx: number | null) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  activeTab: 0,
  lastChangeSource: 'tap',
  isTabBarVisible: false,
  pendingTab: null,
  setActiveTab: (idx) => set({ activeTab: idx, lastChangeSource: 'tap' }),
  setActiveTabFromSwipe: (idx) => set({ activeTab: idx, lastChangeSource: 'swipe' }),
  setTabBarVisible: (v) => set({ isTabBarVisible: v }),
  setPendingTab: (idx) => set({ pendingTab: idx }),
}));
