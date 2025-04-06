import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/experimental-ct-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.resolve(__dirname, './tests'),
});
