import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpeedGauge } from '@/components/ui/SpeedGauge';
import { StatTile } from '@/components/ui/StatTile';
import { useTrip } from '@/hooks/useTrip';
import { useSubscription } from '@/hooks/useSubscription';
import { useWeeklyInsight } from '@/hooks/useWeeklyInsight';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/format';

export default function DashboardScreen() {
  const { isTracking, liveStats, startTrip, stopTrip, isSaving } = useTrip();
  const { isPremium } = useSubscription();
  const { insight } = useWeeklyInsight();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Velox</Text>
        {isTracking && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Speed gauge */}
        <View style={styles.gaugeContainer}>
          <SpeedGauge speed={liveStats.speed} active={isTracking} />
        </View>

        {/* 2×2 stat grid */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatTile value={formatDistance(liveStats.distance)} label="Distance" />
            <StatTile value={formatDuration(liveStats.duration)} label="Duration" />
          </View>
          <View style={styles.gridRow}>
            <StatTile value={formatSpeed(liveStats.topSpeed)} label="Top Speed" />
            <StatTile value={formatSpeed(liveStats.avgSpeed)} label="Avg Speed" />
          </View>
        </View>

        {/* Weekly insight — premium only, shown when not tracking */}
        {isPremium && !isTracking && insight && (
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>THIS WEEK'S INSIGHT</Text>
            <Text style={styles.insightText}>{insight.summary}</Text>
          </View>
        )}

        {/* Altitude tile — shown while tracking */}
        {isTracking && (
          <View style={styles.altitudeTile}>
            <Text style={styles.altitudeValue}>{Math.round(liveStats.altitude)} m</Text>
            <Text style={styles.altitudeLabel}>Altitude</Text>
          </View>
        )}

        {/* CTA button */}
        <Pressable
          style={[styles.tripButton, isTracking && styles.tripButtonStop]}
          onPress={isTracking ? stopTrip : startTrip}
          disabled={isSaving}
        >
          <Text style={styles.tripButtonText}>
            {isSaving ? 'Saving...' : isTracking ? 'STOP TRIP' : 'START TRIP'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 200, 150, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C896',
  },
  liveText: {
    color: '#00C896',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scroll: {
    paddingBottom: 112, // space for floating tab bar (68) + 24 margin + 20 extra
  },
  altitudeTile: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  altitudeValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  altitudeLabel: { color: '#8E8EA0', fontSize: 12, marginTop: 4 },
  gaugeContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  grid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0,200,150,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,200,150,0.2)',
  },
  insightLabel: {
    color: '#00C896',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  insightText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
  },
  tripButton: {
    marginHorizontal: 20,
    backgroundColor: '#00C896',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  tripButtonStop: {
    backgroundColor: '#FF4B4B',
  },
  tripButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
