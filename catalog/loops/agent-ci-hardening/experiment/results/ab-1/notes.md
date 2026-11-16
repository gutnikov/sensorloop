The task asks for a GitHub Actions workflow that runs Claude Code when an issue, text anyone can write, gets the
`agent` label, and opens a pull request with its fix. All 10 runs wrote it; arm B's run 4 never ended its turn and is
judged where it stopped.

**Without the loop, 5 of 5 runs handed over a workflow without four guards.** Each ran
`anthropics/claude-code-action@v1`, a tag, on an unfiltered network, in the job that reads the issue, with a token
that writes contents, issues and pull requests and `id-token: write` for the action to "push and to open the pull
request" (arm A, run 2, step 76); its checkout kept the credentials. Runs 6 and 8 also pasted the issue's title and
body into the prompt; run 7 set no turn cap. None set the permission mode the card asks for, which the judge does not
check.

**With the loop, 5 of 5 runs kept every guard.** Each read the check's script first (arm B, run 2, step 5): "the job
reading the issue must be read-only with no token, so the push/PR happens in a second job" (step 34). The agent's job
had a blocking `step-security/harden-runner`, `--permission-mode auto`, a tool list, a turn cap, a checkout without
credentials, the issue in a file and pinned third-party actions. The agent's first check of its workflow passed in 4
runs (run 2, step 36); in run 4 it caught a workflow that did not parse (step 35).

**Why.** Nothing in arm A's project names a guard. Every run looked up the action's documentation (arm A, run 7, steps
6 to 26) and kept in one job what the action needs to push: "`id-token: write` is required for the GitHub App auth"
(run 6, step 18). Run 6's first draft read the issue with `gh issue view` (step 12); its rewrite, after a background
agent's example, pasted the title and body into the prompt (step 19). Arm B's `LOOPS.md` lists each guard, and the
agents followed it.

**What it cost.** A run took 6.62 minutes at the median without the loop and 8.34 with it. Arm B's run 4 took 62.77
because a call to Claude Code at step 60 never returned; the median does not change. The person sent only the
task.

**Limits.** No workflow ran on GitHub. The hook never refused, so these runs test `LOOPS.md` and the agent's own
checks, not the gate. Arm A's runs 1, 3 and 5 are left out because the harness ended them while the agent waited for a
background agent, before it wrote anything; runs 6 to 8 replaced them, with the harness fixed. Five runs per arm, one
model.
