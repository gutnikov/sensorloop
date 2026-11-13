---
title: Terminal run
type: computational
summary: Drives a terminal app through a scripted session at a fixed size, sending keys and reading the rendered screen.
signal: The first step whose expected text did not appear, with the screen as it was captured.
---

A terminal run drives a command-line or full-screen terminal app through a scripted session, sending keys and
reading back the rendered screen. Loops read it to check a terminal interface the way a person at the keyboard meets
it.

## What it sees

The screen as text, in a terminal of fixed width and height, so that the same session renders the same screen every
time. The script waits for the expected text to appear rather than sleeping for a set time, which keeps the run both
fast and stable. Colours, styles and flicker are not seen unless they are captured on purpose.

## Reading the signal

- **Every expected text appeared**: the session went as scripted, at this terminal size.
- **A step's text did not appear**: the signal names the first such step and gives the screen as it was captured.
  The screen usually shows what the app did instead.

When the app or the terminal did not start, the run failed before it observed anything. That is a failure of the
run, not of the work.
