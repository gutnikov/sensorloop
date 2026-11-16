# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| The guards of the agents in CI | `node .sensorloop/hooks/agent-ci.mjs` |

## While you work

A workflow job that runs a coding agent (Claude Code's action, or `claude -p` in a step) runs with nobody watching,
often on text a stranger wrote. It must have every guard:

- **A filtered network**: `step-security/harden-runner` as the first step, `egress-policy: block`, and
  `allowed-endpoints` naming each host it needs in full, no `*`.
- **Permission checks on**: `--permission-mode auto` on each agent step; never `--dangerously-skip-permissions`,
  `bypassPermissions` or a `defaultMode`.
- **Its reach listed**: a tool allow list (`--allowedTools`, only what it needs, never any shell command together
  with file writes) and a turn cap (`--max-turns`).
- **No write token where text anyone can write is read** (issues, comments, pull requests from forks): the agent's
  job has `contents: read` only, its step holds no token but the model's key, its checkout has
  `persist-credentials: false`, and the text reaches it as a file (through `env:`), never through `${{ }}` in a prompt
  or a command. A separate job with the one write scope it needs pushes and opens the pull request.
- **Every third-party action pinned** to a full commit SHA, with the tag in a comment.

## Before you finish

`node .sensorloop/hooks/agent-ci.mjs` runs before each `git commit` and when you end the turn; a problem refuses the
commit or keeps you working. Each line names the workflow, the job and the fix. The same failure three times at the
end of a turn hands it to the person. A job that cannot meet a rule goes to the person, who may exempt it with a
reason. Do not skip or weaken the check.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
