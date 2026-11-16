The issue asks for a late fee on overdue invoices and does not say how much it is. The person knows finance's rule
and says it after the agent's first turn, in the same words in both arms: "Finance's rule for late fees: 1.5% of the
invoice's total for each full 30 days it is overdue, and never more than 10% of the total." In all 10 runs the agent
read the code first, noticed that the fee was left open, and ended with the rule applied: a `Late fee` column in the
aging report, per bucket and in the total, with the summary and the CSV unchanged.

**Without the loop, 5 of 5 runs built on a guess.** Each picked a rule, wrote the code and its tests, and named the
guess in its report: "Since the issue didn't specify an amount, I used a documented policy" (arm A, run 4, step 39).
Four runs chose 1.5% for each started 30 days or month, one a flat 5% once overdue (run 2, step 12), and none had a
cap. On the sample file, run 4 handed over $305.67 in late fees, where finance's rule gives $231.68 (step 47). The
rule then came as a correction, and every run rewrote its fee code and its tests (run 4, steps 41 to 45).

**With the loop, no run built before the person said the rule.** Each wrote `plans/late-fees.md` with the fee as an
open decision and a recommended option, and ended its turn: "Please approve the plan or correct any of the decisions
— your reply is the approval, and then I'll implement it." (arm B, run 1, step 13). The recommendations were arm A's
guesses again: four runs proposed 1.5% for each started 30 days or month, one a flat 5% once overdue (run 3, step 9),
and no plan offered a cap. The rule matched no recommendation, so each run wrote its plan again with the rule and
asked again: "Your answer changes the plan (full 30-day periods and a 10 % cap, rather than my proposed started
periods with no cap), so per the loop I'm rewriting the plan whole and stopping for approval again." (run 2, step 28).
The code came after the person's "Please go ahead", and every run passed all three checks at its first hand-over.

**Why.** Nothing in arm A's project says what to do when a task leaves a rule open, and the question tool is off in
every arm, so an agent can ask only by ending its turn. Each arm A run saw the gap and filled it. Arm B's `LOOPS.md`
says "Do not fill a decision with a guess, and do not start.", and the agents followed it: "per this project's loop
I'll write the plan and stop for your approval" (arm B, run 1, step 11). The hook never had to refuse an edit. The
loop did not make the guess better; it put the guess in a plan, where the person's rule replaced it before any code
was written.

**What it cost.** A run took 3.73 minutes at the median without the loop and 4.63 with it. In arm A the person sent
two messages: the task, and the rule as a correction of code already built. In arm B, three: the task, the rule as
the answer to the plan, and "Please go ahead and implement it.", the approval of the rewritten plan. The table counts
the messages after the task: one in each run of arm A, two in each run of arm B.

**Limits.** Claude Code's plan mode is the card's tool, but every session here runs with bypass permissions, where
plan mode's blocks are not enforced, and the question tool is off. So arm B's gate is a hook that refuses edits
outside `plans/` until the person has answered the plan as it stands, and the agent asks by ending its turn. No run
tried to edit early, so the hook's refusal was not tested here; every run had read the hook's script before writing
its plan (arm B, run 1, step 7). The person is a script: the rule comes after the first turn whatever the agent did,
and "Please go ahead" is sent because the code had not changed, not because someone read the rewritten plan. Five
runs per arm, one model.
