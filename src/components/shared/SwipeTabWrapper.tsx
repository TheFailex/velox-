import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const TAB_ROUTES = [
  '/(tabs)/',
  '/(tabs)/history',
  '/(tabs)/stats',
  '/(tabs)/profile',
] as const;

type TabRoute = (typeof TAB_ROUTES)[number];

interface Props {
  currentIndex: number;
  children: React.ReactNode;
}

export function SwipeTabWrapper({ currentIndex, children }: Props) {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const navigate = (route: TabRoute) => {
    router.navigate(route as string);
  };

  const swipe = Gesture.Pan()
    // Activate on clearly horizontal intent
    .activeOffsetX([-20, 20])
    // Tolerate small vertical drift during a horizontal swipe
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      // Subtle rubber-band drag feedback (15% of real movement)
      translateX.value = e.translationX * 0.15;
    })
    .onEnd((e) => {
      // Trigger on a fast flick OR a long drag
      const isLeft =
        e.velocityX < -500 || (e.translationX < -50 && e.velocityX < -50);
      const isRight =
        e.velocityX > 500 || (e.translationX > 50 && e.velocityX > 50);

      if (isLeft && currentIndex < TAB_ROUTES.length - 1) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        runOnJS(navigate)(TAB_ROUTES[currentIndex + 1]);
      } else if (isRight && currentIndex > 0) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        runOnJS(navigate)(TAB_ROUTES[currentIndex - 1]);
      } else {
        // Snap back if threshold not met
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={swipe}>
      <Animated.View style={[styles.fill, animStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
