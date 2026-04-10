import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert, Linking } from 'react-native';
import { useTripStore } from '@/store/tripStore';

const TRIP_TRACKING_TASK = 'VELOX_TRIP_TRACKING';

// Must be defined at module level, outside any component or function
TaskManager.defineTask(TRIP_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Velox GPS] Task error:', error);
    return;
  }
  const { locations } = data as { locations: Location.LocationObject[] };
  useTripStore.getState().addGPSPoints(locations);
});

export const locationService = {
  async requestPermissions(): Promise<boolean> {
    // Step 1: foreground permission
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;

    // Step 2: background permission
    // Android 11+ does NOT show a dialog — it opens system Settings directly.
    // Always show an explanation Alert first or the user will be confused and deny.
    if (Platform.OS === 'android') {
      await new Promise<void>((resolve) => {
        Alert.alert(
          'One more step',
          'To track trips in the background, tap "Allow all the time" on the next screen.',
          [{ text: 'Continue', onPress: () => resolve() }],
          { cancelable: false }
        );
      });
    }

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();

    if (bg !== 'granted') {
      if (Platform.OS === 'android') {
        Alert.alert(
          'Background location needed',
          'Go to Settings → Permissions → Location → Allow all the time for accurate trip tracking.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Not now', style: 'cancel' },
          ]
        );
      }
      return false;
    }

    return true;
  },

  async startTracking(): Promise<void> {
    await Location.startLocationUpdatesAsync(TRIP_TRACKING_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5,      // meters between updates
      timeInterval: 2000,       // ms between updates
      showsBackgroundLocationIndicator: true, // iOS blue bar
      foregroundService: {      // Android foreground service notification
        notificationTitle: 'Velox is tracking your trip',
        notificationBody: 'Tap to open Velox',
        notificationColor: '#00C896',
      },
    });
  },

  async stopTracking(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TRIP_TRACKING_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(TRIP_TRACKING_TASK);
    }
  },

  async isTracking(): Promise<boolean> {
    return TaskManager.isTaskRegisteredAsync(TRIP_TRACKING_TASK);
  },
};

export const showBatteryOptimizationPrompt = () => {
  if (Platform.OS !== 'android') return;
  Alert.alert(
    'Improve tracking accuracy',
    'Some Android phones stop background apps to save battery. Disable battery optimization for Velox to ensure your trips are always recorded.',
    [
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
      { text: 'Maybe later', style: 'cancel' },
    ]
  );
};
