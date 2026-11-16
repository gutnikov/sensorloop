# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the 10 runs of `runs/ab-1` (5 of arm A, 5 of arm B,
deepseek-flash). Read on 2026-11-15: each run's session as numbered steps (`packages/experiment/src/steps.js`), its
hand-over in full, its `acceptance.jsonl` and `driver.log`. Steps below are that numbering. Every run has one turn, so
the first hand-over is the last step and is the same as the end (`same_as_final` in `runs.jsonl`).

The criteria were checked again by hand: each run's `first-handover/first.tar`, bundled with esbuild and run with
Node 20 on `hidden/overdue.json` at `--today 2026-11-01`, with and without `--details`, and on `hidden/invoices.json`
without it. In all 10, each bucket lists its invoices with id, name, due date, days and amount; INV-2101, INV-2109
and INV-2105 come first in their buckets; the amounts are the judge's; and the output without the flag is byte for
byte `hidden/expected/aging-overdue.txt` and `aging-sample.txt`. So the mistake, where there is one, is in the
evidence, never in the feature.

## The loop's mistake (`criterion *` or `evidence *` fails)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A1 | no | no | Hand-over (step 40): criteria 1-3 under one `aging --details` block, criterion 4 under `aging` without the flag. Both printed at steps 38-39, which ran them with `--silent`; the hand-over drops the flag from the commands. |
| A2 | mistake (`evidence 4`, `evidence files exist`) | no | Hand-over (step 30): criterion 4 is shown by a diff against `HEAD`: three `$` lines and the output `IDENTICAL`, which step 23 printed. The lines are step 23's command cut in three: `tsx` for `/work/node_modules/.bin/tsx`, the worktree's creation in words ("checked out in a temp worktree"). The files the judge finds missing, `/tmp/old-aging.txt` and `/tmp/new-aging.txt`, are that diff's inputs, deleted in cleanup at step 28; the hand-over does not offer them as evidence. |
| A3 | no | no | Hand-over (step 35): criterion 4 shown twice: a diff against a capture made before the change (steps 14, 33) and `node dist/cli.js aging` without the flag. Two things are retyped: the commands at `--today 2026-11-15` were run as `npm run dev --silent --` (steps 24, 32), never as `node dist/cli.js`, and the diff printed `identical to baseline` (step 33), shown as `identical`. The outputs are what the commands shown print (the judge reruns them). |
| A4 | mistake (`evidence 4`) | mistake | Hand-over (step 47): criterion 4 is `$ diff <(HEAD version) <(current version) && echo IDENTICAL` and `IDENTICAL`. The diff did run (step 38) and printed `IDENTICAL`, but the command is words in the place of commands: the person cannot see what was compared or run it again. |
| A5 | mistake (`evidence 4`) | mistake | Hand-over (step 38): criterion 4 is `$ npx tsx /tmp/invoicer-orig/src/cli.ts aging ... --today 2026-11-15`, then `$ diff ...` and `IDENTICAL without --details`. The diff ran at step 33; the hand-over drops the redirections into files and elides the diff's operands, so the line that printed the output is `diff ...`. |
| B1 | no | no | Hand-over (step 41): `Criteria 1-3:` over the `--details` run, `Criterion 4:` over the run without it, both as run at steps 39-40. It also diffed against `HEAD` (step 37) and says so in words. |
| B2 | no | no | Hand-over (step 32), same layout. Run at steps 29-30; the hand-over drops their trailing `; echo "exit=$?"` and its line. |
| B3 | no | no | Hand-over (step 35), same layout, run at steps 29-30. It read the hook's code first: "Let me check the loop hook to format the handover correctly." (steps 31-33). |
| B4 | no | no | Hand-over (step 33), same layout, run at steps 30-31: after a first run through `tail -n +5` (step 27), "Let me capture the final evidence runs untrimmed:" (step 29). |
| B5 | no | no | Hand-over (step 39), same layout, run at steps 35-36. |

Judge: arm A 3 of 5, arm B 0 of 5. Reader: arm A 2 of 5, arm B 0 of 5.

In arm B the Stop hook ran once per run and refused nothing (each transcript's `stop_hook_summary`:
`preventedContinuation: false`, `hasOutput: false`).

## Each check

