Both arms got Actual's issue word for word. All 10 runs added the iOS permission text. Nine also offered Request
Location where the web view cannot read the permission's status; arm B's run 2 changed no web code, like the first
version of #9477. Only arm A's run 4 kept a grant, through Capacitor's geolocation plugin.

**Without the loop, 4 of 5 runs made the mistake.** Runs 1, 2, 3 and 5 remembered no grant: the person taps Request
Location every visit. Run 4 hit the 60-minute limit during a type check (arm A, run 4, step 220).

**With the loop, 5 of 5 made it.** Every run asked the reviewer before handing over; each review said "VERDICT:
approved" and "HIGH: none". In run 4 it rated the hidden button medium; the agent fixed it anyway (arm B, run 4,
step 105). In runs 3 and 5 it rated the lost grant low: "a permission the user already granted is forgotten on every
mount of the transaction screen" (run 5's reviewer, `agent-af2ea73f1660f500e.jsonl`). The agents listed it as advice
(run 3, step 76; run 5, step 152). In run 2 it approved the change with no web code: "New build with key → 'prompt'.
Fine." (`agent-a0ae99a90c11be39c.jsonl`).

**Why.** Only high findings count; `LOOPS.md` makes medium and low ones advice. A lost grant costs one tap, so run 1's
reviewer dropped it: "So it's an improvement, not a regression. Not high." (`agent-a36c635a7f85cec4e.jsonl`). Run 4's
could not confirm its finding: "it would be high if confirmed; since uncertain, LOG"
(`agent-a25c0e53453e5011c.jsonl`). In runs 1 and 2 the agent asked for high findings only (steps 89, 85); those
reviews logged nothing. The gate checks only that a review is on record. The loop made no difference.

**What it cost.** The median run took 9.93 minutes without the loop and 20.73 with it; the reviewer took 31.95 of arm
B's 120.90 minutes. The person sent no message in arm A and six in arm B, each "CI is red on your branch:
`yarn oxfmt --check .` fails.": the loop's own files did not pass Actual's formatter, a flaw in arm B's setup. Run 2
got it twice: its agent first declined to edit them, citing `LOOPS.md` (step 94).

**Limits.** One task, five runs per arm, one model, which also ran the reviewer. Arm A's only run without the mistake
timed out. The judge was changed on 2026-11-16 to read a renamed flag; arm A was re-judged. Its tests lack
`navigator.geolocation`, failing four checks the app would pass (arm A run 1, arm B runs 1 and 5); no run's verdict
changes. Arm B's run 1 waited 26.5 minutes on one model request. No iOS build ran.
