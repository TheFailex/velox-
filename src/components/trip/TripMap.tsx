import { View, Text, StyleSheet } from 'react-native';

export function TripMap() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Map — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 200,
    backgroundColor: '#14141C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  text: { color: '#8E8EA0' },
});
