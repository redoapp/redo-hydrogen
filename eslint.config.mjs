import tseslint from "typescript-eslint";

export default tseslint.config(
  tseslint.configs.recommended,
  { ignores: ["dist/", "node_modules/"] },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
);
