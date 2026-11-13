---
title: Scripted terminal
summary: Runs a terminal app in a terminal of fixed size that a script can type into and read back.
sensors: [terminal-run, screenshot]
layer: project
---

A scripted terminal runs a terminal app inside a terminal of fixed size that a script can type into and read back as
text. A test drives a command-line or full-screen app through it, as a user at a keyboard would.

## Finding it

Look in the project's tests for a helper that starts the app in a terminal multiplexer or a pseudo-terminal, and in
the test dependencies for a terminal-emulator library. When the project has none, tmux on the machine serves.

## Using it

- **Fix the size**: start the session at a set width and height
  (`tmux new-session -d -s app -x 120 -y 40 '<command>'`), so the screen is the same on every run.
- **Type as a user would**: `tmux send-keys -t app 'q' Enter`, control keys included.
- **Read the screen back**: `tmux capture-pane -p -t app` prints it as text; `-e` keeps the colours when they matter.
- **Wait for text, not a timer**: capture the screen in a loop until the expected text appears, with a timeout.

Examples: tmux (`send-keys`, `capture-pane`), a pseudo-terminal with a VT100 parser, such as pexpect with pyte
(Python).
