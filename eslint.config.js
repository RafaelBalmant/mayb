import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "node_modules/", "test-results/", "playwright-report/", "src/faces/*.svg"] },
  js.configs.recommended,
  { rules: { "no-empty": ["error", { allowEmptyCatch: true }] } },
  {
    files: ["src/**/*.{js,jsx}"],
    ...react.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18" } }, // Preact is API-compatible; there is no react package to detect
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off", // no PropTypes in this project
      "react/no-unknown-property": "off", // Preact uses class/for, not className/htmlFor
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.js", "e2e/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
  prettier,
];
