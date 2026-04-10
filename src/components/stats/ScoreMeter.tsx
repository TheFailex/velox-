import { View, Text, StyleSheet } from 'react-native';

interface ScoreMeterProps {
  score: number; // 0–100
  size?: 'sm' | 'lg';
}

const SEGMENTS = 20;

function scoreColor(score: number) {
  if (score >= 80) return '#00C896';
  if (score >= 60) return '#F0A500';
  return '#FF4B4B';
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export function ScoreMeter({ score, size = 'lg' }: ScoreMeterProps) {
  const color = scoreColor(score);
  const filled = Math.round((score / 100) * SEGMENTS);
  const isLarge = size === 'lg';

  return (
    <View style={styles.container}>
      {/* Segment bar */}
      <View style={styles.segmentsRow}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              i < filled
                ? { backgroundColor: color, opacity: 0.3 + (i / SEGMENTS) * 0.7 }
                : styles.segmentEmpty,
            ]}
          />
        ))}
      </View>

      {/* Score number */}
      <Text style={[styles.score, { color, fontSize: isLarge ? 56 : 36 }]}>{score}</Text>
      <Text style={[styles.label, isLarge && styles.labelLg]}>{scoreLabel(score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  segmentsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  segment: {
    width: 10,
    height: 6,
    borderRadius: 3,
  },
  segmentEmpty: { backgroundColor: '#1E1E2A' },
  score: { fontWeight: '700', letterSpacing: -1, lineHeight: 60 },
  label: { color: '#8E8EA0', fontSize: 13, fontWeight: '600' },
  labelLg: { fontSize: 14 },
});
