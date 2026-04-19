import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Exists only so Expo Router doesn't throw an unmatched route when
 * velox://auth/callback arrives. All routing is handled in _layout.tsx.
 */
export default function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00C896" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' },
});
