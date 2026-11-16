# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/architecture-fitness-functions/card.md`): the loop is not in the plugin's
`wiring/`, so this is what the sensorloop skill would set up following the card's "The loop" and "Set up", in the
shape it gives a project (`procedures/loops-file.md`) and with its hook script `check.sh`. This file is not part of
the overlay: the experiment's `.dockerignore` keeps it out of the image, or the driver would copy it over the
project's README.

## What it adds

| File | What it is |
|---|---|
| `.dependency-cruiser.cjs` | ARCHITECTURE.md as rules, each with a `comment` that says what the layer is for and where the code goes: `report-export-do-no-io` (src/report and src/export import no I/O module), `report-export-do-not-call-up` (they import neither src/cli.ts nor src/parse.ts), `only-parse-reads-files` (no module but src/parse.ts imports `fs`), `no-circular`. The second and third together close the way around the first: a report that calls a function which reads a file. |
| `.sensorloop/hooks/architecture.sh` | `depcruise src --config .dependency-cruiser.cjs --output-type err-long` (each violation as `from → to`, its rule and its text), and a search for the clock (`new Date()`, `Date.now(`) in src/report and src/export, which an import rule cannot see. |
| `.sensorloop/hooks/guard-rules.sh` | Refuses the agent's writes to `.dependency-cruiser.cjs` (the card: the agent cannot change a rule to pass). |
| `.claude/settings.json` | `architecture.sh` through `check.sh`, label `architecture`: PostToolUse on Edit, Write and MultiEdit (the agent sees a violation at once), PreToolUse on Bash for a call that runs `git commit` (refused), and Stop (the turn goes on; the same failure three times goes to the person). The task asks for no commit, and the arm A runs made none, so the end of the turn stands in for the commit and the CI run of the card. PreToolUse on Edit, Write and MultiEdit runs `guard-rules.sh`. |
| `.sensorloop/LOOPS.md`, `.sensorloop/loops.yaml` | The loop as the skill writes it down; the rules are the person's, and a rule that seems wrong goes to them. |
| `.sensorloop/hooks/check.sh` | The plugin's, copied at image build (`plugin_scripts`). |
| `CLAUDE.md.append`, `.gitignore.append` | The import line `@.sensorloop/LOOPS.md`, and `.sensorloop/state/`. |

The image, in both arms: dependency-cruiser 18.7.0 and TypeScript 5.9.3 in `/opt/depcruise`, with `depcruise` linked
into `/usr/local/bin` (the experiment's `Dockerfile`). Not a devDependency, so arm A's project stays as in its pilot;
not `npm install -g`, since a global dependency-cruiser prints a warning on every run that would reach the agent.

Left out of the card: a rule for where new files go (`allowed`), a rule for tests reaching internals, a baseline and
its ratchet, a reviewed list of disable comments and an exception list (the project has no violation today, so none
is needed), and a CI job (the person's CI is the same in both arms). Changes to ARCHITECTURE.md are not refused: it is
prose, and `LOOPS.md` asks the agent to take a rule it thinks wrong to the person.

## Proved without a session

2026-11-15, in a container of the experiment's image (built with `--arm B --runs 0`): the overlay applied as the
driver does (copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then each
state below, and the hooks run as Claude Code runs them, with their input on stdin (`{"hook_event_name":"Stop"}`, a
PostToolUse Edit input, or a PreToolUse Bash input whose command is `git add -A && git commit -m ...`).

The untouched project: `✔ no dependency violations found (11 modules, 21 dependencies cruised)`, exit 0, in about a
second.

**The mistake**, pilot run 1 of arm A (shipped-artifact-check's `runs/pilot/A-deepseek-flash-1/diff.patch` applied:
`src/report/aging.ts` calls `readHolidays()` of a new `src/holidays.ts`, which reads the file), after an edit and
before a commit:

```
sensorloop: architecture failed (`.sensorloop/hooks/architecture.sh`, exit 1). Fix the code, not the check. The end of its output:

  error only-parse-reads-files: src/holidays.ts → fs
    src/parse.ts is the only module that reads files (ARCHITECTURE.md). Read a
    new file in src/parse.ts, beside readInvoices, and check its contents
    there; src/cli.ts calls it and passes what it read to the rest. A module
    that reads a file elsewhere (in src/report/, or a new src/<name>.ts) breaks
    the rule even when its callers look pure.

x 1 dependency violations (1 errors, 0 warnings). 13 modules, 25 dependencies cruised.
exit=2
```

Stop three times on it: `exit=2`, `exit=2`, then `{"systemMessage": "sensorloop: architecture still fails the same way
after 3 rounds; over to you (...)"}`, `exit=0`.

The same run with the reading moved into `src/parse.ts`, and the report still importing it from there: `error
report-export-do-not-call-up: src/report/aging.ts → src/parse.ts`, with its text ("Take what the function needs as an
argument, and let src/cli.ts pass it in."), exit 1.

A report that reads the file itself (`import { readFileSync } from 'node:fs'` and `new Date()` added to
`src/report/aging.ts`), after the edit: exit 2, with `error report-export-do-no-io: src/report/aging.ts → fs`, `error
only-parse-reads-files: src/report/aging.ts → fs` and `error report-export-read-no-clock: src/report/aging.ts:42:export
const now = () => new Date();`, each with its text.

**The reference** (`hidden/reference.patch`, made by hand from run 3: the file read in `src/parse.ts`, the dates passed
in by `src/cli.ts`, ARCHITECTURE.md unchanged; every check of the judge passes on it): after the edit `exit=0`, before
a commit `exit=0`, Stop `exit=0`.

**The guard**: a PreToolUse Edit of `/work/.dependency-cruiser.cjs`: `sensorloop: rules failed
(`.dependency-cruiser.cjs` is the person's). Fix the code the way the rule's text says; changing a rule is not a fix.
...`, exit 2. An Edit of `src/parse.ts`: exit 0.

## Doubts

- The loop is stricter than the judge. Pilot runs 2 and 3 read the holidays in a new `src/holidays.ts` and pass the
  dates to the report: the judge passes them (the reports do no I/O), and this check refuses them, on
  `only-parse-reads-files`, as ARCHITECTURE.md's "the only module that reads files" says. Both runs had rewritten that
  sentence of ARCHITECTURE.md to fit their design (`hidden/CALIBRATION.md`); with the loop, the rule lives in
  `.dependency-cruiser.cjs`, so rewriting the prose does not get a change through. So an arm B run may do work the
  verdicts do not see, and the experiment's measure may want to count it.
