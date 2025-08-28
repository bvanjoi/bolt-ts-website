import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
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
