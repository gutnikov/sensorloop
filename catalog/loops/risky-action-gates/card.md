---
title: Ask before the irreversible
summary: Before an action that cannot be undone, the agent stops, and a person confirms or refuses it.
sensors: [human-answer]
when: Before an action that cannot be undone, such as a deploy, a migration, deleting data, a push to a protected branch, or a message sent outside the project. In CI, a check confirms that the gates are still in place.
failure: The person answers no. Or the CI check finds a command on the list of gated commands that would run without asking.
next: A refused action is not tried another way. The agent says what it did not do and goes on with the work that does not depend on the action; for the work that does, it asks what to do instead. In a run nobody watches, a gated action waits or is refused; it never runs unasked. A missing gate keeps CI red until a person restores the rule or takes the command off the list.
---

## The loop

1. Before a gated action, the agent stops and shows what will run and what it touches: the exact command, the
   migration, the diff of the release.
2. A person confirms or refuses.
3. On a yes, the action runs as shown. On a no, the agent does not rewrite the command or wrap it in a script to get
   past the gate. It reports what it did not do, and asks before any work that depended on the action.

## Why

No loop after an irreversible action can undo it: deleted data stays deleted, and a sent message stays sent. A gate
puts a person in front of such an action before it runs. Gating only what cannot be undone keeps the questions rare
enough to get real attention, instead of approval by habit.

## Set up

- **Gate only the irreversible**: whatever touches production, deletes data, sends something outside the project or
  spends money. The list of gated commands, kept in the repository, names them. Everything else runs without asking,
  which needs an isolated environment where its effects can be undone.
- **The gate is a permission rule that asks**, one per gated command. For example, in Claude Code,
  `"ask": ["Bash(kubectl apply *)", "Bash(terraform apply *)"]` under `permissions`; there, a rule that asks wins over
  one that allows. Other coding agents have their own form of the same rule.
- **A rule matches the command, not the intent.** The same action can run through a script the rule does not name.
  So the place where the action happens refuses it too: production credentials stay out of the agent's environment,
  and a deploy runs from CI behind required reviewers.
- **Every part of a compound command is checked.** `make build && rm -rf data` asks because of its second part.
  Claude Code checks each part against the rules; for a coding agent that does not, a hook splits the command.
- **A gate built as a hook fails closed.** A hook that crashes or cannot decide refuses the command instead of
  letting it through.
- **Unwatched runs refuse or wait.** Set the coding agent to refuse a gated command in a run nobody watches, or to
  pause it until a person answers, and never to approve it by default.
- **A check that the gates stand.** In CI, a script reads the agent's permission settings and the list of gated
  commands, and reports each command as gated, not gated or allowed; anything but gated fails.
- **An action the person approves every time** is a sign of approval by habit. If the action can in fact be undone,
  such as a push to a branch that is not protected, take it off the list, with the person's approval. If it cannot,
  the gate stays.
