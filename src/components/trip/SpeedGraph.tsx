import { View, Text, StyleSheet } from 'react-native';
import type { GPSPoint } from '@/types';

interface SpeedGraphProps {
  route: GPSPoint[];
  height?: number;
}

export function SpeedGraph({ route, height = 120 }: SpeedGraphProps) {
  if (route.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.empty}>No speed data</Text>
      </View>
    );
  }

  // Sample down to max 80 bars so they fit without crowding
  const step = Math.max(1, Math.floor(route.length / 80));
  const sampled = route.filter((_, i) => i % step === 0);
  const maxSpeed = sampled.reduce((max, p) => Math.max(max, p.speed), 1);
  const chartHeight = height - 24; // leave room for label

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.bars}>
        {sampled.map((point, i) => {
          const barH = Math.max(2, (point.speed / maxSpeed) * chartHeight);
          const barColor = point.speed > 100 ? '#FF4B4B' : '#00C896';
          return (
            <View
              key={i}
              style={[styles.bar, { height: barH, backgroundColor: barColor }]}
            />
          );
        })}
      </View>
      <Text style={styles.maxLabel}>{Math.round(maxSpeed)} km/h</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'flex-end',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 2,
    opacity: 0.85,
  },
  empty: {
    color: '#8E8EA0',
    textAlign: 'center',
  },
  maxLabel: {
    color: '#8E8EA0',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
});
