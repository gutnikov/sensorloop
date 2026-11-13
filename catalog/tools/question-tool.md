---
title: The agent's question tool
summary: The coding agent's way to put a question to a person, with a few options and a free answer, and wait for it.
sensors: [human-answer]
layer: agent
---

The coding agent's question tool puts a structured question to a person and waits for the answer. It is built into
the agent, and works only where a person is present to answer.

## Finding it

- **Built in**: `AskUserQuestion` in Claude Code; other coding agents have an equivalent, or ask in the chat.
- **The agent's settings** can allow or deny it like any other tool.
- **In an unattended run** there is no one to answer: the agent states its assumption instead, for a person to
  confirm later.

## Using it

- **Two to four options**, the recommended one first and marked so; a free answer is always possible.
- **One decision per question**, with what each option costs.
- **Before an action that cannot be undone**, not after it.
- **Keep the question and the answer**, so the decision can be found later.

Examples: `AskUserQuestion` in Claude Code, and the equivalents in other coding agents.
