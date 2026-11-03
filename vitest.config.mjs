import { defineConfig } from "vitest/config";

export default defineConfig({
  // React's automatic JSX runtime, as Next.js uses (no `import React` in the components)
  esbuild: { jsx: "automatic" },
  test: {
    include: ["tests/**/*.test.{js,jsx}"],
    // as next.config.mjs (trailingSlash), so <Link> writes the same addresses as in the built pages
    env: { __NEXT_TRAILING_SLASH: "true" },
  },
});
