// @ts-check

// apparently it's not standard to publish types for eslint plugins

import pluginJs from "@eslint/js";
// @ts-expect-error no types for this plugin
import configPrettier from "eslint-config-prettier";
// @ts-expect-error no types for this plugin
import pluginBetterMutation from "eslint-plugin-better-mutation";
import pluginJest from "eslint-plugin-jest";
import pluginJestDom from "eslint-plugin-jest-dom";
// @ts-expect-error no types for this plugin
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
// @ts-expect-error no types for this plugin
import pluginReactHooks from "eslint-plugin-react-hooks";
// @ts-expect-error no types for this plugin
import pluginReactJsx from "eslint-plugin-react/configs/jsx-runtime.js";
// @ts-expect-error no types for this plugin
import pluginReactRecommended from "eslint-plugin-react/configs/recommended.js";
import pluginStorybook from "eslint-plugin-storybook";
import pluginTestingLibrary from "eslint-plugin-testing-library";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // jsx-runtime only disables rules, so need both recommended and jsx.
  {
    ...pluginReactRecommended,
    settings: { react: { version: "detect" } },
  },
  ...pluginStorybook.configs["flat/recommended"],
  pluginReactJsx,
  configPrettier,
  {
    ignores: ["*", "!js/", "!*.ts", "!*.mjs"],
  },
  {
    name: "orbit",
    linterOptions: {
      reportUnusedDisableDirectives: "error",
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
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      // unused arguments are fine if they have a leading _
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          reportUsedIgnorePattern: true,
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
    files: ["js/test/**", "js/**/*.test.*"],
    plugins: {
      jest: pluginJest,
      "jest-dom": pluginJestDom,
      "testing-library": pluginTestingLibrary,
    },
    rules: {
      ...pluginJest.configs["flat/style"].rules,
      ...pluginJest.configs["flat/recommended"].rules,
      ...pluginJestDom.configs["flat/recommended"].rules,
      ...pluginTestingLibrary.configs["flat/react"].rules,
      // empty functions are fine
      "@typescript-eslint/no-empty-function": "off",
      // ! is fine in tests
      "@typescript-eslint/no-non-null-assertion": "off",
      // expect.any is untyped and triggers this all the time.
      "@typescript-eslint/no-unsafe-assignment": "off",
      // expect(method) triggers this
      "@typescript-eslint/unbound-method": "off",
      // sometimes the easiest way to mock a complex test setup is to mutate something
      "better-mutation/no-mutation": "off",
      "better-mutation/no-mutating-methods": "off",
      /* we do `view = render(); view.getBy()` which also doesn't require destructuring
      and has less global mutable state than `screen`. */
      "testing-library/prefer-screen-queries": "off",
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
