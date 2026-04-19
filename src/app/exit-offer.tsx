import { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useTabStore } from '@/store/tabStore';

// ─── Plan data ────────────────────────────────────────────────────────────────

interface PlanInfo {
  id: string;
  type: PACKAGE_TYPE;
  label: string;
  fallbackOriginal: string;
  fallbackDiscounted: string;
}

const EXIT_PLANS: PlanInfo[] = [
  {
    id: 'velox_annual',
    type: PACKAGE_TYPE.ANNUAL,
    label: 'Annual',
    fallbackOriginal: '€29.99/year',
    fallbackDiscounted: '€23.99/year',
  },
  {
    id: 'velox_monthly',
    type: PACKAGE_TYPE.MONTHLY,
    label: 'Monthly',
    fallbackOriginal: '€2.49/month',
    fallbackDiscounted: '€1.99/month',
  },
];

function getOriginalPrice(pkg: PurchasesPackage | undefined, plan: PlanInfo): string {
  if (!pkg) return plan.fallbackOriginal;
  const period = plan.type === PACKAGE_TYPE.ANNUAL ? '/year' : '/month';
  const intro = (pkg.product as any).introPrice;
  if (intro?.priceString) {
    // introPrice exists → priceString is the base (non-discounted) plan price
    return `${pkg.product.priceString}${period}`;
  }
  // No introPrice → the product itself IS the promo price; compute the original (÷0.8)
  const original = (pkg.product.price / 0.8).toFixed(2);
  return `${pkg.product.currencyCode} ${original}${period}`;
}

function getDiscountedPrice(pkg: PurchasesPackage | undefined, plan: PlanInfo): string {
  if (!pkg) return plan.fallbackDiscounted;
  const period = plan.type === PACKAGE_TYPE.ANNUAL ? '/year' : '/month';
  const intro = (pkg.product as any).introPrice;
  if (intro?.priceString) {
    // introPrice exists → that is the promotional price
    return `${intro.priceString}${period}`;
  }
  // No introPrice → priceString IS the discounted price (the exit-offer product price)
  return `${pkg.product.priceString}${period}`;
}

// ─── Animation timings ────────────────────────────────────────────────────────
// Sequence: badge → headline → plans (staggered) → CTA
// Total reveal: ~1 second, giving drama to the discount

