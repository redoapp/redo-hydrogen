import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  tseslint.configs.recommended,
  prettier,
  { ignores: ["dist/", "node_modules/"] },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-extra-boolean-cast": "error",
      eqeqeq: ["error", "always"],
    },
  },
);
