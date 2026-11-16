The task is FB-112, an email to support from Marta, a bookkeeper: the aging report says $3,096.28 is over 90 days,
"but not who owes it". In all 10 runs the agent read the code and ran the aging report on the sample file. After the
agent's first turn, the product owner wrote once, the same message in both arms: four approved criteria, among them
`invoicer aging <file> --by-customer` and "Without --by-customer, aging prints exactly what it prints today." Every run
ended with all four criteria met, a test named after FB-112 and CI green. The arms differ in what the first turn held.

**Without the loop, all 5 runs built a guess before the product owner spoke, and it missed the approved criteria.**
Each added a customer table to the aging report's default output, with no option to leave it out: "I'll add a
per-customer breakdown to the aging report so each bucket shows who owes it." (arm A, run 4, step 21), then "Done."
(step 35). The criteria arrived as a correction, and the agent redid part of the work: "Understood — the approved
criteria differ from what I built. I'll change it to an opt-in `--by-customer` flag and restore the default output
exactly." (step 36). Each run had also written a test named `FB-112: ...` in its first turn, after the code, so the
test half of the question did not separate the arms.

**With the loop, no run changed the code before the product owner spoke.** Each ran the report to reproduce the
$3,096.28, sent draft criteria with Marta's words beside them, and stopped: "I'll wait for your approval or corrections
to these criteria, then add a test named for FB-112, watch it fail, and build what you approve." (arm B, run 1, step
22). After the answer, every run wrote its FB-112 tests first and saw them fail before it changed the code: "All three
new-behavior tests fail as expected, and the unchanged-default test passes. Now I'll implement." (arm B, run 2, step
29).

**Why.** Both arms guessed the same thing. All 5 drafts in arm B also put the customers in the default report, which
criterion 4 rules out; 3 of them named `--by-customer` only as the alternative: "should this be the default `aging`
output, or a flag such as `--by-customer`? My recommendation is default — it's what she opens the report for." (arm B,
run 4, step 18). The loop did not make the guess better. It made the agent write the guess down as criteria and stop,
so the product owner's answer replaced it before any code, instead of correcting code already built.

**What it cost.** A run took 3.83 minutes at the median without the loop and 4.4 with it. The first turn was shorter
with the loop: arm B's drafts reached the person 52 to 74 seconds after the task, arm A's builds 107 to 200 seconds
after it. In both arms the product owner wrote one message per run, and no run needed a report of a red CI or a
request to go ahead.

**Limits.** The product owner is scripted: the same complete criteria after the first turn, whatever it held. A person
who approved arm B's drafts as written would have approved the change to the default report that criterion 4 rules
out, so the loop helps only as far as the person reads the draft. The hook that refuses code with no test named after
the item never refused: every run of arm B named its tests after FB-112, as `LOOPS.md` asks, and so did every run of
arm A, which has no such instruction but has an earlier test named `FB-87: ...`. These runs show the instruction in
`LOOPS.md` at work, not the hook. The question tool was off in both arms, so the agent asked by ending its turn.
