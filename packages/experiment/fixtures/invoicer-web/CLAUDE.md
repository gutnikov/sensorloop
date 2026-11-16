# invoicer-web

A small web app over a JSON file of invoices. TypeScript on Node 22, Express, ES modules. Pages are rendered on the
server; the little client-side JavaScript there is lives in `public/js/`.

- `src/`: `server.ts` starts the app, `app.ts` holds the routes, `pages/` renders the pages, `store.ts` reads the file.
- `tests/`: unit tests (Vitest). `e2e/`: browser tests (Playwright).

Commands: `npm test` (unit tests), `npm run typecheck` (types), `npm run build` (compile to `dist/`),
`npm run test:e2e` (browser tests), `npm run lighthouse` (page audit). CI runs all five.
