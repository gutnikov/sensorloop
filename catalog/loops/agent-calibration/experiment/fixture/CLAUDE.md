# invoicer

A command-line tool that reports on a JSON file of invoices. TypeScript on Node 22, ES modules.

- `src/`: the code. `cli.ts` is the entry point; `report/` holds the summary and aging reports, `export/` the CSV,
  `categorize/` the line categories, which ask a model (DeepSeek, through the Anthropic SDK).
- `tests/`: Vitest tests. `tests/fake-model.ts` stands in for the model.
- `evals/`: graded examples. `categorize.jsonl` is the eval set of `categorize`; `line-clarity.jsonl` holds invoice
  lines that accounting graded clear or vague, each with why.
- `invoices/`: the invoices we send, one file a month; CI checks them.

Commands: `npm test` (tests), `npm run typecheck` (types), `npm run build` (compile to `dist/`), `npm run eval` (the
eval set, against the real model).
