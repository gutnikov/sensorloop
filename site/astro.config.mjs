// sensorloop.dev: Astro with static output, written to dist/ (the folder wrangler.jsonc serves). Every page is built
// from the repository's content: docs/ (the metamodel) and catalog/ (the cards, read through @sensorloop/catalog).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { analyticsSnippet } from './src/config.mjs';

const SITE = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY = path.dirname(SITE);
const CONTENT = {
  catalogDir: path.join(REPOSITORY, 'catalog'),
  docsDir: path.join(REPOSITORY, 'docs'),
};

// The site's look: the shell around every page and the home page, from src/looks/<LOOK>/, imported as @look. The
// default is the published one, `tui-modern`; another (`report`, the look before it, or a new prototype) runs with
// `LOOK=report npm run dev -- --port 4401`. Each look gets its own caches and build folder, so several can run side
// by side.
const PUBLISHED = 'tui-modern';
const LOOK = process.env.LOOK || PUBLISHED;
const PROTOTYPE = LOOK !== PUBLISHED;

export default defineConfig({
  site: 'https://sensorloop.dev',
  output: 'static',
  ...(PROTOTYPE && { outDir: `./dist-looks/${LOOK}`, cacheDir: `./node_modules/.astro-${LOOK}` }),
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [
    {
      name: 'sensorloop',
      // Stop before building while the analytics token in src/config.mjs is empty or malformed.
      hooks: { 'astro:config:setup': () => void analyticsSnippet() },
    },
  ],
  vite: {
    define: { __CONTENT__: JSON.stringify(CONTENT) },
    resolve: { alias: { '@look': path.join(SITE, 'src', 'looks', LOOK) } },
    ...(PROTOTYPE && { cacheDir: `./node_modules/.vite-${LOOK}` }),
    // A look's build, written beside the site, must not reload the other looks' dev servers.
    server: { watch: { ignored: ['**/dist-looks/**'] } },
    plugins: [reloadOnContent()],
  },
});

/** In dev, a change to a card or a doc reloads the page: they live outside site/, where Vite does not look. */
function reloadOnContent() {
  const dirs = Object.values(CONTENT);
  return {
    name: 'sensorloop-reload-on-content',
    configureServer(server) {
      server.watcher.add(dirs);
      const reload = (file) => {
        if (dirs.some((dir) => file.startsWith(dir + path.sep))) server.ws.send({ type: 'full-reload' });
      };
      for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, reload);
    },
  };
}
