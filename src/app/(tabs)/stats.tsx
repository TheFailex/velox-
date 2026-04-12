import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStats } from '@/hooks/useStats';
import { useTabFocus } from './_layout';
import { WeeklyChart } from '@/components/stats/WeeklyChart';
import { LoadingState } from '@/components/shared/LoadingState';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/format';

export default function StatsScreen() {
  const { stats, trips, isLoading, isError, refetch } = useStats();
  const activeTab = useTabFocus();

  // Stats is tab index 2 — refetch every time the user swipes to it
  useEffect(() => {
    if (activeTab === 2) refetch();
  }, [activeTab]);

  if (isLoading) return <LoadingState />;

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stats</Text>
        {hasData && (
          <Text style={styles.headerSub}>{stats.totalTrips} trips total</Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {hasData ? (
          <>
            {/* Highlight card — total distance */}
            <View style={styles.highlightCard}>
              <Text style={styles.highlightValue}>
                {formatDistance(stats.totalDistanceKm)}
              </Text>
              <Text style={styles.highlightLabel}>Total Distance</Text>
            </View>

            {/* 2×2 stat grid */}
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatBlock
                  value={String(stats.totalTrips)}
                  label="Trips"
                  accent="#00C896"
                />
                <StatBlock
                  value={formatDuration(stats.totalDurationSeconds)}
                  label="Time Behind Wheel"
                />
              </View>
              <View style={styles.gridRow}>
                <StatBlock
                  value={formatSpeed(stats.topSpeedKmh)}
                  label="Best Speed"
                  accent="#FF4B4B"
                />
                <StatBlock
                  value={String(stats.avgDrivingScore)}
                  label="Avg Score"
                  accent={scoreAccent(stats.avgDrivingScore)}
                />
              </View>
            </View>

            {/* 7-day activity chart */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <WeeklyChart trips={trips} />
            </View>
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function scoreAccent(score: number) {
  if (score >= 80) return '#00C896';
  if (score >= 60) return '#F0A500';
  return '#FF4B4B';
}

function StatBlock({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statValue, accent ? { color: accent } : undefined]}>
        {value}
      </Text>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSub: { color: '#8E8EA0', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 112 },
  highlightCard: {
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.2)',
  },
  highlightValue: {
    color: '#00C896',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  highlightLabel: { color: '#8E8EA0', fontSize: 14, marginTop: 4 },
  grid: { gap: 12, marginBottom: 24 },
  gridRow: { flexDirection: 'row', gap: 12 },
  statBlock: {
    flex: 1,
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#8E8EA0', fontSize: 12, marginTop: 4 },
  chartSection: { marginBottom: 24 },
  sectionTitle: {
    color: '#8E8EA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  emptySub: { color: '#8E8EA0', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#00C896',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { color: '#0A0A0F', fontWeight: '700', fontSize: 15 },
});
