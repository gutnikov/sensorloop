# invoicer-web

The invoices, their customers and what is still owed, in the browser. It reads the same JSON file of invoices as the
`invoicer` command line tool (`data/invoices.json` is an example).

```
npm run dev                  # http://localhost:3000, reloads on changes
npm run build && npm start   # as it runs in production
```

`PORT` sets the port (3000) and `INVOICES_FILE` the invoices file (`data/invoices.json`).

## Pages

- `/invoices`: every invoice, newest first, with a filter.
- `/invoices/<id>`: one invoice.
- `/customers`: each customer, with what they were billed and what they owe.

The pages are rendered on the server (`src/pages/`, with the `html` template tag, which escapes every value). The few
scripts a page needs are in `public/js/`, and each page loads only its own.

## Development

- `npm test`: the unit tests (Vitest, `tests/`).
- `npm run typecheck`: the types (`tsc --noEmit`).
- `npm run build`: compiles `src/` to `dist/`.
- `npm run test:e2e`: the browser tests (Playwright, `e2e/`). They build and start the app on port 3100.
- `npm run lighthouse`: the page audit (Lighthouse CI, `lighthouserc.json`): three pages, three runs each, against the
  minimums in its config. It builds and starts the app on port 3200; the reports go to `.lighthouseci/`.

CI runs all of them on every pull request (`.github/workflows/ci.yml`).
