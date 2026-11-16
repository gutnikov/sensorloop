In session 1 of both arms the agent added `--customer` to the reports, and in all 10 runs its first hand-over said
nothing at the top about whose figures they were. The person corrected it, and every run then printed
`Customer: Acme Tools (acme)` above the figures. Session 2, a fresh Claude Code, added `--month` to the summary. CI
was green after every session.

**Without the loop, 2 of 5 runs made the mistake again.** In runs 2 and 3 the month's summary never names the month.
Run 2 tried both filters: "Customer: Acme Tools (acme)" above a September summary that does not say September
(arm A, run 2, session 2, step 25). No arm A run kept a rule or a memory. What carried over was session 1's code
comment, such as "Names the customer a filtered report covers, so the printout cannot pass for the whole company's."
(run 2, session 1, step 29). Every session 2 read it, and three added a month line. Run 3 weighed it: "OK final:
minimal, no scope line." (run 3, session 2, its reasoning before step 16).

**With the loop, no run made it again.** Each session 1 wrote the correction into `.sensorloop/LOOPS.md` before the
fix, with the date and the issue: "A filtered report must say at the top what it covers, e.g. `Customer: Acme Tools
(acme)` above the figures" (arm B, run 5, session 1, step 22). Every session 2 began with that rule in its
instructions, put a `Month:` line above the figures, and named the rule in its hand-over.

**Why.** In arm A the correction survives only as code about customers, and the month's issue does not ask for more.
Arm B's rule covers any filtered report, and every session reads it: "I'll follow the existing `customer.ts` pattern
and apply the project rule that filtered reports state their scope." (arm B, run 4, session 2, step 15).

**What it cost.** A run of both sessions took 6.38 minutes at the median without the loop and 4.59 with it. Every
run had one message from the person: the correction after session 1's first turn.

**Limits.** The person is a script and corrects whatever the first turn held; here every first hand-over needed it.
Arm B makes the rule at the first correction, where the card waits for a second and a person's approval. Arm B's code
carried the same comment as arm A's, so its 5 of 5 is the rule and the comment together. Five runs per arm, one
model.
