# Diagnose: a problem in the flow, and the loop that should have caught it

Something keeps going wrong in how changes get made: regressions reach main, CI is often red, the agent loops or edits
what it should not, bugs reach users, reviews keep finding the same mistake. This is the metaloop: find the earliest
point on the change path where the problem could have been caught, and the loop that would catch it there.

## 1. State the problem as a failure

Write it down in one sentence: what went wrong, where it was found, and where it should have been found. Ask the
person for examples (a pull request, a CI run, an incident) if they have them.

## 2. Gather evidence with the flow-auditor

Hand the problem to the `flow-auditor` subagent with what you know: the sentence from step 1, the examples, and the
registry (`.sensorloop/loops.yaml`). It reads, read-only, what the project has: CI history, git history, the
pull requests and their reviews, agent session transcripts, an outcome log, and returns the evidence and where the
problem first became visible. Its reading keeps the long logs out of your context.

## 3. Find the earliest phase that could catch it

Walk the change path from the work outwards: while editing, before the turn ends, at commit, in CI, on a preview,
after a deploy, in production. For each point, ask whether a sensor there could have seen the failure. The earliest
point that could is where the fix belongs, because a failure costs more the later it is found.

Then match it to the catalog ([../catalog/index.md](../catalog/index.md)): an existing loop that is `active` but did
not fire (its wiring or command is wrong), a loop that is `proposed` or `off` here, or a loop the project does not
have.
If no loop fits, describe the sensor that would see the failure, and the tool that would build it here.

## 4. Propose

Give the person: the failure, the evidence, the phase that should catch it, and the change, from cheapest to dearest.
A fix to an existing loop comes before a new loop. A mistake made twice by people or agents becomes a rule a sensor
checks (a lint rule, a test, a hook), not a line of advice. Wire it if it is in [wiring/](../wiring/) and the person
agrees; otherwise record it as `proposed` in the registry. Update `LOOPS.md` if anything active changed.
