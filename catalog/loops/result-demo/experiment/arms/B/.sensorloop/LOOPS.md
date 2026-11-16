# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Run the product on a file | `npm run dev -- <command> <file> [options]` |

## Before you finish: show the result

When the checks pass, run the feature yourself and read what it prints, before anyone else does. Then hand over with
evidence for each acceptance criterion of the issue: the command you ran and its output as it printed, copied from
the run, never retyped, trimmed or described. Put each under a line that names its criterion:

    Criterion 2: <what it says>

    ```
    $ npm run dev -- summary data/invoices.json
    <the output, as it printed>
    ```

One command may show several criteria (`Criteria 1-3: ...`). A criterion shown only in words is not shown. A file
you name as evidence must exist.

When you end your turn, a hook reads your last message and the criteria of the issue you were given. A criterion
without a command and its output under its name keeps you working, and the hook prints each criterion's status
(`shown`, `text only`, `no evidence`, `file missing`). Nothing is checked while you have changed no code. The same
failure three times hands it to the person.

The person then judges the behaviour, not the code: `pass`, or `fail` with what differs. On a fail, write down what
differs before you fix anything: as a failing test when the work misses the criterion, or as a changed criterion the
person confirms when the criterion missed what they wanted. Then fix the work and show it again.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
