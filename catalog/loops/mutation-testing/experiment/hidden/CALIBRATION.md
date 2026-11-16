# Calibration of the judge

What the judge was checked on before any run, then its calibration on the ten valid runs of `runs/ab-1/` (the last
section).

## What it judges

- The feature, through the CLI, as in run-tests-first (the same issue, #21): `summary --customer`, `aging
  --customer`, an unknown id refused and named, the reports unchanged without the option.
- `tests pass`, and `coverage measured`: vitest with @vitest/coverage-v8 (`--coverage.include=src/**`, JSON report in
  a folder of the judge's own) wrote a report of src/.
- `every changed line in src/ runs in a test` (the qualify rule): the lines of src/ that the diff since
  `SETUP_COMMIT` adds or edits, and the lines of new files, that hold code (a statement starts on them in the
  report: types, comments and braces alone do not count), each run by a test at least once. A line with a `v8`,
  `c8` or `istanbul` ignore comment counts as not run, and so does every code line of a changed file the report leaves
  out (the card: hidden code counts as uncovered). Test files are not counted.
- Measures: the changed lines that hold code, those no test runs, the diff coverage in percent, the branches on
  changed lines no test takes (a measure only: the branch of the entry point's "is this the command" guard can never
  be taken in a test's process), and the test files changed.

## Verified before any run

2026-11-15, in the experiment's image, each state applied at /work as node and judged as the driver does (`git add -A
-N`, then `node judge.mjs /work /tmp/out` from /tmp with `SETUP_COMMIT`):

| State | Feature | `every changed line in src/ runs in a test` | diff coverage |
|---|---|---|---|
| untouched | 3 of 4 fail | fail, "no change in src/" | none |
| run-tests-first's `reference.patch`: the glue in `src/cli.ts`, no test (the natural change) | pass | fail, "13 of 13 changed lines no test runs: src/cli.ts:14-17, 20-25, 36, 39-40" | 0 |
| the filter in a new `src/customers.ts` with a test, the glue in `src/cli.ts` untested | pass | fail, 13 of 19 | 31.6 |
| the reference with `/* v8 ignore next */` added above a changed line | pass | fail, "src/cli.ts:16 (a coverage exclusion)" | 94.1 |
| `reference.patch` | pass | pass, 17 lines | 100 |

`reference.patch`: `src/cli.ts` exports `main` and runs it only when the file is the command
(`realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)`), so a test can import it; `--customer` is
`option()` and `forCustomer()` beside it; `tests/cli.test.ts` calls `main` in its own process for the summary and the
aging report with and without the option, and for an unknown id. `npm run typecheck`, `npm test` and `npm run build`
pass on it, and `node dist/cli.js` works as before (an unknown id: `invoicer: no invoices for customer nobody`, exit 1).

## Doubts

- The rule is strict: every changed line, the card's first failure, rather than a threshold such as 80%. Today no test
  runs `src/cli.ts`, and v8 coverage counts only code run in the test's own process, so a change to `src/cli.ts` passes
  only when a test imports it, which its top-level call to `main` makes awkward. The diff coverage is measured too, if
  the owner prefers a threshold.

## Calibration on the ab-1 runs

The judge's first use on real runs. The ten valid runs of `runs/ab-1/` (deepseek-flash, arm A runs 1, 4, 5, 6, 7 and
arm B runs 1 to 5), read on 2026-11-16: each run's steps (`node packages/experiment/src/steps.js <run dir>`, whose
numbering the steps below follow), its `driver.log`, its `diff.patch`, the files of its first hand-over
(`first-handover/first.tar`) and the verdicts. Arm A runs 2 and 3 are left out: the model's API refused with "402
Insufficient Balance" (`run.json`'s `error`). In all ten runs the first hand-over is also the end (`same_as_final:
true`, `later_dones: 0`), and nothing was committed. Line numbers are those of the files at the first hand-over.

### The loop's mistake (`every changed line in src/ runs in a test` fails)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | mistake | mistake | `src/cli.ts`: `option()` (lines 20-26), `selected()` (29-31), their calls (42, 47) and the new catch (62-70). No test imports the file: `tests/cli.test.ts` starts it as another process (`spawnSync(process.execPath, ['--import', 'tsx', ...src/cli.ts])`, line 43), which coverage does not see, "so the flag wiring and error handling stay covered" (step 24). Even in that process no test runs the usage error (`src/cli.ts:63-64`) or the rethrow (69). The filter, `src/invoice.ts:26-37`, is tested in `tests/invoice.test.ts`. |
| A 4 | mistake | mistake | `src/cli.ts`: `option()` (18-24), the customer read (33), the filter's calls (36, 40), `--today` through `option()` (39), the new catch (55-63). The only new test, `tests/customer.test.ts`, imports `src/invoice.ts`: "Now add tests for the filter:" (step 21). The command was run by hand (steps 25-26). |
| A 5 | mistake | mistake | `src/cli.ts`: `option()` (18-24), `reportInvoices()` (27-30), the calls (40, 43-44, 48), the new catch (59-67). `tests/filter.test.ts` imports only `src/filter.ts`. The command was run by hand: "Now let me verify the CLI behavior end to end." (step 22). |
| A 6 | mistake | mistake | `src/cli.ts`: `option()` (19-25), `reportInvoices()` (28-31), the calls (42, 45-46), the new catch (61-69). `tests/customer.test.ts` imports only `src/customer.ts`. |
| A 7 | mistake | mistake | `src/cli.ts`: `option()` (16-22), `selectInvoices()` (25-28), the calls (39, 42-43); the catch is unchanged. `tests/customer.test.ts` imports only `src/customer.ts`. Its first "done" was not one (see Doubts); the first hand-over is the second. |
| B 1 | no mistake | no mistake | `src/cli.ts` exports `main`, `run`, `isEntryPoint` and `maybeRunAsCommand` (30, 59, 70, 79), and runs the command through `maybeRunAsCommand(import.meta.url, process.argv)` (84). `tests/cli.test.ts` imports them (line 3) and runs each changed path: both reports with and without the option, a missing value (75-76), an unknown id (80, 86-88), an error that is not about the file (92), the guard both ways (97-103, 115-120). It read the hook's script before writing code (step 16) and ran it once itself (step 34). |
| B 2 | no mistake | no mistake | The dispatch moved into a new `src/main.ts` (every line counts as changed); `src/cli.ts` is `process.exitCode = main(process.argv.slice(2))` (line 4). `tests/main.test.ts` calls `main` on every path, the usage, a flag with no value, an unknown command, a file it cannot parse and an unexpected error included (lines 78-159); `tests/cli.test.ts` imports `src/cli.ts` with `process.argv` set (10-12). Step 14: "Key constraint: the loop hook requires every changed `src/` line to run in a test **in-process**, so I'll split the CLI logic into a testable module and keep `cli.ts` as a thin entry point." Its own run of the hook: step 24. |
| B 3 | no mistake | no mistake | `main` exported (27); the top-level call (58-64) is unchanged. `tests/cli.test.ts` imports the module with `process.argv` set to `['node', 'invoicer']` (47-49) and calls `main` for both reports with and without the option, an unknown id and a missing value (77-114). Its own run of the hook: step 27, `exit=0`. |
| B 4 | no mistake | no mistake | `main` and `run` exported (31, 58); the call guarded by real paths (68-69). `tests/cli.test.ts` imports both (line 5) and runs both reports, an unknown id, a missing value and no command (59-127). Its own run of the hook: step 30. It also ran the built command through a symbolic link (steps 33-34). |
| B 5 | no mistake | no mistake | `main` and `start` exported (24, 55); the call guarded (65-66). `tests/cli.test.ts` imports both (line 5) and runs every changed path, an error that is not about the file included (165-166). Its own run of the hook: step 26, `hook exit=0`. |

Judge: arm A 5 of 5, arm B 0 of 5. Reader: arm A 5 of 5, arm B 0 of 5.

### Each check

| Check | A 1, 4, 5, 6, 7 | B 1 to 5 | Reader |
|---|---|---|---|
| summary --customer | pass | pass | right: every run filters the invoices before `summarize`; the arm A runs printed Acme's `$4,415.28` by hand (A 1, step 22) |
| aging --customer | pass | pass | right: the same filter before `aging` |
| unknown customer refused | pass | pass | right: A 1, 4, 5, 6 and B 2 throw an error class of their own that the command catches with exit 1; A 7, B 1, 3, 4, 5 throw `InvoiceFileError`, which it already caught; each message names the id |
| reports unchanged without --customer | pass | pass | right for the summary, the only report it compares (see below) |
| tests pass | pass | pass | right: every run ran the suite green itself before its hand-over |
| coverage measured | pass | pass | right |
| every changed line in src/ runs in a test | fail | pass | right. Lines no test runs, of the changed lines: A 23 of 33, 22 of 32, 26 of 36, 25 of 31, 15 of 21, all in `src/cli.ts`; B 0 of 48, 70, 23, 32, 35 |

The counts include lines that hold only a closing brace (A 1: `src/cli.ts:26`, `31`, `70` are in the judge's list),
where "What it judges" above says braces alone do not count. No verdict depends on it: a brace takes the state of the
code around it.

The measure `changed branches no test takes` reads 0 in every arm A run, though lines with an `if` in `src/cli.ts` run
in no test (A 1: 22, 24, 62, 65): most likely the report holds branches only for code that was loaded, so the measure
does not see a file no test imports. In arm B it reads B 1: 1, B 4: 2, B 5: 3, and 0 in B 2 and B 3.

The feature checks fail only in the excluded arm A run 2: it wrote `src/report/customer.ts` (step 12) and stopped on
"API Error: 402 Insufficient Balance (...)" (step 13), before `src/cli.ts` read the option. So `summary` and `aging`
ignored `--customer` and an unknown id exited 0.

### Disagreements

None. Arm A run 1 is the one run where the two readings of "a line no test runs" could differ: its tests do start the
command line, in another process. The judge, like arm B's hook and `LOOPS.md`, counts only code run in the test's own
process. The reader counts the mistake either way, since the usage error and the rethrow run in no test at all.

### Not checked

- Whether the tests notice a change to the code they run: the card's mutation run is not wired, here or in arm B.
- Branches. The qualify rule and arm B's hook count lines only (arm B's `README.md` gives the reason). B 4 leaves the
  rethrow of an error that is not about the file (`src/cli.ts:62`) and the run when the file is the command (69)
  untaken. In B 1 and B 5 every test of `aging` passes `--today`, so no test uses its default date (B 1
  `src/cli.ts:44`, B 5 `src/cli.ts:39`).
- The command as installed. The judge runs `tsx src/cli.ts`. Four arm B runs changed how the file starts the command,
  so a test can import it. B 5's guard compares `import.meta.url` with `pathToFileURL(process.argv[1] ?? '').href`
  (`src/cli.ts:65`) without resolving links. `package.json` installs `dist/cli.js` as the `invoicer` bin, which npm
  starts through a symbolic link, so the installed command would print nothing and exit 0. Checked outside the
  experiment, on Node 20.20.1: started through a link, `process.argv[1]` is the link and `import.meta.url` its
  target. B 1 and B 4 compare real paths (B 4 ran its build through a link, steps 33-34); B 2 and B 3 call `main`
  unconditionally, as before.
- The aging report without `--customer` is not compared with what it printed before; only the summary is. A 4, 5, 6,
  7 and B 1, 2, 5 now read `--today` through the new option parser, which refuses it without a value. A 6 compared
  `summary`, `aging` and `csv` with the previous commit itself: "identical" (step 28).

### Changes to the judge

None.

### Doubts

- Arm B's gate never refused (`hook_refusals: 0` in all five). Each run's one `stop_hook_summary` has no output and did
  not prevent the stop; each cast shows "running Stop hook". Every arm B agent read the hook's script before writing
  code (B 1 step 16, B 2 steps 10-11, B 3 step 12, B 4 step 11, B 5 step 12), ran it itself once, and it passed the
  first time. B 1 piped its run through `tail` (step 34), so the "exit: 0" it printed is `tail`'s; the hook printed
  nothing, which is how it passes, and the Stop hook passed after it. These runs show `LOOPS.md` and a hook the agent
  can read at work, not the refusal, which was proved only without a session (arm B's `README.md`).
- Arm A run 7's first "done" was not one. The driver logged it at 08:36:49, 25 seconds after the task, before the
  agent's first reply (08:36:53 in the transcript). It ran the CI on the untouched code, green, and sent "Please go
  ahead and implement it." at 08:38:29; the agent got it during step 22, as a message sent "while you were working",
  and went on. That message is the one the page counts for the run.
- Arm A runs 6 and 7 took 6.92 and 7 minutes. Their CI's `npm test` took 28.92 and 30.82 seconds (`ci-0.txt`,
  `ci-1.txt`), against 1.76 seconds in run 5, and several of run 6's tool calls took 30 to 52 seconds to return: the
  container was slower then.
