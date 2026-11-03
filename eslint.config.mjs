import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      "dist/",
      ".next/",
      ".next-*/",
      "out/",
      "out-*/",
      "node_modules/",
      "test-results/",
      "playwright-report/",
      "src/faces/*.svg",
    ],
  },
  js.configs.recommended,
  ...nextVitals,
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "react/prop-types": "off", // no PropTypes in this project
      // The site is a static export, where next/image cannot optimize images; the photos are made light ahead of
      // time instead (npm run images: AVIF/WebP in two sizes, with width/height), so plain <img> is the right tag.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.{js,jsx}", "*.config.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    // e2e specs run in Node, but the callbacks given to page.evaluate run in the browser
    files: ["e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // the prototype page: built in Node, its stand-ins for Next.js run in the browser
    files: ["scripts/prototype/**/*.{js,jsx,mjs}"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettier,
];

export default config;
