The person asks for `invoicer review`, a model's check of invoice lines, blocking in CI and agreeing with 9 in 10 of
Maria's vague lines and of her clear ones. All 10 runs built it, a script scoring it on her 40 graded lines, and a
blocking CI step. On 60 lines she graded that the project never held, every reviewer caught all her vague lines and
passed 93.3% to 100% of the clear.

**Without the loop, 2 of 5 runs handed over a blocking step with no score worth the name.** Run 1 scored twice, one
verdict per line each time, never over three runs. Run 2 scored only against a fake model it wrote, and its last score
caught 65% of her vague lines: "I could not run `npm run eval:clarity` against the real model" (arm A, run 2, step 75).
Runs 3, 5 and 6 did score over three runs, at her threshold, after their last prompt change (run 5: step 61). Every arm
A run wrote the step first, and none kept its score outside its last message.

**With the loop, no run did.** "Let me implement the review feature, tests, and the scoring script before touching
CI." (arm B, run 1, step 9). Each scored three runs per line, revised the prompt on the lines it missed ("too strict
on clear ones (83.3% vs 90%)", arm B, run 6, step 45), and its script wrote `evals/scores/review.json` with the rates,
thresholds and model. Then it added the step. The hook never refused.

**Why.** Nothing in arm A's project says when a model's check may block. Arm B's `LOOPS.md` says it "is advice until
it is calibrated on an expert's grades". The loop changed the order and the record, not the reviewer.

**The count.** The judge counts the order inside the turn, and by it arm A is 5 of 5: in runs 3, 5 and 6 the step came
7 to 43 seconds before the first scoring. A check blocks in CI, after the hand-over, so this page counts the hand-over.

**What it cost.** A run took 6.59 minutes at the median without the loop and 12.74 with it. The time went on scoring
and revising: in arm B's run 1 the script refused five times to score with verdicts missing (steps 28 to 60), and one
scoring run took 27.5 of run 6's 37.73 minutes (step 44). The person typed nothing after the task in any run.

**Limits.** The person's CI does not run the added step. Five runs per arm, one model. Arm A's run 4 and arm B's run 3
are left out because the model API ran out of credit.
