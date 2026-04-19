import { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Gauge geometry ───────────────────────────────────────────────────────────
const SIZE = 240;
const CX = SIZE / 2;       // 120
const CY = SIZE / 2;       // 120
const ARC_R = 96;          // radius of the speed fill arc
const TICK_OUTER_R = 110;  // outer edge of ticks
const TICK_MINOR_INNER_R = 103; // inner edge of minor ticks
const TICK_MAJOR_INNER_R = 97;  // inner edge of major ticks

const GAUGE_START_DEG = -130;  // degrees from 12 o'clock, clockwise (≈7:30 position)
const GAUGE_SPAN_DEG  = 260;   // total sweep
const TICK_COUNT      = 52;
const MAX_SPEED       = 200;   // km/h → 100% fill

// ─── Color mapping ────────────────────────────────────────────────────────────
function speedToColor(ratio: number): string {
  if (ratio < 0.30) return '#00C896'; // green
  if (ratio < 0.50) return '#7CC860'; // yellow-green
  if (ratio < 0.68) return '#F0A500'; // amber
  if (ratio < 0.84) return '#FF7A00'; // orange
  return '#FF4B4B';                    // red
}

// ─── Polar helpers (regular JS — only used at render time) ────────────────────
function toXY(deg: number, r: number): { x: number; y: number } {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcD(startDeg: number, spanDeg: number, r: number): string {
  if (spanDeg <= 0) return '';
  const cappedSpan = Math.min(spanDeg, 359.9);
  const s = toXY(startDeg, r);
  const e = toXY(startDeg + cappedSpan, r);
  const large = cappedSpan > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SpeedGaugeProps {
  speed: number;          // always km/h internally
  active?: boolean;
  unit?: 'kmh' | 'mph';
}

export function SpeedGauge({ speed, active = false, unit = 'kmh' }: SpeedGaugeProps) {
  const displaySpeed = unit === 'mph' ? speed * 0.621371 : speed;
  const unitLabel = unit === 'mph' ? 'mph' : 'km/h';
  // Animated ratio 0→1 driving the arc length
  const animRatio = useSharedValue(0);

  useEffect(() => {
    const target = active ? Math.min(speed / MAX_SPEED, 1) : 0;
    animRatio.value = withSpring(target, { damping: 20, stiffness: 140, mass: 0.6 });
  }, [speed, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const ratio = active ? Math.min(speed / MAX_SPEED, 1) : 0;
  const arcColor = active ? speedToColor(ratio) : '#2A2A3A';
  const numColor = active ? '#FFFFFF' : '#3A3A4A';
  const unitColor = active ? '#8E8EA0' : '#2A2A3A';

  // Animated arc — path is computed on UI thread (worklet)
  const animProps = useAnimatedProps(() => {
    const r = animRatio.value;
    if (r <= 0) return { d: '' };

    // Inline polar-to-cartesian so this runs as a worklet with no external calls
    const startDeg = -130;
    const spanDeg = r * 260;
    const cappedSpan = spanDeg > 359.9 ? 359.9 : spanDeg;
    const R = 96;

    const sRad = (startDeg - 90) * (Math.PI / 180);
    const eRad = (startDeg + cappedSpan - 90) * (Math.PI / 180);

    const sx = 120 + R * Math.cos(sRad);
    const sy = 120 + R * Math.sin(sRad);
    const ex = 120 + R * Math.cos(eRad);
    const ey = 120 + R * Math.sin(eRad);
    const large = cappedSpan > 180 ? 1 : 0;

    return {
      d: `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`,
    };
  });

  // Tick marks — computed once (memoized)
  const ticks = useMemo(() => (
    Array.from({ length: TICK_COUNT }, (_, i) => {
      const tickRatio = i / (TICK_COUNT - 1);
      const deg = GAUGE_START_DEG + tickRatio * GAUGE_SPAN_DEG;
      const isMajor = i % 4 === 0;
      const outerR = TICK_OUTER_R;
      const innerR = isMajor ? TICK_MAJOR_INNER_R : TICK_MINOR_INNER_R;
      const outer = toXY(deg, outerR);
      const inner = toXY(deg, innerR);
      return { outer, inner, isMajor, tickRatio };
    })
  ), []);

  // Background track (full arc)
  const bgArcPath = useMemo(
    () => arcD(GAUGE_START_DEG, GAUGE_SPAN_DEG, ARC_R),
    []
  );

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {/* ── Background track ── */}
        <Path
          d={bgArcPath}
          stroke="#18182A"
          strokeWidth={6}
          fill="none"
          strokeLinecap="butt"
        />

        {/* ── Tick marks ── */}
        {ticks.map((tick, idx) => {
          const isActive = active && tick.tickRatio <= ratio;
          const color = isActive ? speedToColor(tick.tickRatio) : '#252535';
          return (
            <Path
              key={idx}
              d={`M ${tick.outer.x.toFixed(2)} ${tick.outer.y.toFixed(2)} L ${tick.inner.x.toFixed(2)} ${tick.inner.y.toFixed(2)}`}
              stroke={color}
              strokeWidth={tick.isMajor ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Animated speed fill arc ── */}
        <AnimatedPath
          animatedProps={animProps}
          stroke={arcColor}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      {/* ── Center overlay (speed + unit) ── */}
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.num, { color: numColor }]}>
          {Math.round(displaySpeed)}
        </Text>
        <Text style={[styles.unit, { color: unitColor }]}>{unitLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 72,
  },
  unit: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
