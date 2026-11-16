# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| One test file | `npx vitest run tests/<command>.test.ts` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## Before you change anything

An issue's acceptance criteria (AC1, AC2, ...) are its spec. Before you write any code or test, go through the
criteria and list the cases they leave open: an input two criteria both claim or none covers, a value none of them
gives. Ask the person all the open cases in one message, each with what its possible answers would change, and end
your turn there. Do not settle an open case yourself, in the code or in a test. Each answer is part of the spec from
then on, and gets a test like a criterion.

## While you work

Tests come from the spec, not from your code. Write one test for each criterion, named after it
(`it('AC3: lists the most overdue first', ...)`), that runs the command as a user does (`runCli` in
`tests/helpers/cli.ts`) on invoices made for it, and that fails when the criterion breaks. The test of an answer is
named after the criterion it settles. Then write the code until they pass.

## Before you finish

When you end your turn, a hook reads the criteria ids of the issue you were given and the tests you added or changed
in this session. A criterion with no test named after it keeps you working, and the hook prints the missing ids. Write
the missing tests; never rename a test to an id it does not check. The same failure three times hands it to the
person. While you have changed no code and no test (a turn that ends with your questions), nothing is checked.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
