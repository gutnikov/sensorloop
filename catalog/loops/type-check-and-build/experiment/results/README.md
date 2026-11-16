# Results

Each folder is one set of runs, named by its date and label; `runs.jsonl` holds one line of scores per run
(`packages/experiment/src/score.js`). The page of the loop shows the newest set that has both arms.

## 2026-11-15-pilot: the type check in the project's scripts

Arm A only, 3 runs each on `deepseek-flash` and `deepseek-v4-pro`. The fixture named `npm run typecheck` in its
`CLAUDE.md`, README and `package.json`, and its build ran `tsc`. CI was green at the agent's first "done" in 6 of 6
runs: the agent ran the type check itself, 3 to 7 times a run. One `deepseek-v4-pro` run was first marked as passing 5
of the 8 feature checks; that was the judge's error (see below). By the rule fixed before the runs, no model qualified,
so the setup changed.

## 2026-11-15-pilot-2: the type check only in CI

Arm A only, 3 runs each on `deepseek-flash` and `glm-5.3-flash`. The fixture's build became tsup, which strips types;
the type check ran only in CI (`npx tsc --noEmit`), and `CLAUDE.md` named `npm test` and `npm run build`. CI was green
at the first "done" in 6 of 6 runs: every agent ran `npx tsc --noEmit` on its own, and 3 of the 6 had not opened the CI
file, so they ran `tsc` because the project is TypeScript. One `glm-5.3-flash` run was first marked as passing 5 of the 8 feature
checks; that was the judge's error too.
No model qualified.

What it shows: on a task of this size, these agents check types without being told, so this loop has nothing to catch
here, and only its cost would show. Its arm B was not run.

## Correction, after calibrating the judge on these runs

The two runs marked 5 of 8 (`pilot/A-deepseek-v4-pro-2`, `pilot-2/A-glm-5.3-flash-2`) had added EUR and GBP invoices
to `data/invoices.json`; the judge compared the USD-only report of that changed file with the old output. Their
USD-only output is unchanged. The judge now reads the file as it was before the session, and both runs pass 8 of 8
(`acceptance.calibrated.jsonl`, `hidden/CALIBRATION.md`). Every run of both pilots passes the feature checks.
