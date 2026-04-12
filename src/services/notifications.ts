import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { GPSPoint } from '@/types';
import { totalDistanceKm } from '@/utils/distance';

const TRIP_NOTIFICATION_ID = 'velox-trip-live';
const CHANNEL_ID = 'velox-trip';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Trip tracking',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0],
      enableVibrate: false,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function updateTripNotification(
  gpsPoints: GPSPoint[],
  startTime: number
): Promise<void> {
  if (gpsPoints.length === 0) return;

  const speed = Math.round(gpsPoints[gpsPoints.length - 1].speed);
  const distance = totalDistanceKm(gpsPoints);
  const duration = Math.floor((Date.now() - startTime) / 1000);

  // KEY FIX: do NOT dismiss before re-scheduling.
  // Scheduling with the same identifier replaces the existing notification
  // in-place on Android (no pop animation, no flicker).
  await Notifications.scheduleNotificationAsync({
    identifier: TRIP_NOTIFICATION_ID,
    content: {
      title: 'Velox · Trip in progress',
      body: `${speed} km/h  ·  ${distance.toFixed(2)} km  ·  ${formatDuration(duration)}`,
      data: {},
      sound: false,   // no sound on each update — silent in-place update
      sticky: true,   // persists until stopTrip dismisses it
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: null,
  });
}

export async function dismissTripNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(TRIP_NOTIFICATION_ID);
  } catch {
    // safe to ignore
  }
}
