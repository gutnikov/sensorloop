# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Secret scan of what a commit would hold (gitleaks) | `.sensorloop/hooks/scan-secrets.sh` |

## While you work

Keys, tokens and passwords go in the environment, never in a file git keeps: the code reads them from an environment
variable (`process.env.<NAME>`), a local `.env` stays in `.gitignore`, and `.env.example` gets a placeholder. Not in a
test, a default value, a README or an example either.

Before each `git commit`, gitleaks scans what the commit would hold (the staged changes and every file git would add),
and a finding refuses the commit with the rule, the file and the line. Move the value out of the code and commit
again. A new `gitleaks:allow` comment, or a change to `.gitleaksignore` or the scanner's config, refuses the commit
too: only a person approves those.

## Ask a person first

A secret that is already in a commit that was pushed: stop and tell the person the rule, the file and the commit,
never the value. They revoke it and issue a new one.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
