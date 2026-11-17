# Setup: a project's loops

The project has no `.sensorloop/loops.yaml`. Goal: every loop that the project's needs and facts call for, wired,
proved, written down, and reported to the person.

## 1. Find the tools, and learn the project

Start by finding the tools: which of the catalog's tools the project already has, and where each one is. Then show
them to the person, as the interview's first section says ([../../interview/SKILL.md](../../interview/SKILL.md),
"First: the tools already here"). The person sees them before any question.

Read, do not guess. Look where the project itself runs things, in this order, and when sources disagree, CI wins:

- CI configuration (`.github/workflows/`, `.gitlab-ci.yml` and the like): the commands it trusts.
- The task file (`package.json` scripts, `Makefile`, `justfile`, `pyproject.toml`, `Taskfile.yml`).
- The README and contributing guide.
- The tools' config files, the dependency manifests and lockfiles, and `.mcp.json`.

Find the commands for: tests, type check, build, lint, format. Run each once and note whether it passes and how long
it takes; a command that does not run as found is not a command yet. Note what exists beyond the repository: CI,
deploy, previews, a browser, logs, metrics, traces, an error tracker. Note what is already in `.claude/settings.json`
and `CLAUDE.md`. Check that `python3` runs (the stall detector needs it). The commands can run while the interview's
first turn waits for its answers; do not hold the tools or the first questions back for them.

## 2. Interview the person

Find out what the person needs before you choose anything: run the interview in
[../../interview/SKILL.md](../../interview/SKILL.md). It opens with the tools found, then asks one or two questions a
turn, for at most five turns, only what the repository cannot tell you. The questions that change the setup most come
first: how much the agent should do on its own, what would hurt if a change broke it, what the loops may cost. Then
come those that change how the loops hold: when the agent may call the person, which actions wait for them, where they
approve the work. Each question offers only the options the earlier answers leave open. The interview ends with needs
and limits the person confirms.

If the person is not available, the interview takes its defaults (watched in a session, calling the person before
what cannot be undone and when stuck; pushes, deploys, migrations and deletes need a person; no model calls in CI)
and says what it assumed.

## 3. Propose

Start from the needs the person confirmed, the tools found, and the catalog ([../catalog/index.md](../catalog/index.md)).
The interview's [tree](../../interview/tree.md) says which loops each need decides. Take every loop that a confirmed
need or a failure likely here calls for. There is no limit on how many, but each loop costs time, money and attention,
so leave out a loop with neither behind it. For each loop you take, decide one of two things:

- **Wire it** when the project can run it: it has the tools the loop's sensors are built with (found, or one you
  add as a dev dependency or a CI step), and the person's limits allow it (no reviewer agent when they allowed no
  model calls). A loop with a page in [wiring/](../wiring/) follows that page. Any other loop is wired from its card,
  `../catalog/loops/<id>.md`: its "The loop" and "Set up", and its `when`, `failure` and `next`.
- **Propose it** when it needs what only a person can provide (an account, a paid service, a secret, a deploy target,
  a person's time on a schedule), or what the limits forbid for now. It is recorded as `proposed` with its `needs`.

The loops with a wiring page need:

| Loop | Needs |
|---|---|
| run-tests-first | a test command |
| red-green-tdd | a test command |
| type-check-and-build | a type check or build command, fast enough after edits or at the end of a turn |
| lint-with-fix-instructions | a lint command |
| risky-action-gates | always; the gated commands come from the interview |
| stall-detector | `python3`; most useful when the agent works unattended |

Show the person one table. For each loop give: wire or propose, the need it serves or the failure it catches here,
the tool and command it uses, when it fires, and the changes you will make (files, hooks, permissions, CI jobs,
dependencies). Say which needs no loop serves yet. Get a yes, or the changes they want.

## 4. Wire

For each agreed loop, follow its page in [wiring/](../wiring/) when it has one. Otherwise follow its card, built with
the project's own tools, in whatever form the card's `when` calls for: a hook that runs a command through
`.sensorloop/hooks/check.sh`, a permission rule, a CI job, a subagent, or an instruction in `LOOPS.md`. Copy
`wiring/scripts/` to `.sensorloop/hooks/` and make the scripts executable. Merge hooks and permissions into
`.claude/settings.json`. Add `.sensorloop/state/` to `.gitignore`. A CI job goes into the project's workflow files;
it runs only once it is pushed, and the push waits for the person.

## 5. Prove

Check that each wired loop works the way it will run:

- Make it fail once on purpose, as its card's `failure` says (a type error, a lint violation, a fake secret staged, a
  gated command), and see its signal reach the agent where the loop says it does (a hook's message, a refused commit,
  a turn that goes on, a permission prompt). Then undo the break and see the loop pass. Never leave a break behind.
- Time it on the clean tree. A check slower than its place allows (about 20 seconds after each edit) moves to a later
  place; say so.
- For a hook, check that `.claude/settings.json` still parses, and run the hook's command as the hook would.
- For a CI job, check the workflow with the project's workflow checker when it has one, and run the job's commands
  locally. Its first run in CI is what proves it; until then the report says it is waiting for that run.
- For a loop a person takes part in (a plan to approve, a demo), check that its gate and its instruction are in place.
  Walk through it once on a small change only when the person agrees to spend that time.

Record the date in `proved`. A loop you could not see fire is not active: record it as `proposed`, with what it still
needs, and say why.

## 6. Write down

Write `.sensorloop/loops.yaml`, with the tools found and the wants and limits from the interview, and
`.sensorloop/LOOPS.md` ([loops-file.md](loops-file.md)), and add the import line to `CLAUDE.md`.

## 7. Report

End with a report to the person, in the conversation. It has one row per loop, wired or tried:

```
## Loops set up

| Loop | When it fires | How it was checked | Result |
|---|---|---|---|
| Type check and build | after each edit; when the turn ends | a type error in src/cart.ts: the hook blocked with the error; undone, it passed in 6 s | ✅ works |
| No secrets in commits | before each commit; in CI on each pull request | a fake key staged: the commit was refused; the CI job passed actionlint and its command ran locally | ⏳ waits for its first CI run |
| Stall detector | after each tool call | the same failing call five times: no warning | ❌ did not fire: python3 is 3.6; left proposed |
```

Under the table, add:

- **Proposed, not set up**: each loop with what it needs, and who can provide it.
- **Needs no loop serves yet**, from the interview.
- **Assumed**: the defaults the interview took.
- **Changed**: the files written, and the diff of `.claude/settings.json`.
- **Your move**: what only the person can do now, such as pushing the branch with the CI job, adding a secret, or
  applying `.sensorloop/settings.to-apply.json`.

Then end with what could be better (rule 7).
