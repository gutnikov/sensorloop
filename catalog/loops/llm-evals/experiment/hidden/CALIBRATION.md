# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1`
to `-3`, deepseek-flash). Read on 2026-11-15: each run's diff, its saved verdicts and the agent's messages. The judge
calls the model, so it was not run again: the verdicts below come from the saved measures.

## The loop's mistake (`no eval regression`)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| 1 | no mistake | no mistake | Base 100/100/100%, agent 100/100/100%. |
| 2 | no mistake | **mistake** | Base 100/100/100%, agent 95/95/95%: `e-learning` passes in every base run and fails in every agent run ("E-learning seats, 25 users: Software (expected Training)"). |
| 3 | no mistake | no mistake | Base 100/100/100%, agent 100/100/100%. |

## Disagreements

| Run | Check | Class | Evidence |
|---|---|---|---|
| 2 | `no eval regression` | false pass | The judge floored the noise at one case (`Math.max(spread, 1 / cases)`) and required the drop to exceed it. With a base spread of 0 and a drop of exactly one case (5 points), 5 > 5 is false, so it passed. The card counts a drop below the baseline by more than the spread of the base's runs (0 here), and `experiment.yaml` says "by more than the noise ... and at least one case". A case that fails 3/3 while the base passes it 3/3, in runs made at the same time, is the card's regression, not noise. |

Why it dropped, from the diff: run 2 turns thinking off (`diff.patch` line 195) and sends every request through the new
batch message, even for one invoice (`invoicesMessage`, line 125). The agent's own evals, 100% twice with thinking off,
ran `npm run eval`, which calls `categorizeLines` and the old one-invoice message (line 32): they measured a path the
CLI no longer takes. The judge runs the CLI, which is the path that ships.

## Not checked

- Batches of several invoices. All three runs moved to batching (up to 20 invoices a request), the main saving the
  task invites. The judge runs one invoice per case, so a batch of one: no check sees how the model does on a real
  batch, nor whether a reply of the right total length but shifted between invoices gives one invoice another's
  categories (all three split the flat list by count). The agents tested batches themselves (run 1: 144/144 lines;
  run 2: 20/20 in one request; run 3: 412 invoices, 0 wrong), but no check does.
- `cheaper` is measured per invoice on one-invoice files, so it cannot see the saving from batching. All three pass it
  through the shorter answer (output 213-234 tokens down to 13-90). A run that only batched would fail it.

## Changes to the judge

`no eval regression`: the noise is the spread of the base's runs, and the check fails when the agent's mean is below
the base's by more than that spread and by one case or more (`drop > noise && drop >= 1 / cases`). One stray run of one
case (a drop of a third of a case) still passes.

Verified without the model, from the saved measures (`eval pass rate per run`, `eval complete`, `regressed cases`),
by recomputing the check with the new rule:

- Run 1: passes (drop 0). Run 3: passes (drop 0).
- Run 2: fails, "agent 95% vs base 100%: a drop of 5 points, noise 0; regressed: e-learning".
- The re-judged lines are in `acceptance.calibrated.jsonl` beside each run's `acceptance.jsonl`; only that one line
  differs, in run 2.
- `reference.patch` could not be judged again without the model. It passes the new rule whenever its pass rate is
  within the base's spread or less than one case below it; before, it could also be one full case below.

## The verdict that flipped

Run 2 now made the loop's mistake, so the pilot qualifies on one run of three. One doubt remains: the judge measures
three runs at one moment and does not rerun a failing case, while the card reruns it up to four more times before it
calls it a regression. The agent's evals saw `e-learning` pass six times out of six (on the one-invoice path). Rerunning
the regressed cases, as the card says, would make the verdict firmer; it was not added, since it cannot be verified
here without calling the model.

## Doubts

- The eval set of the base has one invoice per case, and `npm run eval` calls `categorizeLines`, which the CLI stops
  using once a run batches. A batched run of the eval set in the judge (all cases as invoices of one file, three runs,
  compared line by line with the base) would cover what all three runs changed. Not added: it needs the model to
  verify.

## Calibration on the ab-1 runs

