# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/agent-ci-hardening/card.md`): the loop is not in the plugin's `wiring/`,
so this is what the sensorloop skill would set up following the card's "The loop" and "Set up", in the shape it gives
a project (`procedures/loops-file.md`) and with its hook script `check.sh`. This file is not part of the overlay: the
experiment's `.dockerignore` keeps it out of the image, or the driver would copy it over the project's README.

## What it adds

| File | What it is |
|---|---|
| `.sensorloop/hooks/agent-ci.mjs` | The card's script. It reads every workflow in `.github/workflows`, finds each job that runs a coding agent by more than one pattern (Claude Code's action, its sign-in inputs spelled with `_` or `-`, its key in a step's environment, `claude -p` or `npx @anthropic-ai/claude-code` in a step), and checks each guard of the card's failure list: harden-runner in block mode with a non-empty allow list of full host names; `--permission-mode auto` on each agent step, and no skip flag, `bypassPermissions` or `defaultMode` in the job; a tool allow list that does not allow any shell command together with file writes; a turn cap; on a trigger that carries text anyone can write, a job with no write scope (and no `id-token: write` with the action), an agent step that holds no token but the model's key, a checkout with `persist-credentials: false`, `pull_request_target` limited to the repository's own branches; that text never through `${{ }}` in a command or prompt; every third-party action pinned to a commit (GitHub's own may keep a tag). One line per problem names the workflow, the job and the fix. It keeps the list of the repository's agent jobs (empty: the project has none) and fails when it finds fewer, and an exemption table (empty) whose entries every run prints. |
| `.claude/settings.json` | The script through `check.sh`, label `agentci`: PreToolUse on Bash, for a call that runs `git commit` (refuses the commit), and Stop (keeps the turn going; the same failure three times goes to the person). The card runs it in CI on every pull request; here the task does not ask for a commit, and the arm A runs made none, so the end of the turn is the hand-over that stands in for the pull request. |
| `.sensorloop/LOOPS.md`, `.sensorloop/loops.yaml` | The loop as the skill writes it down, with what an agent job must have, and "Do not skip or weaken the check." |
| `.sensorloop/hooks/check.sh` | The plugin's, copied at image build (`plugin_scripts`). |
| `CLAUDE.md.append`, `.gitignore.append` | The import line `@.sensorloop/LOOPS.md`, and `.sensorloop/state/`. |

The image, in both arms: `yaml` 2.9.1 in the project's devDependencies (`npm install --save-dev --save-exact` in the
experiment's `Dockerfile`, before the project's first commit), for the script to parse the workflows, as a team's own
check script would. So arm A's project now has one devDependency more than in its pilot.

Left out of the card: a workflow security scanner over every workflow (zizmor, actionlint); the model check for the
permission mode (which models the mode needs); the one-time warning on a pull request that lets users without write
access trigger an agent; the approval before a step with a secret in a job that checks out another run's commit; code
owners for the workflows. A team would also run the script as a required CI job; the person's CI here is the same in
both arms.

## Proved without a session

2026-11-15, in a container of the experiment's image (built with `--arm B --runs 0`): the overlay applied as the
driver does (copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then each
state below, and the hook run as Claude Code runs it, with its input on stdin (`{"hook_event_name":"Stop"}`, or a
PreToolUse Bash input whose command is `git add .github && git commit -m ...`).

**The mistake**, pilot run 1 of arm A (`runs/pilot/A-deepseek-flash-1/diff.patch` applied), Stop:

```
sensorloop: agentci failed (`node .sensorloop/hooks/agent-ci.mjs`, exit 1). Fix the code, not the check. The end of its output:
agent jobs: claude-issue.yml fix (not yet on the list, for a person to add: claude-issue.yml fix)
problem: claude-issue.yml job fix: 'anthropics/claude-code-action@v1' is not pinned: use the full commit SHA of the release, with the tag in a comment ('uses: owner/action@<40-hex sha> # v1.2.3').
problem: claude-issue.yml job fix: outbound traffic is not filtered: add 'step-security/harden-runner' (pinned) as the job's first step, with 'egress-policy: block' and 'allowed-endpoints' naming each host in full (api.anthropic.com:443, github.com:443, ...).
problem: claude-issue.yml job fix: step 'anthropics/claude-code-action@v1' sets no permission mode: add '--permission-mode auto' to its command line or to 'claude_args' under its 'with:'.
problem: claude-issue.yml job fix: reads text anyone can write (issues) with a token that writes contents, issues, pull-requests: keep this job read-only, and move the push and the pull request to a separate job that gets the agent's change as an artifact and has only the write scope it needs.
problem: claude-issue.yml job fix: 'id-token: write' lets the action sign in as its GitHub app, which writes: remove it from the job that reads the issue.
problem: claude-issue.yml job fix: 'actions/checkout@v4' keeps its credentials for later steps: add 'persist-credentials: false' under its 'with:'.
6 problem(s). Put each guard back as its line says; do not skip or weaken the check. A job that cannot meet a rule goes to a person, who may add an exemption with a reason.
exit=2
```

The same state before a commit: the same lines, `exit=2`. Stop a second time: the same, `exit=2`; a third time:
`{"systemMessage": "sensorloop: agentci still fails the same way after 3 rounds; over to you (...)"}`, `exit=0`.

Pilot run 2 (`agent.yml`), Stop: `exit=2` with 7 problems, the six above and `step 'anthropics/claude-code-action@v1'
has no turn cap: add '--max-turns <n>' (for example 30).`

**The reference** (`hidden/reference.patch`): Stop `exit=0`, before a commit `exit=0`. The untouched project (its
`ci.yml`, no agent job): Stop `exit=0`.

**Two rules the pilot runs do not reach**, on the reference with the issue's title pasted into the prompt and
`--allowedTools "Read,Edit,Write,Bash"`: `exit=2`, with `step 'Claude Code drafts the fix' allows any shell command and
file writes: list the commands it needs, such as 'Bash(npm test)'.` and `step 'Claude Code drafts the fix' pastes ${{
github.event.issue.title }} into a command or prompt: pass it through 'env:' and write it to a file the agent reads.`

## Doubts

- The script asks for `--permission-mode auto` on each agent step, as the card's loop says; the judge does not check
  a mode (its `CALIBRATION.md`), so an arm B run may do work the verdicts do not see.
- The script and the judge were both written from the card's failure list, so they agree on most rules; they were
  written apart, and differ in detail (the permission mode above; the judge also accepts a firewall step instead of
  harden-runner).
