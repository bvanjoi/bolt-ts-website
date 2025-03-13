import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindCSS()],
  html: {
    template: './static/index.html',
  },
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /\.txt$/i,
            type: 'asset/source',
          },
        ],
      },
    },
  },
});
