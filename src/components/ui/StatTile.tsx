import { View, Text, StyleSheet } from 'react-native';

interface StatTileProps {
  value: string;
  label: string;
  icon?: string;
}

export function StatTile({ value, label }: StatTileProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14141C',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  value: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  label: { color: '#8E8EA0', fontSize: 12, marginTop: 4 },
});