The judge's first use on arm B. The ten valid runs of `runs/ab-1/` (deepseek-flash, `high` effort): arm A runs 1, 2,
3, 4 and 6, arm B runs 1 to 5. Arm A's run 5 is left out: its `run.json` has an `error` (the model API refused with
402 Insufficient Balance from 21:03:28 on), and its measures (base 10%, 0%, 0%) say nothing about the agent. Read on
2026-11-16: each run's steps (`node packages/experiment/src/steps.js <run dir>`, whose numbering the steps below
follow), its `driver.log`, `diff.patch`, `acceptance.jsonl` and transcript. The judge calls the model, so it was not
run again: the verdicts below are the saved ones. In every run the first hand-over equals the end
(`same_as_final: true`, no `acceptance-first.jsonl`).

What the judge measures: each case of the base's eval set as its own file of one invoice, named `EVAL-<case>`
(`judge.mjs` line 98), through `tsx src/cli.ts categorize` (line 122), three runs on the base and three on the agent's
version.

### The loop's mistake (`no eval regression`)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | no mistake | no mistake | Base 100/100/100%, agent 100/100/100% (`acceptance.jsonl` lines 1-2). Thinking off (`diff.patch` line 147), 40 lines a request (line 154). The agent's evals after the change: `npm run eval` 60/60 twice (steps 48, 59), the cases batched 240/240 (step 62). |
| A 2 | no mistake | no mistake | 100/100/100% both. Thinking on, 50 lines a request (line 124). `npm run eval` 60/60 after the change (step 21). |
| A 3 | no mistake | no mistake | 100/100/100% both. Thinking on, 100 lines a request (line 158). The agent's own baseline on the base was 98% (`starter-kit` 2/3, "no JSON list of categories in the answer", step 11); after the change 60/60 (step 26), and the cases batched 48/48 three times (step 32). |
| A 4 | mistake | mistake | Base 100/100/100%, agent 95/95/95%: `e-learning` fails in every agent run, "E-learning seats, 25 users: Software (expected Training)" (lines 2, 5, 7). Thinking off (`disableThinking: true`, line 183), 10 invoices a request (line 181). The command now sends a file of one invoice under the heading `Invoice <id>:` (line 167); `categorizeLines`, which `npm run eval` calls, sends the lines with no heading (line 31). The agent's evals: 20/20 (step 32) and 60/60 (step 38) through `categorizeLines`; 20/20 in two requests (step 35) and 60/60 (step 40) with ten invoices a request. None sent the request that failed. |
| A 6 | no mistake | no mistake | 100/100/100% both. Thinking off (line 122), 50 lines a request (line 126), the lines sent with no invoice heading. 60/60 after the change (step 27) and again with thinking off (step 44). |
| B 1 | no mistake | no mistake | 100/100/100% both. Thinking on. `scripts/eval.ts` rewritten to send the cases "in the same batches `invoicer categorize` uses" (line 23): one request for all 20 (step 48, `"calls":1`). `npm run eval` 20/20 (step 47); the comparison passes (step 50). |
| B 2 | no mistake | no mistake | 100/100/100% both. Thinking off (line 350). `scripts/eval.ts` through `categorizeInvoices` (lines 25-26). 20/20 (steps 55, 66); the comparison passes (step 77, and from its cache at step 80). |
| B 3 | no mistake | no mistake | Base 100/100/100%, agent 95/100/100% (line 2): one case run in 60 failed, and since runs 2 and 3 passed every case, it passed in the agent's other two runs (`regressed cases` empty, line 5). A drop of 1.7 points, a third of a case: by the card's reruns ("Two passes clear it as noise") noise. The judge does not record which case it was. Thinking on, `maxTokens` 8192 (line 289). `scripts/eval.ts` batched (line 24). The comparison passes (steps 50, 61). |
| B 4 | mistake | mistake | As A 4: agent 95/95/95%, `e-learning` "Software (expected Training)" in every run (lines 2, 5, 7). Thinking off (line 270), 40 lines a request (line 274); a file of one invoice goes under `Invoice <id>:` (line 256). `scripts/eval.ts` rewritten to batch the cases (line 39): two requests a run, 19 cases (38 lines), then `store-opening`. The comparison by hand twice, "evals pass: pass rate 100% (runs 100, 100, 100), baseline 100% (runs 100, 100, 100), noise 0 points" (steps 25, 38). |
| B 5 | no mistake | no mistake | 100/100/100% both. Thinking on. `scripts/eval.ts` "in the batches the command sends" (line 43): up to 20 invoices and 60 lines a request (lines 325-326), so one request. 20/20 (step 27); the comparison passes (steps 29, 38). |

Judge: arm A 1 of 5, arm B 1 of 5. Reader: the same.

### Each check

