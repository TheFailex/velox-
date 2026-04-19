import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { SpeedGauge } from '@/components/ui/SpeedGauge';
import { StatTile } from '@/components/ui/StatTile';
import { useTrip } from '@/hooks/useTrip';
import { useSubscription } from '@/hooks/useSubscription';
import { tripsService } from '@/services/supabase';
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { useTabEntrance } from '@/hooks/useTabEntrance';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/format';
import { RatingModal, shouldShowRating } from '@/components/shared/RatingModal';
import type { VehicleEntry } from '@/types';

const BTN_SPRING = { damping: 12, stiffness: 380, mass: 0.8 };
const TILE_SPRING = { damping: 20, stiffness: 300, mass: 0.7 };
const RING_DURATION = 650;
const RING2_DELAY = 200;
const TRIP_START_DELAY = 580;

function scoreColor(s: number) {
  if (s >= 80) return '#00C896';
  if (s >= 60) return '#F0A500';
  return '#FF4B4B';
}

export default function DashboardScreen() {
  const { isTracking, liveStats, startTrip, stopTrip, isSaving, selectedVehicle, setSelectedVehicle } = useTrip();
  const { isPremium, openPaywall } = useSubscription();
  const { insight } = useWeeklyInsight();
  const { speedUnit, vehicles } = useProfile();
  const { stats } = useStats();
  const entranceStyle = useTabEntrance(0);

  const wasTracking = useRef(false);
  const [showRating, setShowRating] = useState(false);

  // Pre-select first vehicle when vehicles load
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tile shared values (8 = 4 tiles × opacity + translateY)
  const t0o = useSharedValue(0); const t0y = useSharedValue(30);
  const t1o = useSharedValue(0); const t1y = useSharedValue(30);
  const t2o = useSharedValue(0); const t2y = useSharedValue(30);
  const t3o = useSharedValue(0); const t3y = useSharedValue(30);

  const tile0Style = useAnimatedStyle(() => ({ flex: 1, opacity: t0o.value, transform: [{ translateY: t0y.value }] }));
  const tile1Style = useAnimatedStyle(() => ({ flex: 1, opacity: t1o.value, transform: [{ translateY: t1y.value }] }));
  const tile2Style = useAnimatedStyle(() => ({ flex: 1, opacity: t2o.value, transform: [{ translateY: t2y.value }] }));
  const tile3Style = useAnimatedStyle(() => ({ flex: 1, opacity: t3o.value, transform: [{ translateY: t3y.value }] }));

  // Button + ripple animations
  const btnScale = useSharedValue(1);
  const ring1Scale = useSharedValue(1); const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1); const ring2Opacity = useSharedValue(0);

  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const ring1Style = useAnimatedStyle(() => ({ transform: [{ scale: ring1Scale.value }], opacity: ring1Opacity.value }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ scale: ring2Scale.value }], opacity: ring2Opacity.value }));

  useEffect(() => {
    if (isTracking && !wasTracking.current) {
      // Stagger tiles in
      const show = (o: typeof t0o, y: typeof t0y, delay: number) => {
        setTimeout(() => {
          o.value = withTiming(1, { duration: 280 });
          y.value = withSpring(0, TILE_SPRING);
        }, delay);
      };
      show(t0o, t0y, 0);
      show(t1o, t1y, 110);
      show(t2o, t2y, 210);
      show(t3o, t3y, 310);
    } else if (!isTracking && wasTracking.current) {
      t0o.value = 0; t0y.value = 30;
      t1o.value = 0; t1y.value = 30;
      t2o.value = 0; t2y.value = 30;
      t3o.value = 0; t3y.value = 30;
      // Show rating popup after trip ends (with delay so save can complete)
      setTimeout(async () => {
        if (await shouldShowRating()) setShowRating(true);
      }, 1200);
    }
    wasTracking.current = isTracking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking]);

  const handleTripPress = async () => {
    if (isTracking) { stopTrip(); return; }

    if (!isPremium) {
      const blocked = await tripsService.hasTripToday();
      if (blocked) { openPaywall(); return; }
    }

    ring1Scale.value = 1;
    ring1Opacity.value = 0.55;
    ring1Scale.value = withTiming(1.35, { duration: RING_DURATION, easing: Easing.out(Easing.quad) });
    ring1Opacity.value = withTiming(0, { duration: RING_DURATION });
    setTimeout(() => {
      ring2Scale.value = 1;
      ring2Opacity.value = 0.4;
      ring2Scale.value = withTiming(1.35, { duration: RING_DURATION, easing: Easing.out(Easing.quad) });
      ring2Opacity.value = withTiming(0, { duration: RING_DURATION });
    }, RING2_DELAY);

    btnScale.value = withSpring(0.94, BTN_SPRING);
    setTimeout(() => { btnScale.value = withSpring(1, BTN_SPRING); }, 120);
    setTimeout(startTrip, TRIP_START_DELAY);
  };

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#0A0A0F' }, entranceStyle]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Velox</Text>
          {isTracking && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Speed gauge */}
          <View style={styles.gaugeContainer}>
            <SpeedGauge speed={liveStats.speed} active={isTracking} unit={speedUnit} />
          </View>

          {/* Live stats — staggered entrance when trip starts */}
          {isTracking && (
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <Animated.View style={tile0Style}>
                  <StatTile value={formatDistance(liveStats.distance, speedUnit)} label="Distance" />
                </Animated.View>
                <Animated.View style={tile1Style}>
                  <StatTile value={formatDuration(liveStats.duration)} label="Duration" />
                </Animated.View>
              </View>
              <View style={styles.gridRow}>
                <Animated.View style={tile2Style}>
                  <StatTile value={formatSpeed(liveStats.topSpeed, speedUnit)} label="Top Speed" />
                </Animated.View>
                <Animated.View style={tile3Style}>
                  <StatTile value={formatSpeed(liveStats.avgSpeed, speedUnit)} label="Avg Speed" />
                </Animated.View>
              </View>
            </View>
          )}

          {/* Altitude — while tracking */}
          {isTracking && (
            <View style={styles.altitudeTile}>
              <Text style={styles.altitudeValue}>{Math.round(liveStats.altitude)} m</Text>
              <Text style={styles.altitudeLabel}>Altitude</Text>
            </View>
          )}

          {/* Lifetime stats — premium only while not tracking */}
          {isPremium && !isTracking && stats.totalTrips > 0 && (
            <View style={styles.lifetimeCard}>
              <Text style={styles.lifetimeTitle}>YOUR STATS</Text>
              <View style={styles.lifetimeRow}>
                <View style={styles.lifetimeStat}>
                  <Text style={styles.lifetimeValue}>{stats.totalTrips}</Text>
                  <Text style={styles.lifetimeLabel}>Trips</Text>
                </View>
                <View style={styles.lifetimeDivider} />
                <View style={styles.lifetimeStat}>
                  <Text style={styles.lifetimeValue}>{formatDistance(stats.totalDistanceKm, speedUnit)}</Text>
                  <Text style={styles.lifetimeLabel}>Total Distance</Text>
                </View>
                <View style={styles.lifetimeDivider} />
                <View style={styles.lifetimeStat}>
                  <Text style={[styles.lifetimeValue, { color: scoreColor(stats.avgDrivingScore) }]}>
                    {stats.avgDrivingScore}
                  </Text>
                  <Text style={styles.lifetimeLabel}>Avg Score</Text>
                </View>
              </View>
            </View>
          )}

          {/* Weekly insight — premium, not tracking */}
          {isPremium && !isTracking && insight && (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>THIS WEEK'S INSIGHT</Text>
              <Text style={styles.insightText}>{insight.summary}</Text>
            </View>
          )}

          {/* Vehicle picker — only before a trip */}
          {!isTracking && vehicles.length > 0 && (
            <View style={styles.vehiclePicker}>
              <Text style={styles.vehiclePickerLabel}>VEHICLE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehiclePickerRow}
              >
                {vehicles.map((v: VehicleEntry, i: number) => {
                  const isSelected = selectedVehicle?.make === v.make && selectedVehicle?.model === v.model;
                  return (
                    <Pressable
                      key={i}
                      style={[styles.vehiclePill, isSelected && styles.vehiclePillActive]}
                      onPress={() => setSelectedVehicle(v)}
                    >
                      <Text style={styles.vehiclePillIcon}>{v.type === 'Motorbike' ? '🏍️' : '🚗'}</Text>
                      <Text style={[styles.vehiclePillText, isSelected && styles.vehiclePillTextActive]}>
                        {v.make} {v.model}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* CTA button */}
          <View style={styles.tripButtonWrap}>
            {!isTracking && (
              <>
                <Animated.View style={[styles.rippleRing, ring1Style]} pointerEvents="none" />
                <Animated.View style={[styles.rippleRing, ring2Style]} pointerEvents="none" />
              </>
            )}
            <Animated.View style={btnAnimStyle}>
              <Pressable
                style={[styles.tripButton, isTracking && styles.tripButtonStop]}
                onPress={handleTripPress}
                disabled={isSaving}
              >
                <Text style={styles.tripButtonText}>
                  {isSaving ? 'Saving...' : isTracking ? 'STOP TRIP' : 'START TRIP'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <RatingModal visible={showRating} onClose={() => setShowRating(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,200,150,0.12)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,200,150,0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C896' },
  liveText: { color: '#00C896', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  scroll: { paddingBottom: 112 },
  gaugeContainer: { alignItems: 'center', paddingVertical: 28 },
  grid: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  gridRow: { flexDirection: 'row', gap: 12 },
  altitudeTile: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: '#14141C',
    borderRadius: 12, padding: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
  },
  altitudeValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  altitudeLabel: { color: '#8E8EA0', fontSize: 12, marginTop: 4 },
  lifetimeCard: {
    marginHorizontal: 20, marginBottom: 20, backgroundColor: '#14141C',
    borderRadius: 16, padding: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lifetimeTitle: {
    color: '#8E8EA0', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 14,
  },
  lifetimeRow: { flexDirection: 'row', alignItems: 'center' },
  lifetimeStat: { flex: 1, alignItems: 'center' },
  lifetimeValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  lifetimeLabel: { color: '#8E8EA0', fontSize: 11, marginTop: 4 },
  lifetimeDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.07)' },
  insightCard: {
    marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(0,200,150,0.06)',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,200,150,0.2)',
  },
  insightLabel: { color: '#00C896', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  insightText: { color: '#FFFFFF', fontSize: 14, lineHeight: 21 },
  vehiclePicker: { marginHorizontal: 20, marginBottom: 16 },
  vehiclePickerLabel: {
    color: '#8E8EA0', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 8,
  },
  vehiclePickerRow: { gap: 8, paddingRight: 4 },
  vehiclePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#14141C', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  vehiclePillActive: {
    borderColor: '#00C896',
    backgroundColor: 'rgba(0,200,150,0.08)',
  },
  vehiclePillIcon: { fontSize: 14 },
  vehiclePillText: { color: '#8E8EA0', fontSize: 13, fontWeight: '600' },
  vehiclePillTextActive: { color: '#00C896' },
  tripButtonWrap: { marginHorizontal: 20, overflow: 'visible' },
  rippleRing: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16, borderWidth: 2, borderColor: '#00C896',
  },
  tripButton: {
    backgroundColor: '#00C896', borderRadius: 16, paddingVertical: 20, alignItems: 'center',
  },
  tripButtonStop: { backgroundColor: '#FF4B4B' },
  tripButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 1 },
});
