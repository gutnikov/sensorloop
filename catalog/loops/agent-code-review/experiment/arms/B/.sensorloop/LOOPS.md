# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |

## Before you finish

A reviewer with a fresh context reads every change before you hand it over:

1. When the change is done and `npm test` passes, commit it. The reviewer reads only what is committed.
2. Ask the `code-reviewer` agent (the Agent tool, `subagent_type: "code-reviewer"`; it runs in the foreground here,
   and the call returns its report) to review `git diff <base>...HEAD`, where `<base>` is the commit the session
   started from, in `.sensorloop/state/review-base`. Give it the base and the task, word for word as the person wrote
   it, and nothing of your own reasoning: not what you think is fine, not what to skip.
3. Fix each high finding in the code, with a test that covers it; run the tests, commit, and ask the reviewer to
   re-review only the findings still open, word for word, on `git diff <reviewed commit>..HEAD`. Medium and low
   findings are advice: list them in your report; they add no round.
4. Three rounds of fixes at most. For a high finding still open after the third, write in your report why the code
   stands or what would fix it; one you cannot rule on without guessing goes to the person.

When you end the turn, a hook checks that the latest commit has a review on record, and keeps you working until it
has; the same refusal three times hands it to the person. A turn that commits nothing and leaves nothing uncommitted
needs no review.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json`, `.claude/agents/` or CI files to get past a loop.
