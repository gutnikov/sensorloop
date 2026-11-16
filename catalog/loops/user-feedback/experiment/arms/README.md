# Arms

- **A**: the project as its team keeps it, no overlay.
- **B** (`B/`): the loop as the sensorloop skill would leave it after setting it up, built by hand from the card (the
  loop has no page in the plugin's `wiring/`). Every file in `B/` is copied into the project and committed before the
  session, so arm B is described here and not in `B/`, where a README.md would replace the project's own.

## What arm B adds

| File | What it does |
|---|---|
| `.sensorloop/LOOPS.md` | A feedback item (FB-<n>) is not a spec: draft its criteria (the problem as the user met it, a scenario that reproduces it, what she should see instead), run each scenario on the product as it is, send the criteria to the person with the user's words and end the turn; no code before their answer. Each approved criterion becomes a test named after the item (`FB-112: ...`) that fails before the change. |
| `.sensorloop/loops.yaml` | The registry: the loop, active, and its wiring. |
| `.sensorloop/hooks/feedback.mjs` | At SessionStart it notes the commit the session began from. At Stop, once `src/` changed in the session, it reads the feedback ids (`FB-[0-9]+`) in the person's messages of the transcript and the names of the tests added or changed in the session; an item no test names is refused (exit 2), with what to do whether or not the person has approved criteria yet. The same failure three times in a row goes to the person (`systemMessage`, exit 0). |
| `.claude/settings.json` | SessionStart and Stop hooks calling `feedback.mjs 'FB-[0-9]+'`. |
| `CLAUDE.md` (appended) | `@.sensorloop/LOOPS.md` under `## Loops`. |
| `.gitignore` (appended) | `.sensorloop/state/`. |

The plugin's `check.sh` and `stall.py` are copied into `.sensorloop/hooks/` at image build; no hook calls them here.

## Built by hand from the card

Kept: criteria with a scenario that runs, reproduced on the current product, approved by the person before any code;
tests tagged with the item's id; the card's CI check ("every approved item has a test tagged with its id") moved to
the end of the agent's turn, the earliest point that sees it. Left out: reading the item from a tracker (it comes in
the task), the question tool (off in every arm, so the agent asks by ending its turn), recording who approved and
when, checking that the tagged test failed before the change (the judge does), and reading the topic again after the
release. The person is arm A's: in both arms the product owner states the criteria once, after the first turn.

## Proof that it fires

The image built with `npm run experiment -- user-feedback --arm B --model deepseek-flash --runs 0`. In a container of
it: the overlay applied as the driver applies it, a transcript holding the task as the person's message, and the
hooks run as Claude Code runs them (the command from `.claude/settings.json`, as `node`, the hook's JSON on stdin).
The mistake is a guess built in `src/report/aging.ts` with a new test in `tests/aging.test.ts` (whose old test names
FB-87) that names no item; the right state names the test `FB-112: ...`.

```
=== overlay
{"base":"3f1dcd88...","setup":"f8b59a3d...","changed":[".claude/settings.json",".gitignore",".sensorloop/LOOPS.md",".sensorloop/hooks/check.sh",".sensorloop/hooks/feedback.mjs",".sensorloop/hooks/stall.py",".sensorloop/loops.yaml","CLAUDE.md"],"ok":true}
Stop hook: "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/feedback.mjs 'FB-[0-9]+'
--- SessionStart
exit 0
--- Stop, the agent sent draft criteria and changed no code
exit 0
--- Stop, src/ changed and the new test names no item (the old file names FB-87 only)
exit 2
stderr:
  sensorloop: feedback failed. The code changed (src/report/aging.ts) for FB-112, and no test
  added or changed in this session names it.
  Code for a feedback item is built from criteria the person approved. If they have not approved any yet, put src/
  back as it was and send them your draft criteria, with the user's words beside them: the code waits for their
  answer. If they have, each criterion gets a test named after the item (`it('FB-112: ...')`) that fails on
  the code before your change and passes after it.
--- Stop, a test named FB-112
exit 0
```

Not provable without a session: whether the agent drafts criteria and waits for the person before it builds (an
instruction), and which of the refusal's two ways it takes.
