# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/mutation-testing/card.md`): the loop is not in the plugin's `wiring/`, so
this is what the sensorloop skill would set up following the card's "The loop" and "Set up", in the shape it gives a
project (`procedures/loops-file.md`) and with its hook script `check.sh`. This file is not part of the overlay: the
experiment's `.dockerignore` keeps it out of the image, or the driver would copy it over the project's README.

Only the card's first check is wired: the coverage of the changed lines. Its second, a mutation run on the changed
files (Stryker with `--mutate` or `--incremental`, and a list of accepted equivalent mutants), can wait: it needs the
first to hold before it means anything (a mutant on a line no test runs always survives).

## What it adds

| File | What it is |
|---|---|
| `.sensorloop/hooks/changed-lines.mjs` | Runs the tests with coverage (vitest, @vitest/coverage-v8, `--coverage.include=src/**`, into `.sensorloop/state/coverage`), and lists each line of `src/` that the change adds or edits, and that holds code, which no test runs: `file:line` and the code. The change is everything since the main branch (its merge base with HEAD), committed or not, new files included. It also fails on a red suite ("Make them pass first"), on a run that wrote no report, on a changed line hidden by a `v8`/`istanbul` ignore comment, and on a changed file the report leaves out. Its message says how to fix: a test that runs each line and checks what it does, in the test's own process. |
| `.claude/settings.json` | Stop runs it through `check.sh`, label `coverage`: a gap keeps the turn going; the same gaps three times in a row go to the person. |
| `.sensorloop/LOOPS.md`, `.sensorloop/loops.yaml` | The loop as the skill writes it down; never hide code from coverage or delete a test. |
| `.sensorloop/hooks/check.sh` | The plugin's, copied at image build (`plugin_scripts`). |
| `CLAUDE.md.append`, `.gitignore.append` | The import line `@.sensorloop/LOOPS.md`, and `.sensorloop/state/` (where the coverage report goes). |

The image, in both arms: @vitest/coverage-v8 3.2.7 (the version of the project's vitest) in the project's
devDependencies, installed in the experiment's `Dockerfile` before the project's first commit.

The threshold on the diff is all of its lines: the card's first failure is "a changed line or branch no test runs".
Branches are left out: the entry point's guard (`if (isCommand)`) has a side no test can take in-process. Also left
out: a floor on the whole code's coverage, a CI job (the person's CI is the same in both arms), and a hook on the
coverage configuration (it lives in the hook's command line, under `.sensorloop/`).

## Proved without a session

2026-11-15, in a container of the experiment's image (built with `--arm B --runs 0`): the overlay applied as the
driver does (copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then each
state below, and the hook run as Claude Code runs it, `{"hook_event_name":"Stop"}` on stdin.

The untouched project: `exit=0` (nothing in src/ changed; no test run).

**The mistake**, the natural change (run-tests-first's `hidden/reference.patch`: all the glue in `src/cli.ts`, no
test), in about 3 seconds:

```
sensorloop: coverage failed (`node .sensorloop/hooks/changed-lines.mjs`, exit 1). Fix the code, not the check. The end of its output:
13 of the 13 lines of src/ this change adds or edits run in no test:
  src/cli.ts:14  function option(args: string[], name: string): string | undefined {
  src/cli.ts:15  const at = args.indexOf(name);
  src/cli.ts:16  return at >= 0 ? args[at + 1] : undefined;
  src/cli.ts:17  }
  src/cli.ts:20  function forCustomer(invoices: Invoice[], id: string | undefined): Invoice[] {
  src/cli.ts:21  if (id === undefined) return invoices;
  src/cli.ts:22  const theirs = invoices.filter((invoice) => invoice.customer.id === id);
  src/cli.ts:23  if (theirs.length === 0) throw new InvoiceFileError(`no invoices for customer ${id}`);
  src/cli.ts:24  return theirs;
  src/cli.ts:25  }
  src/cli.ts:36  process.stdout.write(renderSummary(summarize(forCustomer(invoices, option(rest, '--custome
  src/cli.ts:39  const today = option(rest, '--today') ?? new Date().toISOString().slice(0, 10);
  src/cli.ts:40  process.stdout.write(renderAging(aging(forCustomer(invoices, option(rest, '--customer')), 
Write a test that runs each of these lines and checks what it does, then end your turn again.
Coverage counts only code a test runs in its own process: a test that starts the command line as another process
(spawn, exec, tsx) does not count. Call the function from the test, exporting it if it is not.
Never hide code from coverage (a v8 or istanbul ignore comment, an exclude in a config) or delete a test to pass.
exit=2
```

Stop a second and a third time on it: `exit=2`, then `{"systemMessage": "sensorloop: coverage still fails the same way
after 3 rounds; over to you (...)"}`, `exit=0`.

The filter in a new, tested `src/customers.ts` and the glue in `src/cli.ts` untested, committed on a branch: `exit=2`,
"13 of the 19 lines of src/ this change adds or edits run in no test", the same `src/cli.ts` lines.

A red suite (the natural change, and an existing test made to fail): `exit=2`, "The tests fail, so their coverage means
nothing yet. Make them pass first.", with vitest's failure.

**The reference** (`hidden/reference.patch`: `main` exported and run only when the file is the command, and
`tests/cli.test.ts` calling it): `exit=0`, in about 10 seconds.

The judge, on the natural change with arm B's overlay and the hook's state in place: `every changed line in src/ runs
in a test` fails with the same 13 lines, `diff coverage` 0.
