import { View, Text, StyleSheet } from 'react-native';
import type { Trip } from '@/types';

interface WeeklyChartProps {
  trips: Trip[];
}

interface DayData {
  label: string;
  distanceKm: number;
  tripCount: number;
}

function getLast7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

export function WeeklyChart({ trips }: WeeklyChartProps) {
  const days = getLast7Days();

  const data: DayData[] = days.map((day) => {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const dayTrips = trips.filter((t) => {
      const ts = new Date(t.started_at).getTime();
      return ts >= start.getTime() && ts <= end.getTime();
    });

    return {
      label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      distanceKm: dayTrips.reduce((s, t) => s + t.distance_km, 0),
      tripCount: dayTrips.length,
    };
  });

  const maxDistance = Math.max(...data.map((d) => d.distanceKm), 1);
  const totalTrips = data.reduce((s, d) => s + d.tripCount, 0);
  const totalKm = data.reduce((s, d) => s + d.distanceKm, 0);

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {data.map((day, i) => {
          const heightPct = (day.distanceKm / maxDistance) * 100;
          const isToday = i === 6;
          const hasData = day.distanceKm > 0;

          return (
            <View key={i} style={styles.barWrapper}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    hasData
                      ? (isToday ? styles.barToday : styles.barFilled)
                      : styles.barEmpty,
                    { height: hasData ? `${Math.max(8, heightPct)}%` : '4%' } as any,
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.legend}>
        {totalTrips} trips · {totalKm.toFixed(1)} km this week
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14141C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 6,
    marginBottom: 10,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barEmpty: { backgroundColor: '#1E1E2A' },
  barFilled: { backgroundColor: 'rgba(0,200,150,0.35)' },
  barToday: { backgroundColor: '#00C896' },
  barLabel: { color: '#8E8EA0', fontSize: 11, fontWeight: '600' },
  barLabelToday: { color: '#00C896' },
  legend: { color: '#3A3A4A', fontSize: 11 },
});
