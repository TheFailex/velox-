import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { restorePurchases } from '@/services/revenuecat';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useTabStore } from '@/store/tabStore';

const { width: W } = Dimensions.get('window');

// ─── Feature carousel slides ──────────────────────────────────────────────────

const SLIDES = [
  {
    icon: '📍',
    title: 'Unlimited Trip History',
    bullets: [
      'Every drive saved forever',
      'Filter and search past trips',
      'Never lose a journey',
    ],
  },
  {
    icon: '📊',
    title: 'Full Speed Analysis',
    bullets: [
      'Second-by-second speed graph',
      'Top speed, avg speed & more',
      'Spot patterns in your driving',
    ],
  },
  {
    icon: '🗺️',
    title: 'Route Playback',
    bullets: [
      'Color-coded route map',
      'See every turn you took',
      'Speed overlay per km',
    ],
  },
  {
    icon: '🏆',
    title: 'Driving Score',
    bullets: [
      'AI-powered 0–100 score',
      'Improve your style over time',
      'Compare with past trips',
    ],
  },
  {
    icon: '🤖',
    title: 'Weekly AI Insights',
    bullets: [
      'Personalized weekly report',
      'Trends across your drives',
      'Smart tips to drive better',
    ],
  },
];

// ─── Plan types ───────────────────────────────────────────────────────────────

interface PlanInfo {
  id: string;
  type: PACKAGE_TYPE;
  label: string;
  fallbackPrice: string;
  fallbackWeekly: string;
  savingsBadge: string | null;
}

