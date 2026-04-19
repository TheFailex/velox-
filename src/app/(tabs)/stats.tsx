import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useStats } from '@/hooks/useStats';
import { useSubscription } from '@/hooks/useSubscription';
import { useTabFocus } from './_layout';
import { useTabEntrance } from '@/hooks/useTabEntrance';
import { WeeklyChart } from '@/components/stats/WeeklyChart';
import { ActivityCalendar } from '@/components/stats/ActivityCalendar';
import { LoadingState } from '@/components/shared/LoadingState';
import { useProfile } from '@/hooks/useProfile';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/format';

export default function StatsScreen() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | undefined>(undefined);
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);

  const { stats, trips, vehicleOptions, isLoading, isError, refetch } = useStats(selectedVehicle);
  const activeTab = useTabFocus();
  const { speedUnit } = useProfile();
  const { isPremium, openPaywall } = useSubscription();
  const entranceStyle = useTabEntrance(2);

  useEffect(() => {
    if (activeTab === 2) refetch();
  }, [activeTab]);

  if (isLoading) return <LoadingState />;

  if (!isPremium) return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#0A0A0F' }, entranceStyle]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stats</Text>
        </View>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedIcon}>📊</Text>
          <Text style={styles.lockedTitle}>Stats are Premium</Text>
          <Text style={styles.lockedSub}>
            Unlock lifetime stats, weekly charts, activity calendar and advanced driving analytics.
          </Text>
          <Pressable style={styles.lockedBtn} onPress={openPaywall}>
            <Text style={styles.lockedBtnText}>✦  Upgrade to Premium</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  if (isError) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stats</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>Could not load stats</Text>
        <Text style={styles.emptySub}>Check your connection and Supabase configuration.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const hasData = stats.totalTrips > 0;
  const totalTurns = stats.totalLeftTurns + stats.totalRightTurns;
  const leftPct = totalTurns > 0 ? Math.round((stats.totalLeftTurns / totalTurns) * 100) : 50;
  const rightPct = 100 - leftPct;

  const vehicleLabel = selectedVehicle ?? 'All Vehicles';

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: '#0A0A0F' }, entranceStyle]}>
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stats</Text>
        {hasData && <Text style={styles.headerSub}>{stats.totalTrips} trips</Text>}
      </View>

      {/* Vehicle dropdown — only if there are multiple vehicles in trips */}
      {vehicleOptions.length > 0 && (
        <Pressable style={styles.vehicleDropdown} onPress={() => setVehiclePickerVisible(true)}>
          <Text style={styles.vehicleDropdownText}>{vehicleLabel}</Text>
          <Ionicons name="chevron-down" size={16} color="#8E8EA0" />
        </Pressable>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {hasData ? (
          <>
            {/* Highlight card */}
            <View style={styles.highlightCard}>
              <Text style={styles.highlightValue}>
                {formatDistance(stats.totalDistanceKm, speedUnit)}
              </Text>
              <Text style={styles.highlightLabel}>Total Distance</Text>
            </View>

            {/* Core 2×2 */}
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatBlock value={String(stats.totalTrips)} label="Trips" accent="#00C896" />
                <StatBlock value={formatDuration(stats.totalDurationSeconds)} label="Time Behind Wheel" />
              </View>
              <View style={styles.gridRow}>
                <StatBlock value={formatSpeed(stats.topSpeedKmh, speedUnit)} label="Top Speed" accent="#FF4B4B" />
                <StatBlock value={String(stats.avgDrivingScore)} label="Avg Score" accent={scoreAccent(stats.avgDrivingScore)} />
              </View>
            </View>

            {/* Activity calendar */}
            <View style={styles.calendarSection}>
              <Text style={styles.sectionTitle}>Activity</Text>
              <ActivityCalendar trips={trips} unit={speedUnit} />
            </View>

            {/* Weekly chart */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <WeeklyChart trips={trips} />
            </View>

            {/* Maneuvers */}
            <Text style={styles.sectionTitle}>Maneuvers</Text>
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatBlock value={String(stats.totalLeftTurns)} label="Left Turns" accent="#7B7FE8" icon="↩" />
                <StatBlock value={String(stats.totalRightTurns)} label="Right Turns" accent="#E87B7B" icon="↪" />
              </View>
              <View style={styles.gridRow}>
                <StatBlock value={String(stats.totalBrakeEvents)} label="Brake Events" accent="#F0A500" icon="✋" />
                <StatBlock value={String(stats.totalStops)} label="Total Stops" accent="#8E8EA0" icon="⏹" />
              </View>
            </View>

            {/* Turn preference */}
            {totalTurns > 0 && (
              <View style={styles.turnPrefCard}>
                <Text style={styles.turnPrefTitle}>Turn Preference</Text>
                <View style={styles.turnPrefBar}>
                  <View style={[styles.turnPrefLeft, { flex: leftPct }]}>
                    <Text style={styles.turnPrefPct}>{leftPct}%</Text>
                  </View>
                  <View style={[styles.turnPrefRight, { flex: rightPct }]}>
                    <Text style={styles.turnPrefPct}>{rightPct}%</Text>
                  </View>
                </View>
                <View style={styles.turnPrefLabels}>
                  <Text style={styles.turnPrefLabel}>Left</Text>
                  <Text style={styles.turnPrefLabel}>Right</Text>
                </View>
              </View>
            )}

            {/* Physics */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Physics</Text>
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatBlock value={`${stats.maxDecelerationMs2.toFixed(1)} m/s²`} label="Max Decel" accent="#FF4B4B" icon="↓" />
                <StatBlock value={`${stats.maxAccelerationMs2.toFixed(1)} m/s²`} label="Max Accel" accent="#00C896" icon="↑" />
              </View>
              <View style={styles.gridRow}>
                <StatBlock value={`${stats.peakGForce.toFixed(2)} G`} label="Peak G-Force" accent="#F0A500" />
                <StatBlock value={formatSpeed(stats.topCornerSpeedKmh, speedUnit)} label="Top Corner Speed" accent="#7CC860" />
              </View>
            </View>

            {/* More */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>More Stats</Text>
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatBlock
                  value={stats.best0to100Seconds !== null ? `${stats.best0to100Seconds}s` : '—'}
                  label="Best 0–100 km/h"
                  accent="#00C896"
                />
                <StatBlock value={formatDistance(stats.avgTripLengthKm, speedUnit)} label="Avg Trip Length" />
              </View>
            </View>
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      {/* Vehicle picker modal */}
      <Modal
        visible={vehiclePickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVehiclePickerVisible(false)}
      >
        <SafeAreaView style={styles.pickerContainer} edges={['top', 'bottom']}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Filter by Vehicle</Text>
            <Pressable onPress={() => setVehiclePickerVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color="#8E8EA0" />
            </Pressable>
          </View>
          <FlatList
            data={['All Vehicles', ...vehicleOptions]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isActive = item === 'All Vehicles' ? !selectedVehicle : selectedVehicle === item;
              return (
                <Pressable
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedVehicle(item === 'All Vehicles' ? undefined : item);
                    setVehiclePickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, isActive && styles.pickerItemActive]}>
                    {item}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={18} color="#00C896" />}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </Animated.View>
  );
}

function scoreAccent(score: number) {
  if (score >= 80) return '#00C896';
  if (score >= 60) return '#F0A500';
  return '#FF4B4B';
}

function StatBlock({ value, label, accent, icon }: {
  value: string; label: string; accent?: string; icon?: string;
}) {
  return (
    <View style={styles.statBlock}>
      {icon && <Text style={[styles.statIcon, accent ? { color: accent } : undefined]}>{icon}</Text>}
      <Text style={[styles.statValue, accent ? { color: accent } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No data yet</Text>
      <Text style={styles.emptySub}>Complete your first trip to see lifetime stats.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'baseline', gap: 10,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerSub: { color: '#8E8EA0', fontSize: 14 },

  vehicleDropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: '#14141C', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)',
  },
  vehicleDropdownText: { color: '#00C896', fontSize: 14, fontWeight: '600' },

  content: { paddingHorizontal: 20, paddingBottom: 112 },

  highlightCard: {
    backgroundColor: '#14141C', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.2)',
  },
  highlightValue: { color: '#00C896', fontSize: 48, fontWeight: '700', letterSpacing: -1 },
  highlightLabel: { color: '#8E8EA0', fontSize: 14, marginTop: 4 },

  grid: { gap: 12, marginBottom: 20 },
  gridRow: { flexDirection: 'row', gap: 12 },
  statBlock: {
    flex: 1, backgroundColor: '#14141C', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: { fontSize: 18, marginBottom: 6, color: '#8E8EA0' },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#8E8EA0', fontSize: 12, marginTop: 4 },

  calendarSection: {
    marginBottom: 24,
    backgroundColor: '#14141C', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  chartSection: { marginBottom: 24 },
  sectionTitle: {
    color: '#8E8EA0', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
  },

  turnPrefCard: {
    backgroundColor: '#14141C', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 20,
  },
  turnPrefTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  turnPrefBar: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', height: 40 },
  turnPrefLeft: { backgroundColor: '#4A4AE8', alignItems: 'center', justifyContent: 'center' },
  turnPrefRight: { backgroundColor: '#E84A4A', alignItems: 'center', justifyContent: 'center' },
  turnPrefPct: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  turnPrefLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  turnPrefLabel: { color: '#8E8EA0', fontSize: 12 },

  lockedContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  lockedIcon: { fontSize: 52, marginBottom: 4 },
  lockedTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  lockedSub: { color: '#8E8EA0', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  lockedBtn: {
    marginTop: 12, backgroundColor: '#00C896',
    borderRadius: 14, paddingHorizontal: 28, paddingVertical: 15,
  },
  lockedBtnText: { color: '#0A0A0F', fontSize: 15, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  emptySub: { color: '#8E8EA0', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: '#00C896',
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  retryText: { color: '#0A0A0F', fontWeight: '700', fontSize: 15 },

  pickerContainer: { flex: 1, backgroundColor: '#0A0A0F' },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pickerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  pickerItemText: { color: '#FFFFFF', fontSize: 16 },
  pickerItemActive: { color: '#00C896', fontWeight: '600' },
  pickerSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 20 },
});
