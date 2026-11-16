Both arms built the feature right. In all 10 runs `summary` and `aging` take `--customer <id>`, an unknown id is an
error that names it, and the summary without the option is unchanged. Every run put the filter in a function with a unit
test, and wired the option into the command line. The project's CI does not measure coverage and was green every time.

**Without the loop, 5 of 5 runs handed over command-line code that no test runs.** No test imports `src/cli.ts`, so 15
to 26 changed lines per run, the option's parsing among them, run in no test. Four runs tested only the filter and ran
the command by hand: "Now let me verify the CLI behavior end to end." (arm A, run 5, step 22). Run 1 wrote tests that
start the command as another process, which coverage does not count; even there, no test runs its new usage error
(`src/cli.ts`, lines 63 and 64).

**With the loop, no run did.** Each agent read the hook's script before writing code (arm B, run 1, step 16) and made
the command line callable from a test: "Key constraint: the loop hook requires every changed `src/` line to run in a
test **in-process**, so I'll split the CLI logic into a testable module and keep `cli.ts` as a thin entry point." (run
2, step 14). Each ran the hook itself once, and it passed (run 3, step 27). When the turn ended, the hook passed again:
it never had to refuse.

**Why.** Nothing in arm A's project asks for a test of the command line. Arm B's `LOOPS.md` says how to write one that
counts: "call the function from the test." The agents did so before the gate could object.

**What it cost.** A run took 1.92 minutes at the median without the loop and 4.1 with it. Arm B's runs added 131 to 199
lines of tests, arm A's 24 to 84. The person sent no message in arm B. Arm A's run 7 counts one, "Please go ahead and
implement it.": the driver took the agent's slow start for the end of its turn and sent it, 25 seconds after the task.
The agent was still working and went on.

**Limits.** Only the card's first check is wired: lines a test runs, not branches, and not the mutation run, which asks
whether the tests notice a change. The judge runs `tsx src/cli.ts`, not the installed command: arm B's run 5 guards its
entry point without resolving links (`src/cli.ts`, line 65), so through npm's `bin` link it would print nothing. Arm A
runs 2 and 3 are left out: the model's API ran out of credit.
