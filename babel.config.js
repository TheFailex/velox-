module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Hermes (ahead-of-time compiler) rejects dynamic import() calls where
      // the module specifier is a variable rather than a string literal.
      // Some packages (e.g. OpenTelemetry optional peer deps) use this pattern:
      //   import(/* webpackIgnore */ /* turbopackIgnore */ SOME_VAR)
      // Replace any such call with Promise.resolve({}) so Hermes can compile.
      function stubVariableDynamicImports({ types: t }) {
        return {
          visitor: {
            ImportExpression(path) {
              if (!t.isStringLiteral(path.node.source)) {
                path.replaceWith(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('Promise'),
                      t.identifier('resolve')
                    ),
                    [t.objectExpression([])]
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};
