import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SpeedGraph } from '@/components/trip/SpeedGraph';
import { TripMap } from '@/components/trip/TripMap';
import { LoadingState } from '@/components/shared/LoadingState';
import { tripsService } from '@/services/supabase';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '@/utils/format';
import type { Trip } from '@/types';

function scoreColor(score: number) {
  if (score >= 80) return '#00C896';
  if (score >= 60) return '#F0A500';
  return '#FF4B4B';
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: trip, isLoading } = useQuery<Trip>({
    queryKey: ['trip', id],
    queryFn: () => tripsService.getById(id) as Promise<Trip>,
    enabled: !!id,
  });

  if (isLoading || !trip) return <LoadingState />;

  const color = scoreColor(trip.driving_score);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
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

        {/* 2×2 stats */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatBlock value={formatDistance(trip.distance_km)} label="Distance" />
            <StatBlock value={formatDuration(trip.duration_seconds)} label="Duration" />
          </View>
          <View style={styles.gridRow}>
            <StatBlock value={formatSpeed(trip.top_speed_kmh)} label="Top Speed" />
            <StatBlock value={formatSpeed(trip.avg_speed_kmh)} label="Avg Speed" />
          </View>
        </View>

        {/* Speed profile */}
        <Section title="Speed Profile">
          <SpeedGraph route={trip.route ?? []} height={140} />
        </Section>

        {/* Route map */}
        <Section title="Route">
          <TripMap />
        </Section>
      </ScrollView>
    </SafeAreaView>
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
  content: { paddingBottom: 40 },
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
