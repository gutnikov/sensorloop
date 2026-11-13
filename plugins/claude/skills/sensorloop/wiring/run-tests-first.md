# Wiring: Run the tests first

Needs: the project's test command (`commands.test`). Adds: text in `LOOPS.md`. No hook: the agent runs it, because
only the agent knows when a task starts.

## In LOOPS.md, under "Before you change anything"

> Run `<test command>` before changing anything, and note which tests already fail. When you finish, run it again and
> compare test by test: a test that passed and now fails is yours to fix; one that already failed is not, so name it
> in your report and leave it, unless the task is to fix it.

If the main branch's suite is already red, add: report the failures to the person before starting; they are a
problem of their own.

## Prove

Run the test command once and see it report; note its time in the registry's `wiring` (a suite over a few minutes
means the agent should run the area it changes, and say so in `LOOPS.md`).
