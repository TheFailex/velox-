import { useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue, withSpring, withDelay, useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const PACKAGE_ID = 'com.failex.velox';
export const RATING_KEY = 'rating_status'; // undefined | 'later' | 'done'

export async function shouldShowRating(): Promise<boolean> {
  const s = await AsyncStorage.getItem(RATING_KEY);
  return s !== 'done';
}

// ─── Star component ───────────────────────────────────────────────────────────

function Star({ filled, onPress, delayMs }: {
  filled: boolean;
  onPress: () => void;
  delayMs: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withDelay(
      delayMs,
      withSpring(1.5, { damping: 7, stiffness: 400 }, () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      })
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View style={animStyle}>
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={44}
          color={filled ? '#F0A500' : '#3A3A4A'}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RatingModal({ visible, onClose }: RatingModalProps) {
  const [selectedStar, setSelectedStar] = useState<number | null>(null);

  const handleStarPress = async (index: number) => {
    setSelectedStar(index);
    await AsyncStorage.setItem(RATING_KEY, 'done');
    // Small delay so the star animation plays before the app goes to background
    setTimeout(async () => {
      try {
        await Linking.openURL(`market://details?id=${PACKAGE_ID}`);
      } catch {
        await Linking.openURL(`https://play.google.com/store/apps/details?id=${PACKAGE_ID}`);
      }
      onClose();
    }, 500);
  };

  const handleLater = async () => {
    await AsyncStorage.setItem(RATING_KEY, 'later');
    setSelectedStar(null);
    onClose();
  };

  const handleNoThanks = async () => {
    await AsyncStorage.setItem(RATING_KEY, 'done');
    setSelectedStar(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleLater}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🏎️</Text>
          </View>

          {/* Copy */}
          <Text style={styles.title}>Enjoying Velox?</Text>
          <Text style={styles.subtitle}>
            Take 10 seconds to rate us — it helps other drivers find the app.
          </Text>

          {/* Stars */}
          <View style={styles.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                filled={selectedStar !== null && i <= selectedStar}
                onPress={() => handleStarPress(i)}
                delayMs={i * 60}
              />
            ))}
          </View>

          {/* Actions */}
          <Pressable style={styles.laterBtn} onPress={handleLater}>
            <Text style={styles.laterText}>Remind me later</Text>
          </Pressable>

          <Pressable onPress={handleNoThanks} hitSlop={8}>
            <Text style={styles.noThanks}>No thanks</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  card: {
    width: '100%',
    backgroundColor: '#14141C',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,200,150,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 38 },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8E8EA0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },

  stars: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  laterBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  laterText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  noThanks: {
    color: '#3A3A4A',
    fontSize: 13,
    paddingVertical: 4,
  },
});
