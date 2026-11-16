# Contributing

## A feature starts from its issue's spec

An issue for a feature says what the feature is for, and lists its acceptance criteria, numbered AC1, AC2 and so on.
The criteria are the spec: the feature is done when each of them holds.

## Tests come from the spec

- Each acceptance criterion gets at least one test that checks it, and the test's name starts with the criterion's
  id: `it('AC3: lists the most overdue first', ...)`. In review we read the criteria and their tests side by side.
- A command's criteria are tested by running the command: `runCli` in `tests/helpers/cli.ts` runs invoicer from the
  source, and `invoice` and `writeInvoices` make the invoices a test needs. The tests of a command go in
  `tests/<command>.test.ts`; `tests/aging.test.ts` is an example.
- A test uses invoices made for it, not the example file in `data/`.

## Before a pull request

`npm run typecheck`, `npm test` and `npm run build` pass; CI runs the same.
