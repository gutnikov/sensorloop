# Setup: a project's first loops

The project has no `.sensorloop/loops.yaml`. Goal: a few loops that fit it, wired, proved, and written down.

## 1. Learn the project

Read, do not guess. Look where the project itself runs things, in this order, CI winning when sources disagree:

- CI configuration (`.github/workflows/`, `.gitlab-ci.yml` and the like): the commands it trusts.
- The task file (`package.json` scripts, `Makefile`, `justfile`, `pyproject.toml`, `Taskfile.yml`).
- The README and contributing guide.
- The tools' config files and the dependency manifests.

Find the commands for: tests, type check, build, lint, format. Run each once and note whether it passes and how long
it takes; a command that does not run as found is not a command yet. Note what exists beyond the repository: CI,
deploy, previews, a browser, logs, metrics, traces, an error tracker. Note what is already in `.claude/settings.json`
and `CLAUDE.md`. Check that `python3` runs (the stall detector needs it).

## 2. Ask about the limits

Ask the person, in one round of short questions with options, only what the repository cannot tell you:

- How the agent works here: watched in a session, or unattended (overnight, in CI)?
- Which actions must never run without a person: pushes, deploys, migrations, deletes, messages sent outside?
- Budget: may loops spend model calls (reviewers, judges)? In CI?
- Anything that must not change: files, branches, settings.

If the person is not available, assume: watched in a session; pushes, deploys, migrations and deletes need a person;
no model calls in CI. Say what you assumed.

## 3. Propose

Start from the loops you can wire ([wiring/](../wiring/)), and keep only those the project can run:

| Loop | Needs |
|---|---|
| run-tests-first | a test command |
| red-green-tdd | a test command |
| type-check-and-build | a type check or build command, fast enough after edits or at the end of a turn |
| lint-with-fix-instructions | a lint command |
| risky-action-gates | always; the gated commands come from step 2 |
| stall-detector | `python3`; most useful when the agent works unattended |

Then read [../catalog/index.md](../catalog/index.md) for loops the project's facts call for that you do not wire
(CI results when there is CI, smoke tests when there is a deploy, and so on): at most three, as `proposed`.

Show the person one table: each loop, the failure it catches here, the command it uses, and the changes you will make
(files, hooks, permissions). Get a yes, or the changes they want.

## 4. Wire

For each agreed loop, follow its page in [wiring/](../wiring/). Copy `wiring/scripts/` to `.sensorloop/hooks/` and
make the scripts executable. Merge hooks and permissions into `.claude/settings.json`. Add `.sensorloop/state/` to
`.gitignore`.

## 5. Prove

For each active loop, make it fail once on purpose (a type error, a lint violation, a gated command) and see its
signal; then undo the break and see it pass. Record the date in `proved`. A loop you could not see fire is not
active: say why.

## 6. Write down

Write `.sensorloop/loops.yaml` and `.sensorloop/LOOPS.md` ([loops-file.md](loops-file.md)), and add the import line to
`CLAUDE.md`. Show the person what changed, and end with what could be better (rule 7).
