import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTabStore } from '@/store/tabStore';
import { navigateToTab } from '@/services/tabNav';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { label: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { label: 'Dashboard', icon: 'speedometer-outline', activeIcon: 'speedometer' },
  { label: 'History',   icon: 'time-outline',        activeIcon: 'time' },
  { label: 'Stats',     icon: 'bar-chart-outline',   activeIcon: 'bar-chart' },
  { label: 'Profile',   icon: 'person-outline',      activeIcon: 'person' },
];

export function GlobalTabBar() {
  const { activeTab, isTabBarVisible, setActiveTab } = useTabStore();

  if (!isTabBarVisible) return null;

  const handlePress = (idx: number) => {
    setActiveTab(idx);
    navigateToTab(idx);
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => {
          const focused = activeTab === idx;
          return (
            <Pressable
              key={tab.label}
              onPress={() => handlePress(idx)}
              style={styles.tabItem}
              hitSlop={4}
            >
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={22}
                color={focused ? '#00C896' : 'rgba(180,175,200,0.45)'}
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
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
    // pointerEvents box-none lets touches pass through the empty space around the pill
  },
  tabBar: {
    height: 72,
    borderRadius: 40,
    backgroundColor: 'rgba(18, 14, 28, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    gap: 3,
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(180,175,200,0.45)',
  },
  tabLabelActive: {
    color: '#00C896',
  },
});
