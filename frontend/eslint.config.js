import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin
    },
    settings: {
      react: {
        version: "detect" // auto-detect React version
      }
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off" // Next.js handles React automatically
    }
  },
  prettier
];
