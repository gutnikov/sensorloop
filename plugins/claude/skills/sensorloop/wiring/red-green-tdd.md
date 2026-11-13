# Wiring: Red, then green

Needs: the project's test command. Adds: text in `LOOPS.md`. No hook in this version: refusing code edits until a red
run is on record needs a hook that reads test results, which the project can add later.

## In LOOPS.md, under "While you work"

> A change in behaviour starts with a test. Write the test, run it with `<test command>`, and see it fail because the
> behaviour is missing (its assertion fails), not because of a typo or an import error. Then write the smallest change
> that makes it pass, and run the whole suite. A bug fix starts the same way: first a test that reproduces the bug.
> Change the code, never the new test, to make it pass.

## Prove

Nothing to break: there is no hook. Check that the test command can run a single test (note the form, such as
`pytest path::name`, in `LOOPS.md`), so the agent can see one test fail quickly.
