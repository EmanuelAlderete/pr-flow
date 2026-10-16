import tailwindcss from "@tailwindcss/postcss";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import postcss from "postcss";

// Vite prepends postcss-import, which drops @import rules that follow Tailwind's
// @plugin. Compile globals.css with the app's PostCSS plugin before that pass.
function tailwindPostcssPlugin() {
  return {
    name: "pr-flow-tailwind-postcss",
    enforce: "pre" as const,
    async transform(code: string, id: string) {
      const filePath = id.split("?")[0];
      if (!filePath.endsWith(".css")) return null;
      if (!code.includes('@import "tailwindcss"') && !code.includes("@import 'tailwindcss'")) {
        return null;
      }

      const result = await postcss([tailwindcss()]).process(code, { from: filePath });
      return {
        code: result.css,
        map: result.map?.toString() ?? null
      };
    }
  };
}

const config: StorybookConfig = {
  stories: ["../{components,modules}/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindPostcssPlugin()];
    return config;
  }
};

export default config;
