import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSegments, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTabStore } from '@/store/tabStore';
import { navigateToTab } from '@/services/tabNav';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { label: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { label: 'Dashboard', icon: 'speedometer-outline', activeIcon: 'speedometer' },
  { label: 'History',   icon: 'time-outline',        activeIcon: 'time' },
  { label: 'Stats',     icon: 'bar-chart-outline',   activeIcon: 'bar-chart' },
  { label: 'Profile',   icon: 'person-outline',      activeIcon: 'person' },
];

const BUBBLE_SPRING = { damping: 20, stiffness: 320, mass: 0.9 };
const PRESS_SPRING  = { damping: 14, stiffness: 420 };

function TabItem({
  tab,
  focused,
  onPress,
}: {
  tab: typeof TABS[number];
  focused: boolean;
  onPress: () => void;
}) {
  const bubbleScale   = useSharedValue(focused ? 1 : 0);
  const bubbleOpacity = useSharedValue(focused ? 1 : 0);
  const pressScale    = useSharedValue(1);

  useEffect(() => {
    bubbleScale.value   = withSpring(focused ? 1 : 0, BUBBLE_SPRING);
    bubbleOpacity.value = withSpring(focused ? 1 : 0, { damping: 22, stiffness: 350 });
  }, [focused]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: bubbleOpacity.value,
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Pressable
      style={styles.tabItem}
      onPressIn={() => { pressScale.value = withSpring(0.82, PRESS_SPRING); }}
      onPressOut={() => { pressScale.value = withSpring(1, PRESS_SPRING); }}
      onPress={onPress}
    >
      <Animated.View style={pressStyle}>
        {/* Inner content wrapper — bubble fills this exactly */}
        <View style={styles.tabInner}>
          <Animated.View style={[styles.activeBubble, bubbleStyle]} />
          <Ionicons
            name={focused ? tab.activeIcon : tab.icon}
            size={20}
            color={focused ? '#00C896' : 'rgba(180,175,200,0.4)'}
          />
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function GlobalTabBar() {
  const { activeTab, isTabBarVisible, setActiveTab, setPendingTab } = useTabStore();
  const segments = useSegments();

  if (!isTabBarVisible) return null;

  const handlePress = (idx: number) => {
    setActiveTab(idx);
    const inTabs = segments[0] === '(tabs)';
    if (inTabs) {
      navigateToTab(idx);
    } else {
      setPendingTab(idx);
      router.back();
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TabItem
            key={tab.label}
            tab={tab}
            focused={activeTab === idx}
            onPress={() => handlePress(idx)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  tabBar: {
    height: 62,
    borderRadius: 40,
    backgroundColor: 'rgba(18, 14, 28, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  // This view sizes the bubble — padding here = bubble breathing room
  tabInner: {
    alignItems: 'center',
    gap: 3,
    width: 82,
    paddingVertical: 6,
  },
  activeBubble: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 200, 150, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.18)',
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(180,175,200,0.4)',
  },
  tabLabelActive: {
    color: '#00C896',
  },
});
