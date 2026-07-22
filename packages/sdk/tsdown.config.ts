import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  dts: true,
  // Catches an accidental Node builtin import with a build warning instead
  // of silently shipping something that breaks in a browser; this package
  // has no legitimate use for one (see the browser-safety property audited
  // when packages/core was first written).
  platform: "browser",
  clean: true,
  // @tip/core is a devDependency (workspace:*, never published), so
  // tsdown's default rule (dependencies stay external, devDependencies are
  // bundled if actually used) already inlines it. @solana/kit and
  // @solana/addresses stay in "dependencies", so the same default rule
  // keeps them external. Nothing else to configure here.
});
