// @ts-check

// apparently it's not standard to publish types for eslint plugins

import pluginJs from "@eslint/js";
// @ts-expect-error no types for this plugin
import pluginBetterMutation from "eslint-plugin-better-mutation";
// @ts-expect-error no types for this plugin
import pluginJest from "eslint-plugin-jest";
// @ts-expect-error no types for this plugin
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
// @ts-expect-error no types for this plugin
import pluginReactHooks from "eslint-plugin-react-hooks";
// @ts-expect-error no types for this plugin
import pluginReactConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  pluginReactConfig,
  {
    ignores: ["*", "!js/", "!*.ts", "!*.mjs"],
  },
  {
    name: "orbit",
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "better-mutation": pluginBetterMutation,
      "jsx-a11y": pluginJsxA11y,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginBetterMutation.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      // allow modifying module.exports
      "better-mutation/no-mutation": ["error", { commonjs: true }],
      // enforce "type" instead of enforcing "interface"
      "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
      // unused arguments are fine if they have a leading _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // `${number}` is fine
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
    },
  },
  {
    files: ["js/test/", "js/**/*.test.*"],
    // we use both jest's recommended and style rules, but only need to set the plugin once here,
    // and it doesn't matter which config we get the plugin from.
    ...pluginJest.configs["flat/recommended"],
    rules: {
      ...pluginJest.configs["flat/style"].rules,
      ...pluginJest.configs["flat/recommended"].rules,
      // empty functions are fine
      "@typescript-eslint/no-empty-function": "off",
      // expect.any is untyped and triggers this all the time.
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  {
    // In this file, some plugins have missing types that cause type-aware lint errors.
    files: ["eslint.config.mjs"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
);
