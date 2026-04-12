const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin — injects TripNotificationModule into the Android project.
 *
 * What it does:
 *  1. Copies TripNotificationModule.kt and TripNotificationPackage.kt into
 *     android/app/src/main/java/com/velox/app/ during prebuild.
 *  2. Registers TripNotificationPackage in MainApplication.kt so React Native
 *     exposes NativeModules.TripNotification to JavaScript.
 */
function withTripNotification(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const packageDir = path.join(
        projectRoot,
        'app/src/main/java/com/velox/app'
      );
      const pluginDir = path.join(__dirname); // same folder as this file

      // ── 1. Copy Kotlin source files ──────────────────────────────────────
      const files = ['TripNotificationModule.kt', 'TripNotificationPackage.kt'];
      for (const file of files) {
        fs.copyFileSync(path.join(pluginDir, file), path.join(packageDir, file));
      }

      // ── 2. Register the package in MainApplication.kt ───────────────────
      const mainAppPath = path.join(packageDir, 'MainApplication.kt');
      let contents = fs.readFileSync(mainAppPath, 'utf8');

      if (!contents.includes('TripNotificationPackage')) {
        // Pattern A (most common in Expo SDK 52):
        //   val packages = PackageList(this).packages
        if (contents.includes('val packages = PackageList(this).packages')) {
          contents = contents.replace(
            'val packages = PackageList(this).packages',
            'val packages = PackageList(this).packages.also { it.add(TripNotificationPackage()) }'
          );
        }
        // Pattern B:
        //   PackageList(this).packages.apply { ... }
        else if (contents.includes('PackageList(this).packages.apply {')) {
          contents = contents.replace(
            'PackageList(this).packages.apply {',
            'PackageList(this).packages.apply {\n      add(TripNotificationPackage())'
          );
        }
        // Pattern C (older Java-style fallback):
        //   packages.addAll(new PackageList(this).getPackages());
        else if (contents.includes('packages.addAll(new PackageList')) {
          contents = contents.replace(
            'packages.addAll(new PackageList(this).getPackages());',
            'packages.addAll(new PackageList(this).getPackages());\n      packages.add(new TripNotificationPackage());'
          );
        }

        fs.writeFileSync(mainAppPath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withTripNotification;
