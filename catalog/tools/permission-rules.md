---
title: The agent's permission rules
summary: The coding agent's rules for which actions run, which are refused, and which go to a person or a model first.
sensors: [human-answer, llm-judge]
layer: agent
---

The coding agent's permission rules decide, for each action, whether it runs, is refused, or goes to a person or a
model first. They live in the agent's settings, which a person sets and approves.

## Finding it

- **Claude Code**: `permissions` in `.claude/settings.json` (shared with the project), `.claude/settings.local.json`
  and `~/.claude/settings.json`, with an organisation's managed settings above them.
- **Other coding agents**: an approval policy and a sandbox mode in their config (`~/.codex/config.toml` for Codex).
- **Deploys**: the code host's deployment environments, with their required reviewers.

## Using it

- **Rules match a tool and a pattern**: `Bash(npm run test:*)` allowed, `Bash(git push:*)` asked, `Read(./.env)`
  denied.
- **Deny wins over ask, and ask over allow.**
- **Actions that cannot be undone** (a push to the main branch, a delete, a deploy) are asked about by default.
- **Deny rules for what must never run**, whoever decides the rest; changes to the rules are reviewed like code.

Examples: Claude Code's allow, ask and deny rules and its auto mode; the approval policies of other coding agents;
deployment environments with required reviewers.
