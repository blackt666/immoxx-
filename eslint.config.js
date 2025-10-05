import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "client/dist/**", "client/node_modules/**", "test-results/**", "playwright-report/**"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...pluginReactConfig,
    files: ["**/*.{jsx,tsx}"],
    rules: {
        ...pluginReactConfig.rules,
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unknown-property": ["error", { "ignore": ["cmdk-input-wrapper"] }]
    },
    settings: {
        react: {
            version: "detect"
        }
    }
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "writable",
        RequestInit: "readonly",
        NodeJS: "readonly"
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-case-declarations": "off",
      "prefer-const": "warn",
      "no-prototype-builtins": "warn",
      "no-undef": "warn"
    },
  },
  {
    files: ["**/tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];
