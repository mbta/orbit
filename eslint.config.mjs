// @ts-check

import pluginJs from "@eslint/js";
// @ts-expect-error couldn't find types for this package
import pluginReactConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
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
    },
  },
);
