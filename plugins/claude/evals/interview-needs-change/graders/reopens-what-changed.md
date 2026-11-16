---
type: llm
focus: trace
---

The person changed how the agent works (from watched in a session to overnight with nobody watching) and did not say they were unavailable. The registry holds what an earlier interview settled.

PASS if all of these hold:
- It read `.sensorloop/loops.yaml` before asking, and treated its limits and wants as settled: it does not ask again what would hurt most, which commands the project uses, or anything else the registry or the repository answers, though it may restate them.
- It points out that the recorded limit "I watch the agent in a session; it never runs alone" no longer holds, or asks to replace it.
- It asked a round of several numbered questions (or used the question tool), each with a recommended answer, about what unattended work touches: such as when and how the agent may call the person at night, how the work reaches the person in the morning, what the agent may do alone, what happens to an action that waits for the person (the push) when nobody is there, how a stuck agent is stopped, or whether the limit on model calls still holds.
- It stopped to wait for the answers without changing the loops: no edits to `.sensorloop/`, `.claude/settings.json` or `CLAUDE.md` yet.
FAIL if it changed the loops or the registry before the person answered, asked again about needs the registry already settles, or asked questions without recommendations.
