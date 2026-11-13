# Wiring: Ask before the irreversible

Needs: the list of actions that must not run without a person (setup step 2). Adds: `ask` permission rules, one per
gated command. A rule that asks wins over one that allows.

## In .claude/settings.json

```json
{
  "permissions": {
    "ask": [
      "Bash(git push:*)",
      "Bash(npm run deploy:*)",
      "Bash(alembic upgrade:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

Build the list from what the project really runs: its deploy and release commands, its migration command, pushes to
protected branches, commands that delete data or send messages outside. Use the rule syntax the file already uses, if
it has rules. Merge with the existing `allow`, `ask` and `deny` lists; never remove an existing rule.

A rule matches a command, not an intent: the last gate stands where the action happens. Say so to the person if
production credentials are in the agent's environment, and propose moving deploys behind CI with required reviewers.

## In LOOPS.md, under "Ask a person first"

List the gated actions. Add: a refused action is not tried another way (a rewritten command, a script); say what you
did not do and go on with the rest, or ask what to do instead.

## Prove

Ask the agent's own session to run one gated command in a harmless form (such as `git push --dry-run`) and see the
permission prompt appear instead of the command running. Record the gated list in the registry's `wiring`.
