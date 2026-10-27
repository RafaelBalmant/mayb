import { defineConfig } from "vite";
import { seo } from "./scripts/seo.mjs";

export default defineConfig({
  // caminhos relativos: o build funciona em qualquer hospedagem estática
  base: "./",
  plugins: [seo()],
});