| Check | All ten runs | Reader |
|---|---|---|
| eval complete | pass | right: no case run missing in any run |
| no eval regression | fail in A 4 and B 4, pass in the rest | right (above) |
| cheaper | pass | right, on one-invoice files: the agent's output per invoice is 13-15 tokens in the five runs with thinking off and 96-111 in the others, against 203-229 on the base (line 4 against line 3) |

The measure `eval runs by the agent` (line 9) is not a check, and it is off. It counts Bash commands matching
`npm run eval|scripts\/eval` (`judge.mjs` line 246), so it counts a read or a diff of `scripts/eval.ts` (seven runs)
and misses `node .sensorloop/hooks/evals.mjs` (all five arm B runs) and the agents' own batched scripts:

| Run | Measure | Counted by mistake | Missed |
|---|---|---|---|
| A 1 | 4 | | the batched runs (step 62) |
| A 2 | 4 | step 3, a `cat -n` of `scripts/eval.ts` | |
| A 3 | 3 | step 4, a `cat` of `scripts/eval.ts` | the batched runs (step 32) |
| A 4 | 3 | | the batched runs (steps 35, 40) |
| A 6 | 4 | step 5, a `cat -n` of `scripts/eval.ts` | |
| B 1 | 1 | | the comparison (step 50) |
| B 2 | 3 | step 71, a `git diff` of `scripts/eval.ts` | the comparisons (steps 77, 80) |
| B 3 | 2 | step 52, a `git diff` of `scripts/eval.ts` | the comparisons (steps 50, 61) |
| B 4 | 1 | step 5, a `cat` of `scripts/eval.ts` | the comparisons (steps 25, 38), three runs of the set each |
| B 5 | 2 | step 3, a `cat -n` of `scripts/eval.ts` | the comparisons (steps 29, 38) |

In B 4 the agent never typed `npm run eval`, and it ran the eval set six times, through the hook's script.

### Disagreements

- None on the loop's mistake.
- `eval runs by the agent`, as above: it reads "1" in B 4, where the agent ran the set six times. Not in the qualify
  rule; it changes no verdict. Not changed: the judge is not this reading's to edit. A fix would match the commands
  that run the set (`npm run eval`, `tsx scripts/eval`, `evals.mjs`) and not a path inside `cat` or `git diff`.
- The same pattern is the cast marker "The agent runs the evals" in `experiment.yaml`. In arm A's replay (`A.cast`,
  run 3) it falls on step 4, where the agent reads `scripts/eval.ts`; the agent first runs the set at step 11. In arm
  B's replay (run 3) it falls right, on `npm run eval -- --runs 1` (step 49).

### Why the loop let B 4 through

- What arm B wires: the Stop hook `node "$CLAUDE_PROJECT_DIR"/.sensorloop/hooks/evals.mjs --hook`, 600 s
  (`arms/B/.claude/settings.json`); `.sensorloop/LOOPS.md`, imported in `CLAUDE.md`; the baseline
  `evals/baseline.json`, measured on `ea45738` with the base's runner, one case a request: 100% three times, spread 0.
- It ran. The agent ran it by hand at step 25 (09:17:12 to 09:17:21) and step 38 (09:19:05 to 09:19:08), each three
  runs of `npm run eval -- --runs 1`, and both said "evals pass: pass rate 100% (runs 100, 100, 100), baseline 100%
  (runs 100, 100, 100), noise 0 points". The Stop hook ran once, at 09:19:36, in 96 ms, exit 0, with the same message
  (transcript line 229): the watched files had not changed since step 38, so it returned the stored verdict without
  calling the model (`evals.mjs` lines 142-146).
- Not the threshold. With a spread of 0, any mean below 100% sends the failed cases to four reruns (lines 168-172),
  and a case that fails three of them is a regression (line 180). Every one of the hook's six runs was 100%.
- Not the agent skipping it, and not a flaky case: `e-learning` failed 3 of 3 in the judge's runs of the agent's
  version, passed 3 of 3 on the base, and passed 6 of 6 in the hook's runs.
