# invoicer

Reports on a file of invoices: what was billed, what was paid and what is still owed, which invoices are overdue,
a CSV export for spreadsheets, and the accounting category of every line item.

```
npm run dev -- summary data/invoices.json
npm run dev -- aging data/invoices.json --today 2026-11-01
npm run dev -- csv data/invoices.json > invoices.csv
npm run dev -- categorize data/invoices.json
```

The invoices file is a JSON list; `data/invoices.json` is an example.

## Categories

`invoicer categorize` asks a model for the category of each line item, one request per invoice. The model is
DeepSeek, through its Anthropic-compatible API with the Anthropic SDK; set

```
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
ANTHROPIC_AUTH_TOKEN=<your DeepSeek key>
```

- `src/categorize/prompt.ts`: the prompt, with accounting's rules for each category.
- `src/categorize/settings.ts`: the model and its parameters.
- `src/categorize/categorize.ts`: the request, and the checks on the answer.

The eval set, `evals/categorize.jsonl`, holds invoices whose categories accounting checked. `npm run eval` runs
each case three times against the real model and prints the failed cases and the pass rate. It needs the settings
above and costs a few cents; the team runs it by hand, and CI does not run it.

## Development

- `npm test` runs the tests (Vitest). The tests of `categorize` use a fake model (`tests/fake-model.ts`) that
  replays scripted replies: no network, no key.
- `npm run typecheck` checks the types (`tsc --noEmit`).
- `npm run build` compiles to `dist/`; `dist/cli.js` is the `invoicer` command.

CI runs `npm run typecheck`, `npm test` and `npm run build` on every pull request.
