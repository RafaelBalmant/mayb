import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { seo } from "./scripts/seo.mjs";

export default defineConfig({
  plugins: [preact(), seo()],
  // relative paths: the build works on any static host
  base: "./",
  test: { include: ["tests/**/*.test.{js,jsx}"] },
});
