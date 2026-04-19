import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import type { Trip } from '@/types';

interface WeeklyChartProps {
  trips: Trip[];
}

interface DayData {
  label: string;
  distanceKm: number;
  tripCount: number;
}

const VB_W = 400;
const VB_H = 100;
const PAD_TOP = 8;
const PAD_BOTTOM = 2;
const USABLE_H = VB_H - PAD_TOP - PAD_BOTTOM;

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

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * VB_W,
    y: PAD_TOP + USABLE_H * (1 - d.distanceKm / maxDistance),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L${VB_W},${VB_H} L0,${VB_H} Z`;

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        {/* Y-axis */}
        <View style={styles.yAxis}>
          <Text style={styles.axisVal}>{maxDistance.toFixed(1)}</Text>
          <Text style={styles.axisUnit}>km</Text>
          <View style={styles.axisFlex} />
          <Text style={styles.axisVal}>0</Text>
          {/* spacer to align "0" with bottom of SVG, above day labels */}
          <View style={styles.dayLabelSpacer} />
        </View>

        {/* Chart + day labels */}
        <View style={styles.chartCol}>
          <Svg
            width="100%"
            height={96}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#00C896" stopOpacity="0.35" />
                <Stop offset="1" stopColor="#00C896" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#weekGrad)" />
            <Path
              d={linePath}
              stroke="#00C896"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dot on today (last point) */}
            <Circle
              cx={points[6].x}
              cy={points[6].y}
              r="5"
              fill="#00C896"
            />
          </Svg>

          {/* Day labels (X-axis) */}
          <View style={styles.labelsRow}>
            {data.map((day, i) => (
              <Text
                key={i}
                style={[styles.barLabel, i === 6 && styles.barLabelToday]}
              >
                {day.label}
              </Text>
            ))}
          </View>
        </View>
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
  chartRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  yAxis: {
    width: 34,
    alignItems: 'flex-end',
  },
  axisFlex: { flex: 1 },
  dayLabelSpacer: { height: 20 }, // matches labelsRow height
  chartCol: {
    flex: 1,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    height: 16,
  },
  axisVal: {
    color: '#8E8EA0',
    fontSize: 10,
    fontWeight: '600',
  },
  axisUnit: {
    color: '#505065',
    fontSize: 9,
    marginTop: 1,
  },
  barLabel: { color: '#8E8EA0', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  barLabelToday: { color: '#00C896' },
  legend: { color: '#3A3A4A', fontSize: 11 },
});
