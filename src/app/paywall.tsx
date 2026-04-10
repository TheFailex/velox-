import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const FEATURES = [
  'Weekly Driving Insights — personalized every Sunday',
  'Unlimited Trip History — access every trip, forever',
  'Detailed Speed Graphs — per-second breakdown',
  'Driving Score & Trends — track improvement over time',
  'Privacy-First Cloud Sync — encrypted, never sold',
];

const PLANS = [
  { id: 'velox_monthly', label: 'Monthly', price: '$2.99', sub: 'per month', badge: null },
  { id: 'velox_annual', label: 'Annual', price: '$19.99', sub: 'per year', badge: 'BEST VALUE' },
  { id: 'velox_lifetime', label: 'Lifetime', price: '$49.99', sub: 'one-time', badge: null },
] as const;

export default function PaywallScreen() {
  const [selected, setSelected] = useState<string>('velox_annual');

  const handlePurchase = () => {
    // TODO: wire up react-native-purchases in EAS dev build
    // await Purchases.purchaseProduct(selected);
    router.replace('/(tabs)');
  };

  const handleClose = () => {
    try {
      router.back();
    } catch {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Close */}
      <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Headline */}
        <Text style={styles.headline}>Know Every Drive.</Text>
        <Text style={styles.headlineSub}>Own Every Mile.</Text>
        <Text style={styles.tagline}>Upgrade to Velox Premium</Text>

        {/* Feature list */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureIcon}>✦</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelected(plan.id)}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
              >
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                  {plan.label}
                </Text>
                <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                  {plan.price}
                </Text>
                <Text style={styles.planSub}>{plan.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Pressable style={styles.ctaButton} onPress={handlePurchase}>
          <Text style={styles.ctaText}>Start Premium</Text>
        </Pressable>
        <Pressable hitSlop={8}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>
        <Pressable onPress={handleClose} hitSlop={8}>
          <Text style={styles.maybeLaterText}>Maybe later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  closeBtn: { position: 'absolute', top: 56, right: 20, zIndex: 10, padding: 8 },
  closeText: { color: '#8E8EA0', fontSize: 18 },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
  headline: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  headlineSub: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  tagline: { color: '#00C896', fontSize: 14, fontWeight: '600', marginBottom: 32 },
  features: { gap: 14, marginBottom: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { color: '#00C896', fontSize: 12, marginTop: 3 },
  featureText: { color: '#FFFFFF', fontSize: 15, flex: 1, lineHeight: 22 },
  plans: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  planCard: {
    flex: 1,
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCardSelected: {
    borderColor: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.07)',
  },
  planBadge: {
    backgroundColor: '#00C896',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  planBadgeText: { color: '#0A0A0F', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planLabel: { color: '#8E8EA0', fontSize: 12, marginBottom: 4 },
  planLabelSelected: { color: '#00C896' },
  planPrice: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  planPriceSelected: { color: '#FFFFFF' },
  planSub: { color: '#8E8EA0', fontSize: 10, marginTop: 2 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  ctaText: { color: '#0A0A0F', fontSize: 17, fontWeight: '700' },
  restoreText: { color: '#8E8EA0', fontSize: 13 },
  maybeLaterText: { color: '#3A3A4A', fontSize: 13 },
});
