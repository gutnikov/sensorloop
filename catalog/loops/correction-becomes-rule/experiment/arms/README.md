# Arms

- **A**: the project as its team keeps it, no overlay. Claude Code may keep its own memory, in both arms.
- **B** (`B/`): the loop as the sensorloop skill would leave it after setting it up, built by hand from the card (the
  loop has no page in the plugin's `wiring/`). Every file in `B/` is copied into the project and committed before the
  session, so arm B is described here and not in `B/`, where a README.md would replace the project's own.

## What arm B adds

| File | What it does |
|---|---|
| `.sensorloop/LOOPS.md` | When the person corrects the work, add the correction under "Rules from corrections" first (one short line, in the form of the mistake it prevents, in the person's words, with the date and the issue), then fix the work; before finishing, check the work against every rule there and name the ones applied. The section starts with "None yet." and is the one part of LOOPS.md written in place. |
| `.sensorloop/loops.yaml` | The registry: the loop, active, and its wiring. |
| `CLAUDE.md` (appended) | `@.sensorloop/LOOPS.md` under `## Loops`: every session, the second one included, reads the rules. |
| `.gitignore` (appended) | `.sensorloop/state/`. |

No hook: the loop is an instruction. The plugin's `check.sh` and `stall.py` are copied into `.sensorloop/hooks/` at
image build; nothing calls them here.

## Built by hand from the card

Kept: the agent records a correction the moment the person makes it, as a line in the form of the failure it fixes,
with its source, where every later session reads it; sessions name the rules they applied. Changed: the card logs
the first correction of a kind and makes a rule only at the second, which a person approves. This experiment has two
sessions and replies that cannot depend on what the agent did (`NEEDS.md`), so arm B writes the rule at the first
correction; it is the person's own words, which is what a person would approve. Left out: the outcome log with kinds
and phases, the weekly search of transcripts, a check in place of a line of instructions, and retiring rules that no
session names. The person is the same in both arms (`sessions` in `experiment.yaml`: the correction after session 1's
first turn, nothing in session 2), and the judge reads the end (`judge_at: end`).

## Proof that it fires

An instruction cannot be made to fire without a session: whether the agent writes the rule, and whether session 2
follows it, shows only in a run. What can be shown is that the overlay applies and that a later session is given the
rules. The image built with `npm run experiment -- correction-becomes-rule --arm B --model deepseek-flash --runs 0`; in
a container of it, the overlay applied as the driver applies it:

```
=== overlay
{"base":"fbbc30c8...","setup":"9ae38312...","changed":[".gitignore",".sensorloop/LOOPS.md",".sensorloop/hooks/check.sh",".sensorloop/hooks/stall.py",".sensorloop/loops.yaml","CLAUDE.md"],"ok":true}
--- the end of CLAUDE.md

## Loops

@.sensorloop/LOOPS.md
--- .claude/settings.json
  ls: cannot access '/work/.claude/settings.json': No such file or directory
--- LOOPS.md, its rules section
## Rules from corrections

None yet.

## Never
--- .gitignore
.sensorloop/state/
```

A rule the agent adds to `.sensorloop/LOOPS.md` is in the judge's `correction kept as a rule` (its `project_docs`
reads `*.md` added since the setup commit).
