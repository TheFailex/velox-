package com.velox.app

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Native module that updates the expo-location foreground service notification in-place,
 * so the user sees a single notification with live speed / distance / duration.
 *
 * Strategy: expo-location's LocationTaskService posts its foreground notification on the
 * channel "${packageName}:VELOX_TRIP_TRACKING".  We find that notification by channel ID
 * at runtime and call NotificationManager.notify() with the same ID — Android replaces it
 * in-place without any pop or flicker.
 */
class TripNotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TripNotification"

  // Must match TRIP_TRACKING_TASK constant in location.ts
  private val channelId: String
    get() = "${reactContext.packageName}:VELOX_TRIP_TRACKING"

  @ReactMethod
  fun update(speed: Int, distanceKm: Double, elapsedSeconds: Int) {
    val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE)
      as? NotificationManager ?: return
    val targetId = findLocationNotifId(nm) ?: return

    val body = formatBody(speed, distanceKm, elapsedSeconds)

    val iconRes = reactContext.resources
      .getIdentifier("notification_icon", "drawable", reactContext.packageName)
      .takeIf { it != 0 } ?: reactContext.applicationInfo.icon

    val intent = reactContext.packageManager
      .getLaunchIntentForPackage(reactContext.packageName)
      ?.also { it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP }
    val pendingFlags =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
      else PendingIntent.FLAG_UPDATE_CURRENT
    val contentIntent = intent?.let {
      PendingIntent.getActivity(reactContext, 0, it, pendingFlags)
    }

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        Notification.Builder(reactContext, channelId)
      else
        @Suppress("DEPRECATION") Notification.Builder(reactContext)

    builder
      .setContentTitle("Velox · Trip in progress")
      .setContentText(body)
      .setSmallIcon(iconRes)
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .setColorized(true)
      .setColor(0xFF00C896.toInt())
    contentIntent?.let { builder.setContentIntent(it) }

    nm.notify(targetId, builder.build())
  }

  @ReactMethod
  fun dismiss() {
    val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE)
      as? NotificationManager ?: return
    // Try to find and cancel by channel; fall back to the static start ID
    val id = findLocationNotifId(nm)
    if (id != null) {
      nm.cancel(id)
    } else {
      // Sweep the full ID range expo-location could have used this session
      for (i in 481756..481800) nm.cancel(i)
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  /**
   * Finds the expo-location foreground service notification ID at runtime.
   * Primary: match by channel ID (reliable on API 26+).
   * Fallback: scan the range expo-location allocates (sServiceId starts at 481756).
   */
  private fun findLocationNotifId(nm: NotificationManager): Int? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val active = nm.activeNotifications
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        active.firstOrNull { it.notification.channelId == channelId }?.id?.let { return it }
      }
      active.firstOrNull { it.id in 481756..481900 }?.id?.let { return it }
    }
    return null
  }

  private fun formatBody(speed: Int, distanceKm: Double, elapsedSeconds: Int): String {
    val h = elapsedSeconds / 3600
    val m = (elapsedSeconds % 3600) / 60
    val s = elapsedSeconds % 60
    val duration =
      if (h > 0) "$h:${pad(m)}:${pad(s)}"
      else "${pad(m)}:${pad(s)}"
    return "$speed km/h  ·  ${"%.2f".format(distanceKm)} km  ·  $duration"
  }

  private fun pad(n: Int) = n.toString().padStart(2, '0')
}
