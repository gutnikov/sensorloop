// superloops.dev: Astro with static output, written to dist/ (the folder wrangler.jsonc serves). Every page is built
// from the repository's content: docs/ (the metamodel) and catalog/ (the cards, read through @superloops/catalog).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { analyticsSnippet } from './src/config.mjs';

const REPOSITORY = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = {
  catalogDir: path.join(REPOSITORY, 'catalog'),
  docsDir: path.join(REPOSITORY, 'docs'),
};

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
  vite: {
    define: { __CONTENT__: JSON.stringify(CONTENT) },
    plugins: [reloadOnContent()],
  },
});

/** In dev, a change to a card or a doc reloads the page: they live outside site/, where Vite does not look. */
function reloadOnContent() {
  const dirs = Object.values(CONTENT);
  return {
    name: 'superloops-reload-on-content',
    configureServer(server) {
      server.watcher.add(dirs);
      const reload = (file) => {
        if (dirs.some((dir) => file.startsWith(dir + path.sep))) server.ws.send({ type: 'full-reload' });
      };
      for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, reload);
    },
  };
}
