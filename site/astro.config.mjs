// superloops.dev: Astro with static output, written to dist/ (the folder wrangler.jsonc serves).
import { defineConfig } from 'astro/config';
import { analyticsSnippet } from './src/config.mjs';

export default defineConfig({
  site: 'https://superloops.dev',
  output: 'static',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [
    {
      name: 'superloops',
      // Stop before building while the analytics token in src/config.mjs is empty or malformed.
      hooks: { 'astro:config:setup': () => void analyticsSnippet() },
    },
  ],
});
