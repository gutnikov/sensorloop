---
title: Fresh-context code review
summary: Reviewer agents with a fresh context read the committed diff, and the coding agent fixes the confirmed findings for at most five rounds, each re-review checking only the open ones.
sensors: [llm-reviewer]
placement: inner
when: After the agent's tests pass and its work is committed, before it opens a pull request; then once per round of fixes, on the fix diff.
failure: A high-severity finding that a second pass confirms, or one a re-review marks not addressed. Medium and low findings go to a log, and never enter the loop.
next: The coding agent fixes the code, and from round four a fresh implementer on a stronger model takes over. After round five each open finding gets a ruling with its reason, and one that leaves every way forward a guess goes to a person. Until the reviewer is calibrated, its findings are advice.
---

## The loop

1. The agent commits its work. Reviewer agents, one per lens, each start with a fresh context and get the diff
   against the merge base and the requirement, not the agent's reasoning.
2. Each returns findings with `file:line` evidence and a severity. A second pass checks each high finding, and drops
   the ones it cannot confirm. Medium and low findings go to a log that the final review reads.
3. A round is one fix and one re-review, five rounds at most. Rounds one to three go back to the same implementer,
   with the open findings word for word. Rounds four and five go to a fresh implementer on a stronger model, told that
   the task is now its own.
4. The re-review starts only once the fix report names the tests that cover the fix, the command and its output.
5. It checks only the open findings, on the fix diff: each is addressed or not, and attempted is not addressed. New
   breakage in the fix diff joins the open list; anything outside it goes to the log and adds no round. A full
   re-review finds something new every round, and never converges.
6. After round five, each open finding gets a ruling in the log: why the code stands, or, when later work builds on
   it, the smallest change that unblocks that work. The final report lists every ruling. None is made earlier just to
   end the loop.

## Why

An agent that reviews its own change reads it with the reasoning that produced it, and misses what that reasoning
missed. A reviewer with a fresh context gets only the diff and the requirement. It catches what needs judgement, such
as semantic duplication, redundant tests, brute-force fixes and over-engineering: partly, at a cost, and not the same
way every time.

## Set up

- **Reviewers that only read.** One per lens, such as correctness, security, tests and the project's conventions,
  each a subagent whose tools only read: a reviewer that edits is a second implementer whose commits nobody reviews.
  Where a coding agent forks the parent conversation by default, the dispatch asks for a fresh context.
- **Commit, then review.** Reviewers read `git diff <base>...HEAD`, which leaves out staged and uncommitted work. A
  base that does not resolve, or an empty diff, fails before any reviewer starts.
- **What the reviewer's prompt holds**: the diff, the requirement, the binding constraints copied word for word from
  the spec, and the linter's output on the changed files. Never "do not flag", "at most minor" or "the plan chose":
  they decide the review before it is done.
- **What counts as a finding**, in each reviewer's instructions: a problem the diff introduced, not an older one; a
  claim of breakage elsewhere names the code provably affected; a broken rule is quoted. A defect the plan mandates
  is still a finding.
- **Review against what is built.** In a build of several tickets, each review checks its own ticket, and the review
  against the whole spec runs once every ticket has landed; earlier, it reads each unbuilt ticket as a failure.
- **A size limit as well as a round limit.** An approved diff of more than 500 changed lines goes to a person: one
  reviewer's pass over that much code is not to be trusted alone.
- **Wiring.** The agent runs the loop after its tests pass and before it opens the pull request. A CI job runs the
  same reviewers on the pull request, outside the agent's session, so a skipped review still happens. A hook refuses
  the agent's edits to the reviewers' definitions.
