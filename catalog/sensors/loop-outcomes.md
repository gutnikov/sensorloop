---
title: Loop outcomes
type: computational
summary: Reads the record of what the loops caught and missed (escapes, corrections, releases not confirmed) to find the loop that should have caught a problem earlier.
signal: Escapes and corrections counted per phase and kind, and the earliest phase that could have caught each.
---

This sensor reads the record of what the loops caught and what they missed: escapes, corrections, releases not
confirmed. It serves the metaloop, which improves the loops themselves, by finding the loop that should have caught a
problem, or caught it earlier.

## What it sees

Escapes (problems that got past the phase meant to catch them), corrections and unconfirmed releases, counted per
phase and kind, each with the earliest phase that could have caught it. It needs the loops to record their outcomes as
they happen. It cannot see a problem no loop or person ever noticed, and it knows nothing that was not written down.

## Reading the signal

- **An escape**: a problem was found later than it could have been. The record names where it was found and the
  earliest phase that could have seen it.
- **A correction**: a person or a later sensor changed work that an earlier loop had passed.
- **The same kind caught late twice**: a reason to add a loop, or to move one earlier.

An empty record is not a clean one: if the loops stopped writing their outcomes, the sensor sees nothing. Check that
recent runs appear in the record before reading silence as success.