- The cause: the hook measures what `npm run eval` sends, and the agent changed that. At step 18 it rewrote
  `scripts/eval.ts`, as `LOOPS.md` asks ("make `scripts/eval.ts` run that one, so that the evals measure what
  ships", lines 26-27), so that a run sends the 20 cases in two batched requests; its report: "Now drives
  `categorizeBatch` through the same `batchInvoices` grouping the command uses, so the evals measure what ships"
  (step 42). The judge sends `e-learning` alone, as the command sends a file of one invoice:
  `Invoice EVAL-e-learning:` and one line, thinking off. No request of the session had that shape.
- The hook lets the runner change: `scripts/eval.ts` is a watched file, which triggers the evals (line 28), not part
  of the suite it guards (line 29). A new runner is compared with a baseline the old one measured.
- All five arm B runs rewrote `scripts/eval.ts` to batch the cases (B 1 line 23, B 2 lines 25-26, B 3 line 24, B 4
  line 39, B 5 line 43); in four of them all 20 cases go in one request. No arm A run changed it. A 4 shows the same
  gap without the loop: its evals went through `categorizeLines`, with no heading, and through batches of ten.

### Not checked

- Batches of many invoices, as in the pilot: the judge sends one invoice a file, the shape that failed, and never a
  batch, the shape a 412-invoice file sends. Each agent checked its batched path itself (A 1 step 62, A 3 step 32,
  A 4 step 40, and arm B's rewritten runner), not independently.
- `cheaper` sees the shorter answer only, as in the pilot; it cannot see the saving from batching.

### Changes to the judge

None.

### Doubts

- The invoice's name in the request. The judge names each case's invoice `EVAL-<case>`. A 4 and B 4 are the only
  runs with thinking off whose request names the invoice (`Invoice EVAL-e-learning:`); A 1 and A 6 send the lines
  with no heading, B 2 under `Invoice 1:`. The case is ambiguous on the prompt's own terms: Software holds "SaaS
  seats", Training "e-learning seats" (`fixtures/invoicer-assist/src/categorize/prompt.ts` lines 11-12, 15). Whether
  the name, the heading, the line alone or chance tipped it to Software cannot be told without the model. A judge
  run with names like `INV-1001` would tell whether the drop is the agent's or the judge's.
- B 1's one message came from a false end of turn. After step 25 the agent's next reply took 25 seconds (the tool
  result at 08:44:33, the reply at 08:44:58); the driver logged `turn-end` at 08:44:49, ran CI (green, the code
  unchanged) and, with no change to the code, typed "Please go ahead and implement it." at 08:45:17. Claude Code
  delivered it inside the turn (`queue-operation`, `absorbed_mid_turn`, with step 28's result); the agent's next
  thinking: "The user says "Please go ahead and implement it." So continue." Its `minutes_to_green`, 3.38, is the CI
  of that false hand-over. The run's two permission prompts were both for one command, step 18, answered yes.
- The Stop hook never refused in any run (`hook_refusals: 0`). In every arm B run it ran once, in 96 to 226 ms, and
  returned the verdict of the agent's own last comparison: these runs show `LOOPS.md` and the agent running the
  check, not the gate.

## The invoice names (2026-11-16): no mistake left

The two mistakes above, and the pilot's run 2, all failed on the same case, `e-learning`, and only on a version whose
request puts the invoice's id in front of its lines (`Invoice <id>:`). The judge named each case's invoice after the
case, `EVAL-e-learning`, with the customer "Eval Customer": the request held the case's name, in an id no real
invoice has.

The judge now names the invoices `INV-1001` to `INV-1020`, with the customer "Harbor Pine Ltd" (`judge.mjs`, the loop
that writes the cases). Re-judged with it, calling the model as in the runs:

| Run | Before | After |
|---|---|---|
| ab-1 A 1, 2, 3, 6; B 1, 2, 3, 5 | no mistake | no mistake: base and agent 100/100/100% (B 3 before: 95/100/100%) |
| ab-1 A 4 | mistake (agent 95/95/95%) | no mistake: base and agent 100/100/100% |
| ab-1 B 4 | mistake (agent 95/95/95%) | no mistake: base and agent 100/100/100% |
| pilot A 2 | mistake (agent 95/95/95%) | no mistake: base and agent 100/100/100% (from its `diff.patch`) |

A 4 and B 4 were judged twice. Judged at the same moment as each other, both had one run at 70% on the base and the
agent's version alike, the same drop on both, and passed. Judged one at a time, both were 100% in all six runs; those are the
verdicts written into `acceptance.jsonl`. The old lines are in `acceptance.judge-1.jsonl` beside each run's.

So no run of this experiment, pilot or A/B, lowered the pass rate: the agent kept the categories as good as before with
the loop and without it. The experiment does not qualify, and its A/B is 0 of 5 against 0 of 5.
