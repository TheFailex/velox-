import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { checkPremium } from '@/services/revenuecat';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export function useSubscription() {
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const setIsPremium = useSubscriptionStore((s) => s.setIsPremium);

  useEffect(() => {
    // Initial check
    checkPremium().then(setIsPremium).catch(() => setIsPremium(false));

    // Re-validate whenever the app comes back to the foreground —
    // catches subscription purchases made outside the app and expired subs
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        checkPremium().then(setIsPremium).catch(() => {});
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openPaywall = () => router.push('/paywall');

  return { isPremium, openPaywall };
}
