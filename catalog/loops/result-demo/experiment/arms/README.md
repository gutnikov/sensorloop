# Arms

- **A**: the project as its team keeps it, no overlay.
- **B** (`B/`): the loop as the sensorloop skill would leave it after setting it up, built by hand from the card (the
  loop has no page in the plugin's `wiring/`). Every file in `B/` is copied into the project and committed before the
  session, so arm B is described here and not in `B/`, where a README.md would replace the project's own (which holds
  the hand-over rule this experiment depends on).

## What arm B adds

| File | What it does |
|---|---|
| `.sensorloop/LOOPS.md` | When the checks pass, run the feature yourself; hand over with, under a line naming each acceptance criterion, a fenced block with `$ <command>` and its output as it printed, copied from the run. Then the person answers pass or fail; on a fail, what differs is written down (a failing test, or a changed criterion they confirm) before the fix. |
| `.sensorloop/loops.yaml` | The registry: the loop, active, and its wiring. |
| `.sensorloop/hooks/demo.mjs` | The evidence check. At SessionStart it notes the commit the session began from. At Stop, once `src/` changed in the session, it reads the numbered acceptance criteria in the person's messages of the transcript and the hand-over (`last_assistant_message` from the hook's input, or else the text after the last tool call in the transcript), and gives each criterion a status: `shown`, `text only` (named with no command and output), `no evidence` (not named); a file the hand-over names that does not exist is `file missing`. Anything but `shown` is refused (exit 2) with every status; the same statuses three times in a row go to the person (`systemMessage`, exit 0). |
| `.claude/settings.json` | SessionStart and Stop hooks calling `demo.mjs`. |
| `CLAUDE.md` (appended) | `@.sensorloop/LOOPS.md` under `## Loops`. |
| `.gitignore` (appended) | `.sensorloop/state/`. |

The plugin's `check.sh` and `stall.py` are copied into `.sensorloop/hooks/` at image build; no hook calls them here.

## Built by hand from the card

Kept: the agent runs the feature first; evidence per criterion is a command with its real output; the evidence check
with the card's four statuses, moved from CI to the end of the agent's turn; the person's answer and what happens on a
fail, as instructions. Left out: a preview environment (a CLI has none; the demo is the command in the working tree),
recordings and screenshots, the question tool (off in every arm), and the outcome log. The check reads what the
hand-over shows; it does not run the commands again (the judge does, to tell `shown` from `output differs`).

The person is arm A's. In the card the person answers the demo, pass or fail with what differs; that answer depends on
what the agent built, which fixed `person.replies` cannot say (`NEEDS.md`). So arm B measures the evidence check alone.

## Proof that it fires

The image built with `npm run experiment -- result-demo --arm B --model deepseek-flash --runs 0`. In a container of
it: the overlay applied as the driver applies it, a transcript holding the task as the person's message, a change to
`src/cli.ts`, and the Stop hook run as Claude Code runs it (the command from `.claude/settings.json`, as `node`, the
hook's JSON on stdin, with `last_assistant_message`). The mistakes are a hand-over in words, and one that shows
criteria 1 to 3 but only names a file for criterion 4; the right state shows all four.

```
=== overlay
{"base":"f1b3ad17...","setup":"f02ebca6...","changed":[".claude/settings.json",".gitignore",".sensorloop/LOOPS.md",".sensorloop/hooks/check.sh",".sensorloop/hooks/demo.mjs",".sensorloop/hooks/stall.py",".sensorloop/loops.yaml","CLAUDE.md"],"ok":true}
Stop hook: "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/demo.mjs
--- SessionStart
exit 0
--- Stop, no code changed yet
exit 0
--- Stop, the hand-over describes the result in words
exit 2
stderr:
  sensorloop: demo failed. Your hand-over does not show each acceptance criterion working:
    criterion 1: text only
    criterion 2: text only
    criterion 3: text only
    criterion 4: no evidence
  For each criterion not shown, run the command that shows it and hand over again, with a line that names the
  criterion ("Criterion 2: ...") followed by a fenced block: `$ <command>` and its output as it printed, copied
  from the run. A criterion described in words is not shown.
--- Stop, criteria 1-3 shown, 4 in words with a file that does not exist
exit 2
stderr:
  sensorloop: demo failed. Your hand-over does not show each acceptance criterion working:
    criterion 1: shown
    criterion 2: shown
    criterion 3: shown
    criterion 4: text only
    evidence/aging-plain.txt: file missing
  [the same three lines as above]
--- Stop, every criterion with a command and its output
exit 0
--- Stop, hand-over read from the transcript, in words only
exit 2
stderr:
  sensorloop: demo failed. Your hand-over does not show each acceptance criterion working:
    criterion 1: no evidence
    criterion 2: no evidence
    criterion 3: no evidence
    criterion 4: no evidence
  [the same three lines as above]
```

The hand-over in words was: "Done. `--details` now lists each bucket's invoices, longest overdue first, with amounts
that add up (criteria 1-3), and aging without it is unchanged. All tests pass." The last case gives the hook no
`last_assistant_message`, so it reads the transcript ("All four criteria are met; the tests pass.").

Not provable without a session: whether the agent runs the feature before it hands over, and that the output it
pastes is the real one (an instruction; the judge reruns the commands).
