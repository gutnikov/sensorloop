---
type: llm
focus: trace
---

PASS if all of these hold:
- It states the failure: changes landed on main with failing tests (the commits for #12 and #15 and the two fixes after them).
- It backs this with evidence it read: the git history and the registry or settings, showing that the only check that runs by itself is `make check` (compiling), while the tests run only as an instruction at the start of a task.
- It names the gap: nothing runs the tests before the turn ends or before a commit, so a red suite can be committed; the earliest point that could catch it is before the turn ends or at commit, inside the agent's session.
- It proposes a concrete fix at that point, such as running `make test` from the Stop hook or before each commit (with check.sh), and records it in `.sensorloop/loops.yaml` (as proposed, or as active once wired and proved), keeping LOOPS.md in step if anything active changed.
FAIL if it only gives general advice, blames the model without proposing a check, proposes only a later point (CI, review) when the session could catch it, or weakens or removes an existing check.
