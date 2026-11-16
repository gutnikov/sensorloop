# Architecture

- `src/cli.ts` is the only entry point. It reads the arguments, calls the rest, and writes to the terminal.
- `src/parse.ts` reads the invoices file and checks every field. It is the only module that reads files.
- `src/invoice.ts`, `src/money.ts`, `src/discounts.ts`: the arithmetic. Pure functions.
- `src/report/` and `src/export/`: pure functions from invoices to a report or a CSV. They do no I/O: no files, no
  network, no clock. What they need (such as today's date) is passed in by `cli.ts`.
