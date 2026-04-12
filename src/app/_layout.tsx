import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
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

  // Handle OAuth deep link: velox://auth/callback#access_token=...&refresh_token=...
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (!url.startsWith('velox://')) return;
      const hash = url.split('#')[1];
      if (!hash) return;
      const params = Object.fromEntries(new URLSearchParams(hash));
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    };

    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // Subscribe to auth state — reacts to sign-in AND sign-out in real time
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN') initRevenueCat(s?.user?.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Tab bar visibility: show when logged in, hide during onboarding / paywall
  useEffect(() => {
    if (session === undefined) return;
    const isAuthFlow = segments[0] === 'onboarding' || segments[0] === 'paywall';
    setTabBarVisible(!!session && !isAuthFlow);
  }, [session, segments]);

  // Nav guard
  useEffect(() => {
    if (!navigationState?.key || session === undefined) return;
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    if (session) {
      if (!inTabsGroup && !inOnboarding) router.replace('/(tabs)');
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
