import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { initRevenueCat } from '@/services/revenuecat';
import { useTabStore } from '@/store/tabStore';
import { GlobalTabBar } from '@/components/shared/GlobalTabBar';

const queryClient = new QueryClient();

export const ONBOARDING_KEY = 'onboarding_complete';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const setTabBarVisible = useTabStore((s) => s.setTabBarVisible);

  // Handle OAuth deep link — implicit flow: velox://auth/callback#access_token=XXX&refresh_token=YYY
  // Routing is done here directly so it's not subject to timing races with auth/callback.tsx.
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (!url.startsWith('velox://')) return;

      const hash = url.split('#')[1];
      if (!hash) return;
      const params = Object.fromEntries(new URLSearchParams(hash));
      if (!params.access_token || !params.refresh_token) return;

      const { data: { session } } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (!session) return;

      // Route immediately — avoids depending on auth/callback.tsx mounting in time
      const userKey = `${ONBOARDING_KEY}_${session.user.id}`;
      const userDone = await AsyncStorage.getItem(userKey);
      if (userDone === '1') {
        router.replace('/(tabs)');
      } else {
        await AsyncStorage.setItem('onboarding_resume_step', '2');
        router.replace('/onboarding');
      }
    };

    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to auth state — reacts to sign-in AND sign-out in real time
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && s?.user?.id) {
        initRevenueCat(s.user.id);
      }
      if (event === 'SIGNED_OUT') {
        // Stop background GPS task and clear trip state so no data leaks to the next session
        const { locationService } = await import('@/services/location');
        const { useTripStore } = await import('@/store/tripStore');
        await locationService.stopTracking().catch(() => {});
        useTripStore.getState().resetTrip();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Tab bar visibility: show when logged in, hide during onboarding / paywall
  useEffect(() => {
    if (session === undefined) return;
    const isAuthFlow = segments[0] === 'onboarding' || segments[0] === 'paywall' || segments[0] === 'exit-offer';
    setTabBarVisible(!!session && !isAuthFlow);
  }, [session, segments]);

  // Nav guard
  useEffect(() => {
    if (!navigationState?.key || session === undefined) return;
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inExitOffer = segments[0] === 'exit-offer';
    const inAuthCallback = segments[0] === 'auth';

    if (session) {
      const checkOnboarding = async () => {
        const userKey = `${ONBOARDING_KEY}_${session.user.id}`;
        const userDone = await AsyncStorage.getItem(userKey);

        if (!userDone && !inOnboarding && !inPaywall && !inExitOffer && !inAuthCallback) {
          router.replace('/onboarding');
        } else if (!inTabsGroup && !inOnboarding && !inPaywall && !inExitOffer && !inAuthCallback) {
          router.replace('/(tabs)');
        }
      };
      checkOnboarding();
    } else {
      if (!inOnboarding) router.replace('/onboarding');
    }
  }, [navigationState?.key, session]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            {/* GlobalTabBar is absolutely positioned — renders on top of every screen */}
            <GlobalTabBar />
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
