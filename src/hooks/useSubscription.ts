import { useState, useEffect } from 'react';
import { checkPremium } from '@/services/revenuecat';
import { router } from 'expo-router';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremium()
      .then(setIsPremium)
      .catch(() => setIsPremium(false))
      .finally(() => setLoading(false));
  }, []);

  const openPaywall = () => router.push('/paywall');

  return { isPremium, loading, openPaywall };
}
