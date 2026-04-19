import { useRef } from 'react';
import { Dimensions, ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { SpeedGraph } from '@/components/trip/SpeedGraph';
import { TripMap } from '@/components/trip/TripMap';
import { LoadingState } from '@/components/shared/LoadingState';
import { tripsService } from '@/services/supabase';
import { getCardOrigin } from '@/store/cardOrigin';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '@/utils/format';
import { useProfile } from '@/hooks/useProfile';
import type { Trip } from '@/types';

const { width: W, height: H } = Dimensions.get('window');

function scoreColor(score: number) {
  if (score >= 80) return '#00C896';
  if (score >= 60) return '#F0A500';
  return '#FF4B4B';
}

// Custom entering animation: screen expands from the tapped card's position.
// Origin values are captured as primitives at call-time so the worklet can read them.
function makeCardEntering(ox: number, oy: number, ow: number, oh: number) {
  return function cardEntering() {
    'worklet';
    const translateX = ox + ow / 2 - W / 2;
    const translateY = oy + oh / 2 - H / 2;
    const scale = ow / W;

    return {
      initialValues: {
        transform: [{ translateX }, { translateY }, { scale }],
        opacity: 0,
        borderRadius: 14,
      },
      animations: {
        transform: [
          { translateX: withTiming(0, { duration: 420 }) },
          { translateY: withTiming(0, { duration: 420 }) },
          { scale: withTiming(1, { duration: 420 }) },
        ],
        opacity: withTiming(1, { duration: 180 }),
        borderRadius: withTiming(0, { duration: 420 }),
      },
    };
  };
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { speedUnit } = useProfile();

  // Read card origin once at mount — set by TripCard right before navigation
  const { x: ox, y: oy, w: ow, h: oh } = useRef(getCardOrigin()).current;
  const cardEntering = makeCardEntering(ox, oy, ow, oh);

  // Exit animation: reverse shared-element — contract back to card bounds
  const exitTx = useSharedValue(0);
  const exitTy = useSharedValue(0);
  const exitScale = useSharedValue(1);
  const exitOpacity = useSharedValue(1);
  const exitRadius = useSharedValue(0);

  const exitStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: exitTx.value },
      { translateY: exitTy.value },
      { scale: exitScale.value },
    ],
    opacity: exitOpacity.value,
    borderRadius: exitRadius.value,
  }));

  const handleBack = () => {
    const targetTx = ox + ow / 2 - W / 2;
    const targetTy = oy + oh / 2 - H / 2;
    const targetScale = ow / W;
    const cfg = { duration: 380, easing: Easing.inOut(Easing.quad) };

    exitTx.value = withTiming(targetTx, cfg);
    exitTy.value = withTiming(targetTy, cfg);
    exitScale.value = withTiming(targetScale, cfg);
    exitRadius.value = withTiming(14, cfg);
    // Fade out slightly faster so content disappears before the card is tiny
    exitOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(router.back)();
    });
  };

  const { data: trip, isLoading } = useQuery<Trip>({
    queryKey: ['trip', id],
    queryFn: () => tripsService.getById(id) as Promise<Trip>,
    enabled: !!id,
  });

  if (isLoading || !trip) return <LoadingState />;

  const color = scoreColor(trip.driving_score);

  return (
    <>
      <Stack.Screen
        options={{
          animation: 'none',
          gestureEnabled: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
        }}
      />

      <Animated.View entering={cardEntering} style={[styles.animContainer, exitStyle]}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{formatDate(trip.started_at)}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Score card */}
            <View style={[styles.scoreCard, { borderColor: `${color}30` }]}>
              <Text style={[styles.scoreNumber, { color }]}>{trip.driving_score}</Text>
              <Text style={styles.scoreLabel}>Driving Score</Text>
            </View>

            {/* Route map — directly below score */}
            <Section title="Route">
              <TripMap route={trip.route ?? []} height={220} unit={speedUnit} />
            </Section>

            {/* Vehicle + country badges */}
            {(trip.vehicle_make || trip.vehicle_model || trip.country) && (
              <View style={styles.badgeRow}>
                {(trip.vehicle_make || trip.vehicle_model) && (
                  <View style={styles.vehicleBadge}>
                    <Text style={styles.vehicleIcon}>🚗</Text>
                    <Text style={styles.vehicleText}>
                      {[trip.vehicle_make, trip.vehicle_model].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                )}
                {trip.country && (
                  <View style={styles.vehicleBadge}>
                    <Text style={styles.vehicleIcon}>📍</Text>
                    <Text style={styles.vehicleText}>{trip.country}</Text>
                  </View>
                )}
              </View>
            )}

            {/* 2×2 stats */}
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatBlock value={formatDistance(trip.distance_km, speedUnit)} label="Distance" />
                <StatBlock value={formatDuration(trip.duration_seconds)} label="Duration" />
              </View>
              <View style={styles.gridRow}>
                <StatBlock value={formatSpeed(trip.top_speed_kmh, speedUnit)} label="Top Speed" />
                <StatBlock value={formatSpeed(trip.avg_speed_kmh, speedUnit)} label="Avg Speed" />
              </View>
            </View>

            {/* Maneuvers — always shown */}
            <Section title="Maneuvers">
              <View style={styles.sectionGrid}>
                <View style={styles.gridRow}>
                  <StatBlock value={String(trip.left_turns ?? 0)} label="Left Turns" />
                  <StatBlock value={String(trip.right_turns ?? 0)} label="Right Turns" />
                </View>
                <View style={styles.gridRow}>
                  <StatBlock value={String(trip.brake_events ?? 0)} label="Brake Events" />
                  <StatBlock value={String(trip.total_stops ?? 0)} label="Stops" />
                </View>
              </View>
            </Section>

            {/* Physics — always shown */}
            <Section title="Physics">
              <View style={styles.sectionGrid}>
                <View style={styles.gridRow}>
                  <StatBlock value={`${(trip.max_deceleration_ms2 ?? 0).toFixed(1)} m/s²`} label="Max Decel" />
                  <StatBlock value={`${(trip.max_acceleration_ms2 ?? 0).toFixed(1)} m/s²`} label="Max Accel" />
                </View>
                <View style={styles.gridRow}>
                  <StatBlock value={`${(trip.peak_g_force ?? 0).toFixed(2)} G`} label="Peak G-Force" />
                  <StatBlock value={formatSpeed(trip.top_corner_speed_kmh ?? 0, speedUnit)} label="Top Corner Speed" />
                </View>
              </View>
            </Section>

            {/* Performance */}
            {trip.best_0_100_seconds != null && (
              <Section title="Performance">
                <View style={styles.gridRow}>
                  <StatBlock value={`${trip.best_0_100_seconds}s`} label="0–100 km/h" />
                  <View style={{ flex: 1 }} />
                </View>
              </Section>
            )}

            {/* Speed profile */}
            <Section title="Speed Profile">
              <SpeedGraph route={trip.route ?? []} unit={speedUnit} />
            </Section>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  animContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    overflow: 'hidden',
  },
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: { width: 40 },
  backText: { color: '#00C896', fontSize: 32, lineHeight: 36 },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  content: { paddingBottom: 120 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#14141C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
  },
  vehicleIcon: { fontSize: 16 },
  vehicleText: { color: '#8E8EA0', fontSize: 13, fontWeight: '600' },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 28,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#14141C',
    borderRadius: 16,
    borderWidth: 1,
  },
  scoreNumber: { fontSize: 72, fontWeight: '700', letterSpacing: -2 },
  scoreLabel: { color: '#8E8EA0', fontSize: 14, marginTop: 4 },
  grid: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  sectionGrid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  statBlock: {
    flex: 1,
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#8E8EA0', fontSize: 12, marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    color: '#8E8EA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});
