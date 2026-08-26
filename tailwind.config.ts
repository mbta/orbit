// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

/* eslint-disable @typescript-eslint/unbound-method -- the recommended way to make tailwind plugins triggers this */

import fs from "fs";
import path from "path";
import formsPlugin from "@tailwindcss/forms";
import { railTechUITheme } from "rail-tech-ui";
import { default as flattenColorPalette } from "tailwindcss/lib/util/flattenColorPalette";
import plugin from "tailwindcss/plugin";

const lightModePlugin = plugin(({ addVariant }) => {
  addVariant("light", ":where(html.light) &");
  addVariant("dark", [
    ":where(html.dark) &",
    ":where(html:not(.light):not(.dark)) &",
  ]);
});

const branchColorPlugin = plugin(
  ({ matchUtilities, theme }) => {
    // https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables
    const rewriteColor = (colorValue: string) => {
      // intercept tokens from rail-tech-ui formatted: "rgb(var(--some-var) / <alpha-value>)"
      const rgbMatch =
        /^rgb\((var\(--[a-zA-Z0-9-]+\))\s*\/\s*<alpha-value>\)$/.exec(
          colorValue,
        );
      if (rgbMatch) {
        // return just "var(--some-var)"
        return rgbMatch[1];
      }

      // intercept custom colors that have a alpha-value opacity modification
      // built-in. see "glides-mustard-sheer" in rail-tech-ui
      const noAlphaVarMatch = /^(var\(--[a-zA-Z0-9-]+\))$/.exec(colorValue);
      if (noAlphaVarMatch) {
        return noAlphaVarMatch[1];
      }

      // continue to parse hex codes (native tailwind) as fallback
      const hexParseResult = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(
        colorValue,
      );
      if (hexParseResult === null) {
        return null;
      }
      const [, rHex, gHex, bHex] = hexParseResult;
      const r = parseInt(rHex, 16);
      const g = parseInt(gHex, 16);
      const b = parseInt(bHex, 16);
      return `${r} ${g} ${b}`;
    };
    const colorValues: Record<string, string> = {};
    const themeColors = flattenColorPalette(theme("colors"));
    for (const colorKey of Object.keys(themeColors)) {
      const originalColor = themeColors[colorKey];
      const rewrittenColor = rewriteColor(originalColor);
      if (rewrittenColor !== null) {
        colorValues[colorKey] = rewrittenColor;
      }
    }
    matchUtilities(
      {
        "branch-color": (value) => ({ "--color-branch": value }),
      },
      { values: colorValues, type: ["color"] },
    );
  },
  {
    theme: {
      extend: {
        colors: {
          "glides-branch": "rgb(var(--color-branch) / <alpha-value>)",
        },
      },
    },
  },
);

export default {
  presets: [railTechUITheme],
  content: [
    "./js/**/*.js",
    "./js/**/*.ts",
    "./js/**/*.tsx",
    "./lib/orbit_web.ex",
    "./lib/orbit_web/**/*.*ex",
    "./node_modules/rail-tech-ui/src/**/*.{js,ts,tsx}",
  ],
  darkMode: null,
  theme: {
    extend: {
      borderRadius: {
        "4xl": "2rem",
      },
      // Orbit-specific color overrides merged with rail-tech-ui's tokens.
      // Orbit values only override shades they explicitly define; glides-*, heavy-rail-*, etc. are preserved.
      colors: {
        crimson: "#960018",
        tangerine: "#CF8300",
        blue: { DEFAULT: "#003DA5" },
        green: "#145A06",
        gray: {
          100: "#F6F6F6",
          200: "#E8E8E8",
          300: "#929292",
          400: "#494F5C",
          500: "#1C1E23",
        },
        red: { 200: "#FF4531" },
      },
      zIndex: {
        layout: "1000",
        object: "2000",
        header: "2500",
        "modal-backdrop": "3000",
        "modal-content": "3001",
      },
      height: {
        header: "49px",
      },
      animation: {
        "dash-spin-ccw": "dashoffset-spin 2s linear infinite",
        "dash-spin-cw": "dashoffset-spin 3s linear infinite reverse",
        "slide-in-from-left": "slide-in-from-left 0.25s",
      },
      keyframes: {
        "dashoffset-spin": {
          "0%": { "stroke-dashoffset": "0" },
          "100%": { "stroke-dashoffset": "1" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100vh)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [
    lightModePlugin,
    branchColorPlugin,
    formsPlugin,
    // Allows prefixing tailwind classes with LiveView classes to add rules
    // only when LiveView classes are applied, for example:
    //
    //     <div class="phx-click-loading:animate-ping">
    //
    plugin(({ addVariant }) => {
      addVariant("phx-click-loading", [
        ".phx-click-loading&",
        ".phx-click-loading &",
      ]);
    }),
    plugin(({ addVariant }) => {
      addVariant("phx-submit-loading", [
        ".phx-submit-loading&",
        ".phx-submit-loading &",
      ]);
    }),
    plugin(({ addVariant }) => {
      addVariant("phx-change-loading", [
        ".phx-change-loading&",
        ".phx-change-loading &",
      ]);
    }),

    // Embeds Heroicons (https://heroicons.com) into your app.css bundle
    // See your `CoreComponents.icon/1` for more information.
    //
    plugin(function ({ matchComponents, theme }) {
      type Value = { name: string; fullPath: string };
      const iconsDir = path.join(__dirname, "deps/heroicons/optimized");
      const values: Record<string, Value> = {};
      const icons = [
        ["", "/24/outline"],
        ["-solid", "/24/solid"],
        ["-mini", "/20/solid"],
        ["-micro", "/16/solid"],
      ];
      icons.forEach(([suffix, dir]) => {
        fs.readdirSync(path.join(iconsDir, dir)).forEach((file) => {
          const name = path.basename(file, ".svg") + suffix;
          // eslint-disable-next-line better-mutation/no-mutation -- ignoring cuz this came from default phoenix code
          values[name] = { name, fullPath: path.join(iconsDir, dir, file) };
        });
      });
      matchComponents<Value>(
        {
          // @ts-expect-error function might be passed a string, ignoring cuz this came from default phoenix untyped code
          hero: ({ name, fullPath }: Value) => {
            const content = fs
              .readFileSync(fullPath)
              .toString()
              .replace(/\r?\n|\r/g, "");
            let size = theme("spacing.6");
            if (name.endsWith("-mini")) {
              size = theme("spacing.5");
            } else if (name.endsWith("-micro")) {
              size = theme("spacing.4");
            }
            return {
              [`--hero-${name}`]: `url('data:image/svg+xml;utf8,${content}')`,
              "-webkit-mask": `var(--hero-${name})`,
              mask: `var(--hero-${name})`,
              "mask-repeat": "no-repeat",
              "background-color": "currentColor",
              "vertical-align": "middle",
              display: "inline-block",
              width: size,
              height: size,
            };
          },
        },
        { values },
      );
    }),
  ],
};
