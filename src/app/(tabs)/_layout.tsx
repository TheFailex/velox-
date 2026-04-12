import { useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';

import DashboardScreen from './index';
import HistoryScreen from './history';
import StatsScreen from './stats';
import ProfileScreen from './profile';

import { useTabStore } from '@/store/tabStore';
import { registerTabGoTo, unregisterTabGoTo } from '@/services/tabNav';

const { width: W } = Dimensions.get('window');

const SCREENS = [DashboardScreen, HistoryScreen, StatsScreen, ProfileScreen];

// Lets child screens (e.g. stats) know which tab is active without prop drilling
export function useTabFocus() {
  return useTabStore((s) => s.activeTab);
}

export default function TabLayout() {
  const scrollRef = useRef<ScrollView>(null);
  const { activeTab, setActiveTab } = useTabStore();

  const goTo = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * W, animated: true });
    setActiveTab(idx);
  }, [setActiveTab]);

  // Register so GlobalTabBar (rendered in root _layout) can drive this ScrollView
  useEffect(() => {
    registerTabGoTo(goTo);
    return () => unregisterTabGoTo();
  }, [goTo]);

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
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setActiveTab(idx);
        }}
        style={styles.pager}
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
