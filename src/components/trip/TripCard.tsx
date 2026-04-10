import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '@/utils/format';
import type { Trip } from '@/types';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#00C896';
  if (score >= 60) return '#F0A500';
  return '#FF4B4B';
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const color = scoreColor(trip.driving_score);

  return (
    <Card onPress={onPress} style={styles.card}>
      {/* Top row: date + score badge */}
      <View style={styles.topRow}>
        <Text style={styles.date}>{formatDate(trip.started_at)}</Text>
        <View style={[styles.scoreBadge, { borderColor: `${color}50`, backgroundColor: `${color}15` }]}>
          <Text style={[styles.scoreText, { color }]}>{trip.driving_score}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDistance(trip.distance_km)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(trip.duration_seconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatSpeed(trip.top_speed_kmh)}</Text>
          <Text style={styles.statLabel}>Top Speed</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 24,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    color: '#8E8EA0',
    fontSize: 11,
    marginTop: 2,
  },
  separator: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
