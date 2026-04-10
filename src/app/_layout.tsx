import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { initRevenueCat } from '@/services/revenuecat';

const queryClient = new QueryClient();

export const ONBOARDING_KEY = 'onboarding_complete';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Load onboarding flag once on mount
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === '1');
    });
  }, []);

  useEffect(() => {
    // Wait for both navigator and onboarding flag to be ready
    if (!navigationState?.key || onboardingDone === null) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      initRevenueCat(session?.user?.id);

      const inTabsGroup = segments[0] === '(tabs)';
      const inOnboarding = segments[0] === 'onboarding';

      if (session) {
        // Logged-in users always go to tabs
        if (!inTabsGroup) router.replace('/(tabs)');
      } else {
        // No session: send to onboarding only once (first launch)
        if (!onboardingDone && !inOnboarding) router.replace('/onboarding');
      }
    });
  }, [navigationState?.key, onboardingDone]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
