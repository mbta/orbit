// Resolved by esbuild via NODE_PATH=deps/; imported only for side effects.
declare module "phoenix_html";

declare module "tailwindcss/lib/util/flattenColorPalette" {
  export default function flattenColorPalette(
    colors: Record<string, string | Record<string, string>>,
  ): Record<string, string>;
}