const PLANS: PlanInfo[] = [
  {
    id: 'velox_annual',
    type: PACKAGE_TYPE.ANNUAL,
    label: 'Annual',
    fallbackPrice: '€29.99/year',
    fallbackWeekly: '€0.58/week',
    savingsBadge: 'SAVE 16%',
  },
  {
    id: 'velox_monthly',
    type: PACKAGE_TYPE.MONTHLY,
    label: 'Monthly',
    fallbackPrice: '€2.49/month',
    fallbackWeekly: '€0.58/week',
    savingsBadge: null,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weeklyPrice(pkg: PurchasesPackage | undefined, plan: PlanInfo): string {
  if (!pkg) return plan.fallbackWeekly;
  const price = pkg.product.price;
  if (plan.type === PACKAGE_TYPE.ANNUAL) {
    return `${pkg.product.currencyCode} ${(price / 52).toFixed(2)}/week`;
  }
  return `${pkg.product.currencyCode} ${(price / 4.33).toFixed(2)}/week`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const { fromOnboarding } = useLocalSearchParams<{ fromOnboarding?: string }>();
  const isFromOnboarding = fromOnboarding === '1';

  const [selectedPlan, setSelectedPlan] = useState<string>('velox_annual');
  const [packages, setPackages] = useState<Map<string, PurchasesPackage>>(new Map());
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => {
        const current = offerings.current;
        if (!current) return;
        const map = new Map<string, PurchasesPackage>();
        for (const pkg of current.availablePackages) {
          // First match wins — avoids picking up a promo base plan over the default one
          if (pkg.packageType === PACKAGE_TYPE.MONTHLY && !map.has('velox_monthly')) map.set('velox_monthly', pkg);
          else if (pkg.packageType === PACKAGE_TYPE.ANNUAL && !map.has('velox_annual')) map.set('velox_annual', pkg);
        }
        setPackages(map);
      })
      .catch(() => {/* offerings not configured — fallback prices shown */});
  }, []);

  const handlePurchase = async (planId = selectedPlan) => {
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
      router.back();
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', e.message ?? 'Something went wrong.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (info.entitlements.active['velox_premium_v2']) {
        useSubscriptionStore.getState().setIsPremium(true);
        router.back();
      } else {
        Alert.alert('No purchases found', 'No active subscription was found.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message ?? 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handleClose = async () => {
    if (isFromOnboarding) {
      const shown = await AsyncStorage.getItem('exit_offer_shown');
      if (shown === '1') {
        useTabStore.getState().setPendingTab(0);
        router.replace('/(tabs)');
      } else {
        router.push('/exit-offer');
      }
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeIcon}>✦</Text>
          <Text style={styles.premiumBadgeText}>Premium</Text>
        </View>
        <Pressable onPress={handleClose} hitSlop={16} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Feature Carousel */}
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (W - 40));
              setSlideIndex(idx);
            }}
          >
            {SLIDES.map((slide, i) => (
              <View key={i} style={styles.slide}>
                <View style={styles.slideIconWrap}>
                  <Text style={styles.slideIcon}>{slide.icon}</Text>
                </View>
                <View style={styles.slideCard}>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  {slide.bullets.map((b, j) => (
                    <View key={j} style={styles.slideBulletRow}>
                      <Text style={styles.slideBulletDot}>•</Text>
                      <Text style={styles.slideBulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === slideIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Plan selector */}
        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const pkg = packages.get(plan.id);
            const priceStr = pkg?.product.priceString
              ? `${pkg.product.priceString}${plan.type === PACKAGE_TYPE.ANNUAL ? '/year' : '/month'}`
              : plan.fallbackPrice;
            const weekly = weeklyPrice(pkg, plan);
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
              >
                <View style={styles.planCardLeft}>
                  <View style={styles.planRadioRow}>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                      {plan.label}
                    </Text>
                  </View>
                  <Text style={styles.planPrice}>{priceStr}</Text>
                </View>
                <View style={styles.planCardRight}>
                  {plan.savingsBadge && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>{plan.savingsBadge}</Text>
                    </View>
                  )}
                  <Text style={styles.planWeekly}>{weekly}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.ctaBtn, (purchasing || restoring) && styles.ctaDisabled]}
          onPress={() => handlePurchase()}
          disabled={purchasing || restoring}
        >
          {purchasing
            ? <ActivityIndicator color="#0A0A0F" />
            : <Text style={styles.ctaText}>Continue</Text>
          }
        </Pressable>

        <View style={styles.footerLinks}>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Terms of use</Text>
          </Pressable>
          <Text style={styles.footerSep}>·</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.footerSep}>·</Text>
          <Pressable onPress={handleRestore} hitSlop={8}>
            {restoring
              ? <ActivityIndicator size="small" color="#8E8EA0" />
              : <Text style={styles.footerLink}>Restore Purchases</Text>
            }
          </Pressable>
        </View>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,200,150,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.3)',
  },
  premiumBadgeIcon: { color: '#00C896', fontSize: 12 },
  premiumBadgeText: { color: '#00C896', fontSize: 13, fontWeight: '700' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // Carousel
  carouselWrap: { marginTop: 8 },
  slide: {
    width: W - 40,
    marginHorizontal: 20,
    height: 300,
    position: 'relative',
  },
  slideIconWrap: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14141C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 0,
  },
  slideIcon: { fontSize: 72 },
  slideCard: {
    backgroundColor: 'rgba(20,20,28,0.96)',
    borderRadius: 16,
    padding: 16,
    marginTop: -1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 0,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  slideBulletRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  slideBulletDot: { color: '#00C896', fontSize: 12, marginTop: 2 },
  slideBulletText: { color: '#8E8EA0', fontSize: 13, flex: 1 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A3A',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#00C896',
  },

  // Plans
  plans: { paddingHorizontal: 20, gap: 10, marginTop: 20 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCardSelected: {
    borderColor: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.06)',
  },
  planCardLeft: { gap: 4 },
  planRadioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3A3A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#00C896' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00C896' },
  planLabel: { color: '#8E8EA0', fontSize: 15, fontWeight: '600' },
  planLabelSelected: { color: '#FFFFFF' },
  planPrice: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginLeft: 30 },
  planCardRight: { alignItems: 'flex-end', gap: 6 },
  savingsBadge: {
    backgroundColor: '#00C896',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savingsBadgeText: { color: '#0A0A0F', fontSize: 10, fontWeight: '800' },
  planWeekly: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  ctaBtn: {
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#0A0A0F', fontSize: 17, fontWeight: '700' },
  footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerLink: { color: '#8E8EA0', fontSize: 11 },
  footerSep: { color: '#3A3A4A', fontSize: 11 },

});