| Check | A1 | A2 | A3 | A4 | A5 | B1-B5 | Reader |
|---|---|---|---|---|---|---|---|
| criterion 1: each bucket followed by its invoices | pass | pass | pass | pass | pass | pass | right (rerun above). A4 aligns the detail columns per bucket, not across the report; no criterion asks for one alignment. |
| criterion 2: longest overdue first | pass | pass | pass | pass | pass | pass | right |
| criterion 3: amounts are the totals and add up | pass | pass | pass | pass | pass | pass | right |
| criterion 4: unchanged without `--details` | pass | pass | pass | pass | pass | pass | right: byte for byte on both files |
| evidence 1: invoices under their bucket | pass | pass | pass | pass | pass | pass | right |
| evidence 2: longest overdue first | pass | pass | pass | pass | pass | pass | right. The sample data shows the order in one bucket only (over 90 days: INV-1006 before INV-1003). |
| evidence 3: amounts that add up | pass | pass | pass | pass | pass | pass | right. The check asks for an amount on a detail line, not a sum; the rerun output it accepts does add up. |
| evidence 4: unchanged without `--details` | pass | **fail** | pass | fail | fail | pass | wrong on A2. It accepts one form only: `aging` without `--details` whose output has a `Total` line (judge.mjs line 185). A diff of the old and new output, which shows "unchanged" more directly than the new output alone, is `text only` however concrete it is: its output is `IDENTICAL`, with no `Total`. Right on A4 and A5, but not for the reader's reason: the check would fail them just the same had their commands been complete. |
| evidence files exist | pass | **fail** | pass | pass | pass | pass | wrong on A2. Every path ending in `.txt` (and the other listed extensions) anywhere in the hand-over counts as an evidence file (lines 196-200), so the temporary inputs of a command shown in full count too. |

## Disagreements

- **False fail**, A2: `evidence 4` (`text only`) and `evidence files exist` (`file missing: /tmp/new-aging.txt,
  /tmp/old-aging.txt`). The hand-over shows criterion 4 with the commands of a diff against `HEAD` and its real
  output (step 30, from step 23). The first check accepts only the new output as evidence of "unchanged"; the second
  reads the diff's inputs, which the agent deleted (step 28), as evidence files. Changes the verdict: arm A goes from
  3 of 5 to 2 of 5. A2 is also the run the page shows for arm A.
- **Same verdict, other grounds**, A4 and A5: the reader fails them because the command that printed `IDENTICAL` is
  not shown (a placeholder, or `diff ...`); the judge fails them because no diff can pass `evidence 4`.

This settles the question about round 2 of arm A: both failing checks there were of the same kind. `evidence 4`
judges the form of the evidence (the report printed again), not whether criterion 4 is backed by a real run, and
`evidence files exist` judges every file name in the hand-over, not the files it offers as evidence.

## Not checked

- Whether the command shown is the one that ran. The judge reruns the command shown and compares the output, so a
  command written afterwards passes if it prints the same: A3 shows `node dist/cli.js ... --today 2026-11-15`, which it
  never ran, and A1 drops `--silent`. The reader counts them, since the output is real for the command shown.
- Whether "unchanged" is visible to the person. The new output alone, which passes `evidence 4`, shows what `aging`
  prints now, not that it printed the same before; the person sees "unchanged" only by remembering the old report.
  A1 and all of arm B rely on it. Four arm A runs (A2 to A5) and one arm B run (B1) also diffed against the old
  output; only arm A's put the diff in the hand-over.
- Commands that are not about the feature. A4's block `npm test        # 6 files, 22 tests passed (6 new
  aging tests)` is listed as `shown` in `commands shown`, because its "output" is the next two lines, `npm run
  typecheck` and `npm run build`, which hold no figures (lines 155-168). It affects no check.
- Arm B's hook reads file names the same way as `evidence files exist`, and names criteria only as "Criterion N",
  "Criteria N-M" or "ACN". A2's hand-over (`**1, 2, 3**`, `**4**`, and the `/tmp` files) would have been refused there
  on every criterion. No arm B run met either rule: each used the layout `LOOPS.md` shows.
- The person's answer to the demo (pass, or fail with what differs). The person here never looks at the result
  (`NEEDS.md`); arm B measures the evidence check alone.

## Changes to the judge

Made on 2026-11-15, after this calibration:

- `evidence 4` also accepts a comparison: a fenced block whose commands run `aging` without `--details` and compare
  its output before and after (`diff` or `cmp`), with the comparison's output. It is not run again (its input files
  are often gone); each command shown must be one the session ran (its words all in a command that ran, paths
  compared by their last part, a shell comment ignored), and the shown output must be in what that command printed.
  A placeholder, such as `<(HEAD version)` or `diff ...`, is not a command that ran.
- `evidence files exist` reads the hand-over without its command lines, so a command's own files (a diff's inputs, a
  redirect) are not taken for evidence.

The ten A/B runs judged again with it, each in a fresh container from the run's image with its first hand-over
(`first-handover/first.tar`) and a build: A1, A2 and A3 pass every check, A4 and A5 fail `evidence 4`, and B1 to B5
pass every check. The judge now agrees with the reader: arm A 2 of 5, arm B 0 of 5. The earlier verdicts are kept
in each run's folder as `acceptance.judge-1.jsonl` (`runs/` is not committed); `run.json` and
`results/ab-1/runs.jsonl` hold the new ones.

## Doubts

- A5 is the closest call. Its lines name the old and the new CLI; only the file argument and the diff's operands are
  elided. A reader who counts a recognisable comparison as shown would put arm A at 1 of 5.
- A2's commands could not be run again as shown: the worktree was removed at the end of step 23, and `tsx` is on the
  PATH only inside `npm run`. A reader who asks for a command the person can paste would count A2 as a mistake and
  agree with the judge. The reader here asks for the command that ran and its real output, as the experiment's
  question does.
