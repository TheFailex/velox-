import { View, Text, StyleSheet } from 'react-native';

interface SpeedGaugeProps {
  speed: number;  // km/h
  active?: boolean;
}

export function SpeedGauge({ speed, active = false }: SpeedGaugeProps) {
  const ringColor = active ? '#00C896' : '#1E1E2A';
  const speedColor = active ? '#FFFFFF' : '#3A3A4A';

  return (
    <View style={[styles.ring, { borderColor: ringColor }]}>
      <View style={[styles.innerRing, { borderColor: `${ringColor}40` }]}>
        <Text style={[styles.speed, { color: speedColor }]}>
          {Math.round(speed)}
        </Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D16',
  },
  innerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speed: {
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 72,
  },
  unit: {
    color: '#8E8EA0',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
