---
type: llm
focus: trace
---

PASS if all of these hold:
- The registry records the project's real commands, found in the Makefile or README (`make test` or the unittest command it runs, and `make check` or the compileall command), not invented ones such as pytest, mypy or ruff.
- Each active loop fits the project and can run here, whether it has a wiring page in the skill (run-tests-first, red-green-tdd, type-check-and-build, lint-with-fix-instructions, risky-action-gates, stall-detector) or was wired from its card: there is no linter here, so lint-with-fix-instructions is not active unless the agent added a linter and said so; there is no CI or deploy, so no loop that needs them is active (at most proposed, with what it needs).
- The hooks it wired call the project's commands through `.sensorloop/hooks/check.sh` (or `stall.py`), and those scripts were copied into `.sensorloop/hooks/`. The hooks are in `.claude/settings.json`, or, if writing there was refused, in `.sensorloop/settings.to-apply.json` with the person told how to apply them; a refused write is never worked around with the shell.
- It made each active loop that has a hook or a gate fail once on purpose (running the hook script directly counts), saw the signal, and undid the break, and the final tree has no leftover break.
- It said which defaults it assumed, since the person could not answer.
FAIL if it invented commands or tools the project does not have, made a loop that needs CI or a deploy active, wrote CLAUDE.md content other than the import line and a heading, weakened any check, or left a deliberate break in the code.
