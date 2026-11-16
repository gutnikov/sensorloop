# Arms

- **A**: the project as its team keeps it, no overlay.
- **B** (`B/`): the loop as the sensorloop skill would leave it after setting it up, built by hand from the card (the
  loop has no page in the plugin's `wiring/`). Every file in `B/` is copied into the project and committed before the
  session, so arm B is described here and not in `B/`, where a README.md would replace the project's own.

## What arm B adds

| File | What it does |
|---|---|
| `.sensorloop/LOOPS.md` | Before any code or test, list the cases the criteria leave open and ask them in one message, then end the turn; each answer joins the spec. One test per criterion, named after it (`AC3: ...`), run through the command (`runCli`), written before the code. |
| `.sensorloop/loops.yaml` | The registry: the loop, active, and its wiring. |
| `.sensorloop/hooks/trace.mjs` | The requirement trace. At SessionStart it notes the commit the session began from. At Stop, once `src/` or `tests/` changed in the session, it reads the criteria ids (`AC[0-9]+`) in the person's messages of the transcript, and the names of the tests added or changed in the session; a criterion with no test named after it is refused (exit 2) with the missing ids. The same missing ids three times in a row go to the person (`systemMessage`, exit 0), as `check.sh` does. A turn that changed nothing (one that ends with questions) is not checked. |
| `.claude/settings.json` | SessionStart and Stop hooks calling `trace.mjs 'AC[0-9]+'`. |
| `CLAUDE.md` (appended) | `@.sensorloop/LOOPS.md` under `## Loops`. |
| `.gitignore` (appended) | `.sensorloop/state/`. |

The plugin's `check.sh` and `stall.py` are copied into `.sensorloop/hooks/` at image build, as for every arm B; no
hook calls them here.

## Built by hand from the card

Kept: the spec (here, the issue's criteria, as CONTRIBUTING.md has it) is complete before tests are derived, open
cases go to the person in one message, one test per criterion tagged with its id, and the trace that checks each
criterion has a test. Left out, as more than the smallest faithful version: requirement and spec files with stable
ids for steps, rules and examples, production signals, the person's approval recorded in a file, and separate hands
for the spec and the tests. The hook reads the spec from the person's messages because this project keeps no spec
file. It checks that a test names each criterion, not that the test would fail when the criterion breaks; the judge
measures that.

## Proof that it fires

The image built with `npm run experiment -- spec-before-tests --arm B --model deepseek-flash --runs 0`. In a container
of it: the overlay applied as the driver applies it (each file copied, `*.append` appended, hooks made executable, one
commit as `node`), a transcript holding the task as the person's message, and the hooks run as Claude Code runs them
(the command from `.claude/settings.json`, as `node`, the hook's JSON on stdin). The mistake is code and tests for the
issue with AC3 and AC5 untested; the right state names every criterion.

```
=== overlay
{"base":"91847c14...","setup":"ea24d62b...","changed":[".claude/settings.json",".gitignore",".sensorloop/LOOPS.md",".sensorloop/hooks/check.sh",".sensorloop/hooks/stall.py",".sensorloop/hooks/trace.mjs",".sensorloop/loops.yaml","CLAUDE.md"],"ok":true}
Stop hook: "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/trace.mjs 'AC[0-9]+'
--- SessionStart (notes where the session began)
exit 0
--- Stop, the agent asked and changed nothing
exit 0
--- Stop, code and tests with AC3 and AC5 untested (1st time)
exit 2
stderr:
  sensorloop: trace failed. The spec's criteria AC3, AC5 have no test named after them.
  Criteria in the issue: AC1, AC2, AC3, AC4, AC5. Tests added or changed in this session: tests/reminders.test.ts.
  Write a test for each, named after it (`it('AC3: ...')`), that runs the command (runCli in
  tests/helpers/cli.ts) and fails when the criterion breaks. Do not rename a test to an id it does not check.
  If the spec still leaves a case open, tests and code wait for it: put src/ and tests/ back as they were, and ask
  the person the open cases instead.
--- Stop, the same work committed during the session (2nd time)
exit 2
stderr:
  sensorloop: trace failed. The spec's criteria AC3, AC5 have no test named after them.
  [the same five lines as above]
--- Stop, the same failure a 3rd time
exit 0
stdout:
  {"systemMessage":"sensorloop: trace still misses AC3, AC5 after 3 rounds; over to you."}
--- Stop, a test named after every criterion
exit 0
```

The test file of the mistake had tests named `AC1: ...`, `AC2: ...`, `AC-4: ...` and one with no id; the right state
added `AC3: ...` and `AC5: ...`. The second refusal shows that work committed during the session still counts (the
session's base, not HEAD).

Not provable without a session: whether the agent asks the open case before it builds (an instruction), and whether
it follows the refusal's advice to put its work back and ask.
