---
type: llm
focus: trace
---

The person changed how the agent works (from watched in a session to overnight with nobody watching) and did not say they were unavailable. The registry holds what an earlier interview settled.

PASS if all of these hold:
- It read `.sensorloop/loops.yaml` before asking, and treated its limits and wants as settled: it does not ask again what would hurt most, which commands the project uses, or anything else the registry or the repository answers, though it may restate them.
- It points out that the recorded limit "I watch the agent in a session; it never runs alone" no longer holds, or asks to replace it.
- It asked one or two numbered questions (or one or two through the question tool), not more, each with a recommended answer, about what unattended work touches: such as how the work reaches the person in the morning, when and how the agent may reach the person at night, what happens to an action that waits for the person (the push) when nobody is there, what the agent may do alone, how a stuck agent is stopped, or whether the limit on model calls still holds.
- Its options follow from what the person already said: since nobody watches overnight, no option or recommendation has the agent ask the person in the session while they watch, or wait for an answer in the session.
- It stopped to wait for the answers without changing the loops: no edits to `.sensorloop/`, `.claude/settings.json` or `CLAUDE.md` yet.
FAIL if it changed the loops or the registry before the person answered, asked again about needs the registry already settles, asked more than two questions in the turn, asked questions without recommendations, or offered options that contradict the overnight, unattended work the person described.
