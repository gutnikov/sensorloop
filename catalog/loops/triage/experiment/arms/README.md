# Arms

- **A**: the project as its team keeps it, no overlay.
- **B** (`B/`): the loop as the sensorloop skill would leave it after setting it up, built by hand from the card (the
  loop has no page in the plugin's `wiring/`). Every file in `B/` is copied into the project and committed before the
  session, so arm B is described here and not in `B/`, where a README.md would replace the project's own.

## What arm B adds

| File | What it does |
|---|---|
| `.sensorloop/LOOPS.md` | Triage each ready item before working it: a duplicate of an open item, an item short of information, or the wrong kind (a bug that asks to change what a feature chose) is flagged in its file under `## Comments`, named in the hand-over, and not worked. |
| `.sensorloop/loops.yaml` | The registry: the loop, active, and its wiring. |
| `.sensorloop/hooks/triage.mjs` | The triage report. For each item labelled `ready` in `issues/`: the items that look like it, open and closed, ranked by the rare words they share in title and text, with a note when the look-alike is in progress (a duplicate joins it) or a closed feature (a change to what it chose is a new requirement); and what it lacks (its fields; for a bug, a way to see it and an example). It decides nothing and writes nothing. |
| `.claude/settings.json` | A UserPromptSubmit hook, `triage.mjs --hook`: the report, once per session, added to the context with the first prompt. The agent can also run it (`node .sensorloop/hooks/triage.mjs`). |
| `CLAUDE.md` (appended) | `@.sensorloop/LOOPS.md` under `## Loops`. |
| `.gitignore` (appended) | `.sensorloop/state/`. |

The plugin's `check.sh` and `stall.py` are copied into `.sensorloop/hooks/` at image build; no hook calls them here.

## Built by hand from the card

Kept: triage before work; duplicates first; the kinds that matter here (a duplicate, short of information, a kind
that is wrong); rules in code where they can (the fields and, for a bug, a way to see it and an example; a look-alike
in progress; a look-alike that is a closed feature), and a judge for the rest, which here is the working agent reading
the report. Left out: triage where items arrive (the tracker is a folder and nothing runs when an item is filed, so it
runs in the working session), a separate writer job, the veto window before closing, labels, and the calibration of
the judge. The look-alikes are found by title and text words, not titles alone: #76 and #66 share one title word
("code") but six in their text (discount, unknown, discountRate, error, ...).

## Proof that it fires

The image built with `npm run experiment -- triage --arm B --model deepseek-flash --runs 0`. In a container of it:
the overlay applied as the driver applies it, and the hook run as Claude Code runs it (the command from
`.claude/settings.json`, as `node`, the hook's JSON on stdin). A UserPromptSubmit hook's stdout is added to the
agent's context; this loop's hook informs and never refuses.

```
=== overlay
{"base":"ba6e1d04...","setup":"abedf6a2...","changed":[".claude/settings.json",".gitignore",".sensorloop/LOOPS.md",".sensorloop/hooks/check.sh",".sensorloop/hooks/stall.py",".sensorloop/hooks/triage.mjs",".sensorloop/loops.yaml","CLAUDE.md"],"ok":true}
UserPromptSubmit hook: "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/triage.mjs --hook
--- UserPromptSubmit, the first prompt of the session
exit 0
stdout:
  sensorloop triage: 5 item(s) labelled ready in issues/. Before you work one, read the items that look
  like it, and decide: a duplicate of an open item, short of information, or the wrong kind (a bug that asks to
  change what a feature chose is a new requirement). Flag such an item in its file under ## Comments, and do not
  work it. This report decides nothing.

  #71 "aging: an invoice 30 days overdue is put in 31-60 days" (bug)
    looks like: no other item
    lacks: nothing found
  #73 "csv: the customer's id as a column" (feature)
    looks like: #31 "csv: one row per invoice, for spreadsheets" (feature, closed); shared words: csv, spreadsheet
    lacks: nothing found
  #74 "Customers in the summary are in random order" (bug)
    looks like: #25 "summary: list customers by what they owe" (feature, closed); shared words: order, list, month, summary, customer
      #25 is a closed feature: if #74 asks to change what #25 chose, it is a new requirement, not a bug.
    lacks: an example (an invoice, or the figures seen and expected)
  #76 "invoicer crashes with a wall of code on a typo in the file" (bug)
    looks like: #66 "Unknown discount code: a stack trace instead of an error" (bug, open, in-progress, assignee sam); shared words: code, discount, throw, error, unknown, discountrate
      #66 is in progress (sam): if it is the same problem, #76 joins it and is not worked.
    lacks: nothing found
  #77 "Totals are a cent off" (bug)
    looks like: no other item
    lacks: a way to see it (a command, or steps); an example (an invoice, or the figures seen and expected)
--- UserPromptSubmit, a later prompt of the same session (CI is red ...)
exit 0
--- the agent runs it: node .sensorloop/hooks/triage.mjs
sensorloop triage: 5 item(s) labelled ready in issues/. Before you work one, read the items that look
like it, and decide: a duplicate of an open item, short of information, or the wrong kind (a bug that asks to
change what a feature chose is a new requirement). Flag such an item in its file under ## Comments, and do not
[exit 0]
[git status: nothing written by the script]
```

Each of the three items to flag shows its sign: #76 its duplicate in progress, #77 what it lacks, #74 the closed
feature that chose its behaviour; the real bug (#71) and feature (#73) show nothing that stops them.

Not provable without a session: the decision and the flag (the agent judges the report and writes in the item's
file, an instruction). No hook refuses work on a flagged item: no program can tell which item an edit is for.
