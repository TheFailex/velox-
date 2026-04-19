import { create } from 'zustand';

interface SubscriptionStore {
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  isPremium: false,
  setIsPremium: (v) => set({ isPremium: v }),
}));
