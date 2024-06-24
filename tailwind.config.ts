// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

import fs from "fs";
import path from "path";
import formsPlugin from "@tailwindcss/forms";
import plugin from "tailwindcss/plugin";

export default {
  content: [
    "./js/**/*.js",
    "./js/**/*.ts",
    "./js/**/*.tsx",
    "./lib/orbit_web.ex",
    "./lib/orbit_web/**/*.*ex",
    "./storybook/**/*.html",
  ],
  darkMode: ["class", '[data-mode="dark"]'],
  theme: {
    colors: {
      "mbta-red": "#DA291C",
      "mbta-orange": "#ED8B00",
      "mbta-blue": "#003DA5",
      black: "#000000",
      gray: {
        100: "#EAEAEA",
        200: "#D9D9D9",
        300: "#929292",
      },
    },
    zIndex: {
      layout: "1000",
      object: "2000",
      "modal-backdrop": "3000",
      "modal-content": "3001",
    },
  },
  plugins: [
    formsPlugin,
    // Allows prefixing tailwind classes with LiveView classes to add rules
    // only when LiveView classes are applied, for example:
    //
    //     <div class="phx-click-loading:animate-ping">
    //
    plugin(({ addVariant }) => {
      addVariant("phx-no-feedback", [
        ".phx-no-feedback&",
        ".phx-no-feedback &",
      ]);
    }),
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
