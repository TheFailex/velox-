import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { GPSPoint } from '@/types';

interface SpeedGraphProps {
  route: GPSPoint[];
  unit?: 'kmh' | 'mph';
}

const VB_W = 400;
const VB_H = 100;
// Top padding prevents the line stroke from being clipped at the maximum value
const PAD_TOP = 8;
const PAD_BOTTOM = 2;
const USABLE_H = VB_H - PAD_TOP - PAD_BOTTOM;

function formatElapsed(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return sec === 0 ? `${min}m` : `${min}m ${sec}s`;
}

export function SpeedGraph({ route, unit = 'kmh' }: SpeedGraphProps) {
  if (route.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No speed data</Text>
      </View>
    );
  }

  const step = Math.max(1, Math.floor(route.length / 100));
  const sampled = route.filter((_, i) => i % step === 0);
  const maxSpeed = Math.max(...sampled.map((p) => p.speed), 1);
  const maxSpeedDisplay = unit === 'mph' ? Math.round(maxSpeed * 0.621371) : Math.round(maxSpeed);
  const unitLabel = unit === 'mph' ? 'mph' : 'km/h';
  const elapsedMs = sampled[sampled.length - 1].timestamp - sampled[0].timestamp;

  const points = sampled.map((p, i) => ({
    x: (i / (sampled.length - 1)) * VB_W,
    y: PAD_TOP + USABLE_H * (1 - p.speed / maxSpeed),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L${VB_W},${VB_H} L0,${VB_H} Z`;

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisVal}>{maxSpeedDisplay}</Text>
          <Text style={styles.axisUnit}>{unitLabel}</Text>
          <View style={styles.axisFlex} />
          <Text style={styles.axisVal}>0</Text>
          {/* spacer to align with x-axis row below */}
          <View style={styles.xAxisSpacer} />
        </View>

        {/* SVG + X-axis */}
        <View style={styles.chartCol}>
          <Svg
            width="100%"
            height={110}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#00C896" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#00C896" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#speedGrad)" />
            <Path
              d={linePath}
              stroke="#00C896"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          {/* X-axis */}
          <View style={styles.xAxis}>
            <Text style={styles.axisVal}>0:00</Text>
            <Text style={styles.axisCenter}>Time elapsed</Text>
            <Text style={styles.axisVal}>{formatElapsed(elapsedMs)}</Text>
          </View>
        </View>
      </View>
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
  },
  empty: {
    color: '#8E8EA0',
    textAlign: 'center',
    paddingVertical: 40,
  },
  chartRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'stretch',
  },
  yAxis: {
    width: 36,
    alignItems: 'flex-end',
  },
  axisFlex: { flex: 1 },
  // matches the xAxis row height so "0" aligns with the bottom of the SVG
  xAxisSpacer: { height: 20 },
  chartCol: {
    flex: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  axisCenter: {
    color: '#505065',
    fontSize: 9,
  },
});
