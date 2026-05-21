const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // @supabase/supabase-js ships an .mjs version that contains
  //   import(/* webpackIgnore *//* turbopackIgnore */ OTEL_PKG)
  // Hermes can't compile dynamic imports with variable specifiers.
  // The .cjs version is identical but uses require() instead, so redirect to it.
  if (moduleName === '@supabase/supabase-js') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/@supabase/supabase-js/dist/index.cjs'
      ),
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