const EASE_OUT = Easing.out(Easing.cubic);
const T_BADGE = 350;      // badge fade+scale
const T_HEADLINE = 400;   // headline slide up
const T_PLANS = 380;      // each plan card slide up
const PLAN_STAGGER = 120; // delay between cards
const T_DISCOUNT = 600;   // discount badge scale pulse

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExitOfferScreen() {
  const [packages, setPackages] = useState<Map<string, PurchasesPackage>>(new Map());
  const [purchasing, setPurchasing] = useState(false);

  // Badge
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.6);
  // Headline
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(18);
  // Plan cards
  const card0Opacity = useSharedValue(0);
  const card0Y = useSharedValue(24);
  const card1Opacity = useSharedValue(0);
  const card1Y = useSharedValue(24);
  // Discount badge scale pulse
  const discountScale = useSharedValue(1);
  // CTA button
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(12);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));
  const card0Style = useAnimatedStyle(() => ({
    opacity: card0Opacity.value,
    transform: [{ translateY: card0Y.value }],
  }));
  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const discountBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: discountScale.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  useEffect(() => {
    AsyncStorage.setItem('exit_offer_shown', '1');

    Purchases.getOfferings()
      .then((offerings) => {
        const current = offerings.all['exit_offer_v1'] ?? offerings.current;
        if (!current) return;
        const map = new Map<string, PurchasesPackage>();
        for (const pkg of current.availablePackages) {
          if (pkg.packageType === PACKAGE_TYPE.MONTHLY) map.set('velox_monthly', pkg);
          else if (pkg.packageType === PACKAGE_TYPE.ANNUAL) map.set('velox_annual', pkg);
        }
        setPackages(map);
      })
      .catch(() => {/* fallback prices shown */});

    // ── Staggered entrance animation ──────────────────────────────────────
    // t=0: badge
    badgeOpacity.value = withTiming(1, { duration: T_BADGE, easing: EASE_OUT });
    badgeScale.value = withSpring(1, { damping: 14, stiffness: 280, mass: 0.9 });

    // t=150: headline slides up
    headlineOpacity.value = withDelay(150, withTiming(1, { duration: T_HEADLINE, easing: EASE_OUT }));
    headlineY.value = withDelay(150, withTiming(0, { duration: T_HEADLINE, easing: EASE_OUT }));

    // t=350: card 0 slides up
    card0Opacity.value = withDelay(350, withTiming(1, { duration: T_PLANS, easing: EASE_OUT }));
    card0Y.value = withDelay(350, withTiming(0, { duration: T_PLANS, easing: EASE_OUT }));

    // t=350+stagger: card 1 slides up
    const c1Delay = 350 + PLAN_STAGGER;
    card1Opacity.value = withDelay(c1Delay, withTiming(1, { duration: T_PLANS, easing: EASE_OUT }));
    card1Y.value = withDelay(c1Delay, withTiming(0, { duration: T_PLANS, easing: EASE_OUT }));

    // t=600: discount badge pulses (scale up, then settle) — the "wow" moment
    discountScale.value = withDelay(
      600,
      withSequence(
        withSpring(1.35, { damping: 8, stiffness: 320, mass: 0.7 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      )
    );

    // t=700: CTA button slides up
    ctaOpacity.value = withDelay(700, withTiming(1, { duration: 380, easing: EASE_OUT }));
    ctaY.value = withDelay(700, withTiming(0, { duration: 380, easing: EASE_OUT }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePurchase = async (planId: string) => {
    const pkg = packages.get(planId);
    if (!pkg) {
      Alert.alert('Not available', 'In-app purchases are not configured yet.');
      return;
    }
    setPurchasing(true);
    try {
      const result = await Purchases.purchasePackage(pkg);
      const active = result.customerInfo.entitlements.active['velox_premium_v2'] !== undefined;
      useSubscriptionStore.getState().setIsPremium(active);
      useTabStore.getState().setPendingTab(0);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleFree = () => {
    useTabStore.getState().setPendingTab(0);
    router.replace('/(tabs)');
  };

  const planCardStyles = [card0Style, card1Style];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Badge */}
        <Animated.View style={[styles.badgeRow, badgeStyle]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EXCLUSIVE OFFER</Text>
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.View style={headlineStyle}>
          <Text style={styles.title}>Wait — one last thing</Text>
          <Text style={styles.subtitle}>
            Get <Text style={styles.accent}>20% off</Text> your first subscription.{'\n'}
            This offer won't appear again.
          </Text>
        </Animated.View>

        {/* Discounted plan cards */}
        <View style={styles.plans}>
          {EXIT_PLANS.map((plan, idx) => {
            const pkg = packages.get(plan.id);
            const originalPrice = getOriginalPrice(pkg, plan);
            const discountedPrice = getDiscountedPrice(pkg, plan);
            return (
              <Animated.View key={plan.id} style={planCardStyles[idx]}>
                <Pressable
                  onPress={() => !purchasing && handlePurchase(plan.id)}
                  style={[styles.planCard, plan.id === 'velox_annual' && styles.planCardHighlight]}
                  disabled={purchasing}
                >
                  <View>
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    <Text style={styles.planOriginal}>{originalPrice}</Text>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={styles.planDiscounted}>{discountedPrice}</Text>
                    <Animated.View style={[styles.discountBadge, discountBadgeStyle]}>
                      <Text style={styles.discountBadgeText}>-20%</Text>
                    </Animated.View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, ctaStyle]}>
        <Pressable
          style={[styles.ctaBtn, purchasing && styles.ctaDisabled]}
          onPress={() => !purchasing && handlePurchase('velox_annual')}
          disabled={purchasing}
        >
          {purchasing
            ? <ActivityIndicator color="#0A0A0F" />
            : <Text style={styles.ctaText}>Get 20% off</Text>
          }
        </Pressable>

        <Pressable style={styles.freeBtn} onPress={handleFree} disabled={purchasing}>
          <Text style={styles.freeBtnText}>Try the app for free</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 20,
  },

  badgeRow: { alignItems: 'center', marginBottom: 20 },
  badge: {
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: { color: '#00C896', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8E8EA0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  accent: { color: '#00C896', fontWeight: '700' },

  plans: { gap: 12 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCardHighlight: {
    borderColor: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.06)',
  },
  planLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  planOriginal: { color: '#3A3A4A', fontSize: 13, textDecorationLine: 'line-through' },
  planRight: { alignItems: 'flex-end', gap: 6 },
  planDiscounted: { color: '#00C896', fontSize: 20, fontWeight: '700' },
  discountBadge: {
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeText: { color: '#00C896', fontSize: 11, fontWeight: '800' },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 4,
  },
  ctaBtn: {
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#0A0A0F', fontSize: 17, fontWeight: '700' },

  freeBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  freeBtnText: { color: '#8E8EA0', fontSize: 15, fontWeight: '500' },
});
