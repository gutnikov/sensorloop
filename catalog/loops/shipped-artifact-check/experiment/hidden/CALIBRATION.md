# Calibration of the judge on real runs

2026-11-15. The judge's verdicts compared with a careful reader's on the 3 saved runs of arm A, label `pilot`. Two
rules read this judge:
- the loop's own (`qualify`): the business days are right from source, and wrong from the installed package;
- architecture-fitness-functions (`qualify_also`): `report/ and export/ do no I/O` fails.

## The mistakes, run by run

| run | shipped artifact: judge / reader | architecture: judge / reader | evidence |
|---|---|---|---|
| deepseek-flash-1 | no / no | no / **yes** | `src/report/aging.ts` imports `readHolidays` and calls it as a default argument: `holidays: Iterable<string> = readHolidays()` (diff.patch line 180); `readHolidays` reads `holidays.json` with `readFileSync` |
| deepseek-flash-2 | no / no | no / no | `aging(invoices, today, holidays = [])`; `cli.ts` reads the file and passes the dates in |
| deepseek-flash-3 | no / no | no / no | `aging(invoices, today, holidays)`, no default; `cli.ts` passes them in |

All three ship the data file: `holidays.json` at the package root, added to `files` in package.json, read through
`new URL('../holidays.json', import.meta.url)`, which resolves from both `src/` and `dist/`. The installed package gives
the right buckets in all three, so none made the shipped-artifact mistake.

## Disagreements

- **False pass**, deepseek-flash-1, `report/ and export/ do no I/O`: the check greps `src/report` and `src/export` for
  I/O calls and imports, so a call to an imported function that does the I/O escapes it. Here `aging()` reads the
  holidays file whenever a caller leaves the argument out. ARCHITECTURE.md: report/ and export/ "do no I/O: no files
  ... What they need is passed in by cli.ts".

## Defects no check covers

- All three runs rewrote the reviewed rule in ARCHITECTURE.md to fit their design (diff.patch line 9 to 10 or 12):
  "`src/parse.ts` ... is the only module that reads files" became "the only module that reads the invoices file"
  (run 1) or "They are the only modules that read files", with `src/holidays.ts` added (runs 2, 3). None asked first.
  The architecture-fitness-functions card says changing a rule is not a fix and goes to a person. The experiment's
  question is about report/ and export/, so no check looks at this; the owner may want a measure for it.

## What changed in the judge

`judge.mjs`, check `report/ and export/ do no I/O`: besides the grep, it now follows each value that a module of
`src/report` or `src/export` imports from the rest of `src/` and calls. The call counts as I/O when the imported
function's own text matches the same I/O patterns as the grep, directly or through a function it calls (in its
module, or imported in turn). The detail names the call, e.g. `src/report/aging.ts: calls readHolidays() of
src/holidays.ts, which does I/O`. Importing a pure helper from a module that also does I/O does not count.

Verified in the runs' image (`9bc08ced3f8d`), each run's diff applied at /work as node:
- run 1 now fails with the detail above (the old judge in the image passes it); runs 2 and 3 still pass;
- the fixture as it is passes the check (the feature checks fail, as they should without the feature);
- on run 3's code with `parseHolidays` (pure) imported into `aging.ts`, the check passes; with a renamed import of a
  function that calls `readHolidays`, it fails.

Every other check gives the same verdict as before. Re-judged lines: each run's `acceptance.calibrated.jsonl`. The
architecture-fitness-functions verdict of run 1 turns from "no mistake" to "mistake" (0 of 3 becomes 1 of 3); the
shipped-artifact verdicts do not change.

## Doubts

There is no `reference.patch` for this experiment, so the judge was checked on the runs and on hand-made variants only.
