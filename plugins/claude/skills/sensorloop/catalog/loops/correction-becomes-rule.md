---
title: A correction becomes a rule
summary: Every correction a person makes is logged at the phase that should have caught it, and the second of the same kind becomes a check, a reviewer's rule or a line in the agent's instructions.
sensors: [human-review, loop-outcomes]
when: "Each time a person corrects the agent: in the session, in a review comment or by reverting a change. Weekly, the session transcripts are searched for missed corrections, including an error that took the agent more than three attempts, and the outcome log is read for kinds that came back."
failure: A second correction of a kind already logged. It is an escape, a problem that got past the phase meant to catch it though the same kind had already been corrected once.
next: Whoever looks after the loops, or an agent, turns the escape into a rule at the earliest phase that can see it, proposed as a change a person approves. Logging asks no one. A person is asked to choose only when two rules would both fix the correction and differ in a trade-off only they can weigh.
---

## The loop

1. A person corrects the agent: in the session, in a review comment, or by reverting a change.
2. The correction is appended to the project's outcome log with its kind, what was corrected, and the phase that
   should have caught it: the point in the change path where a check runs, such as before the agent stops, at review
   or in CI.
3. The first correction of a kind is only logged. The second of the same kind is an escape.
4. The escape becomes a rule at the earliest phase that can see it:
   - a mechanical correction, such as a banned API, an import shape or a file location, becomes a lint or a test whose
     message says how to fix it;
   - a judgement call goes into the reviewer's standards, read at review time;
   - what the agent must do as it works becomes a line in its instructions, such as CLAUDE.md.
5. The rule counts once it fails on the original mistake and passes on the fixed version.
6. Weekly, whoever looks after the loops, or an agent, reads the log for the phases where corrections pile up. Two or
   more at one phase call for a loop there, or for a stronger one: a check in place of a line of instructions, or a
   check that blocks in place of one that advises. The measure is that each kind of correction stops coming back.

This is the metaloop at work: rather than fix the same mistake again, improve the loop that should have caught it.

## Why

Without this loop a person makes the same correction from task to task, because nothing remembers it. A correction
that comes back points at a missing constraint, tool or context. Turned into a check, it runs every time, and the
person does not have to make it again.

## Set up

- **The agent logs a correction the moment a person makes it**, as its instructions tell it to. Review comments and
  reverts, made outside the session, are logged by whoever looks after the loops.
- **A fixed list of phases**, written once for the project from the points where its loops run, so that every entry
  names its phase the same way and corrections at one phase add up.
- **Short, stable kinds**, such as `unstructured log line` or `test edited instead of code`, so that two corrections
  of one kind count as one. A kind already in the log is reused before a new one is written.
- **A weekly search of the session transcripts** finds the corrections nobody logged. Whoever looks after the loops,
  or an agent, looks for an instruction the person gave two or more times, with quotes. A candidate that cannot be
  traced to a moment in a transcript is dropped. An error that took the agent more than three attempts counts as a
  correction too.
- **Prefer a check to a line of instructions.** A line in the instructions is advice, not a guarantee. Look at the
  project's existing checks first: one that exists but is not wired in, or is broken, is the finding.
- **A line takes the form of the failure it fixes**, with no nuance clauses ("unless it matters") and no exemptions:
  - a rule broken under pressure: a prohibition that names the excuses seen, such as "Never edit a test to make it
    pass, even when the test looks wrong";
  - output of the wrong shape: a recipe, the steps that give the right shape;
  - a part left out: a required slot in a template, such as a heading every plan must fill in;
  - behaviour that depends on a condition: the condition, stated as something the agent can observe, such as "When
    the repository has a lockfile, install from it".
- **A correction about an action can become a hook** that warns or blocks, tested like any other rule: a pattern that
  matches too much blocks good work, and a hook that lets the call through on an error of its own blocks nothing.
- **A person approves every new rule.** A rule an agent proposes, or one found in the transcripts, arrives as a change
  a person approves, never as a direct edit of the instructions. The default is no change: one incident is not a rule.
- **Each rule carries its source and earns its place.** It names the log entry or pull request it came from. The agent
  names the rules it applied in its final message; a rule no session named in 30 days, or a check that fires on good
  code, goes back to the person who approved it, to keep or remove.
