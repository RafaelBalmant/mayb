import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["dist/", "node_modules/", "src/rostos/*.svg"] },
  js.configs.recommended,
  { rules: { "no-empty": ["error", { allowEmptyCatch: true }] } },
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.js", "e2e/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
  prettier,
];
