# Wiring: Stall detector

Needs: `python3`. Adds: two hooks running `.sensorloop/hooks/stall.py`. Most useful when the agent works unattended.

## In .claude/settings.json

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.sensorloop/hooks/stall.py" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.sensorloop/hooks/stall.py" }] }
    ]
  }
}
```

After every tool call the script keys the call (the tool's name and its arguments) and keeps the last 25 keys of the
task. The same call five times in a row, or one cycle of two to five calls repeated five times, is a stall: the first
tells the agent to step back and change its approach; the second in the same task stops the agent and hands over to
the person. A new prompt from the person starts a new task. Batch work is not a stall: the same edit over twenty files
gives twenty different keys.

## In LOOPS.md, under "While you work"

If the stall detector tells you to step back, do: restate the task, list your assumptions and which might be wrong,
and try a different approach. A second stall stops the session for the person.

## Prove

Feed the script five identical PostToolUse events on its standard input (or run the same harmless read five times)
and see the step-back message; a sixth to tenth repeat stops the session.
