import { useEffect, useRef } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTabStore } from '@/store/tabStore';

export function useTabEntrance(tabIndex: number) {
  const activeTab = useTabStore((s) => s.activeTab);
  const lastChangeSource = useTabStore((s) => s.lastChangeSource);
  const translateY = useSharedValue(0);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (activeTab === tabIndex && lastChangeSource === 'tap') {
      translateY.value = 55;
      translateY.value = withSpring(0, { damping: 22, stiffness: 280, mass: 0.8 });
    }
  }, [activeTab, tabIndex, lastChangeSource]);

  return useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateY: translateY.value }],
  }));
}
