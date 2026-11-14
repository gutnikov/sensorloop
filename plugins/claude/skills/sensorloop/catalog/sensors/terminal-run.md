---
title: Terminal run
type: computational
summary: Drives a terminal app through a scripted session at a fixed size, sending keys and reading the rendered screen.
signal: The first step whose expected text did not appear, with the screen as it was captured.
---

Loops read this sensor to check a terminal interface the way a person at the keyboard meets it, whether it is a
command-line tool or a full-screen app.

## What it sees

The screen as text, in a terminal of fixed width and height, so that the same session renders the same screen every
time. The script waits for the expected text to appear rather than sleeping for a set time, which keeps the run both
fast and stable. Colours, styles and flicker are not part of the text: the run sees them only if the script asks its
tool to capture them, and the tool can.

## Reading the signal

- **Every expected text appeared**: the session went as scripted, at this terminal size.
- **A step's text did not appear**: the signal names the first such step and gives the screen as it was captured.
  The screen usually shows what the app did instead.

When the terminal itself did not start, the run failed before it observed anything. That is a failure of the run, not
of the work. An app that crashes on launch is different: the terminal started, the captured screen usually shows the
app's error, and that is a failure of the work.
