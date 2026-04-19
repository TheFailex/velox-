import { useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, InteractionManager } from 'react-native';

import DashboardScreen from './index';
import HistoryScreen from './history';
import StatsScreen from './stats';
import ProfileScreen from './profile';

import { useTabStore } from '@/store/tabStore';
import { registerTabGoTo, unregisterTabGoTo } from '@/services/tabNav';

const { width: W } = Dimensions.get('window');

const SCREENS = [DashboardScreen, HistoryScreen, StatsScreen, ProfileScreen];

export function useTabFocus() {
  return useTabStore((s) => s.activeTab);
}

export default function TabLayout() {
  const scrollRef = useRef<ScrollView>(null);
  const { activeTab, setActiveTab, setActiveTabFromSwipe, pendingTab, setPendingTab } = useTabStore();

  // On every mount (which happens after router.replace('/(tabs)')), snap to dashboard.
  // This prevents the tab bar from showing a stale active index from a previous session.
  useEffect(() => {
    setActiveTab(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ref mirror so callbacks don't go stale
  const pendingTabRef = useRef(pendingTab);
  pendingTabRef.current = pendingTab;

  const goTo = useCallback((idx: number) => {
    // Instant reposition so the slide-up entrance animation is the primary visual cue
    scrollRef.current?.scrollTo({ x: idx * W, animated: false });
    setActiveTab(idx);
  }, [setActiveTab]);

  // Register so GlobalTabBar (rendered in root _layout) can drive this ScrollView
  useEffect(() => {
    registerTabGoTo(goTo);
    return () => unregisterTabGoTo();
  }, [goTo]);

  // Jump instantly (no animation) to avoid flash of wrong tab
  const flushPending = useCallback(() => {
    const pt = pendingTabRef.current;
    if (pt === null) return;
    scrollRef.current?.scrollTo({ x: pt * W, animated: false });
    setActiveTab(pt);
    setPendingTab(null);
  }, [setActiveTab, setPendingTab]);

  // Consume pendingTab set by GlobalTabBar when navigating from outside the tabs group.
  // InteractionManager.runAfterInteractions waits for all nav animations to finish,
  // ensuring the transition is complete and the ScrollView is ready to accept scrollTo.
  useEffect(() => {
    if (pendingTab !== null) {
      const task = InteractionManager.runAfterInteractions(flushPending);
      return () => task.cancel();
    }
  }, [pendingTab, flushPending]);

  // Fallback: if the ScrollView was not yet laid out when the effect fired, handle on layout
  const onScrollViewLayout = useCallback(() => {
    if (pendingTabRef.current !== null) {
      flushPending();
    }
  }, [flushPending]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        style={styles.pager}
        onLayout={onScrollViewLayout}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setActiveTabFromSwipe(idx);
        }}
      >
        {SCREENS.map((Screen, i) => (
          <View key={i} style={styles.page}>
            <Screen />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  pager: { flex: 1 },
  page: { width: W, flex: 1 },
});
