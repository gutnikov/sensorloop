---
title: Ask before the irreversible
summary: Before an action that cannot be undone, the agent stops, and a person confirms or refuses it.
sensors: [human-answer]
when: Before an action that cannot be undone, such as a deploy, a migration, deleting data, a push to a protected branch, or a message sent outside the project.
failure: The person refuses. Or a gated action is not gated after all, which the check of the gates reports.
next: A refused action is not tried another way. The agent says what it did not do, and goes on with the rest or asks what to do instead. In a run nobody watches, a gated action waits or is refused; it never runs unasked.
---

## The loop

1. Before a gated action, the agent stops and shows what will run and what it touches: the exact command, the
   migration, the diff of the release.
2. A person confirms or refuses.
3. On a yes, the action runs as shown. On a no, the agent does not rewrite the command or wrap it in a script to get
   past the gate; it reports what it did not do, and goes on with the rest or asks what to do instead.

## Why

No loop after an irreversible action can undo it: deleted data stays deleted, and a sent message stays sent. A gate
puts a person in front of such an action before it runs. Gating only what cannot be undone keeps the questions rare
enough to get real attention, instead of approval by habit.

## Set up

- **Gate only the irreversible**: whatever touches production, deletes data, sends something outside the project or
  spends money. Everything reversible runs in an isolated environment without asking.
- **The gate is a permission rule that asks**, one per gated command; for example, in Claude Code,
  `"ask": ["Bash(git push *)", "Bash(kubectl apply *)"]` under `permissions`. A rule that asks wins over one that
  allows.
- **A rule matches the command, not the intent.** So the last gate stands where the action happens: production
  credentials stay out of the agent's environment, and a deploy runs from CI behind required reviewers.
- **Every part of a compound command is judged.** `make build && rm -rf data` asks because of its second part.
- **A guard that fails, blocks.** A hook that crashes or cannot decide refuses the call instead of letting it through.
- **Nobody there.** In a run nobody watches, a gated call is refused, or paused until a person answers; it is never
  approved by default.
- **A check that the gates stand.** In CI, a script reads the agent's permission settings and the list of gated
  commands, and reports each as gated, not gated or allowed; anything but gated fails.
- **An action the person approves every time** is not risky enough for a gate. Take it off the list, with their
  approval.
