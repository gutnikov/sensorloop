# Wiring: Type check and build

Needs: a type check command (`commands.typecheck`), a build command (`commands.build`), or both. Adds: two hooks.

- **After each edit**, the type check, if it takes under about 20 seconds; slower, it moves to the end of the turn.
- **Before the turn ends**, the build (or the type check, if there is no build).

## In .claude/settings.json

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.sensorloop/hooks/check.sh typecheck 'mypy src'", "timeout": 60 }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.sensorloop/hooks/check.sh build 'npm run build'", "timeout": 300 }]
      }
    ]
  }
}
```

Use the project's commands, quoted as one argument. Merge with the hooks already there.

## In LOOPS.md

Under "While you work": after each edit the type check runs; when it reports errors, fix the code at each
`file:line`, not the types and not the checker's settings. Under "Before you finish": the build runs when you end the
turn, and a failure keeps you working; the same failure three times hands it to the person. A new `# type: ignore`,
`@ts-ignore` or cast to an untyped value counts as an error unless it carries its reason on the same line.

## Prove

Add a type error to a source file, make an edit, and see the hook report it; end a turn with a build error and see
the turn continue. Undo both and see the checks pass.
