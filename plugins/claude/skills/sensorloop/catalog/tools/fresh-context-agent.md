---
title: Fresh-context agent
summary: A separate agent run that starts with none of the working session's context, has read-only tools, and returns a structured verdict.
sensors: [llm-reviewer, llm-judge]
layer: agent
---

A fresh-context agent is a separate run of a coding agent that starts with none of the working session's context. It
reads the work with read-only tools and returns its verdict in a fixed shape.

## Finding it

- **Subagents** defined in the agent's configuration: Claude Code reads them from `.claude/agents/`.
- **Headless runs** from the command line: `claude -p`, `codex exec`.
- **Review commands** the agent ships with or the project adds, such as `/code-review` and `/security-review`.

## Using it

- **Hand it the work to read** (a diff, a file, a spec) and a checklist, not the story of how the work was done.
- **Read-only tools only**: the `tools` list in a subagent's definition, or `--allowedTools` for `claude -p`.
- **Output the loop can parse**: a schema in the prompt, and `--output-format json` for `claude -p`.
- **A limit on its run** (`--max-turns`), so a stuck review ends.

Examples: Claude Code subagents, `claude -p`, `codex exec`; review commands such as `/security-review`, or
`/code-review` from a plugin.
