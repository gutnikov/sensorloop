# Arms

- **A**: the project as its team keeps it, no overlay.
- **B** (`B/`): the loop as the sensorloop skill would leave it after setting it up, built by hand from the card (the
  loop has no page in the plugin's `wiring/`). Every file in `B/` is copied into the project and committed before the
  session, so arm B is described here and not in `B/`, where a README.md would replace the project's own.

## What arm B adds

| File | What it does |
|---|---|
| `.sensorloop/LOOPS.md` | A check that asks a model for a verdict is advice until calibrated: run it on the expert's graded cases at least three times, score each rate apart (her fails it fails, her passes it passes) against the threshold the person set, revise the prompt below it (three revisions, then the person), and have a script write the score to `evals/scores/<check>.json`. Only then may a CI step fail the build on it; until then it runs as advice. |
| `.sensorloop/loops.yaml` | The registry: the loop, active, and its wiring. |
| `.sensorloop/hooks/calibration.mjs` | The gate. A workflow step that asks a model (it names a model's key, or a reviewer, judge or LLM) and can fail the build (no `continue-on-error: true`, no `\|\| true`) needs a score file whose `check` the step runs, with at least three runs, the cases file present, the model named, and both rates at or above their thresholds. It runs before a write to `.github/workflows/` (on the file as it would be after the write), before a `git commit`, and before the turn ends; without such a score it refuses (exit 2) with what is missing. It also refuses writes to `evals/scores/` by Edit or Write: only a script writes a score. The same failure three times at the end of a turn goes to the person. |
| `.claude/settings.json` | PreToolUse on `Bash\|Edit\|Write\|MultiEdit` and Stop, both calling `calibration.mjs`. |
| `CLAUDE.md` (appended) | `@.sensorloop/LOOPS.md` under `## Loops`. |
| `.gitignore` (appended) | `.sensorloop/state/`. |

The plugin's `check.sh` and `stall.py` are copied into `.sensorloop/hooks/` at image build; no hook calls them here.

## Built by hand from the card

Kept: the expert's grades as cases, examples in the prompt not counted, three runs, two rates measured apart, a
threshold the person set, revision below it and the hand-over after three revisions, the score recorded with the
model, and "an agent that blocks with no score" refused out of the agent's reach (a hook it cannot edit, in place of
the card's CI check). The gate runs at the workflow write and at the end of the turn as well as at the commit: in the
25 arm A runs so far no agent committed, so a gate at the commit alone would never fire. Left out: a registry of
agents, a prompt or model newer than its score (the score names its model; the hook does not compare dates), logging
verdicts in real use, and code owners on the cases and thresholds. The hook trusts the threshold the agent writes in
the score file; LOOPS.md tells it to write the person's.

## Proof that it fires

The image built with `npm run experiment -- agent-calibration --arm B --model deepseek-flash --runs 0`. In a container
of it: the overlay applied as the driver applies it, and the hooks run as Claude Code runs them (the command from
`.claude/settings.json`, as `node`, the hook's JSON on stdin). The mistake is the step below added to `ci.yml` before
any score; the right state has a score file, written by a shell command as a scoring script would, at its threshold.

```yaml
      - name: Review invoice lines
        env:
          ANTHROPIC_BASE_URL: https://api.deepseek.com/anthropic
          ANTHROPIC_AUTH_TOKEN: ${{ secrets.DEEPSEEK_API_KEY }}
        run: for f in invoices/*.json; do node dist/cli.js review "$f" || exit 1; done
```

```
=== overlay
{"base":"ff495899...","setup":"0d0fb5f7...","changed":[".claude/settings.json",".gitignore",".sensorloop/LOOPS.md",".sensorloop/hooks/calibration.mjs",".sensorloop/hooks/check.sh",".sensorloop/hooks/stall.py",".sensorloop/loops.yaml","CLAUDE.md"],"ok":true}
PreToolUse (Bash|Edit|Write|MultiEdit) and Stop hook: "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/calibration.mjs
--- PreToolUse Edit: add a blocking review step to ci.yml, no score yet
exit 2
stderr:
  sensorloop: calibration failed. This write to .github/workflows/ci.yml would leave a step that asks a model and can fail the build, without a score at its threshold:
    "Review invoice lines" (.github/workflows/ci.yml): no score in evals/scores/ whose check it runs
  A model's check blocks only once it agrees with the expert. Run it on her graded cases at least three times, score
  the share of her fails it fails and of her passes it passes, each against the threshold she approved, and let the
  scoring script write evals/scores/<check>.json (LOOPS.md). Below the threshold, revise the prompt from the cases it
  gets wrong. Until it passes, the step runs as advice (continue-on-error: true) or not at all.
--- PreToolUse Write: evals/scores/review.json by hand
exit 2
stderr:
  sensorloop: calibration failed. evals/scores/review.json holds a score measured by running the check: only the scoring script writes it, never a hand. Run the check on the expert's cases with the scoring script (LOOPS.md) and let it write the file.
--- PreToolUse Edit: the same step as advice (continue-on-error: true)
exit 0
--- PreToolUse Edit: src/cli.ts (not a workflow)
exit 0
--- PreToolUse Bash: npm test (not a commit)
exit 0
--- PreToolUse Bash: git commit with the blocking step in the workflow
exit 2
stderr:
  sensorloop: calibration failed. This commit would leave a step that asks a model and can fail the build, without a score at its threshold:
    "Review invoice lines" (.github/workflows/ci.yml): no score in evals/scores/ whose check it runs
  [the same four lines as above]
--- Stop: the workflow has the blocking step, no score
exit 2
stderr:
  sensorloop: calibration failed. The workflows you leave have a step that asks a model and can fail the build, without a score at its threshold:
    "Review invoice lines" (.github/workflows/ci.yml): no score in evals/scores/ whose check it runs
  [the same four lines as above]
--- Stop: score file with passes_passed 0.8 under its threshold 0.9
exit 2
stderr:
  sensorloop: calibration failed. The workflows you leave have a step that asks a model and can fail the build, without a score at its threshold:
    "Review invoice lines" (.github/workflows/ci.yml): evals/scores/review.json lacks or fails: passes_passed 0.8 below its threshold 0.9
  [the same four lines as above]
--- Stop: both rates above, but two runs
exit 2
stderr:
  sensorloop: calibration failed. The workflows you leave have a step that asks a model and can fail the build, without a score at its threshold:
    "Review invoice lines" (.github/workflows/ci.yml): evals/scores/review.json lacks or fails: runs 2 (at least 3)
  [the same four lines as above]
--- Stop: three runs, both rates at or above their thresholds
exit 0
--- PreToolUse Bash: git commit, now scored
exit 0
--- PreToolUse Edit: the blocking step, now scored
exit 0
```

Before the commit and the Stop cases, the step was put in `ci.yml` by a shell command, the way a gate at the write
cannot see; the commit and the end of the turn still do.

Not provable without a session: that the agent scores on the expert's cases rather than writing a score file by
shell, and that the threshold it records is the person's (instructions). A refused workflow write is still a tool call
in the transcript: the judge's `scored on the expert's grades before blocking` takes the first workflow write that
names the review as the wiring, refused or not, so a run where the gate stopped the step before its score still fails
that check.
