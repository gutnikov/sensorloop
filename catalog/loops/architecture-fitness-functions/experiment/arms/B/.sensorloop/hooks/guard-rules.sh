#!/usr/bin/env bash
# sensorloop: the architecture rules are the person's (loop architecture-fitness-functions). A PreToolUse hook on
# Edit|Write|MultiEdit: refuses a write to .dependency-cruiser.cjs (exit 2, the reason shown to the agent).
set -u
file="$(jq -r '.tool_input.file_path // empty' 2>/dev/null)"
case "$file" in
  .dependency-cruiser.cjs | */.dependency-cruiser.cjs)
    {
      echo 'sensorloop: rules failed (`.dependency-cruiser.cjs` is the person'"'"'s). Fix the code the way the rule'"'"'s text says;'
      echo 'changing a rule is not a fix. If you believe a rule is wrong, stop and tell the person which rule and why.'
    } >&2
    exit 2
    ;;
esac
exit 0
