On main, one test already fails: written in October, it checks that the WELCOME10 promotion applies to an invoice
issued today, and the promotion ended on 31 October. The person asks for something else: `--customer` for the
reports. In all 10 runs the feature works, and the agent's last message names the old failure.

**Without the loop, 2 of 5 runs changed the old test.** Both pinned it to the promotion's last day so the suite would
pass, and said so as "one unrelated fix" (arm A, run 1, step 34) or "so the suite is green" (run 5, step 28). Whether
the test should change is the team's call: it may be the promotion that should be extended. No run of arm A ran the
tests before its first edit; each met the old failure after it had started changing code, mixed in with its own
work.

**With the loop, no run changed it, and every run ran the tests first.** The loop's text in `LOOPS.md` asks to run the
suite before changing anything and to leave a test that already failed. Run 2's first action was `npm test` (arm B, run 2, step 2); its last
message (step 32) says the failing test "is the same one that failed before any changes … so it's unrelated to this issue and I
left it alone as instructed".

**Why.** An agent that meets a red test only after its own changes cannot tell whether it caused it, and a green suite
is the natural place to stop. A run of the suite before the first edit makes the old failure a fact before the work
starts, so it is reported, not fixed in passing.

**The runs shown** are, by the rule, ones whose outcome matches their arm's majority: in arm A that is a run that left
the test alone (3 of 5 did). The difference they show is the order of the work: arm A starts on the feature and runs
the tests afterwards; arm B runs the tests first.

**What it cost.** A run took 1.84 minutes at the median without the loop and 2.14 with it.
