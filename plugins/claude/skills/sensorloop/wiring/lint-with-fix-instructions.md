# Wiring: Lint with fix instructions

Needs: the project's lint command (`commands.lint`). Adds: a hook that lints before each commit the agent makes. If
the project has CI with no lint job, propose one (show the job; do not add it without a yes).

## In .claude/settings.json

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.sensorloop/hooks/check.sh --on-git-commit lint 'ruff check .'", "timeout": 120 }]
      }
    ]
  }
}
```

The hook runs on every Bash call but lints only when the call runs `git commit`; a failure refuses the commit and
shows the agent the violations.

## Fix instructions

Where the project's linter lets a rule carry a message (custom rules, banned imports or calls with a reason), suggest
writing the fix into the message: what to do instead, and when an exception is fair. Propose these to the person; the
rules are theirs.

## In LOOPS.md

Under "While you work": before each commit the linter runs, and a violation refuses the commit; fix the cause. A
suppression needs its reason on the same line (such as `# noqa: E501 -- generated table` or
`// eslint-disable-next-line <rule> -- <reason>`); never raise a limit or disable a rule to get a commit through.

## Prove

Add a lint violation, try to commit, and see the commit refused with the violation shown. Undo it and see the commit
go through.
