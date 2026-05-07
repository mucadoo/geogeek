import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import ts from "typescript-eslint";

const eslintConfig = [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: {
      "@next/next": next,
      "import": importPlugin,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,

      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",

      "import/order": [
        "warn",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ]
    }
  },
  {
    ignores: [
      ".next/*",
      "out/*",
      "build/*",
      "next-env.d.ts",
      "node_modules/*"
    ]
  }
];

export default eslintConfig;
