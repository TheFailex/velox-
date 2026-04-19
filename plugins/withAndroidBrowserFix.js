const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Forces androidx.browser to 1.8.0 to avoid compileSdk/AGP version conflicts.
 * react-native-purchases pulls in androidx.browser:1.9.0 which requires
 * compileSdk 36 AND AGP 8.9.1 — this pins it to a compatible version.
 */
function withAndroidBrowserFix(config) {
  return withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;

    const injection = `
configurations.all {
    resolutionStrategy.eachDependency { details ->
        if (details.requested.group == 'androidx.browser' && details.requested.name == 'browser') {
            details.useVersion '1.8.0'
            details.because 'AGP 8.8.2 compatibility'
        }
        if (details.requested.group == 'org.jetbrains.kotlin' && details.requested.name == 'kotlin-stdlib') {
            details.useVersion '2.1.20'
            details.because 'Kotlin compiler 2.1.20 compatibility'
        }
    }
}
`;

    if (!gradle.includes("androidx.browser")) {
      config.modResults.contents = gradle.replace(
        /^dependencies \{/m,
        injection + '\ndependencies {'
      );
    }

    return config;
  });
}

module.exports = withAndroidBrowserFix;
