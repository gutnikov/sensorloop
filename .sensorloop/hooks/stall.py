#!/usr/bin/env python3
"""sensorloop: the stall detector, run by Claude Code hooks. Copied into the project as .sensorloop/hooks/stall.py.

After every tool call (PostToolUse) it keys the call by a hash of the tool's name and its arguments, and keeps the
last 25 keys of the task. The same call five times in a row, or one cycle of two to five calls repeated five times,
is a stall. The first stall in a task tells the agent to step back; the second stops it and hands over to the person.
A new prompt from the person (UserPromptSubmit) starts a new task. Python 3 standard library only.
"""
import hashlib
import json
import os
import sys

HISTORY = 25
REPEATS = 5


def key(call):
    args = json.dumps(call.get("tool_input", {}), sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(f"{call.get('tool_name', '')}\n{args}".encode()).hexdigest()[:12]


def short(call):
    name = call.get("tool_name", "?")
    args = call.get("tool_input", {}) or {}
    detail = args.get("command") or args.get("file_path") or args.get("pattern") or args.get("url") or ""
    detail = " ".join(str(detail).split())
    return f"{name} {detail[:60]}".strip()


def stalled(keys):
    """The length of the repeated cycle (1 to 5) if the last keys repeat one, else 0."""
    for length in range(1, 6):
        span = length * REPEATS
        if len(keys) >= span:
            cycle = keys[-length:]
            if all(keys[-span + i] == cycle[i % length] for i in range(span)):
                return length
    return 0


def main():
    event = json.load(sys.stdin)
    project = os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or os.getcwd()
    folder = os.path.join(project, ".sensorloop", "state")
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"stall-{event.get('session_id', 'session')}.json")

    if event.get("hook_event_name") == "UserPromptSubmit":
        if os.path.exists(path):
            os.remove(path)
        return 0

    try:
        with open(path) as file:
            state = json.load(file)
    except (OSError, ValueError):
        state = {"keys": [], "calls": [], "stalls": 0}

    state["keys"] = (state["keys"] + [key(event)])[-HISTORY:]
    state["calls"] = (state["calls"] + [short(event)])[-HISTORY:]
    length = stalled(state["keys"])
    cycle = ""
    if length:
        state["stalls"] += 1
        cycle = " -> ".join(state["calls"][-length:])
        state["keys"], state["calls"] = [], []
    with open(path, "w") as file:
        json.dump(state, file)

    if not length:
        return 0
    if state["stalls"] == 1:
        print(
            f"sensorloop: stall: the same {'call' if length == 1 else f'cycle of {length} calls'} {REPEATS} times "
            f"in a row: {cycle}. Step back: check that you are making progress, look at what you have done, and change "
            "your approach instead of repeating it.",
            file=sys.stderr,
        )
        return 2
    print(json.dumps({
        "continue": False,
        "stopReason": f"sensorloop: stalled twice in this task ({cycle}). Over to you: change the task, give a hint, "
                      "or tell the agent to go on.",
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
