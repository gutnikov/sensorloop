# What this experiment needs from the harness

- **A reply only when the mistake shows.** The person's replies are said whatever the turn held. Here the person
  should correct the second session only when it repeats the mistake: that second correction is the escape the card
  counts, and in arm B it is what makes the rule (the card logs the first correction of a kind and makes a rule at
  the second, which a person approves). So arm B's effect shows only in a third session, after a correction and an
  approval that depend on what the agent did. A reply with a condition would do it, e.g.
  `replies: [{ if: "<command that fails when the mistake is there>", say: "..." }]`, the command run as the agent's
  user in /work.
- **The code at each turn's end.** To tell whether the first session's correction was needed, the judge rebuilds the
  code as it was when the person spoke, by replaying the agent's file edits from the transcript onto the setup
  commit. A shell command that may have changed a file makes the replay inexact, and the measure is then null. A diff
  saved at each turn end (`turn-<session>-<n>.patch`, `git diff <setup>` after `git add -N`) would make it exact.
