import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
  // relative paths: the build works on any static host
  base: "./",
  test: { include: ["tests/**/*.test.{js,jsx}"] },
});
